import type {
	AnnouncementConfig,
	CommentConfig,
	ExpressiveCodeConfig,
	FooterConfig,
	FullscreenWallpaperConfig,
	LicenseConfig,
	MusicPlayerConfig,
	NavBarConfig,
	PermalinkConfig,
	ProfileConfig,
	RandomPostsConfig,
	RelatedPostsConfig,
	SakuraConfig,
	ShareConfig,
	SidebarLayoutConfig,
	SiteConfig,
} from "./types/config";
import { LinkPreset } from "./types/config";

// 定义站点语言
const SITE_LANG = "zh_CN";
const SITE_TIMEZONE = 8;

export const siteConfig: SiteConfig = {
	title: "yRlwAaa",
	subtitle: "One demo website",
	siteURL: "https://yrlwa.top/",
	siteStartDate: "2026-04-30",

	timeZone: SITE_TIMEZONE,
	lang: SITE_LANG,

	// 翻译配置 - 按钮在右上角
	translate: {
		enable: true,
		service: "client.edge",
		defaultLanguage: "zh_CN",
		toolbar: {
			enable: true,
			position: "top-right",
		},
	},

	themeColor: {
		hue: 240,
		fixed: false,
	},

	featurePages: {
		anime: true,
		diary: true,
		friends: true,
		projects: true,
		skills: true,
		timeline: true,
		albums: true,
		devices: true,
	},

	navbarTitle: {
		mode: "text-icon",
		text: "MizukiUI",
		icon: "assets/home/home.webp",
		logo: "assets/home/default-logo.webp",
	},

	pageScaling: {
		enable: true,
		targetWidth: 2000,
	},

	bangumi: {
		userId: "your-bangumi-id",
		fetchOnDev: false,
	},

	bilibili: {
		vmid: "381710006",
		fetchOnDev: true,
		coverMirror: "",
		useWebp: true,
	},

	anime: {
		mode: "bilibili",
	},

	postListLayout: {
		defaultMode: "list",
		allowSwitch: true,
		categoryBar: {
			enable: true,
		},
	},

	tagStyle: {
		useNewStyle: false,
	},

	wallpaperMode: {
		defaultMode: "banner",
		showModeSwitchOnMobile: "desktop",
	},

	banner: {
		src: {
			desktop: [
				"/assets/desktop-banner/1.png",
				"/assets/desktop-banner/2.webp",
				"/assets/desktop-banner/3.png",
				"/assets/desktop-banner/4.jpg",
			],
			mobile: [
				"/assets/mobile-banner/1.webp",
				"/assets/mobile-banner/2.webp",
				"/assets/mobile-banner/3.jpg",
				"/assets/mobile-banner/4.webp",
			],
		},
		position: "center",
		carousel: {
			enable: true,
			interval: 3,
		},
		waves: {
			enable: true,
			performanceMode: false,
			mobileDisable: false,
		},
		imageApi: {
			enable: false,
			url: "http://domain.com/api_v2.php?format=text&count=4",
		},
		homeText: {
			enable: true,
			title: "yRlwAaaの部屋",
			subtitle: [
				"特別なことはないけど、君がいると十分です",
				"今でもあなたは私の光",
				"君ってさ、知らないうちに私の毎日になってたよ",
				"君と話すと、なんか毎日がちょっと楽しくなるんだ",
				"今日はなんでもない日。でも、ちょっとだけいい日",
			],
			typewriter: {
				enable: true,
				speed: 100,
				deleteSpeed: 50,
				pauseTime: 2000,
			},
		},
		credit: {
			enable: false,
			text: "Describe",
			url: "",
		},
		navbar: {
			transparentMode: "semifull",
		},
	},

	toc: {
		enable: true,
		mobileTop: true,
		desktopSidebar: true,
		floating: true,
		depth: 2,
		useJapaneseBadge: true,
	},

	showCoverInContent: true,
	generateOgImages: false,
	favicon: [],

	font: {
		asciiFont: {
			fontFamily: "ZenMaruGothic-Medium",
			fontWeight: "400",
			localFonts: ["ZenMaruGothic-Medium.ttf"],
			enableCompress: true,
		},
		cjkFont: {
			fontFamily: "萝莉体 第二版",
			fontWeight: "500",
			localFonts: ["loli.ttf"],
			enableCompress: true,
		},
	},

	showLastModified: true,
	pageProgressBar: {
		enable: true,
		height: 3,
		duration: 6000,
	},

	thirdPartyAnalytics: {
		enable: false,
		clarityId: "",
	},
};

