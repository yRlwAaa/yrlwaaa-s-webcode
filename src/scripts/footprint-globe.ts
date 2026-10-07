/**
 * 地球足迹 —— 客户端引擎
 *
 * 能力：
 *  1. 3D 地球（MapLibre GL globe 投影），可自由旋转/缩放/拖拽到任意区域
 *  2. 实时经纬度 + 缩放级别显示，精确到 5 位小数（约 1 米）
 *  3. 足迹标点：图上标点、点击查看、照片集、感想文字
 *  4. 与博客文章双向联动：足迹 → 文章链接；文章 → 足迹由页面侧提供
 *  5. 创作模式：点图落点 → 填地点/日期/类型/文字/照片 → 导出条目 JSON
 *
 * 数据来源：页面内联的 <script type="application/json" id="fm-data">，
 * 由 /globe/ 页在构建期注入（等价于 /api/footprints.json）。
 */
import {
	AttributionControl,
	GeoJSONSource,
	Map as MapLibreMap,
	NavigationControl,
	ScaleControl,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

/** 最小 GeoJSON 类型（maplibre-gl v6 不再全局暴露 GeoJSON 命名空间） */
interface GeoPointGeometry {
	type: "Point";
	coordinates: [number, number];
}
interface GeoFeature {
	type: "Feature";
	id?: string;
	geometry: GeoPointGeometry;
	properties: Record<string, unknown>;
}
interface GeoFeatureCollection {
	type: "FeatureCollection";
	features: GeoFeature[];
}

/* ------------------------------------------------------------------ */
/* 类型                                                               */
/* ------------------------------------------------------------------ */

interface FootprintPhoto {
	src: string;
	alt?: string;
	caption?: string;
}
interface FootprintPostLink {
	slug: string;
	title: string;
	url: string;
}
interface Footprint {
	id: string;
	title: string;
	summary: string;
	lat: number;
	lng: number;
	altitude?: number;
	accuracy?: number;
	place: string;
	region: string;
	country: string;
	countryCode: string;
	date: string;
	dateEnd?: string;
	visits: { date: string; note?: string }[];
	type: string;
	tags: string[];
	mood: string;
	cover: string;
	photos: FootprintPhoto[];
	album: string;
	posts: string[];
	postLinks: FootprintPostLink[];
	excerpt: string;
	pinned: boolean;
}
interface FootprintIndex {
	generatedAt: string;
	count: number;
	bbox: number[] | null;
	footprints: Footprint[];
}
interface PostOption {
	slug: string;
	title: string;
	url: string;
}

/* ------------------------------------------------------------------ */
/* 常量                                                               */
/* ------------------------------------------------------------------ */

const STYLE_URL = "https://tiles.openfreemap.org/styles/liberty";

const TYPE_META: Record<string, { label: string; icon: string; color: string }> =
	{
		travel: { label: "旅行", icon: "flight", color: "#4c8dff" },
		life: { label: "生活", icon: "home", color: "#41c9a0" },
		food: { label: "美食", icon: "restaurant", color: "#ff8f56" },
		nature: { label: "自然", icon: "forest", color: "#5ac36b" },
		city: { label: "城市", icon: "location-city", color: "#8f7bff" },
		photo: { label: "摄影", icon: "photo-camera", color: "#ff6f91" },
		memory: { label: "回忆", icon: "favorite", color: "#e2568a" },
	};

const FALLBACK_TYPE = {
	label: "足迹",
	icon: "pin-drop",
	color: "#4c8dff",
};

function typeMeta(type: string) {
	return TYPE_META[type] ?? FALLBACK_TYPE;
}

/* ------------------------------------------------------------------ */
/* 工具                                                               */
/* ------------------------------------------------------------------ */

function readJson<T>(id: string, fallback: T): T {
	const el = document.getElementById(id);
	if (!el) return fallback;
	try {
		return JSON.parse(el.textContent || "") as T;
	} catch (err) {
		console.warn(`[footprint] 解析 ${id} 失败`, err);
		return fallback;
	}
}

function esc(value: unknown): string {
	return String(value ?? "").replace(
		/[&<>"']/g,
		(c) =>
			({
				"&": "&amp;",
				"<": "&lt;",
				">": "&gt;",
				'"': "&quot;",
				"'": "&#39;",
			})[c] as string,
	);
}

/** 经纬度 → 人类可读坐标 */
function formatLat(lat: number): string {
	return `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? "N" : "S"}`;
}
function formatLng(lng: number): string {
	return `${Math.abs(lng).toFixed(5)}° ${lng >= 0 ? "E" : "W"}`;
}

/** 两点球面距离（米） */
function haversine(
	a: { lng: number; lat: number },
	b: { lng: number; lat: number },
): number {
	const R = 6371008.8;
	const toRad = (d: number) => (d * Math.PI) / 180;
	const dLat = toRad(b.lat - a.lat);
	const dLng = toRad(b.lng - a.lng);
	const la1 = toRad(a.lat);
	const la2 = toRad(b.lat);
	const h =
		Math.sin(dLat / 2) ** 2 +
		Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
	return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

function fmtDistance(meters: number): string {
	if (meters < 1000) return `${Math.round(meters)} m`;
	if (meters < 100000) return `${(meters / 1000).toFixed(1)} km`;
	return `${Math.round(meters / 1000)} km`;
}

function year(date: string): string {
	return (date || "").slice(0, 4) || "未知";
}

function todayStr(): string {
	const d = new Date();
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/* ------------------------------------------------------------------ */
/* 状态                                                               */
/* ------------------------------------------------------------------ */

const index = readJson<FootprintIndex>("fm-data", {
	generatedAt: "",
	count: 0,
	bbox: null,
	footprints: [],
});
const allPosts = readJson<PostOption[]>("fm-posts", []);

const filters = {
	types: new Set<string>(),
	year: "",
	query: "",
};

let activeId: string | null = null;
let authorMode = false;
let draftPin: Footprint | null = null;
const draftPhotos: FootprintPhoto[] = [];

/* ------------------------------------------------------------------ */
/* DOM 引用                                                           */
/* ------------------------------------------------------------------ */

const $ = <T extends HTMLElement>(id: string): T | null =>
	document.getElementById(id) as T | null;

/**
 * 兜底：确保地球层直接挂在 <body> 下。
 *
 * 本页是独立文档（不含主题 Layout），正常情况下它本来就是 body 的子元素。
 * 保留这段是为了防止将来有人把地球嵌进别的容器 —— 一旦祖先带 transform，
 * position:fixed 的包含块会变成那个祖先，整屏层会被压缩成一小块。
 * 本模块是 type=module，执行时 DOM 已解析完，元素一定存在。
 */
function ensureShellOnBody() {
	const shell = document.getElementById("fm-shell");
	if (shell && shell.parentElement !== document.body) {
		document.body.appendChild(shell);
	}
}

ensureShellOnBody();

const mapEl = $("fm-map") as unknown as HTMLElement;
const sidebarBody = $("fm-sidebar-body");
const statusPos = $("fm-status-pos");
const statusZoom = $("fm-status-zoom");
const statusMode = $("fm-status-mode");
const countBadge = $("fm-count");
const searchInput = $("fm-search") as HTMLInputElement | null;
const typeChips = $("fm-type-chips");
const yearSelect = $("fm-year") as HTMLSelectElement | null;
const emptyHint = $("fm-empty-hint");
const authorToggle = $("fm-author-toggle") as HTMLInputElement | null;
const authorPanel = $("fm-author-panel");
const locateBtn = $("fm-locate");

if (!mapEl) throw new Error("[footprint] 找不到地图容器 #fm-map");

/* ------------------------------------------------------------------ */
/* 地图初始化                                                          */
/* ------------------------------------------------------------------ */

let map: MapLibreMap;
let globeOk = false;

/**
 * 让地球在进入页面时就以合适大小占据画面。
 * MapLibre 的 zoom≈0 时地球直径约 512px，据此按视口宽度推算缩放。
 */
function initialGlobeZoom(): number {
	const w = mapEl.clientWidth || window.innerWidth;
	const h = mapEl.clientHeight || window.innerHeight;
	const shorter = Math.min(w, h);
	// 目标：球的直径约占短边的 78%
	const zoom = Math.log2((shorter * 0.78) / 512) + 1;
	return Math.max(0.8, Math.min(3.4, zoom));
}

// 相机起点：面向东亚（东经 105°、北纬 30°），球体正面朝向用户
const START_CENTER: [number, number] = [105, 30];

try {
	map = new MapLibreMap({
		container: mapEl,
		style: STYLE_URL,
		center: START_CENTER,
		zoom: 1.8,
		minZoom: 0.2,
		maxZoom: 19,
		// 触摸与手势
		dragRotate: true,
		pitchWithRotate: false,
		touchPitch: false,
		attributionControl: false,
		hash: false,
		fadeDuration: 120,
	});
	globeOk = true;
	// 开局即地球：MapLibre 6 用 setProjection 切换投影（构造参数里已没有 projection 选项）。
	// 此刻样式通常还没就绪，会抛错——静默忽略，交给 runFirstPaint 里的 pollForStyle 重试。
	applyProjection(false);
	if (statusMode && !globeOk) statusMode.textContent = "3D 地球（准备中）";
	map.addControl(new NavigationControl({ visualizePitch: true }), "top-right");
	map.addControl(new ScaleControl({ unit: "metric" }), "bottom-right");
	map.addControl(
		new AttributionControl({
			compact: true,
			customAttribution:
				'© <a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> · © OpenStreetMap contributors',
		}),
		"bottom-right",
	);
} catch (err) {
	console.error("[footprint] MapLibre 初始化失败（可能是 WebGL 不可用）", err);
	if (emptyHint) {
		emptyHint.textContent =
			"当前浏览器/设备不支持 WebGL，无法渲染 3D 地球。可改用支持 WebGL 的浏览器访问。";
		emptyHint.hidden = false;
	}
	throw err;
}

/* ------------------------------------------------------------------ */
/* 数据过滤与统计                                                      */
/* ------------------------------------------------------------------ */

function matches(fp: Footprint): boolean {
	if (filters.types.size > 0 && !filters.types.has(fp.type)) return false;
	if (filters.year && year(fp.date) !== filters.year) return false;
	const q = filters.query.trim().toLowerCase();
	if (q) {
		const haystack = [
			fp.title,
			fp.summary,
			fp.place,
			fp.region,
			fp.country,
			fp.mood,
			fp.excerpt,
			...fp.tags,
		]
			.join(" ")
			.toLowerCase();
		if (!haystack.includes(q)) return false;
	}
	return true;
}

function visibleFootprints(): Footprint[] {
	return index.footprints.filter(matches);
}

/** 转成 GeoJSON（MapLibre 的渲染输入） */
function toGeoJson(list: Footprint[]): GeoFeatureCollection {
	return {
		type: "FeatureCollection",
		features: list.map((fp) => ({
			type: "Feature",
			id: fp.id,
			geometry: { type: "Point", coordinates: [fp.lng, fp.lat] },
			properties: {
				id: fp.id,
				title: fp.title,
				type: fp.type,
				date: fp.date,
				color: typeMeta(fp.type).color,
				cover: fp.cover || "",
			},
		})),
	};
}

/* ------------------------------------------------------------------ */
/* 地图图层                                                            */
/* ------------------------------------------------------------------ */

const SRC_POINTS = "fm-footprints";

function buildLayers() {
	if (!map.getSource(SRC_POINTS)) {
		map.addSource(SRC_POINTS, {
			type: "geojson",
			data: toGeoJson(visibleFootprints()),
			cluster: true,
			clusterRadius: 52,
			clusterMaxZoom: 12,
			clusterProperties: {
				// 记录簇内标点类型，便于聚合着色（可选扩展）
				count: ["+", 1],
			},
		});
	}

	// 聚合圆
	map.addLayer({
		id: "fm-clusters",
		type: "circle",
		source: SRC_POINTS,
		filter: ["has", "point_count"],
		paint: {
			"circle-color": "rgba(76,141,255,0.85)",
			"circle-stroke-color": "rgba(255,255,255,0.9)",
			"circle-stroke-width": 1.4,
			"circle-radius": [
				"interpolate",
				["linear"],
				["get", "point_count"],
				2,
				14,
				10,
				20,
				50,
				28,
			],
			"circle-opacity": 0.92,
		},
	});

	// 聚合数量
	map.addLayer({
		id: "fm-cluster-count",
		type: "symbol",
		source: SRC_POINTS,
		filter: ["has", "point_count"],
		layout: {
			"text-field": ["get", "point_count_abbreviated"],
			"text-size": 12,
			"text-font": ["Noto Sans Regular"],
			"text-allow-overlap": true,
		},
		paint: { "text-color": "#ffffff" },
	});

	// 单个足迹点
	map.addLayer({
		id: "fm-points",
		type: "circle",
		source: SRC_POINTS,
		filter: ["!", ["has", "point_count"]],
		paint: {
			"circle-color": ["get", "color"],
			"circle-radius": [
				"interpolate",
				["linear"],
				["zoom"],
				1,
				5,
				6,
				8,
				12,
				12,
			],
			"circle-stroke-color": "#ffffff",
			"circle-stroke-width": 1.8,
			"circle-opacity": 0.95,
		},
	});

	// 高亮点（选中态）
	map.addLayer({
		id: "fm-active",
		type: "circle",
		source: SRC_POINTS,
		filter: ["==", ["get", "id"], ""],
		paint: {
			"circle-color": ["get", "color"],
			"circle-radius": 13,
			"circle-opacity": 0.25,
			"circle-stroke-color": ["get", "color"],
			"circle-stroke-width": 2,
		},
	});

	// 悬停放大
	map.addLayer({
		id: "fm-hover",
		type: "circle",
		source: SRC_POINTS,
		filter: ["==", ["get", "id"], ""],
		paint: {
			"circle-radius": 16,
			"circle-color": "transparent",
			"circle-stroke-color": "#ffffff",
			"circle-stroke-width": 2,
		},
	});
}

function refreshSource() {
	const src = map.getSource(SRC_POINTS) as GeoJSONSource | undefined;
	if (src) src.setData(toGeoJson(visibleFootprints()));
	renderCount();
}

/* ------------------------------------------------------------------ */
/* 交互                                                               */
/* ------------------------------------------------------------------ */

function setActive(id: string | null) {
	activeId = id;
	if (map.getLayer("fm-active")) {
		map.setFilter("fm-active", ["==", ["get", "id"], id ?? ""]);
	}
}

function flyTo(fp: Footprint, zoom = 9) {
	setActive(fp.id);
	map.flyTo({
		center: [fp.lng, fp.lat],
		zoom,
		pitch: 0,
		duration: 1400,
		essential: true,
	});
}

function openFootprint(id: string, fly = true) {
	const fp = index.footprints.find((f) => f.id === id);
	if (!fp) return;
	if (fly) flyTo(fp);
	renderDetail(fp);
	// 移动端：展开抽屉
	document.body.classList.add("fm-detail-open");
}

function closeDetail() {
	setActive(null);
	document.body.classList.remove("fm-detail-open");
	renderList();
}

function bindMapEvents() {
	// 点击聚合 → 放大展开
	map.on("click", "fm-clusters", (e) => {
		const feature = map.queryRenderedFeatures(e.point, {
			layers: ["fm-clusters"],
		})[0];
		if (!feature) return;
		const clusterId = feature.properties?.cluster_id;
		const src = map.getSource(SRC_POINTS) as GeoJSONSource;
		src
			.getClusterExpansionZoom(clusterId)
			.then((zoom) => {
				const [lng, lat] = (feature.geometry as GeoPointGeometry).coordinates;
				map.easeTo({ center: [lng, lat], zoom, duration: 800 });
			})
			.catch(() => undefined);
	});

	// 点击单个足迹 → 打开详情
	map.on("click", "fm-points", (e) => {
		const feature = e.features?.[0];
		const id = feature?.properties?.id as string | undefined;
		if (id) openFootprint(id, true);
	});

	// 悬停反馈
	map.on("mousemove", "fm-points", (e) => {
		map.getCanvas().style.cursor = "pointer";
		const id = e.features?.[0]?.properties?.id as string | undefined;
		if (map.getLayer("fm-hover")) {
			map.setFilter("fm-hover", ["==", ["get", "id"], id ?? ""]);
		}
	});
	map.on("mouseleave", "fm-points", () => {
		map.getCanvas().style.cursor = "";
		if (map.getLayer("fm-hover")) {
			map.setFilter("fm-hover", ["==", ["get", "id"], ""]);
		}
	});

	// 移动/缩放 → 顶部坐标读数
	map.on("mousemove", (e) => {
		updateStatus(e.lngLat.lat, e.lngLat.lng);
	});
	map.on("move", () => {
		const c = map.getCenter();
		if (!hovering) updateStatus(c.lat, c.lng);
		updateStatusZoom();
	});

	// 创作模式：点击空白处落点
	map.on("click", (e) => {
		if (!authorMode) return;
		const hit = map.queryRenderedFeatures(e.point, {
			layers: ["fm-points", "fm-clusters"],
		});
		if (hit.length > 0) return;
		startDraft(e.lngLat.lat, e.lngLat.lng);
	});
}

let hovering = false;
mapEl.addEventListener("mouseenter", () => (hovering = true));
mapEl.addEventListener("mouseleave", () => (hovering = false));

function updateStatus(lat: number, lng: number) {
	if (!statusPos) return;
	statusPos.innerHTML =
		`<span class="fm-coord" title="纬度">${esc(formatLat(lat))}</span>` +
		`<span class="fm-coord" title="经度">${esc(formatLng(lng))}</span>`;
}

function updateStatusZoom() {
	if (!statusZoom) return;
	statusZoom.textContent = `Z ${map.getZoom().toFixed(2)}`;
}

/* ------------------------------------------------------------------ */
/* 侧栏渲染                                                            */
/* ------------------------------------------------------------------ */

function renderCount() {
	const shown = visibleFootprints().length;
	if (countBadge) {
		countBadge.textContent =
			shown === index.count ? `${index.count} 个标点` : `${shown} / ${index.count} 个标点`;
	}
	if (emptyHint) {
		emptyHint.hidden = shown !== 0;
	}
}

function photoCarousel(fp: Footprint): string {
	if (fp.photos.length === 0) {
		return fp.cover
			? `<div class="fm-cover"><img src="${esc(fp.cover)}" alt="${esc(fp.title)}" loading="lazy" decoding="async" /></div>`
			: "";
	}
	const items = fp.photos
		.map(
			(p, i) =>
				`<figure class="fm-photo${i === 0 ? " is-active" : ""}" data-index="${i}">
					<img src="${esc(p.src)}" alt="${esc(p.alt || fp.title)}" loading="lazy" decoding="async" />
					${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ""}
				</figure>`,
		)
		.join("");
	const dots = fp.photos
		.map(
			(_, i) =>
				`<button class="fm-dot${i === 0 ? " is-active" : ""}" data-index="${i}" aria-label="第 ${i + 1} 张"></button>`,
		)
		.join("");
	return `<div class="fm-gallery" data-count="${fp.photos.length}">
			<div class="fm-gallery-track">${items}</div>
			${fp.photos.length > 1 ? `<div class="fm-dots">${dots}</div>` : ""}
		</div>`;
}

function renderDetail(fp: Footprint) {
	if (!sidebarBody) return;
	const meta = typeMeta(fp.type);
	const distanceFromMe = lastKnownPosition
		? `距你上次读数 ${fmtDistance(haversine(lastKnownPosition, fp))}`
		: "";

	const visits =
		fp.visits.length > 0
			? `<div class="fm-block">
					<h4>到访记录</h4>
					<ul class="fm-visits">${fp.visits
						.map(
							(v) =>
								`<li><span class="fm-visit-date">${esc(v.date)}</span>${v.note ? `<span>${esc(v.note)}</span>` : ""}</li>`,
						)
						.join("")}</ul>
				</div>`
			: "";

	const postsBlock =
		fp.postLinks.length > 0
			? `<div class="fm-block">
					<h4>相关文章</h4>
					<div class="fm-post-links">${fp.postLinks
						.map(
							(p) =>
								`<a class="fm-post-link" href="${esc(p.url)}"><span class="fm-post-name">${esc(p.title)}</span><span class="fm-post-url">${esc(p.url)}</span></a>`,
						)
						.join("")}</div>
				</div>`
			: `<div class="fm-block fm-block--muted"><h4>相关文章</h4><p>这个标点还没有关联文章。在条目 frontmatter 里加 <code>posts: ["文章slug"]</code> 即可双向联动。</p></div>`;

	const albumBlock = fp.album
		? `<a class="fm-album-link" href="/albums/${esc(fp.album)}/">查看相册 →</a>`
		: "";

	const excerptBlock = fp.excerpt
		? `<div class="fm-block"><h4>正文摘录</h4><blockquote class="fm-excerpt">${esc(fp.excerpt)}</blockquote></div>`
		: "";

	sidebarBody.innerHTML = `
		<article class="fm-card fm-detail">
			<button class="fm-back" type="button">← 返回列表</button>
			<header class="fm-detail-head">
				<span class="fm-type-icon" style="--fm-c:${meta.color}">
					<span class="fm-icon">${meta.icon}</span>
				</span>
				<div>
					<h3>${esc(fp.title)}</h3>
					<p class="fm-detail-sub">${esc([fp.place, fp.region, fp.country].filter(Boolean).join(" · ") || "未知地点")}</p>
				</div>
			</header>

			${photoCarousel(fp)}

			<div class="fm-coords-block">
				<button class="fm-coord-chip" type="button" data-copy="${fp.lat},${fp.lng}" title="点击复制坐标">
					<span class="fm-coord">${esc(formatLat(fp.lat))}</span>
					<span class="fm-coord">${esc(formatLng(fp.lng))}</span>
				</button>
				<button class="fm-mini-btn" type="button" data-fly="${fp.id}">定位</button>
			</div>
			<p class="fm-facts">${[
				fp.altitude != null ? `海拔 ${Math.round(fp.altitude)} m` : "",
				fp.accuracy != null ? `精度 ±${Math.round(fp.accuracy)} m` : "",
				distanceFromMe,
			]
				.filter(Boolean)
				.join(" · ")}</p>

			<div class="fm-block">
				<h4>时间</h4>
				<p>${esc(fp.date || "未知")}${fp.dateEnd ? ` — ${esc(fp.dateEnd)}` : ""}${
					fp.mood ? ` · ${esc(fp.mood)}` : ""
				}</p>
			</div>

			${
				fp.summary
					? `<div class="fm-block"><h4>感想</h4><p class="fm-summary">${esc(fp.summary)}</p></div>`
					: ""
			}
			${
				fp.tags.length > 0
					? `<div class="fm-tags">${fp.tags.map((t) => `<span class="fm-tag">${esc(t)}</span>`).join("")}</div>`
					: ""
			}

			${visits}
			${postsBlock}
			${albumBlock}
		</article>
	`;
	wireDetailEvents();
}

function wireDetailEvents() {
	sidebarBody?.querySelector(".fm-back")?.addEventListener("click", closeDetail);

	sidebarBody?.querySelectorAll<HTMLElement>("[data-fly]").forEach((btn) => {
		btn.addEventListener("click", () => {
			const fp = index.footprints.find((f) => f.id === btn.dataset.fly);
			if (fp) flyTo(fp, 12);
		});
	});

	sidebarBody
		?.querySelectorAll<HTMLElement>("[data-copy]")
		.forEach((btn) => {
			btn.addEventListener("click", async () => {
				const text = btn.dataset.copy || "";
				try {
					await navigator.clipboard.writeText(text);
					btn.classList.add("is-copied");
					setTimeout(() => btn.classList.remove("is-copied"), 1200);
				} catch {
					/* 剪贴板不可用时忽略 */
				}
			});
		});

	// 图集左右切换
	const gallery = sidebarBody?.querySelector<HTMLElement>(".fm-gallery");
	if (gallery) {
		const photos = [...gallery.querySelectorAll<HTMLElement>(".fm-photo")];
		const dots = [...gallery.querySelectorAll<HTMLElement>(".fm-dot")];
		let idx = 0;
		const show = (next: number) => {
			idx = (next + photos.length) % photos.length;
			photos.forEach((p, i) => p.classList.toggle("is-active", i === idx));
			dots.forEach((d, i) => d.classList.toggle("is-active", i === idx));
		};
		dots.forEach((dot) =>
			dot.addEventListener("click", () => show(Number(dot.dataset.index))),
		);
		gallery.addEventListener("click", (e) => {
			const target = e.target as HTMLElement;
			if (target.closest(".fm-dot")) return;
			const rect = gallery.getBoundingClientRect();
			show(e.clientX - rect.left < rect.width / 2 ? idx - 1 : idx + 1);
		});
	}
}

const excerptText = "";

function renderList() {
	if (!sidebarBody) return;
	const list = visibleFootprints();

	if (list.length === 0) {
		sidebarBody.innerHTML = `<div class="fm-empty">
			<iconify-icon icon="material-symbols:public_off"></iconify-icon>
			<p>没有匹配的足迹。换个筛选条件，或打开创作模式加上第一个标点。</p>
		</div>`;
		renderCount();
		return;
	}

	sidebarBody.innerHTML = `
		<ul class="fm-list">
			${list
				.map((fp) => {
					const meta = typeMeta(fp.type);
					const thumb =
						fp.cover || fp.photos[0]?.src
							? `<img src="${esc(fp.cover || fp.photos[0].src)}" alt="" loading="lazy" decoding="async" />`
							: `<span class="fm-icon" style="color:${meta.color}">${meta.icon}</span>`;
					return `<li class="fm-card fm-item" data-id="${esc(fp.id)}">
						<div class="fm-thumb">${thumb}</div>
						<div class="fm-item-body">
							<h4>${esc(fp.title)}</h4>
							<p class="fm-item-meta">${esc(fp.date || "")} · ${esc(meta.label)}${
								fp.place ? ` · ${esc(fp.place)}` : ""
							}</p>
							${fp.summary ? `<p class="fm-item-summary">${esc(fp.summary)}</p>` : ""}
						</div>
					</li>`;
				})
				.join("")}
		</ul>
	`;

	sidebarBody.querySelectorAll<HTMLElement>(".fm-item").forEach((li) => {
		li.addEventListener("click", () => {
			const id = li.dataset.id;
			if (id) openFootprint(id, true);
		});
	});

	renderCount();
}

/* ------------------------------------------------------------------ */
/* 创作模式                                                            */
/* ------------------------------------------------------------------ */

function startDraft(lat: number, lng: number) {
	draftPin = {
		id: "draft",
		title: "",
		summary: "",
		lat,
		lng,
		place: "",
		region: "",
		country: "",
		countryCode: "",
		date: todayStr(),
		visits: [],
		type: "travel",
		tags: [],
		mood: "",
		cover: "",
		photos: [],
		album: "",
		posts: [],
		postLinks: [],
		excerpt: "",
		pinned: false,
	};
	draftPhotos.length = 0;
	renderDraft();
	reverseGeocode(lat, lng);
}

/**
 * 反向地理编码（落点后自动填地名）
 *
 * 两个免费通道，按顺序尝试，都失败就静默放弃、让用户手填：
 *  1. OpenStreetMap Nominatim（最准，但部分地区/网络不可达）
 *  2. BigDataCloud 客户端接口（无需 Key，国内可直连，字段粒度较粗）
 */
interface ReversePlace {
	place: string;
	region: string;
	country: string;
	countryCode: string;
}

async function geocodeNominatim(lat: number, lng: number): Promise<ReversePlace | null> {
	const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=zh-CN,zh,en`;
	const res = await fetch(url, { headers: { Accept: "application/json" } });
	if (!res.ok) throw new Error(String(res.status));
	const data = (await res.json()) as { address?: Record<string, string> };
	const a = data.address ?? {};
	return {
		place: a.tourism || a.amenity || a.suburb || a.neighbourhood || a.city || "",
		region: a.state || a.province || "",
		country: a.country || "",
		countryCode: (a.country_code || "").toUpperCase(),
	};
}

async function geocodeBigDataCloud(lat: number, lng: number): Promise<ReversePlace | null> {
	const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=zh`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(String(res.status));
	const d = (await res.json()) as {
		city?: string;
		locality?: string;
		principalSubdivision?: string;
		countryName?: string;
		countryCode?: string;
	};
	return {
		place: d.locality || d.city || "",
		region: d.principalSubdivision || "",
		country: d.countryName || "",
		countryCode: (d.countryCode || "").toUpperCase(),
	};
}

async function reverseGeocode(lat: number, lng: number) {
	let geo: ReversePlace | null = null;
	try {
		geo = await geocodeNominatim(lat, lng);
	} catch {
		/* 换下一个通道 */
	}
	if (!geo || (!geo.place && !geo.region && !geo.country)) {
		try {
			geo = await geocodeBigDataCloud(lat, lng);
		} catch {
			geo = null;
		}
	}

	if (!draftPin) return;
	if (!geo) {
		renderDraftStatus("地名自动识别不可用，手填即可。");
		return;
	}

	draftPin.place = geo.place;
	draftPin.region = geo.region;
	draftPin.country = geo.country;
	draftPin.countryCode = geo.countryCode;
	if (!draftPin.title) {
		draftPin.title = [geo.place, geo.region].filter(Boolean).join(" · ") || geo.country;
	}
	const titleInput = sidebarBody?.querySelector<HTMLInputElement>("#fm-f-title");
	const placeInput = sidebarBody?.querySelector<HTMLInputElement>("#fm-f-place");
	if (titleInput && !titleInput.value) titleInput.value = draftPin.title;
	if (placeInput) placeInput.value = draftPin.place;
	renderDraftStatus("已自动识别地名，可直接改。");
}

function renderDraftStatus(text: string) {
	const el = sidebarBody?.querySelector<HTMLElement>(".fm-draft-status");
	if (el) el.textContent = text;
}

function renderDraft() {
	if (!sidebarBody || !draftPin) return;
	const fp = draftPin;
	const typeOptions = Object.entries(TYPE_META)
		.map(
			([key, meta]) =>
				`<option value="${key}"${fp.type === key ? " selected" : ""}>${meta.label}</option>`,
		)
		.join("");
	const postOptions = allPosts
		.map(
			(p) =>
				`<option value="${esc(p.slug)}">${esc(p.title)}</option>`,
		)
		.join("");

	sidebarBody.innerHTML = `
		<article class="fm-card fm-draft">
			<header class="fm-detail-head">
				<span class="fm-type-icon" style="--fm-c:#4c8dff">
					<iconify-icon icon="material-symbols:edit_location_alt"></iconify-icon>
				</span>
				<div>
					<h3>新标点</h3>
					<p class="fm-detail-sub">${esc(formatLat(fp.lat))} · ${esc(formatLng(fp.lng))}</p>
				</div>
			</header>

			<p class="fm-draft-status">已落点。补全信息后导出，或直接在地图上再点一次换位置。</p>

			<label class="fm-field"><span>地点名</span>
				<input id="fm-f-title" type="text" placeholder="例如：上海 · 外滩" value="${esc(fp.title)}" />
			</label>
			<label class="fm-field"><span>日期</span>
				<input id="fm-f-date" type="date" value="${esc(fp.date)}" />
			</label>
			<label class="fm-field"><span>类型</span>
				<select id="fm-f-type">${typeOptions}</select>
			</label>
			<label class="fm-field"><span>行政地名</span>
				<input id="fm-f-place" type="text" placeholder="市/区" value="${esc(fp.place)}" />
			</label>
			<label class="fm-field"><span>标签（逗号分隔）</span>
				<input id="fm-f-tags" type="text" placeholder="旅行, 夜景" value="${esc(fp.tags.join(", "))}" />
			</label>
			<label class="fm-field"><span>感想 / 文字</span>
				<textarea id="fm-f-summary" rows="5" placeholder="在这里写当时看到的东西、心情……">${esc(fp.summary)}</textarea>
			</label>

			<div class="fm-field">
				<span>照片</span>
				<div class="fm-drop" id="fm-drop">
					<input id="fm-files" type="file" accept="image/*" multiple hidden />
					<button type="button" class="fm-btn fm-btn--ghost" id="fm-pick">选择本地图片</button>
					<span class="fm-hint">仅用于预览排版；正式入库请把图片放进 public/images/footprints/ 或直接用导入脚本。</span>
				</div>
				<div class="fm-draft-photos" id="fm-draft-photos"></div>
			</div>

			<label class="fm-field"><span>关联博客文章</span>
				<select id="fm-f-posts" multiple size="4">${postOptions}</select>
			</label>

			<div class="fm-actions">
				<button type="button" class="fm-btn fm-btn--primary" id="fm-export">导出条目</button>
				<button type="button" class="fm-btn fm-btn--ghost" id="fm-copy-json">复制 JSON</button>
				<button type="button" class="fm-btn fm-btn--ghost" id="fm-cancel">取消</button>
			</div>
		</article>
	`;
	wireDraftEvents();
	renderDraftPhotos();
}

function renderDraftPhotos() {
	const box = sidebarBody?.querySelector<HTMLElement>("#fm-draft-photos");
	if (!box) return;
	box.innerHTML = draftPhotos
		.map(
			(p, i) =>
				`<div class="fm-draft-photo"><img src="${esc(p.src)}" alt="" /><button type="button" data-remove="${i}" aria-label="移除">×</button></div>`,
		)
		.join("");
	box.querySelectorAll<HTMLElement>("[data-remove]").forEach((btn) => {
		btn.addEventListener("click", () => {
			draftPhotos.splice(Number(btn.dataset.remove), 1);
			renderDraftPhotos();
		});
	});
}

function collectDraft(): Footprint | null {
	if (!draftPin) return null;
	const q = <T extends HTMLElement>(sel: string) =>
		sidebarBody?.querySelector<T>(sel) ?? null;

	const title = q<HTMLInputElement>("#fm-f-title")?.value.trim() || "未命名地点";
	const date = q<HTMLInputElement>("#fm-f-date")?.value || todayStr();
	const type = q<HTMLSelectElement>("#fm-f-type")?.value || "travel";
	const place = q<HTMLInputElement>("#fm-f-place")?.value.trim() || "";
	const tags = (q<HTMLInputElement>("#fm-f-tags")?.value || "")
		.split(/[,，]/)
		.map((t) => t.trim())
		.filter(Boolean);
	const summary = q<HTMLTextAreaElement>("#fm-f-summary")?.value || "";
	const postSel = q<HTMLSelectElement>("#fm-f-posts");
	const posts = postSel
		? [...postSel.selectedOptions].map((o) => o.value)
		: [];

	return {
		...draftPin,
		title,
		date,
		type,
		place,
		tags,
		summary,
		photos: [...draftPhotos],
		posts,
	};
}

/** 导出为「足迹条目」JSON：可被 scripts/footprint-import.mjs 直接消费 */
function draftToEntryJSON(fp: Footprint) {
	return {
		title: fp.title,
		summary: fp.summary,
		lat: Number(fp.lat.toFixed(6)),
		lng: Number(fp.lng.toFixed(6)),
		date: fp.date,
		type: fp.type,
		place: fp.place,
		region: fp.region,
		country: fp.country,
		countryCode: fp.countryCode,
		tags: fp.tags,
		photos: fp.photos.map((p) => p.src),
		posts: fp.posts,
	};
}

function downloadJson(name: string, data: unknown) {
	const blob = new Blob([JSON.stringify(data, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	a.remove();
	URL.revokeObjectURL(url);
}

function wireDraftEvents() {
	const pick = sidebarBody?.querySelector<HTMLElement>("#fm-pick");
	const files = sidebarBody?.querySelector<HTMLInputElement>("#fm-files");

	pick?.addEventListener("click", () => files?.click());
	files?.addEventListener("change", () => {
		for (const file of files.files ?? []) {
			const url = URL.createObjectURL(file);
			draftPhotos.push({ src: url, alt: file.name });
		}
		renderDraftPhotos();
	});

	sidebarBody?.querySelector("#fm-cancel")?.addEventListener("click", () => {
		draftPin = null;
		draftPhotos.length = 0;
		renderList();
	});

	const doExport = () => {
		const fp = collectDraft();
		if (!fp) return;
		const entry = draftToEntryJSON(fp);
		const safe = (fp.title || "footprint").replace(/[\\/:*?"<>|\s]+/g, "-");
		downloadJson(`${safe}.json`, entry);
		renderDraftStatus("已导出 JSON。放到 scripts/footprint-inbox/ 后运行导入脚本即可入库。");
	};

	sidebarBody?.querySelector("#fm-export")?.addEventListener("click", doExport);

	sidebarBody?.querySelector("#fm-copy-json")?.addEventListener("click", async () => {
		const fp = collectDraft();
		if (!fp) return;
		try {
			await navigator.clipboard.writeText(
				JSON.stringify(draftToEntryJSON(fp), null, 2),
			);
			renderDraftStatus("条目 JSON 已复制到剪贴板。");
		} catch {
			renderDraftStatus("剪贴板不可用，请改用「导出条目」。");
		}
	});
}

/* ------------------------------------------------------------------ */
/* 顶部/侧栏控件                                                       */
/* ------------------------------------------------------------------ */

function buildTypeChips() {
	if (!typeChips) return;
	const used = new Map<string, number>();
	for (const fp of index.footprints) {
		used.set(fp.type, (used.get(fp.type) ?? 0) + 1);
	}
	const entries = [...used.entries()].sort((a, b) => b[1] - a[1]);
	typeChips.innerHTML = entries
		.map(([type, n]) => {
			const meta = typeMeta(type);
			return `<button class="fm-chip" type="button" data-type="${esc(type)}" style="--fm-c:${meta.color}">
				<span class="fm-icon">${meta.icon}</span>${esc(meta.label)}<em>${n}</em>
			</button>`;
		})
		.join("");

	typeChips.querySelectorAll<HTMLElement>("[data-type]").forEach((chip) => {
		chip.addEventListener("click", () => {
			const type = chip.dataset.type || "";
			if (filters.types.has(type)) filters.types.delete(type);
			else filters.types.add(type);
			chip.classList.toggle("is-active", filters.types.has(type));
			refreshSource();
			renderList();
		});
	});
}

function buildYearOptions() {
	if (!yearSelect) return;
	const years = [
		...new Set(index.footprints.map((fp) => year(fp.date))),
	].sort((a, b) => b.localeCompare(a));
	yearSelect.innerHTML =
		`<option value="">全部年份</option>` +
		years.map((y) => `<option value="${esc(y)}">${esc(y)}</option>`).join("");
	yearSelect.addEventListener("change", () => {
		filters.year = yearSelect.value;
		refreshSource();
		renderList();
	});
}

searchInput?.addEventListener("input", () => {
	filters.query = searchInput.value;
	refreshSource();
	renderList();
});

authorToggle?.addEventListener("change", () => {
	authorMode = authorToggle.checked;
	authorPanel?.classList.toggle("is-open", authorMode);
	map.getCanvas().style.cursor = authorMode ? "crosshair" : "";
	if (!authorMode) {
		draftPin = null;
		renderList();
	} else {
		renderDraftHint();
	}
});

function renderDraftHint() {
	if (!sidebarBody) return;
	sidebarBody.innerHTML = `<div class="fm-empty fm-empty--author">
		<iconify-icon icon="material-symbols:touch_app"></iconify-icon>
		<p>在球上点一下想记录的位置。也可以先缩放拖动到精确位置，再点落点。</p>
		<p class="fm-hint">落点后会在这里出现表单：地点名、日期、类型、感想文字、照片、关联文章。</p>
	</div>`;
}

locateBtn?.addEventListener("click", () => {
	if (!navigator.geolocation) return;
	locateBtn.classList.add("is-busy");
	navigator.geolocation.getCurrentPosition(
		(pos) => {
			locateBtn.classList.remove("is-busy");
			lastKnownPosition = {
				lat: pos.coords.latitude,
				lng: pos.coords.longitude,
			};
			map.flyTo({
				center: [pos.coords.longitude, pos.coords.latitude],
				zoom: 13,
				duration: 1600,
			});
			updateStatus(pos.coords.latitude, pos.coords.longitude);
		},
		(error) => {
			locateBtn.classList.remove("is-busy");
			console.warn("[footprint] 定位失败", error.message);
			const label = locateBtn.querySelector("span:last-child");
			if (label) label.textContent = "定位不可用";
			setTimeout(() => {
				if (label) label.textContent = "定位到我";
			}, 2200);
		},
		{ enableHighAccuracy: true, timeout: 8000 },
	);
});

let lastKnownPosition: { lat: number; lng: number } | null = null;

/* ------------------------------------------------------------------ */
/* 启动                                                               */
/* ------------------------------------------------------------------ */

/**
 * 首屏初始化。
 *
 * 关键设计：**不依赖 map 的 load 事件**。
 * 面板数据（列表、筛选、计数）只跟 DOM 有关，任何情况下都必须渲染出来；
 * 地图图层则只在样式就绪后才挂，就绪不了也不影响页面可用性。
 * 因此这里做成幂等，load 事件与定时兜底都可以调用。
 */
let firstPaintDone = false;

function runFirstPaint() {
	if (firstPaintDone) return;
	firstPaintDone = true;

	// 1) 投影与图层：交给轮询，样式就绪后自动切地球并挂图层；
	//    样式不就绪也不会抛错，更不会影响下面的面板渲染。
	pollForStyle();

	// 2) 面板：与地图无关，必须渲染
	map.resize(); // 容器可能刚被搬动过，重新量一次尺寸
	buildTypeChips();
	buildYearOptions();
	renderCount();
	renderList();
	updateStatusZoom();
	syncOffset();

	const c = map.getCenter();
	updateStatus(c.lat, c.lng);
	initialView();

	// 3) 收起遮罩：idle 之后再收，避免看到空白；定时兜底防呆
	map.once("idle", hideLoading);
	setTimeout(hideLoading, 2500);

	// 4) 深链：?f=<足迹id> 直接飞到该标点
	const params = new URLSearchParams(location.search);
	const target = params.get("f");
	if (target) openFootprint(target, true);
}

/**
 * 地球层距顶部的偏移。
 *
 * 本页是独立文档（没有导航栏），所以默认就是 0，铺满整个视口。
 * 只有在被人为嵌进别的容器时，才需要显式给 --fm-offset 留出顶部空间。
 */
function syncOffset() {
	const shell = document.getElementById("fm-shell");
	if (!shell) return;
	const declared = getComputedStyle(shell).getPropertyValue("--fm-offset-declared").trim();
	shell.style.setProperty("--fm-offset", declared || "0px");
}

window.addEventListener("resize", syncOffset, { passive: true });
syncOffset();

function hideLoading() {
	const veil = document.getElementById("fm-loading");
	if (!veil) return;
	veil.classList.add("is-hidden");
	setTimeout(() => veil.remove(), 700);
}

function applyProjection(verbose: boolean) {
	// MapLibre 6 用 setProjection 切换投影；样式没加载完时会抛 "Style is not done loading"。
	// verbose=false 时把这类「还没到时候」的错误静默掉，交给 pollForStyle 重试。
	try {
		map.setProjection({ type: "globe" });
		globeOk = true;
		if (statusMode) {
			statusMode.textContent = "3D 地球";
			statusMode.dataset.projection = "globe";
			delete statusMode.dataset.projectionError;
		}
	} catch (err) {
		globeOk = false;
		const message = err instanceof Error ? err.message : String(err);
		if (verbose) {
			// 真正失败：写进 DOM，用户/开发者一眼可见，而不是只躺在控制台
			if (statusMode) {
				statusMode.textContent = "平面地图";
				statusMode.dataset.projectionError = message;
				statusMode.title = `globe 投影不可用：${message}`;
			}
			console.warn("[footprint] globe 投影不可用，退回平面地图：", message);
		}
		return false;
	}
	return true;
}

/**
 * 轮询等样式就绪 → 切地球 → 挂图层。
 * 不依赖 map 的 load 事件：个别环境（软件渲染的无头浏览器等）load 永远不来，
 * 用轮询保证「能成就成，不成也不影响页面其余部分」。
 */
function pollForStyle() {
	let tries = 0;
	const maxTries = 40; // 40 × 500ms = 20s
	const timer = setInterval(() => {
		tries += 1;
		const loaded = map.isStyleLoaded?.() ?? true;
		const projected = loaded ? applyProjection(true) : false;
		if (loaded && projected) {
			clearInterval(timer);
			buildLayers();
			bindMapEvents();
			refreshSource();
			initialView();
			if (statusMode) statusMode.title = "拖拽旋转 · 滚轮缩放 · 点击标点";
			return;
		}
		if (tries >= maxTries) {
			clearInterval(timer);
			if (statusMode && !globeOk) {
				statusMode.textContent = "平面地图";
				statusMode.title = "底图样式未就绪：球体渲染不可用，标点与数据仍然可用";
			}
		}
	}, 500);
}

/**
 * 初始取景：
 *  - 有坐标数据时，尽量把全部标点框进视野（但仍保持球体形态）
 *  - 没有数据时，直接把球调整到合适大小——保证「打开就是一颗地球」
 */
function initialView() {
	const bbox = index.bbox;
	if (bbox && bbox.length === 4 && index.count > 0) {
		const [minLng, minLat, maxLng, maxLat] = bbox;
		map.fitBounds(
			[
				[minLng, minLat],
				[maxLng, maxLat],
			],
			{ padding: 90, duration: 0, maxZoom: 8 },
		);
	} else {
		map.jumpTo({ center: START_CENTER, zoom: initialGlobeZoom() });
	}
	map.setPitch(0);
	map.setBearing(0);
}


map.on("load", runFirstPaint);
// 兜底：某些环境（软件渲染的无头浏览器、WebGL 上下文异常）永远不触发 load，
// 用定时器保证「数据面板一定会渲染出来、遮罩一定会消失、图层尽量补上」。
setTimeout(runFirstPaint, 1500);

map.on("error", (e) => {
	const msg = String((e as unknown as { error?: Error }).error?.message ?? "");
	// 瓦片 404 之类不弹窗，只记录
	if (msg) console.debug("[footprint] map error:", msg);
});

export {};
