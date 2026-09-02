<script lang="ts">
import { onDestroy, onMount } from "svelte";

let { class: className = "" }: { class?: string } = $props();

type Track = { name?: string; artist?: string; pic?: string } | null;

let track: Track = $state(null);
let isPlaying = $state(false);
let initialized = $state(false);
let progress = $state(0);
let currentTimeStr = $state("0:00");
let durationStr = $state("0:00");

const manager = () => window.__fireflyMusic;

function syncFromManager() {
	const m = manager();
	if (!m) return;
	const s = m.getState();
	track = s.track;
	isPlaying = s.isPlaying;
	initialized = s.initialized;
	progress = s.progress || 0;
	currentTimeStr = s.currentTimeStr || "0:00";
	durationStr = s.durationStr || "0:00";
}

function onTrack(e: Event) {
	track = (e as CustomEvent).detail?.track ?? null;
}
function onPlayState(e: Event) {
	isPlaying = !!(e as CustomEvent).detail?.isPlaying;
}
function onTime(e: Event) {
	const d = (e as CustomEvent).detail || {};
	progress = d.progress || 0;
	currentTimeStr = d.currentTimeStr || "0:00";
	durationStr = d.durationStr || "0:00";
}
function onInit() {
	syncFromManager();
}

let listeners: Array<[string, EventListener]> = [];
onMount(() => {
	syncFromManager();
	listeners = [
		["fm:track", onTrack],
		["fm:play-state", onPlayState],
		["fm:time", onTime],
		["fm:init", onInit],
	];
	for (const [name, fn] of listeners) {
		window.addEventListener(name, fn);
	}
});
onDestroy(() => {
	for (const [name, fn] of listeners) {
		window.removeEventListener(name, fn);
	}
});

async function togglePlay() {
	const m = manager();
	if (!m) return;
	try {
		if (!m.getState().initialized) {
			await m.init();
		}
		m.togglePlay();
	} catch (e) {
		/* 初始化失败静默，fm:error 会由管理器广播 */
	}
}
function playPrev() {
	manager()?.playPrev();
}
function playNext() {
	manager()?.playNext();
}
function seek(e: MouseEvent) {
	const m = manager();
	if (!m) return;
	const bar = e.currentTarget as HTMLElement;
	const rect = bar.getBoundingClientRect();
	const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
	const duration = m.getState().duration || 0;
	if (duration > 0) m.seekToTime(pct * duration);
}
</script>

<!-- 主页音乐播放卡：与导航栏播放器共用全局状态（window.__fireflyMusic） -->
<div
  class="card-base sakura-card flex items-center gap-4 rounded-(--radius-large) p-4 md:gap-5 md:p-5 {className ?? ''}"
  aria-label="音乐播放"
>
  <!-- 旋转封面 -->
  <button
    type="button"
    onclick={togglePlay}
    class="relative h-16 w-16 shrink-0 rounded-full border border-white/10 shadow-lg md:h-20 md:w-20"
    aria-label={isPlaying ? "暂停" : "播放"}
  >
    {#if track?.pic}
      <img
        src={track.pic}
        alt={track.name || "封面"}
        class="h-full w-full rounded-full object-cover cover-spin"
        class:paused={!isPlaying}
        loading="lazy"
      />
      <div class="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/70 bg-black/80" />
    {:else}
      <div class="flex h-full w-full items-center justify-center rounded-full bg-(--btn-plain-bg-hover) text-(--primary)">
        <svg class="cover-spin {isPlaying ? '' : 'paused'}" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z" />
        </svg>
      </div>
    {/if}
  </button>

  <!-- 曲目信息 + 进度 -->
  <div class="flex min-w-0 flex-1 flex-col justify-center gap-1.5">
    <div class="flex min-w-0 flex-col">
      <span class="truncate text-base font-bold text-black/85 md:text-lg dark:text-white/85">
        {track?.name || "音乐播放"}
      </span>
      <span class="truncate text-xs text-black/50 dark:text-white/50 md:text-sm">
        {track?.artist || (initialized ? "闲置中" : "点我开启音乐")}
      </span>
    </div>
    <div class="flex items-center gap-3">
      <div
        class="group h-2 flex-1 cursor-pointer overflow-hidden rounded-full bg-black/10 dark:bg-white/15"
        onclick={seek}
        role="slider"
        aria-label="播放进度"
        aria-valuenow={Math.round(progress)}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        <div class="h-full rounded-full bg-(--primary) transition-[width] duration-200" style={`width: ${progress}%`} />
      </div>
      <span class="shrink-0 font-mono text-[11px] text-black/45 tabular-nums dark:text-white/45">
        {currentTimeStr} / {durationStr}
      </span>
    </div>
    <!-- 控制按钮 -->
    <div class="mt-0.5 flex items-center justify-center gap-4">
      <button
        type="button"
        onclick={playPrev}
        aria-label="上一曲"
        class="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition-colors duration-150 hover:bg-(--btn-plain-bg-hover) hover:text-(--primary) dark:text-white/60"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>
      <button
        type="button"
        onclick={togglePlay}
        aria-label={isPlaying ? "暂停" : "播放"}
        class="flex h-10 w-10 items-center justify-center rounded-full bg-(--primary) text-white shadow-lg transition-transform duration-150 hover:scale-105 active:scale-95"
      >
        {#if isPlaying}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M6 5h4v14H6zm8 0h4v14h-4z" />
          </svg>
        {:else}
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        {/if}
      </button>
      <button
        type="button"
        onclick={playNext}
        aria-label="下一曲"
        class="flex h-8 w-8 items-center justify-center rounded-full text-black/60 transition-colors duration-150 hover:bg-(--btn-plain-bg-hover) hover:text-(--primary) dark:text-white/60"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" />
        </svg>
      </button>
    </div>
  </div>
</div>

<style>
  /* 封面唱片旋转：播放时旋转，暂停时停在原地 */
  .cover-spin {
    animation: cover-rotate 14s linear infinite;
  }

  .cover-spin.paused {
    animation-play-state: paused;
  }

  @keyframes cover-rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .cover-spin {
      animation: none;
    }
  }
</style>
