export interface TimelineLink {
	name: string;
	url: string;
	type: "website" | "certificate" | "project" | "other";
}

/** 「网页构建」分类：站点自己的功能 / 插件属于哪一块 */
export type ProjectCategory =
	| "base"
	| "content"
	| "music"
	| "album"
	| "ai"
	| "server"
	| "tools"
	| "ux";

export type TimelineType =
	| "education"
	| "work"
	| "project"
	| "achievement"
	| "build";

export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: TimelineType;
	startDate: string;
	endDate?: string;
	location?: string;
	organization?: string;
	position?: string;
	skills?: string[];
	achievements?: string[];
	links?: TimelineLink[];
	icon?: string;
	color?: string;
	featured?: boolean;
	/** 仅「网页构建」用：决定图标、颜色和分类标签 */
	category?: ProjectCategory;
}

export interface TimelineCardProps {
	item: TimelineItem;
	maxSkills?: number;
}

export interface ProjectTimelineLink {
	name: string;
	url: string;
}

/** 「网页构建」数据源里的一条：某个功能 / 插件什么时候加的、干嘛的 */
export interface ProjectTimelineItem {
	id: string;
	title: string;
	category: ProjectCategory;
	/** 该功能上线的日期 YYYY-MM-DD */
	date: string;
	/** 之后值得记一笔的大改动日期 YYYY-MM-DD */
	updated?: string;
	summary: string;
	details?: string[];
	tech?: string[];
	links?: ProjectTimelineLink[];
	icon?: string;
	color?: string;
	highlight?: boolean;
}
