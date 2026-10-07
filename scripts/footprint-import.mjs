#!/usr/bin/env node
/**
 * 足迹导入脚本
 *
 * 把「照片文件夹」或「浏览器创作模式导出的 JSON」变成正式的足迹条目：
 *   1. 解析照片 EXIF 里的 GPS 坐标与拍摄时间
 *   2. 同名同位置同一天的照片自动合并成一个标点
 *   3. 图片转成 webp 落到 public/images/footprints/<id>/
 *   4. 生成 src/content/footprints/<id>.md（frontmatter 就是地图读的数据）
 *
 * 用法：
 *   node scripts/footprint-import.mjs --input scripts/footprint-inbox
 *   node scripts/footprint-import.mjs --input <文件夹> --geocode      # 联网反查地名
 *   node scripts/footprint-import.mjs --from-entry scripts/footprint-inbox/xxx.json
 *
 * 说明：
 *   - EXIF 解析是脚本内置的（不依赖第三方库），只取 GPS + 拍摄时间
 *   - 文件名支持 @lat,lng 覆盖 GPS，例如：外滩@31.23972,121.49028.jpg
 *   - 已存在的条目默认跳过，--force 覆盖
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "src", "content", "footprints");
const IMAGE_DIR = path.join(ROOT, "public", "images", "footprints");

const IMAGE_EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".tif", ".tiff", ".heic", ".avif"]);

/* ------------------------------------------------------------------ */
/* 命令行参数                                                          */
/* ------------------------------------------------------------------ */

function parseArgs(argv) {
	const out = { input: "", fromEntry: "", geocode: false, force: false, dryRun: false, quality: 2000 };
	for (let i = 0; i < argv.length; i += 1) {
		const a = argv[i];
		if (a === "--input" || a === "-i") out.input = argv[++i] ?? "";
		else if (a === "--from-entry") out.fromEntry = argv[++i] ?? "";
		else if (a === "--geocode") out.geocode = true;
		else if (a === "--force") out.force = true;
		else if (a === "--dry-run") out.dryRun = true;
		else if (a === "--quality") out.quality = Number(argv[++i]) || 2000;
		else if (a === "--help" || a === "-h") out.help = true;
	}
	return out;
}

const args = parseArgs(process.argv.slice(2));

if (args.help || (!args.input && !args.fromEntry)) {
	console.log(`
足迹导入脚本

  node scripts/footprint-import.mjs --input <照片文件夹> [--geocode] [--force] [--dry-run]
  node scripts/footprint-import.mjs --from-entry <导出的条目.json> [--force]

  --input      照片文件夹（默认脚本目录下的 footprint-inbox）
  --from-entry 浏览器「创作模式」导出的单条 JSON
  --geocode    调用 OpenStreetMap Nominatim 反查地名（需联网，1 次/秒）
  --quality    图片长边像素上限，默认 2000
  --force      覆盖已存在的同名条目
  --dry-run    只打印将要生成的内容，不写文件
`);
	process.exit(args.help ? 0 : 1);
}

/* ------------------------------------------------------------------ */
/* EXIF 解析（内置实现，只取 GPS + 拍摄时间）                           */
/* ------------------------------------------------------------------ */

const TAG_DATETIME_ORIGINAL = 0x9003;
const TAG_DATETIME = 0x0132;
const TAG_MAKE = 0x010f;
const TAG_MODEL = 0x0110;
const TAG_GPS_IFD = 0x8825;
const TAG_EXIF_IFD = 0x8769;
const TAG_IMAGE_WIDTH = 0x0100;
const TAG_IMAGE_HEIGHT = 0x0101;
const TAG_EXIF_WIDTH = 0xa002;
const TAG_EXIF_HEIGHT = 0xa003;

const TYPE_SIZE = { 1: 1, 2: 1, 3: 2, 4: 4, 5: 8, 7: 1, 9: 4, 10: 8 };

