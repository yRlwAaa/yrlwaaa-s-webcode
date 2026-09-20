/**
 * 工具箱数据
 * ------------------------------------------------------------------
 * 新增一个工具: 在 toolsData 里加一条, 再照 /tools/ncm/ 的样子建一个页面即可,
 * 列表页会自动渲染(一行一个工具)。
 */
export interface ToolItem {
	/** 唯一 id, 同时用作详情页目录名 */
	id: string;
	/** 工具名 */
	name: string;
	/** 列表页副标题: 一句话说明 */
	desc: string;
	/** 详情页简介 */
	intro: string;
	/** 详情页地址(trailingSlash: always) */
	url: string;
	/** iconify 图标名 */
	icon: string;
	/** 标签 */
	tags: string[];
	/** 是否全程在浏览器本地运行(不上传文件) */
	local: boolean;
}

export const toolsData: ToolItem[] = [
	{
		id: "ncm",
		name: "NCM 转 FLAC",
		desc: "网易云 .ncm 加密文件还原成原始 FLAC, 批量拖入, 一键打包成 zip",
		intro:
			".ncm 是网易云音乐客户端给下载文件套的一层加密容器, 里面装的其实就是原始音频流(无损源就是真 FLAC)。这个工具在浏览器里把外层壳解掉, 直接吐出原始 FLAC, 不做任何二次转码, 所以音质和源文件完全一致。支持多选和拖拽, 处理完打包成一个 zip 下载; 全程在本站页面内完成, 文件不会被上传到任何服务器。",
		url: "/tools/ncm/",
		icon: "material-symbols:music-note",
		tags: ["音频", "无损", "纯本地"],
		local: true,
	},
];

export function getTool(id: string): ToolItem | undefined {
	return toolsData.find((tool) => tool.id === id);
}
