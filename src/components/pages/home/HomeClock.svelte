<script lang="ts">
import { onDestroy, onMount } from "svelte";

let { class: className = "" }: { class?: string } = $props();

// 仅客户端渲染后启动，避免 SSR 水合时间不一致
let mounted = $state(false);
let now = $state(new Date());
let timer: ReturnType<typeof setInterval> | undefined;

onMount(() => {
	mounted = true;
	now = new Date();
	timer = setInterval(() => {
		now = new Date();
	}, 1000);
});
onDestroy(() => {
	if (timer) clearInterval(timer);
});

const pad = (n: number) => String(n).padStart(2, "0");
const WEEKDAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const hours = $derived(now.getHours());
const minutes = $derived(now.getMinutes());
const seconds = $derived(now.getSeconds());
const dateText = $derived(
	`${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`,
);
const weekText = $derived(WEEKDAYS[now.getDay()]);
</script>

<!-- 去容器化的时钟排版：大号数字时间直接排在壁纸上 -->
<div class="flex flex-col justify-end {className ?? ''}">
	<div
		class="text-5xl font-bold tabular-nums tracking-tight text-white md:text-6xl [text-shadow:0_4px_24px_rgba(0,0,0,0.6)]"
	>
		{mounted ? `${pad(hours)}:${pad(minutes)}` : "--:--"}<span class="text-(--primary)"
			>:{mounted ? pad(seconds) : "--"}</span
		>
	</div>
	<div class="mt-1.5 text-sm font-medium tracking-wide text-white/60">
		{mounted ? `${dateText} · ${weekText}` : ""}
	</div>
</div>