/** 从 JPEG 里抠出 EXIF 的 TIFF 段（不带 "Exif\0\0" 头） */
function findExifTiff(buf) {
	if (buf.length < 4 || buf[0] !== 0xff || buf[1] !== 0xd8) return null;
	let offset = 2;
	while (offset + 4 <= buf.length) {
		if (buf[offset] !== 0xff) {
			offset += 1;
			continue;
		}
		const marker = buf[offset + 1];
		if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
			offset += 2;
			continue;
		}
		if (marker === 0xda) break; // 图像数据开始
		if (offset + 4 > buf.length) break;
		const size = buf.readUInt16BE(offset + 2);
		if (size < 2) break;
		const segStart = offset + 4;
		const segEnd = offset + 2 + size;
		if (marker === 0xe1 && size >= 8) {
			const head = buf.toString("latin1", segStart, segStart + 6);
			if (head === "Exif\0\0") return buf.subarray(segStart + 6, segEnd);
		}
		offset = segEnd;
	}
	return null;
}

/** 读取 TIFF 头并解析 IFD0 + Exif IFD + GPS IFD */
function parseTiff(tiff) {
	if (!tiff || tiff.length < 8) return null;
	const byteOrder = tiff.toString("latin1", 0, 2);
	let le;
	if (byteOrder === "II") le = true;
	else if (byteOrder === "MM") le = false;
	else return null;

	const u16 = (o) => (le ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
	const u32 = (o) => (le ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
	if (u16(2) !== 0x002a) return null;

	const out = { ifd0: {}, exif: {}, gps: {} };

	const readIfd = (ifdOffset, target) => {
		if (ifdOffset + 2 > tiff.length) return;
		const count = u16(ifdOffset);
		for (let i = 0; i < count; i += 1) {
			const entry = ifdOffset + 2 + i * 12;
			if (entry + 12 > tiff.length) return;
			const tag = u16(entry);
			const type = u16(entry + 2);
			const num = u32(entry + 4);
			const size = (TYPE_SIZE[type] ?? 1) * num;
			let valueOffset = entry + 8;
			if (size > 4) {
				valueOffset = u32(entry + 8);
				// 有些写库方（如 Pillow）会把偏移写成相对 IFD 的小值，容错一下
				if (valueOffset < 8 || valueOffset >= tiff.length) {
					const alt = ifdOffset + valueOffset;
					if (alt + size <= tiff.length) valueOffset = alt;
				}
			}
			target[tag] = { type, num, offset: valueOffset, size };
		}
	};

	readIfd(u32(4), out.ifd0);

	// Exif 子 IFD
	const exifPtr = out.ifd0[TAG_EXIF_IFD];
	if (exifPtr) readIfd(u32(exifPtr.offset), out.exif);

	// GPS 子 IFD
	const gpsPtr = out.ifd0[TAG_GPS_IFD];
	if (gpsPtr) readIfd(u32(gpsPtr.offset), out.gps);

	return { ...out, u16, u32, tiff };
}

/**
 * 读 ASCII 值。
 * 注意：有些写库方（实测 Pillow）会把 ASCII 值标成「未定义类型」并给错 count，
 * 所以这里不按 count 读，而是读到 NUL 或段尾为止，避免把拍摄时间漏掉。
 */
function readAscii(node, view) {
	if (!node) return "";
	const max = Math.min(view.tiff.length, node.offset + Math.max(node.size, 64));
	let end = node.offset;
	while (end < max && view.tiff[end] !== 0) end += 1;
	return view.tiff.toString("latin1", node.offset, end).trim();
}

function readNumbers(node, view) {
	if (!node) return [];
	const { type, num, offset } = node;
	const vals = [];
	for (let i = 0; i < num; i += 1) {
		const o = offset + i * (TYPE_SIZE[type] ?? 1);
		if (type === 3) vals.push(view.u16(o));
		else if (type === 4) vals.push(view.u32(o));
		else if (type === 5) vals.push(view.u32(o) / (view.u32(o + 4) || 1));
		else if (type === 1 || type === 7) vals.push(view.tiff[o]);
		else if (type === 9) vals.push(view.u32(o));
		else if (type === 10) vals.push(view.u32(o) / (view.u32(o + 4) || 1));
	}
	return vals;
}

const GPS_LAT_REF = 0x0001;
const GPS_LAT = 0x0002;
const GPS_LNG_REF = 0x0003;
const GPS_LNG = 0x0004;
const GPS_ALT_REF = 0x0005;
const GPS_ALT = 0x0006;
const GPS_DATE = 0x001d;

function dmsToDecimal(dms, ref) {
	if (!dms || dms.length < 3) return null;
	const [d, m, s] = dms;
	let value = d + m / 60 + s / 3600;
	if (ref === "S" || ref === "W") value = -value;
	return value;
}

/** 解析单张图片的 EXIF */
function readExif(filePath) {
	try {
		const buf = readFileSync(filePath);
		const tiff = findExifTiff(buf);
		if (!tiff) return null;
		const view = parseTiff(tiff);
		if (!view) return null;

		const lat = dmsToDecimal(readNumbers(view.gps[GPS_LAT], view), readAscii(view.gps[GPS_LAT_REF], view));
		const lng = dmsToDecimal(readNumbers(view.gps[GPS_LNG], view), readAscii(view.gps[GPS_LNG_REF], view));
		const altRaw = readNumbers(view.gps[GPS_ALT], view);
		const altRef = readNumbers(view.gps[GPS_ALT_REF], view)[0];
		const altitude =
			altRaw.length > 0 ? (altRef === 1 ? -altRaw[0] : altRaw[0]) : undefined;

		const dateRaw =
			readAscii(view.exif[TAG_DATETIME_ORIGINAL], view) ||
			readAscii(view.ifd0[TAG_DATETIME_ORIGINAL], view) ||
			readAscii(view.ifd0[TAG_DATETIME], view) ||
			readAscii(view.exif[TAG_DATETIME], view) ||
			readAscii(view.gps[GPS_DATE], view);

		return {
			lat,
			lng,
			altitude,
			dateTime: dateRaw ? dateRaw.replace(/^(\d{4}):(\d{2}):(\d{2})/, "$1-$2-$3") : "",
			camera: [readAscii(view.ifd0[TAG_MAKE], view), readAscii(view.ifd0[TAG_MODEL], view)]
				.filter(Boolean)
				.join(" "),
		};
	} catch (err) {
		console.warn(`  ! EXIF 解析失败 ${path.basename(filePath)}: ${err.message}`);
		return null;
	}
}

/* ------------------------------------------------------------------ */
/* 通用工具                                                            */
/* ------------------------------------------------------------------ */

/**
 * 生成文件名友好的 id。
 * 中文标题无法可靠转写，因此改用「坐标网格 + 日期」的稳定 id，
 * 好处是同一个地方重复导入会撞到同一个 id（便于 --force 覆盖而不是堆一堆新文件）。
 */
function slugify(text, coord) {
	const ascii = String(text ?? "")
		.normalize("NFKD")
		.replace(/[^\w\s-]/g, "")
		.trim()
		.replace(/\s+/g, "-")
		.toLowerCase();
	if (ascii) return ascii.slice(0, 48);
	if (coord && Number.isFinite(coord.lat) && Number.isFinite(coord.lng)) {
		const lat = Math.abs(coord.lat).toFixed(3).replace(".", "");
		const lng = Math.abs(coord.lng).toFixed(3).replace(".", "");
		const ns = coord.lat >= 0 ? "n" : "s";
		const ew = coord.lng >= 0 ? "e" : "w";
		const date = (coord.date || "").replace(/-/g, "");
		return `p${ns}${lat}-${ew}${lng}-${date}`;
	}
	return `footprint-${Date.now().toString(36)}`;
}

function yamlString(value) {
	return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/** 文件名解析：名称@lat,lng.ext */
function parseFilename(fileName) {
	const base = path.basename(fileName, path.extname(fileName));
	const m = base.match(/@\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)/);
	if (!m) return { name: base, lat: null, lng: null };
	return {
		name: base.replace(m[0], "").trim() || base,
		lat: Number(m[1]),
		lng: Number(m[2]),
	};
}

async function loadSharp() {
	try {
		const mod = await import("sharp");
		return mod.default ?? mod;
	} catch {
		return null;
	}
}

/** 图片转 webp 落盘；sharp 不可用时退化为原样复制。--dry-run 时只回报假想文件名，不产生任何文件。 */
async function placeImage(sharp, src, destDir, baseName) {
	const maxEdge = args.quality || 2000;
	const outName = sharp ? `${baseName}.webp` : `${baseName}${path.extname(src).toLowerCase()}`;
	if (args.dryRun) return outName; // 预览模式只算文件名，不写盘
	mkdirSync(destDir, { recursive: true });
	if (sharp) {
		await sharp(src)
			.rotate() // 按 EXIF 方向摆正
			.resize({ width: maxEdge, height: maxEdge, fit: "inside", withoutEnlargement: true })
			.webp({ quality: 82 })
			.toFile(path.join(destDir, outName));
		return outName;
	}
	writeFileSync(path.join(destDir, outName), readFileSync(src));
	return outName;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Nominatim 反查地名（可选，注意 1 req/s 的使用条款） */
async function reverseGeocode(lat, lng) {
	const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=zh-CN,zh,en`;
	try {
		const res = await fetch(url, {
			headers: { "User-Agent": "yrlwa-footprint-import/1.0", Accept: "application/json" },
		});
		if (!res.ok) return null;
		const data = await res.json();
		const a = data.address ?? {};
		return {
			place: a.tourism || a.amenity || a.suburb || a.neighbourhood || a.city || "",
			region: a.state || a.province || "",
			country: a.country || "",
			countryCode: (a.country_code || "").toUpperCase(),
		};
	} catch {
		return null;
	}
}

/* ------------------------------------------------------------------ */
/* 条目生成                                                            */
/* ------------------------------------------------------------------ */

function entryMarkdown(entry) {
	const lines = ["---"];
	lines.push(`title: ${yamlString(entry.title)}`);
	if (entry.summary) lines.push(`summary: ${yamlString(entry.summary)}`);
	lines.push(`lat: ${entry.lat}`);
	lines.push(`lng: ${entry.lng}`);
	if (entry.altitude != null) lines.push(`altitude: ${Math.round(entry.altitude * 10) / 10}`);
	if (entry.place) lines.push(`place: ${yamlString(entry.place)}`);
	if (entry.region) lines.push(`region: ${yamlString(entry.region)}`);
	if (entry.country) lines.push(`country: ${yamlString(entry.country)}`);
	if (entry.countryCode) lines.push(`countryCode: ${yamlString(entry.countryCode)}`);
	lines.push(`date: ${entry.date}`);
	if (entry.dateEnd && entry.dateEnd !== entry.date) lines.push(`dateEnd: ${entry.dateEnd}`);
	lines.push(`type: ${entry.type || "travel"}`);
	if (entry.tags?.length) lines.push(`tags: [${entry.tags.map(yamlString).join(", ")}]`);
	if (entry.mood) lines.push(`mood: ${yamlString(entry.mood)}`);
	if (entry.cover) lines.push(`cover: ${yamlString(entry.cover)}`);
	if (entry.photos?.length) {
		lines.push("photos:");
		for (const p of entry.photos) {
			if (p.caption || p.alt) {
				lines.push(`  - src: ${yamlString(p.src)}`);
				if (p.alt) lines.push(`    alt: ${yamlString(p.alt)}`);
				if (p.caption) lines.push(`    caption: ${yamlString(p.caption)}`);
			} else {
				lines.push(`  - ${yamlString(p.src)}`);
			}
		}
	}
	if (entry.album) lines.push(`album: ${yamlString(entry.album)}`);
	if (entry.posts?.length) lines.push(`posts: [${entry.posts.map(yamlString).join(", ")}]`);
	if (entry.excerpt) lines.push(`excerpt: ${yamlString(entry.excerpt)}`);
	if (entry.pinned) lines.push("pinned: true");
	lines.push("---", "", entry.body || "<!-- 这条足迹由 footprint-import.mjs 生成，可自由补充正文 -->", "");
	return lines.join("\n");
}

function writeEntry(id, entry, { dryRun, force }) {
	const file = path.join(CONTENT_DIR, `${id}.md`);
	if (existsSync(file) && !force) {
		console.log(`  · 跳过（已存在）${path.relative(ROOT, file)}`);
		return false;
	}
	const md = entryMarkdown(entry);
	if (dryRun) {
		console.log(`  · [dry-run] 将写入 ${path.relative(ROOT, file)}\n${md}`);
		return true;
	}
	mkdirSync(CONTENT_DIR, { recursive: true });
	writeFileSync(file, md, "utf8");
	console.log(`  ✓ 已生成 ${path.relative(ROOT, file)}`);
	return true;
}

/* ------------------------------------------------------------------ */
/* 模式一：从「创作模式导出的 JSON」生成                                 */
/* ------------------------------------------------------------------ */

async function runFromEntry(sharp) {
	const jsonPath = path.resolve(args.fromEntry);
	if (!existsSync(jsonPath)) {
		console.error(`找不到条目文件：${jsonPath}`);
		process.exit(1);
	}
	const raw = JSON.parse(readFileSync(jsonPath, "utf8"));
	const entries = Array.isArray(raw) ? raw : [raw];
	console.log(`\n从导出的条目生成：${entries.length} 条`);

	for (const item of entries) {
		const title = item.title || "未命名地点";
		const id = item.id || slugify(title);
		const destDir = path.join(IMAGE_DIR, id);

		// 照片：如果给定的是本地文件路径，就转 webp 放进 public；否则原样引用
		const photos = [];
		let index = 0;
		for (const photo of item.photos ?? []) {
			const src = typeof photo === "string" ? photo : photo.src;
			if (!src) continue;
			index += 1;
			if (!/^https?:/i.test(src) && existsSync(src)) {
				const fileName = await placeImage(sharp, src, destDir, `p${index}`);
				photos.push({ src: `/images/footprints/${id}/${fileName}` });
			} else {
				photos.push(typeof photo === "string" ? { src } : photo);
			}
		}

		const entry = {
			title,
			summary: item.summary || "",
			lat: Number(item.lat),
			lng: Number(item.lng),
			altitude: item.altitude,
			place: item.place || "",
			region: item.region || "",
			country: item.country || "",
			countryCode: item.countryCode || "",
			date: item.date || new Date().toISOString().slice(0, 10),
			type: item.type || "travel",
			tags: item.tags || [],
			mood: item.mood || "",
			cover: photos[0]?.src || item.cover || "",
			photos,
			album: item.album || "",
			posts: item.posts || [],
			excerpt: item.excerpt || "",
			pinned: Boolean(item.pinned),
		};

		if (!Number.isFinite(entry.lat) || !Number.isFinite(entry.lng)) {
			console.warn(`  ! ${title} 缺少有效坐标，跳过`);
			continue;
		}
		writeEntry(id, entry, args);
	}
}

/* ------------------------------------------------------------------ */
/* 模式二：扫描照片文件夹                                               */
/* ------------------------------------------------------------------ */

function collectImages(dir) {
	const out = [];
	const walk = (d) => {
		for (const item of readdirSync(d, { withFileTypes: true })) {
			const full = path.join(d, item.name);
			if (item.isDirectory()) walk(full);
			else if (IMAGE_EXT.has(path.extname(item.name).toLowerCase())) out.push(full);
		}
	};
	walk(dir);
	return out.sort();
}

/**
 * 聚类成「一个地方一天」= 一个标点。
 * 判据：同一天 且 相距 < 200 米 —— 走动几百米内的照片算同一处，
 * 不会因为坐标抖了几十米就拆成两个标点。
 */
const CLUSTER_METERS = 200;

function metersBetween(a, b) {
	const R = 6371008.8;
	const toRad = (d) => (d * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function cluster(photos) {
	const groups = [];
	for (const item of photos) {
		const found = groups.find(
			(g) =>
				g.date === item.date && metersBetween(g.anchor, item) < CLUSTER_METERS,
		);
		if (found) found.items.push(item);
		else groups.push({ date: item.date, anchor: item, items: [item] });
	}
	return groups;
}

async function runFromFolder(sharp) {
	const inputDir = path.resolve(args.input || path.join(__dirname, "footprint-inbox"));
	if (!existsSync(inputDir)) {
		console.error(`照片文件夹不存在：${inputDir}`);
		console.error("新建该文件夹，把带 GPS 的照片丢进去，再跑一次。");
		process.exit(1);
	}

	const files = collectImages(inputDir);
	if (files.length === 0) {
		console.log(`\n${inputDir} 里没有找到图片。支持的格式：${[...IMAGE_EXT].join(" ")}`);
		return;
	}
	console.log(`\n扫描 ${files.length} 张图片…`);

	const photos = [];
	for (const file of files) {
		const exif = readExif(file);
		const fromName = parseFilename(file);
		const lat = fromName.lat ?? exif?.lat;
		const lng = fromName.lng ?? exif?.lng;
		const date = (exif?.dateTime || "").slice(0, 10) || new Date(statSync(file).mtime).toISOString().slice(0, 10);

		if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
			console.log(`  · 无 GPS，跳过：${path.basename(file)}（可用 名称@lat,lng.jpg 指定）`);
			continue;
		}
		photos.push({
			file,
			lat,
			lng,
			altitude: exif?.altitude,
			date,
			name: fromName.name,
			camera: exif?.camera || "",
		});
		console.log(`  ✓ ${path.basename(file)} → ${lat.toFixed(5)}, ${lng.toFixed(5)} (${date})`);
	}

	if (photos.length === 0) {
		console.log("\n没有带坐标的照片。给文件改名成 名称@纬度,经度.jpg 再试。");
		return;
	}

	const groups = cluster(photos);
	console.log(`\n聚成 ${groups.length} 个标点，开始生成…`);

	for (const group of groups) {
		const first = group.items[0];
		const dates = [...new Set(group.items.map((p) => p.date))].sort();
		const baseName = first.name || "足迹";
		const id = slugify(baseName, { lat: first.lat, lng: first.lng, date: dates[0] });
		const destDir = path.join(IMAGE_DIR, id);

		// 按时间排序后依次落图：第一张同时作为封面
		const ordered = [...group.items].sort((a, b) => a.date.localeCompare(b.date));
		const placed = [];
		let i = 0;
		for (const item of ordered) {
			i += 1;
			const fileName = await placeImage(sharp, item.file, destDir, `p${i}`);
			placed.push({ src: `/images/footprints/${id}/${fileName}`, alt: "", caption: "" });
		}

		let geo = null;
		if (args.geocode) {
			geo = await reverseGeocode(first.lat, first.lng);
			await sleep(1100); // 遵守 Nominatim 1 req/s
		}

		const entry = {
			title: [geo?.place, geo?.region].filter(Boolean).join(" · ") || baseName,
			summary: "",
			lat: Number(first.lat.toFixed(6)),
			lng: Number(first.lng.toFixed(6)),
			altitude: first.altitude,
			place: geo?.place || "",
			region: geo?.region || "",
			country: geo?.country || "",
			countryCode: geo?.countryCode || "",
			date: dates[0],
			dateEnd: dates.length > 1 ? dates[dates.length - 1] : undefined,
			type: "travel",
			tags: [],
			cover: placed[0]?.src || "",
			photos: placed,
			posts: [],
			body: `<!-- ${group.items.length} 张照片，拍摄日期 ${dates.join(" / ")}${first.camera ? `，设备 ${first.camera}` : ""} -->`,
		};

		writeEntry(id, entry, args);
	}
}

/* ------------------------------------------------------------------ */
/* main                                                               */
/* ------------------------------------------------------------------ */

const sharp = await loadSharp();
if (!sharp) {
	console.warn("\n! 未找到 sharp，图片将原样复制（建议安装以获得自动压缩与转 webp）\n");
}

if (args.fromEntry) await runFromEntry(sharp);
else await runFromFolder(sharp);

console.log("\n完成。下一步：pnpm dev 打开 /globe/ 看效果。\n");
