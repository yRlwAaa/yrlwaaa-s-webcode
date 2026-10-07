/**
 * 足迹（地球标点）类型定义
 *
 * 这些类型描述「从内容集合编译出来、发给前端的扁平数据」。
 * 前端地球页只认这个结构；数据源（Markdown frontmatter / 照片 EXIF / 手写 JSON）变化不影响前端。
 */

/** 标点类型：决定地球上的图标与配色 */
export type FootprintType =
	| "travel"
	| "life"
	| "food"
	| "nature"
	| "city"
	| "photo"
	| "memory";

/** 图集里的一张图 */
export interface FootprintPhoto {
	src: string;
	alt?: string;
	caption?: string;
}

/** 一次到访 */
export interface FootprintVisit {
	date: string;
	note?: string;
}

/** 前端消费的扁平足迹数据（同时是 /api/footprints.json 的结构） */
export interface Footprint {
	/** 稳定 id，取内容集合条目 id（即文件名去掉扩展名） */
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

	/** 首次到访日期 YYYY-MM-DD */
	date: string;
	/** 最后到访日期 YYYY-MM-DD（多次到访时与 date 不同） */
	dateEnd?: string;
	visits: FootprintVisit[];

	type: FootprintType;
	tags: string[];
	mood: string;

	cover: string;
	photos: FootprintPhoto[];
	album: string;

	/** 关联的博客文章 slug 列表 */
	posts: string[];
	/** 关联文章解析后的链接（含标题），用于侧栏直接跳转 */
	postLinks: { slug: string; title: string; url: string }[];
	excerpt: string;

	pinned: boolean;
}

/** /api/footprints.json 的完整响应结构 */
export interface FootprintsIndex {
	/** 生成时间（ISO） */
	generatedAt: string;
	count: number;
	/** 数据的地理包围盒，[minLng, minLat, maxLng, maxLat]，前端用于初始取景 */
	bbox: [number, number, number, number] | null;
	footprints: Footprint[];
}
