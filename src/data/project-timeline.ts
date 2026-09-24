import type {
	ProjectTimelineItem,
	TimelineItem,
} from "../components/features/timeline/types";

/**
 * 「网页构建」分类的数据源：网站功能 / 插件是什么时候加进来的
 *
 * - date    = 该功能第一次上线的日期（以 git 首次提交为准）
 * - title   = 功能 / 插件名
 * - summary = 一句话说明它是干嘛的
 * - category= 分类（决定图标、圆点颜色和分类标签）
 *
 * 数组按日期从新到旧；新增功能就在最上面加一条。
 *
 * 默认约定：**每次给站点加/改一个可用功能，都要在这里补一条**，
 * 条目会自动以内置 build 分类出现在时间线里（见文件末尾的 webBuildTimeline）。
 * 用脚本加，避免手写格式出错：
 *
 *   npm run timeline:add -- --title "功能名" --category music --summary "一句话说明" [--highlight]
 *   npm run timeline:check    # 提示「最近改了功能但时间线没跟上」的提交
 *
 * 可用分类见 src/components/features/timeline/project-categories.ts。
 */
export const webBuildSteps: ProjectTimelineItem[] = [
	{
		id: "folia",
		title: "在线播放器 Folia",
		category: "music",
		date: "2026-09-24",
		summary:
			"音乐页多了个在线播放器入口，点进去站内全屏运行，能登自己的网易云账号；播放器本体与网易云接口分别独立部署",
		highlight: true,
	},
	{
		id: "dictionary-page",
		title: "词典查询页重做",
		category: "tools",
		date: "2026-09-21",
		summary:
			"从 Demo 页进化成了完整的查词界面：同源代理免跨域，联想、例句、生词本全部拿下",
		highlight: true,
	},
	{
		id: "inpaint-ai",
		title: "AI 去水印（E5）",
		category: "ai",
		date: "2026-09-21",
		summary:
			"接上 E5 的 LaMa 模型做内容修复，站点只转发；E5 离线自动回退本地算法",
		highlight: true,
	},
	{
		id: "music-chou-kaguya-hime",
		title: "新专辑《超かぐや姫》",
		category: "music",
		date: "2026-09-21",
		summary: "新增歌手「其他」与这张 10 首歌的专辑，音频已上传R2",
	},
	{
		id: "tools-area",
		title: "工具集 /tools/",
		category: "tools",
		date: "2026-09-20",
		summary:
			"开了个「开袋即食」的工具区，清单式注册，以后加工具只加一条数据",
		highlight: true,
	},
	{
		id: "ncm-tool",
		title: "NCM 转 FLAC",
		category: "tools",
		date: "2026-09-20",
		summary: "浏览器里解开 .ncm 并拼回 FLAC，全部在本地完成",
	},
	{
		id: "img-tool",
		title: "图片转换",
		category: "tools",
		date: "2026-09-20",
		summary: "换格式、改尺寸、压体积，全部在本地完成，可以显示前后大小",
	},
	{
		id: "watermark-tool",
		title: "去水印工具",
		category: "tools",
		date: "2026-09-20",
		summary: "框住水印并用周围颜色填充，多选区、10 步撤销、前后对比",
	},
	{
		id: "tools-i18n",
		title: "工具页与服务器页多语言",
		category: "ux",
		date: "2026-09-20",
		summary: "150+ 条词条进 i18n，页面文案不再写死中文",
	},
	{
		id: "misc-category",
		title: "「杂记」分区",
		category: "content",
		date: "2026-09-19",
		summary: "分区由文章 frontmatter 动态派生，想开新分区发一篇文章就行",
	},
	{
		id: "server-async",
		title: "服务器切换改异步轮询",
		category: "server",
		date: "2026-09-12",
		summary:
			"切换模型 / 绘图不再被 Cloudflare 100s 超时掐断；数据源固定为 e5.yrlwa.top",
	},
	{
		id: "server-wol",
		title: "唤醒 E5 + 访问口令",
		category: "server",
		date: "2026-09-10",
		summary: "经 NAS 发 WOL 魔术包远程开机；控制类操作需要口令，访客只读",
	},
	{
		id: "weather-rewrite",
		title: "天气组件重写",
		category: "base",
		date: "2026-09-10",
		summary:
			"苹果风一周预报 + 城市搜索；构建期抓同源天气数据，另备离线城市表兜底",
	},
	{
		id: "server-console",
		title: "服务器控制台 /server/",
		category: "server",
		date: "2026-09-07",
		summary: "把 E5 的显卡、模型、服务状态搬进站内，手机上也能瞄一眼",
		highlight: true,
	},
	{
		id: "perf-pass",
		title: "性能优化",
		category: "ux",
		date: "2026-09-07",
		summary: "去强制重排、滚动节流、计数改 Map、大列表改事件委托",
	},
	{
		id: "music-albums",
		title: "专辑库扩充 + 年份排序",
		category: "music",
		date: "2026-09-03",
		summary: "陆续加专辑，列表改成按年份降序",
	},
	{
		id: "album-fix",
		title: "相册功能修复",
		category: "album",
		date: "2026-09-02",
		summary: "修掉相册扫描与封面路径的一串问题",
	},
	{
		id: "novel-posts",
		title: "小说与加密文章",
		category: "content",
		date: "2026-09-02",
		summary: "序章与前几章上线，用密码保护 + 置顶",
	},
	{
		id: "qwen-review",
		title: "Qwen 代码评审文章系列",
		category: "content",
		date: "2026-08-26",
		summary: "把模型给的代码评审整理成文章归档",
	},
	{
		id: "album-thumb",
		title: "相册缩略图与懒加载",
		category: "album",
		date: "2026-08-19",
		summary: "自动生成缩略图，配骨架屏和懒加载，有效减轻了相册的卡顿",
	},
	{
		id: "site-stats-refresh",
		title: "站点统计实时刷新",
		category: "base",
		date: "2026-08-19",
		summary: "每 30 秒刷新一次，站内切页也跟着更新",
	},
	{
		id: "ai-search",
		title: "AI 语义搜索",
		category: "ai",
		date: "2026-08-18",
		summary: "用 bge-m3 做向量检索，口语化的中文问句也能搜到文章",
	},
	{
		id: "i18n",
		title: "多语言切换",
		category: "ux",
		date: "2026-08-18",
		summary: "中 / 繁 / 英 / 日四套语言，选择记在本地",
	},
	{
		id: "ai-assistant",
		title: "AI 助手",
		category: "ai",
		date: "2026-08-17",
		summary:
			"右下角悬浮聊天组件，走 Cloudflare Functions 代理，密钥不进前端",
		highlight: true,
	},
	{
		id: "album-multi",
		title: "多相册与封面",
		category: "album",
		date: "2026-08-14",
		summary: "原神、至冬等相册陆续添加，封面统一转成 webp",
	},
	{
		id: "music-module",
		title: "音乐模块",
		category: "music",
		date: "2026-08-09",
		summary: "专辑页 + 艺人页，音频托管 R2，functions/music 代理播放与下载",
		highlight: true,
	},
	{
		id: "album-module",
		title: "相册模块",
		category: "album",
		date: "2026-08-07",
		summary: "照片丢进目录就可自动生成相册，meta.json 里写标题和标签",
	},
	{
		id: "weather-widget",
		title: "天气挂件",
		category: "base",
		date: "2026-07-24",
		summary: "侧栏能看一周天气，这是站上第一个自建小组件",
	},
	{
		id: "site-core",
		title: "站点骨架上线",
		category: "base",
		date: "2026-05-02",
		summary:
			"Mizuki 主题 + Cloudflare Pages，push 部署；明暗主题、壁纸、导航都在这一步",
		highlight: true,
	},
];

/**
 * 上面这份历程转成时间线条目：type = "build"，
 * 与「教育经历 / 工作经历」在页面顶部的筛选里并列。
 */
export const webBuildTimeline: TimelineItem[] = webBuildSteps.map((step) => ({
	id: `build-${step.id}`,
	title: step.title,
	description: step.summary,
	type: "build",
	startDate: step.date,
	category: step.category,
	featured: step.highlight,
}));
