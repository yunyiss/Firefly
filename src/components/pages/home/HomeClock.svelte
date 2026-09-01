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
const WEEKDAYS_CN = ["日", "一", "二", "三", "四", "五", "六"];

const hours = $derived(now.getHours());
const minutes = $derived(now.getMinutes());
const seconds = $derived(now.getSeconds());
const dateText = $derived(
	`${now.getFullYear()} 年 ${now.getMonth() + 1} 月 ${now.getDate()} 日`,
);
const weekText = $derived(`星期${WEEKDAYS_CN[now.getDay()]}`);

// 按时段问候（二次元软萌语气）
const greeting = $derived.by(() => {
	const h = now.getHours();
	if (h >= 5 && h < 8) return "清晨的樱花正醒，早呀";
	if (h >= 8 && h < 11) return "上午好，今天也要元气满满";
	if (h >= 11 && h < 13) return "中午好，记得好好吃饭";
	if (h >= 13 && h < 17) return "下午茶时间到啦";
	if (h >= 17 && h < 19) return "傍晚好，晚霞很美";
	if (h >= 19 && h < 23) return "晚上好，夜色正温柔";
	return "夜深了，早点休息哦";
});
</script>

<!-- 时间面板：问候 + 脉冲状态点 + 大时钟 + 日期胶囊（草图樱花软萌语言） -->
<div class="clock-panel flex flex-col gap-4 {className ?? ''}">
	<div class="flex items-center gap-2.5">
		<span class="relative flex h-2.5 w-2.5">
			<span
				class="absolute inline-flex h-full w-full animate-ping rounded-full bg-(--primary) opacity-60"
			></span>
			<span
				class="relative inline-flex h-2.5 w-2.5 rounded-full bg-(--primary)"
			></span>
		</span>
		<span class="text-sm font-medium text-white/75 [text-shadow:0_2px_10px_rgba(0,0,0,0.45)]">
			{mounted ? greeting : ""}
		</span>
	</div>

	<div
		class="clock-digits text-6xl font-bold tabular-nums tracking-tight text-white sm:text-7xl lg:text-8xl"
	>
		{mounted ? `${pad(hours)}:${pad(minutes)}` : "--:--"}<span class="text-(--primary)"
			>:{mounted ? pad(seconds) : "--"}</span
		>
	</div>

	<div
		class="date-chip inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-medium tracking-wide text-white/75 backdrop-blur-sm"
	>
		<svg viewBox="0 0 24 24" fill="currentColor" class="h-3.5 w-3.5 text-(--primary)" aria-hidden="true">
			<path
				d="M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20Zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm1-8.4 2.5 2.5-1.4 1.4L10.6 12V6h2.4v5.6Z"
			/>
		</svg>
		{mounted ? `${dateText} · ${weekText}` : ""}
	</div>
</div>

<style>
	.clock-digits {
		text-shadow:
			0 4px 24px rgb(0 0 0 / 0.6),
			0 0 42px rgb(255 127 169 / 0.35);
	}
</style>