// 其余配置保持不变...
export const fullscreenWallpaperConfig: FullscreenWallpaperConfig = {
	src: {
		desktop: [
			"/assets/desktop-banner/1.png",
			"/assets/desktop-banner/2.webp",
			"/assets/desktop-banner/3.png",
			"/assets/desktop-banner/4.jpg",
		],
		mobile: [
			"/assets/mobile-banner/1.webp",
			"/assets/mobile-banner/2.webp",
			"/assets/mobile-banner/3.jpg",
			"/assets/mobile-banner/4.webp",
		],
	},
	position: "center",
	carousel: {
		enable: true,
		interval: 5,
	},
	zIndex: -1,
	opacity: 0.8,
	blur: 1,
};

export const navBarConfig: NavBarConfig = {
	links: [
		LinkPreset.Home,
		LinkPreset.Archive,
		{
			name: "Links",
			url: "/links/",
			icon: "material-symbols:link",
			children: [
				{
					name: "Bilibili",
					url: "https://space.bilibili.com/381710006?spm_id_from=333.1007.0.0",
					external: true,
					icon: "fa7-brands:bilibili",
				},
				{
					name: "GitHub",
					url: "https://github.com/yRlwAaa",
					external: true,
					icon: "fa7-brands:github",
				},
				{
					name: "X",
					url: "https://x.com/yRlwAaa",
					external: true,
					icon: "fa7-brands:x-twitter",
				},
				{
					name: "Twitch",
					url: "https://www.twitch.tv/yrlwa",
					external: true,
					icon: "fa7-brands:twitch",
				},
			],
		},
		{
			name: "My",
			url: "/content/",
			icon: "material-symbols:person",
			children: [
				{
					name: "Anime",
					url: "/anime/",
					icon: "material-symbols:movie",
				},
				{
					name: "Diary",
					url: "/diary/",
					icon: "material-symbols:book",
				},
				{
					name: "Gallery",
					url: "/albums/",
					icon: "material-symbols:photo-library",
				},
				{
					name: "Devices",
					url: "/devices/",
					icon: "material-symbols:devices",
					external: false,
				},
			],
		},
		{
			name: "About",
			url: "/content/",
			icon: "material-symbols:info",
			children: [
				{
					name: "About",
					url: "/about/",
					icon: "material-symbols:person",
				},
				{
					name: "Friends",
					url: "/friends/",
					icon: "material-symbols:group",
				},
			],
		},
		{
			name: "Others",
			url: "#",
			icon: "material-symbols:more-horiz",
			children: [
				{
					name: "Projects",
					url: "/projects/",
					icon: "material-symbols:work",
				},
				{
					name: "Skills",
					url: "/skills/",
					icon: "material-symbols:psychology",
				},
				{
					name: "Timeline",
					url: "/timeline/",
					icon: "material-symbols:timeline",
				},
				{
            		name: "Dictionary",
            		url: "/dictionary/",
            		icon: "material-symbols:menu-book",
        		},
			],
		},
	],
};

export const profileConfig: ProfileConfig = {
	avatar: "assets/images/avatar.webp",
	name: "yRlwAaa",
	bio: "真昼ちゃんしか勝たん!",
	typewriter: {
		enable: true,
		speed: 80,
	},
	links: [
		{
			name: "Bilibili",
			icon: "fa7-brands:bilibili",
			url: "https://space.bilibili.com/381710006?spm_id_from=333.1007.0.0",
		},
		{
			name: "GitHub",
			icon: "fa7-brands:github",
			url: "https://github.com/yRlwAaa",
		},
		{
			name: "X",
			icon: "fa7-brands:x-twitter",
			url: "https://x.com/yRlwAaa",
		},
		{
			name: "Twitch",
			icon: "fa7-brands:twitch",
			url: "https://www.twitch.tv/yrlwa",
		},
	],
};

export const licenseConfig: LicenseConfig = {
	enable: true,
	name: "CC BY-NC-SA 4.0",
	url: "https://creativecommons.org/licenses/by-nc-sa/4.0/",
};

export const permalinkConfig: PermalinkConfig = {
	enable: false,
	format: "%postname%",
};

export const expressiveCodeConfig: ExpressiveCodeConfig = {
	theme: "github-dark",
	hideDuringThemeTransition: true,
};

