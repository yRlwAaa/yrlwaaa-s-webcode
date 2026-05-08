<script lang="ts">
	import { onMount } from "svelte";

	let currentLang = "zh_CN";

	const languages = [
		{ code: "zh_CN", name: "中文" },
		{ code: "en", name: "English" },
		{ code: "ja", name: "日本語" },
	];

	onMount(() => {
		// 读取当前语言
		const cookieLang = document.cookie.replace(
			/(?:(?:^|.*;\s*)lang\s*=\s*([^;]*).*$)|^.*$/,
			"$1",
		);
		const storageLang = localStorage.getItem("lang");
		currentLang = cookieLang || storageLang || "zh_CN";
	});

	function switchLanguage(lang: string) {
		currentLang = lang;
		// 设置 cookie 有效期 365 天
		document.cookie = `lang=${lang}; path=/; max-age=31536000`;
		localStorage.setItem("lang", lang);
		// 重新加载页面让 i18n 系统生效
		window.location.reload();
	}
</script>

<div class="lang-switch">
	{#each languages as lang}
		<button
			class:active={currentLang === lang.code}
			on:click={() => switchLanguage(lang.code)}
		>
			{lang.name}
		</button>
	{/each}
</div>

<style>
	.lang-switch {
		display: flex;
		gap: 0.25rem;
		margin-left: 0.5rem;
	}
	button {
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		font-size: 0.75rem;
		cursor: pointer;
		background: transparent;
		color: var(--content-meta);
		white-space: nowrap;
	}
	button.active {
		background: var(--primary);
		color: white;
	}
	button:hover:not(.active) {
		background: var(--btn-regular-bg);
	}

	@media (max-width: 768px) {
		.lang-switch {
			margin-left: 0.25rem;
		}
		button {
			padding: 0.125rem 0.375rem;
			font-size: 0.7rem;
		}
	}
</style>
