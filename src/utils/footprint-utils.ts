/**
 * 足迹数据处理
 *
 * 职责：把 `footprints` 内容集合编译成前端消费的扁平结构，
 * 并按主题的 permalink 规则解析出关联博客文章的真实链接（双向联动的「足迹 → 文章」方向）。
 */
import { getCollection, type CollectionEntry } from "astro:content";

import type { Footprint, FootprintPhoto, FootprintsIndex, FootprintType } from "../types/footprint";
import { getPostUrl, getPostUrlBySlug, removeFileExtension } from "./url-utils";

type FootprintEntry = CollectionEntry<"footprints">;

/** 把任意输入统一成图集对象数组 */
function normalizePhotos(
	raw: FootprintEntry["data"]["photos"],
): FootprintPhoto[] {
	return (raw ?? []).map((item) =>
		typeof item === "string"
			? { src: item, alt: "", caption: "" }
			: { src: item.src, alt: item.alt ?? "", caption: item.caption ?? "" },
	);
}

/** 日期 → YYYY-MM-DD */
function toDateStr(value: Date | undefined): string {
	if (!value) return "";
	const d = new Date(value);
	if (Number.isNaN(d.getTime())) return "";
	const pad = (n: number) => String(n).padStart(2, "0");
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * 解析文章 slug → 站内链接。
 * 直接复用主题的 getPostUrl，因此自定义 permalink / alias / 全局 permalink 规则都会被遵守。
 */
export function resolvePostUrl(
	slug: string,
	post?: CollectionEntry<"posts">,
): string {
	const key = removeFileExtension(slug);
	if (post) return getPostUrl(post);
	return getPostUrlBySlug(key);
}

/** 读取全部足迹并扁平化（不含草稿），置顶优先、其次按日期倒序 */
export async function getFootprints(): Promise<Footprint[]> {
	let entries: FootprintEntry[] = [];
	try {
		entries = await getCollection("footprints");
	} catch {
		// 集合尚未建立或目录为空时静默返回空数组，页面照常渲染
		return [];
	}

	const posts = await getCollection("posts").catch(() => []);
	const postMap = new Map<string, CollectionEntry<"posts">>();
	for (const post of posts) {
		postMap.set(removeFileExtension(post.id), post);
	}

	const list: Footprint[] = entries
		.filter((entry) => !entry.data.draft)
		.map((entry) => {
			const data = entry.data;
			const id = removeFileExtension(entry.id);
			const postSlugs = data.posts ?? [];
			return {
				id,
				title: data.title,
				summary: data.summary ?? "",

				lat: data.lat,
				lng: data.lng,
				altitude: data.altitude,
				accuracy: data.accuracy,

				place: data.place ?? "",
				region: data.region ?? "",
				country: data.country ?? "",
				countryCode: data.countryCode ?? "",

				date: toDateStr(data.date),
				dateEnd: data.dateEnd ? toDateStr(data.dateEnd) : undefined,
				visits: (data.visits ?? []).map((v) => ({
					date: toDateStr(v.date),
					note: v.note ?? "",
				})),

				type: (data.type ?? "travel") as FootprintType,
				tags: data.tags ?? [],
				mood: data.mood ?? "",

				cover: data.cover ?? "",
				photos: normalizePhotos(data.photos),
				album: data.album ?? "",

				posts: postSlugs,
				postLinks: postSlugs.map((slug) => {
					const key = removeFileExtension(slug);
					const post = postMap.get(key);
					return {
						slug,
						title: post?.data.title ?? key,
						url: resolvePostUrl(key, post),
					};
				}),
				excerpt: data.excerpt ?? "",

				pinned: Boolean(data.pinned),
			} satisfies Footprint;
		});

	list.sort((a, b) => {
		if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
		return (b.date || "").localeCompare(a.date || "");
	});

	return list;
}

/** 计算地理包围盒 [minLng, minLat, maxLng, maxLat]，用于地球初始取景 */
export function computeBbox(
	footprints: Footprint[],
): [number, number, number, number] | null {
	if (footprints.length === 0) return null;
	const lngs = footprints.map((f) => f.lng);
	const lats = footprints.map((f) => f.lat);
	return [
		Math.min(...lngs),
		Math.min(...lats),
		Math.max(...lngs),
		Math.max(...lats),
	];
}

/** 组装完整索引（/api/footprints.json 的响应体，也供构建脚本复用） */
export async function getFootprintsIndex(): Promise<FootprintsIndex> {
	const footprints = await getFootprints();
	return {
		generatedAt: new Date().toISOString(),
		count: footprints.length,
		bbox: computeBbox(footprints),
		footprints,
	};
}

/** 反向索引：文章 slug → 关联足迹（「文章 → 足迹」方向） */
export async function getFootprintsByPost(): Promise<Map<string, Footprint[]>> {
	const footprints = await getFootprints();
	const map = new Map<string, Footprint[]>();
	for (const fp of footprints) {
		for (const slug of fp.posts) {
			const key = removeFileExtension(slug);
			const bucket = map.get(key) ?? [];
			bucket.push(fp);
			map.set(key, bucket);
		}
	}
	return map;
}
