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

// 服务端固定用配置的语言
export function getTranslation(lang: string): Translation {
	return map[lang.toLowerCase()] || defaultTranslation;
}

// 服务端渲染用的函数（永远用配置的语言）
export function i18n(key: I18nKey): string {
	const lang = siteConfig.lang || "en";
	return getTranslation(lang)[key];
}

// 客户端动态切换用的函数（需要在组件里手动调用）
export function getClientTranslation(lang: string, key: I18nKey): string {
	return getTranslation(lang)[key];
}
