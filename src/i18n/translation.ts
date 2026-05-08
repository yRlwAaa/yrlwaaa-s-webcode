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

// 从 cookie 读取语言
function getLangFromCookie(): string | null {
	const value = `; ${document.cookie}`;
	const parts = value.split(`; lang=`);
	if (parts.length === 2) return parts.pop()?.split(";").shift() || null;
	return null;
}

// 从 localStorage 读取语言
function getLangFromStorage(): string | null {
	return localStorage.getItem("lang");
}

export function getTranslation(lang: string): Translation {
	return map[lang.toLowerCase()] || defaultTranslation;
}

export function i18n(key: I18nKey): string {
	// 优先从 cookie/localStorage 读取，如果没有则用配置的语言
	let lang =
		getLangFromCookie() || getLangFromStorage() || siteConfig.lang || "en";
	return getTranslation(lang)[key];
}
