<script lang="ts">
	import Icon from "@iconify/svelte";
	import { i18n } from "../../../../i18n/translation";
	import I18nKey from "../../../../i18n/i18nKey";

	interface Props {
		onclick: () => void;
		disabled?: boolean;
	}

	const { onclick, disabled = false }: Props = $props();
</script>

<button
	class="btn-plain w-10 h-10 rounded-lg"
	aria-label={i18n(I18nKey.musicPlayerNext)}
	{onclick}
	{disabled}
>
	<Icon icon="material-symbols:skip-next" class="text-xl" />
</button>
