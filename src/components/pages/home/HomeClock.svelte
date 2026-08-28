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
// 指针角度（分/时针随分秒平滑推进）
const secondDeg = $derived(seconds * 6);
const minuteDeg = $derived(minutes * 6 + seconds * 0.1);
const hourDeg = $derived((hours % 12) * 30 + minutes * 0.5);
const dateText = $derived(
	`${now.getFullYear()}/${pad(now.getMonth() + 1)}/${pad(now.getDate())}`,
);
const weekText = $derived(WEEKDAYS[now.getDay()]);
</script>

<div class={`card-base rounded-(--radius-large) p-4 md:p-6 ${className}`}>
	<div class="flex h-full items-center gap-5 md:gap-7">
		<!-- 模拟表盘 -->
		<div
			class="relative h-24 w-24 shrink-0 rounded-full border border-(--line-divider) md:h-28 md:w-28"
			role="img"
			aria-label={mounted ? `${hours}:${minutes}:${seconds}` : ""}
		>
			{#each Array.from({ length: 12 }) as _, i (i)}
				<div
					class="absolute left-1/2 top-1/2 h-full w-full"
					style={`transform: translate(-50%, -50%) rotate(${i * 30}deg)`}
				>
					<div
						class="mx-auto mt-1.5 w-0.5 rounded-full bg-black/20 dark:bg-white/25"
						style={i % 3 === 0 ? "height: 0.5rem; opacity: 0.9" : "height: 0.375rem"}
					/>
				</div>
			{/each}
			{#if mounted}
				<div
					class="absolute bottom-1/2 left-1/2 w-[3px] origin-bottom rounded-full bg-black/70 dark:bg-white/75"
					style={`height: 24%; transform: translateX(-50%) rotate(${hourDeg}deg)`}
				/>
				<div
					class="absolute bottom-1/2 left-1/2 w-[2.5px] origin-bottom rounded-full bg-black/55 dark:bg-white/60"
					style={`height: 34%; transform: translateX(-50%) rotate(${minuteDeg}deg)`}
				/>
				<div
					class="absolute bottom-1/2 left-1/2 w-px origin-bottom rounded-full bg-(--primary)"
					style={`height: 38%; transform: translateX(-50%) rotate(${secondDeg}deg)`}
				/>
			{/if}
			<div
				class="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-(--primary)"
			/>
		</div>

		<!-- 数字时间 -->
		<div class="flex min-w-0 flex-col">
			<div
				class="text-4xl font-bold tabular-nums tracking-tight text-black/85 md:text-5xl dark:text-white/85"
			>
				{mounted ? `${pad(hours)}:${pad(minutes)}` : "--:--"}<span class="text-(--primary)"
					>:{mounted ? pad(seconds) : "--"}</span
				>
			</div>
			<div class="mt-2 text-sm font-medium text-black/50 dark:text-white/50">
				{mounted ? `${dateText} · ${weekText}` : ""}
			</div>
		</div>
	</div>
</div>
