import { siteConfig } from "../config";
import type I18nKey from "./i18nKey";
import { en } from "./languages/en";
import { ja } from "./languages/ja";
import { zh_CN } from "./languages/zh_CN";
import { zh_TW } from "./languages/zh_TW";

export type Translation = Record<I18nKey, string>;

const defaultTranslation = en;

const map: Record<string, Translation> = {
	en: en,
	en_us: en,
	en_gb: en,
	en_au: en,
	zh_cn: zh_CN,
	zh_tw: zh_TW,
	ja: ja,
	ja_jp: ja,
};

/** 判断语言标识是否受支持 */
export function isSupportedLang(lang: string | null | undefined): boolean {
	return !!lang && lang.toLowerCase() in map;
}

/** 读取客户端语言偏好（localStorage 优先，cookie 兜底） */
export function getStoredLang(): string | null {
	if (typeof window === "undefined") return null;
	try {
		const ls = window.localStorage.getItem("lang");
		if (isSupportedLang(ls)) return ls as string;
		const row = document.cookie
			.split("; ")
			.find((item) => item.startsWith("lang="));
		if (row) {
			const val = row.split("=")[1];
			if (isSupportedLang(val)) return val;
		}
	} catch {
		/* 隐私模式下可能抛出，忽略 */
	}
	return null;
}

/** 保存语言偏好（localStorage + cookie） */
export function saveLang(lang: string): void {
	if (typeof window === "undefined") return;
	try {
		window.localStorage.setItem("lang", lang);
		document.cookie = `lang=${lang}; path=/; max-age=31536000`;
	} catch {
		/* ignore */
	}
}

/** 当前生效语言：客户端偏好 → 站点配置语言 */
export function getCurrentLang(): string {
	return getStoredLang() || siteConfig.lang || "en";
}

// 服务端固定用配置的语言
export function getTranslation(lang: string): Translation {
	return map[lang.toLowerCase()] || defaultTranslation;
}

// 服务端渲染用的函数（构建时永远用配置的语言）
// 客户端调用时自动使用用户选择的语言，使动态渲染（Svelte 等）跟随语言切换
export function i18n(key: I18nKey): string {
	const lang = getCurrentLang();
	return getTranslation(lang)[key];
}

// 客户端动态切换用的函数（需要明确指定语言时使用）
export function getClientTranslation(lang: string, key: I18nKey): string {
	return getTranslation(lang)[key];
}
