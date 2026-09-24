export interface TimelineLink {
	name: string;
	url: string;
	type: "website" | "certificate" | "project" | "other";
}

export interface TimelineItem {
	id: string;
	title: string;
	description: string;
	type: "education" | "work" | "project" | "achievement";
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
	/** 「网页构建」这条记录的内页：功能 / 插件添加历程 */
	buildLog?: ProjectTimelineItem[];
}

export interface TimelineCardProps {
	item: TimelineItem;
	maxSkills?: number;
}

/** 「网页构建」里的一个功能 / 插件 */
export type ProjectCategory =
	| "base"
	| "content"
	| "music"
	| "album"
	| "ai"
	| "server"
	| "tools"
	| "ux";

export interface ProjectTimelineLink {
	name: string;
	url: string;
}

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

export interface ProjectTimelineCardProps {
	item: ProjectTimelineItem;
}
