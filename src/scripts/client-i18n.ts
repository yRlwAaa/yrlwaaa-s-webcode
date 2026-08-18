/**
 * 客户端语言切换与静态文本翻译
 *
 * 静态模板输出处通过 data-i18n="key" 标记（属性翻译用 data-i18n-attr + data-i18n-key），
 * 切换语言时即时替换文本，无需刷新页面。
 * 动态组件（Svelte 等）调用 i18n() 时会自动读取当前语言偏好。
 */
import {
	getCurrentLang,
	getStoredLang,
	getTranslation,
	saveLang,
} from "../i18n/translation";

export { getCurrentLang } from "../i18n/translation";

declare global {
	interface Window {
		I18N_DICTS?: Record<string, Record<string, string>>;
		I18N_DEFAULT?: string;
	}
}

/** 语言切换事件名（detail: { lang }） */
export const I18N_CHANGED_EVENT = "i18n:changed";

/** 获取语言字典（优先页面注入的完整字典，其次模块字典） */
function getDict(lang: string): Record<string, string> | undefined {
	if (window.I18N_DICTS && window.I18N_DICTS[lang]) {
		return window.I18N_DICTS[lang];
	}
	return getTranslation(lang) as unknown as Record<string, string>;
}

/** 替换元素文本，保留图标等子元素 */
function applyText(el: HTMLElement, text: string): void {
	const textNodes: Text[] = [];
	el.childNodes.forEach((node) => {
		if (node.nodeType === Node.TEXT_NODE) {
			textNodes.push(node as Text);
		}
	});
	if (textNodes.length > 0) {
		textNodes[0].textContent = text;
		textNodes.slice(1).forEach((node) => node.remove());
	} else {
		el.textContent = text;
	}
}

/**
 * 应用语言到所有带 data-i18n 标记的静态元素
 * @param lang 目标语言
 */
export function applyStaticI18n(lang: string): void {
	const dict = getDict(lang);
	if (!dict) return;

	document.querySelectorAll<HTMLElement>("[data-i18n]").forEach((el) => {
		const key = el.dataset.i18n;
		if (!key) return;
		const text = dict[key];
		if (text === undefined) return;
		applyText(el, text);
	});

	// 属性翻译：data-i18n-attr="title" data-i18n-key="xxx"
	document.querySelectorAll<HTMLElement>("[data-i18n-attr]").forEach((el) => {
		const attr = el.dataset.i18nAttr;
		const key = el.dataset.i18nKey;
		if (!attr || !key) return;
		const text = dict[key];
		if (text === undefined) return;
		el.setAttribute(attr, text);
	});
}

/**
 * 切换语言：保存偏好 + 即时应用 + 通知动态组件
 * @param lang 目标语言
 */
export function switchSiteLanguage(lang: string): void {
	saveLang(lang);
	applyStaticI18n(lang);
	document.documentElement.setAttribute("lang", lang);
	document.dispatchEvent(
		new CustomEvent(I18N_CHANGED_EVENT, { detail: { lang } }),
	);
}

/**
 * 页面加载时应用已保存的语言偏好（与默认语言不同时）
 * 并监听 Swup 页面切换，新页面内容渲染后重新应用
 */
export function initClientI18n(): void {
	const lang = getCurrentLang();
	document.documentElement.setAttribute("lang", lang);
	if (lang !== (window.I18N_DEFAULT || "")) {
		applyStaticI18n(lang);
	}

	// Swup 切换页面后，新内容需要重新应用语言
	document.addEventListener("swup:contentReplaced", () => {
		applyStaticI18n(getCurrentLang());
	});

	// 兜底：DOM 就绪后再应用一次（部分脚本可能延迟插入标记）
	document.addEventListener("DOMContentLoaded", () => {
		applyStaticI18n(getCurrentLang());
	});
}
