import I18nKey from "../i18n/i18nKey";

/**
 * 工具箱数据
 * ------------------------------------------------------------------
 * 每个工具只描述"结构与位置", 文案全部走 i18n(见 src/i18n/languages/*.ts 的
 * toolNcm* / toolImg* 词条), 这样站点切到英文/日文/繁体时工具页也跟着变。
 *
 * 新增一个工具: ①toolsData 里加一条(带 4 个 i18n 键) ②建 src/pages/tools/<id>/index.astro
 * ③写 public/js/<id>-tool.js ④在 4 个语言文件里补对应词条。
 */
export interface ToolItem {
	/** 唯一 id, 同时用作详情页目录名 */
	id: string;
	/** 工具名 i18n 键 */
	nameKey: I18nKey;
	/** 列表页一句话简介 i18n 键 */
	descKey: I18nKey;
	/** 详情页简介 i18n 键 */
	introKey: I18nKey;
	/** 标签 i18n 键, 值用 | 分隔多标签 */
	tagsKey: I18nKey;
	/** 详情页地址(trailingSlash: always) */
	url: string;
	/** iconify 图标名 */
	icon: string;
	/** 是否全程在浏览器本地运行(不上传文件) */
	local: boolean;
}

export const toolsData: ToolItem[] = [
	{
		id: "ncm",
		nameKey: I18nKey.toolNcmName,
		descKey: I18nKey.toolNcmDesc,
		introKey: I18nKey.toolNcmIntro,
		tagsKey: I18nKey.toolNcmTags,
		url: "/tools/ncm/",
		icon: "material-symbols:music-note",
		local: true,
	},
	{
		id: "image",
		nameKey: I18nKey.toolImgName,
		descKey: I18nKey.toolImgDesc,
		introKey: I18nKey.toolImgIntro,
		tagsKey: I18nKey.toolImgTags,
		url: "/tools/image/",
		icon: "material-symbols:image",
		local: true,
	},
	{
		id: "watermark",
		nameKey: I18nKey.toolWmName,
		descKey: I18nKey.toolWmDesc,
		introKey: I18nKey.toolWmIntro,
		tagsKey: I18nKey.toolWmTags,
		url: "/tools/watermark/",
		icon: "material-symbols:auto-fix-high",
		local: false,
	},
];

export function getTool(id: string): ToolItem | undefined {
	return toolsData.find((tool) => tool.id === id);
}
