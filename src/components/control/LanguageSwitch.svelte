<script lang="ts">
	let currentLang = localStorage.getItem("lang") || "zh_CN";

	const languages = [
		{ code: "zh_CN", name: "中文" },
		{ code: "en", name: "English" },
		{ code: "ja", name: "日本語" },
	];

	function switchLanguage(lang: string) {
		currentLang = lang;
		localStorage.setItem("lang", lang);
		// 刷新页面让翻译生效
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
		background: var(--card-bg);
		border-radius: 9999px;
		padding: 0.25rem;
		border: 1px solid var(--line-color);
	}
	button {
		padding: 0.25rem 0.75rem;
		border-radius: 9999px;
		font-size: 0.75rem;
		cursor: pointer;
		background: transparent;
		color: var(--content-meta);
	}
	button.active {
		background: var(--primary);
		color: white;
	}
	button:hover:not(.active) {
		background: var(--btn-regular-bg);
	}
</style>
