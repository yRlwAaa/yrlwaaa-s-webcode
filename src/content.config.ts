import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const postsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/posts" }),
	schema: z.object({
		title: z.string(),
		published: z.date(),
		updated: z.date().optional(),
		draft: z.boolean().optional().default(false),
		description: z.string().optional().default(""),
		image: z.string().optional().default(""),
		tags: z.array(z.string()).optional().default([]),
		category: z.string().optional().nullable().default(""),
		lang: z.string().optional().default(""),
		pinned: z.boolean().optional().default(false),
		comment: z.boolean().optional().default(true),
		priority: z.number().optional(),
		author: z.string().optional().default(""),
		sourceLink: z.string().optional().default(""),
		licenseName: z.string().optional().default(""),
		licenseUrl: z.string().optional().default(""),

		/* Page encryption fields */
		encrypted: z.boolean().optional().default(false),
		password: z.string().optional().default(""),
		passwordHint: z.string().optional().default(""),

		/* Posts alias */
		alias: z.string().optional(),

		/* Custom permalink - 自定义固定链接，优先级高于 alias */
		permalink: z.string().optional(),

		/* For internal use */
		prevTitle: z.string().default(""),
		prevSlug: z.string().default(""),
		nextTitle: z.string().default(""),
		nextSlug: z.string().default(""),
	}),
});
const specCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/spec" }),
	schema: z.object({}),
});

/**
 * 足迹（地球标点）集合
 *
 * 一条 = 地球上的一个标点：坐标 + 时间 + 照片 + 感想文字 + 关联的博客文章。
 * 可手写，也可由 `node scripts/footprint-import.mjs` 从照片 EXIF 批量生成。
 */
const footprintsCollection = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/footprints" }),
	schema: z.object({
		/** 地点名（必填），例如「上海 · 外滩」 */
		title: z.string(),
		/** 简短一句描述，用于地图侧栏与列表卡片 */
		summary: z.string().optional().default(""),

		// ---- 坐标 ----
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
		/** 海拔（米），可选 */
		altitude: z.number().optional(),
		/** 坐标精度（米），由导入脚本从 EXIF GPS 估算，越小越精确 */
		accuracy: z.number().optional(),

		// ---- 地点信息 ----
		place: z.string().optional().default(""),
		region: z.string().optional().default(""),
		country: z.string().optional().default(""),
		countryCode: z.string().optional().default(""),

		// ---- 时间 ----
		/** 到访日期 YYYY-MM-DD（多次到访时取首次） */
		date: z.coerce.date(),
		/** 多次到访的其它日期 */
		dateEnd: z.coerce.date().optional(),
		/** 到访记录：可写多个时间点 */
		visits: z
			.array(
				z.object({
					date: z.coerce.date(),
					note: z.string().optional().default(""),
				}),
			)
			.optional()
			.default([]),

		// ---- 分类 ----
		/** 标点类型，决定地球上的图标与配色 */
		type: z
			.enum(["travel", "life", "food", "nature", "city", "photo", "memory"])
			.optional()
			.default("travel"),
		tags: z.array(z.string()).optional().default([]),
		mood: z.string().optional().default(""),

		// ---- 媒体 ----
		/** 卡片/侧栏封面图 */
		cover: z.string().optional().default(""),
		/** 图集：字符串路径，或 {src, alt, caption} 对象 */
		photos: z
			.array(
				z.union([
					z.string(),
					z.object({
						src: z.string(),
						alt: z.string().optional().default(""),
						caption: z.string().optional().default(""),
					}),
				]),
			)
			.optional()
			.default([]),
		/** 关联到 /albums/ 里已有的相册 id */
		album: z.string().optional().default(""),

		// ---- 与博客文章联动 ----
		/** 关联的博客文章 slug（src/content/posts/ 下的文件名），双向链接 */
		posts: z.array(z.string()).optional().default([]),
		/** 摘录一句该地相关的正文片段 */
		excerpt: z.string().optional().default(""),

		// ---- 展示控制 ----
		draft: z.boolean().optional().default(false),
		/** 置顶展示优先于日期排序 */
		pinned: z.boolean().optional().default(false),
	}),
});

export const collections = {
	posts: postsCollection,
	spec: specCollection,
	footprints: footprintsCollection,
};
