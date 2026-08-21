<script lang="ts">
	import Icon from "@iconify/svelte";
	import { i18n } from "../../../../i18n/translation";
	import I18nKey from "../../../../i18n/i18nKey";

	interface Props {
		isPlaying: boolean;
		isLoading: boolean;
		onclick: () => void;
	}

	const { isPlaying, isLoading, onclick }: Props = $props();
</script>

<button
	class="btn-regular w-12 h-12 rounded-full"
	class:opacity-50={isLoading}
	disabled={isLoading}
	aria-label={isPlaying ? i18n(I18nKey.musicPlayerPause) : i18n(I18nKey.musicPlayerPlay)}
	{onclick}
>
	{#if isLoading}
		<Icon icon="eos-icons:loading" class="text-xl" />
	{:else if isPlaying}
		<Icon icon="material-symbols:pause" class="text-xl" />
	{:else}
		<Icon icon="material-symbols:play-arrow" class="text-xl" />
	{/if}
</button>
