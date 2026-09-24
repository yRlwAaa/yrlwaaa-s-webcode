import I18nKey from "../i18n/i18nKey";

/**
 * Folia 在线播放器接入配置
 * ------------------------------------------------------------------
 * Folia(chthollyphile/folia-major)是"前端 + 独立网易云 API"的两段式 Web 应用,
 * 本站只提供入口: 音乐页一张入口卡片 → /music/player/ 全屏页 → iframe 内嵌播放器本体。
 *
 * 为什么用 iframe 而不是把播放器并进本站:
 * 播放器由官方一键部署产出(Cloudflare Workers), 自带资源目录与 /api/* 路由,
 * 并进本站会和现有 functions/ 抢 /api/*, 也会让两套 SPA 路由互相打架。
 *
 * 为什么跨域 iframe 里仍然能登网易云账号:
 * Folia 把登录 cookie 存在 localStorage, 再以 ?cookie= 查询参数发给 API
 * (见其 src/services/netease.ts), 不依赖第三方 Cookie —— 所以浏览器的
 * 第三方 Cookie 拦截不会影响登录。
 *
 * 已知限制 —— "本地音乐"功能:
 * 该功能用 File System Access API(showDirectoryPicker), 浏览器禁止跨域 iframe
 * 调用文件选择器。需要导入本地音乐时, 用 /music/player/ 右上角的"在新标签页打开"。
 * 在线听歌、搜索、歌词、AI 主题、歌单等全部正常。
 *
 * 改播放器地址的两种方式(后者优先):
 * ①改下面 url 的默认值 ②构建时设 PUBLIC_FOLIA_PLAYER_URL 环境变量
 */
export interface FoliaPlayerConfig {
	/** 是否在音乐页渲染入口卡片 */
	enabled: boolean;
	/** Folia Web 版部署地址 */
	url: string;
	/** 站内全屏入口页地址(trailingSlash: always) */
	entryUrl: string;
	/** 播放器页标题 i18n 键 */
	titleKey: I18nKey;
}

// Astro 的 PUBLIC_* 变量在构建时注入; 用宽松读取避免未声明时的类型报错
const envUrl = (import.meta.env as Record<string, string | undefined>)
	.PUBLIC_FOLIA_PLAYER_URL;

export const foliaPlayerConfig: FoliaPlayerConfig = {
	enabled: true,
	url: (envUrl && envUrl.trim()) || "https://folia.yrlwa.top/",
	entryUrl: "/music/player/",
	titleKey: I18nKey.musicPlayerEntryTitle,
};

/** 播放器地址是否已配置成一个可内嵌的 http(s) 地址 */
export const isFoliaPlayerReady = (): boolean =>
	foliaPlayerConfig.enabled && /^https?:\/\/.+/i.test(foliaPlayerConfig.url);