export const commentConfig: CommentConfig = {
	enable: false,
	system: "twikoo",
	twikoo: {
		envId: "https://twikoo.vercel.app",
		lang: SITE_LANG,
	},
	giscus: {
		repo: "your-github-username/your-repo-name",
		repoId: "your-repo-id",
		category: "Announcements",
		categoryId: "your-category-id",
		mapping: "pathname",
		strict: "0",
		reactionsEnabled: "1",
		emitMetadata: "0",
		inputPosition: "top",
		theme: "preferred_color_scheme",
		lang: SITE_LANG,
		loading: "lazy",
	},
};

export const shareConfig: ShareConfig = {
	enable: true,
};

export const announcementConfig: AnnouncementConfig = {
	title: "",
	content: "私のサイトへようこそ！X：@yRlwAaa (｡･ω･)ﾉ✨",
	closable: true,
	link: {
		enable: true,
		text: "Learn More",
		url: "/about/",
		external: false,
	},
};

export const musicPlayerConfig: MusicPlayerConfig = {
	enable: true,
	showFloatingPlayer: true,
	floatingEntryMode: "fab",
	mode: "meting",
	meting_api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id&r=:r",
	id: "14317071226",
	server: "netease",
	type: "playlist",
};

export const footerConfig: FooterConfig = {
	enable: true,
	customHtml: "",
};

export const sidebarLayoutConfig: SidebarLayoutConfig = {
	properties: [
		{
			type: "profile",
			position: "top",
			class: "onload-animation",
			animationDelay: 0,
		},
		{
			type: "announcement",
			position: "top",
			class: "onload-animation",
			animationDelay: 50,
		},
		{
			type: "music-sidebar",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 100,
		},
		{
			type: "categories",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 150,
			responsive: {
				collapseThreshold: 5,
			},
		},
		{
			type: "tags",
			position: "top",
			class: "onload-animation",
			animationDelay: 250,
			responsive: {
				collapseThreshold: 20,
			},
		},
		{
			type: "card-toc",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 200,
		},
		{
			type: "site-stats",
			position: "sticky",
			class: "onload-animation",
			animationDelay: 200,
		},
		{
			type: "calendar",
			position: "top",
			class: "onload-animation",
			animationDelay: 250,
		},
	],
	components: {
		left: ["profile", "announcement", "tags", "card-toc"],
		right: ["site-stats", "calendar", "categories", "music-sidebar"],
		drawer: ["profile", "announcement", "music-sidebar", "categories", "tags", "site-stats"],
	},
	defaultAnimation: {
		enable: true,
		baseDelay: 0,
		increment: 50,
	},
	responsive: {
		breakpoints: {
			mobile: 768,
			tablet: 1280,
			desktop: 1280,
		},
	},
};

export const sakuraConfig: SakuraConfig = {
	enable: true,
	sakuraNum: 21,
	limitTimes: -1,
	size: {
		min: 0.5,
		max: 1.1,
	},
	opacity: {
		min: 0.3,
		max: 0.9,
	},
	speed: {
		horizontal: {
			min: -1.7,
			max: -1.2,
		},
		vertical: {
			min: 1.5,
			max: 2.2,
		},
		rotation: 0.03,
		fadeSpeed: 0.03,
	},
	zIndex: 100,
};

export const pioConfig = {
	enable: true,
	models: ["/pio/models/pio/model.json"],
	position: "left",
	width: 280,
	height: 250,
	mode: "draggable",
	hiddenOnMobile: true,
	dialog: {
		welcome: "Welcome to Mizuki Website!",
		touch: [
			"What are you doing?",
			"Stop touching me!",
			"HENTAI!",
			"Don't bully me like that!",
		],
		home: "Click here to go back to homepage!",
		skin: ["Want to see my new outfit?", "The new outfit looks great~"],
		close: "QWQ See you next time~",
		link: "https://github.com/LyraVoid/Mizuki",
	},
};

export const relatedPostsConfig: RelatedPostsConfig = {
	enable: true,
	maxCount: 5,
};

export const randomPostsConfig: RandomPostsConfig = {
	enable: true,
	maxCount: 5,
};

export const widgetConfigs = {
	profile: profileConfig,
	announcement: announcementConfig,
	music: musicPlayerConfig,
	layout: sidebarLayoutConfig,
	sakura: sakuraConfig,
	fullscreenWallpaper: fullscreenWallpaperConfig,
	pio: pioConfig,
	share: shareConfig,
	relatedPosts: relatedPostsConfig,
	randomPosts: randomPostsConfig,
};