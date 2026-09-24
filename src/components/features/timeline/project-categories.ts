import I18nKey from "../../../i18n/i18nKey";

import type { ProjectCategory } from "./types";

export interface ProjectCategoryMeta {
	id: ProjectCategory;
	labelKey: I18nKey;
	icon: string;
	color: string;
}

/** 项目时间线的分类：标签页、卡片角标共用这一份 */
export const projectCategories: ProjectCategoryMeta[] = [
	{
		id: "base",
		labelKey: I18nKey.timelineCatBase,
		icon: "material-symbols:foundation",
		color: "#2563EB",
	},
	{
		id: "content",
		labelKey: I18nKey.timelineCatContent,
		icon: "material-symbols:article",
		color: "#7C3AED",
	},
	{
		id: "music",
		labelKey: I18nKey.timelineCatMusic,
		icon: "material-symbols:music-note",
		color: "#DC2626",
	},
	{
		id: "album",
		labelKey: I18nKey.timelineCatAlbum,
		icon: "material-symbols:photo-library",
		color: "#0891B2",
	},
	{
		id: "ai",
		labelKey: I18nKey.timelineCatAi,
		icon: "material-symbols:smart-toy",
		color: "#059669",
	},
	{
		id: "server",
		labelKey: I18nKey.timelineCatServer,
		icon: "material-symbols:dns",
		color: "#EA580C",
	},
	{
		id: "tools",
		labelKey: I18nKey.timelineCatTools,
		icon: "material-symbols:handyman",
		color: "#CA8A04",
	},
	{
		id: "ux",
		labelKey: I18nKey.timelineCatUx,
		icon: "material-symbols:palette",
		color: "#DB2777",
	},
];

export function getProjectCategory(
	category: ProjectCategory,
): ProjectCategoryMeta {
	return (
		projectCategories.find((item) => item.id === category) ??
		projectCategories[0]
	);
}
