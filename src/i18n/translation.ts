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

// 判断是否在浏览器环境
const isBrowser = typeof document !== "undefined";

function getLangFromCookie(): string | null {
	if (!isBrowser) return null;
	const value = `; ${document.cookie}`;
	const parts = value.split(`; lang=`);
	if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
	return null;
}

function getLangFromStorage(): string | null {
	if (!isBrowser) return null;
	return localStorage.getItem("lang");
}

export function getTranslation(lang: string): Translation {
	return map[lang.toLowerCase()] || defaultTranslation;
}

// 服务端使用的函数（用配置的语言）
export function i18nServer(key: I18nKey): string {
	const lang = siteConfig.lang || "en";
	return getTranslation(lang)[key];
}

// 客户端使用的函数（优先用 cookie/localStorage）
export function i18n(key: I18nKey): string {
	if (isBrowser) {
		const lang =
			getLangFromCookie() ||
			getLangFromStorage() ||
			siteConfig.lang ||
			"en";
		return getTranslation(lang)[key];
	}
	// 服务端回退到配置语言
	return i18nServer(key);
}
