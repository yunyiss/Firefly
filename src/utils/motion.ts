/**
 * GSAP + Lenis 动效引擎（全局唯一实例，由 Layout.astro 全局脚本驱动）
 *
 * 职责划分：
 * - Lenis：平滑滚动（驱动原生 window 滚动，与壁纸 sticky、既有 scroll 监听完全兼容）
 * - ScrollTrigger：滚动进度驱动的 Hero 开场戏、板块入场编舞与卡片流扫入
 * - 壁纸钉住（wallpaper-pinned）、毛玻璃层渐入仍由 Layout.astro 的 updateHomeScrollFx 负责，
 *   本模块通过 html.motion-hero 标记接管 Hero 文案的滚动变换，避免双方写同一内联样式
 *
 * 预隐藏约定：板块（.reveal-section）与 Hero 元素（[data-reveal-hero]）由 CSS 在
 * reveal-pending 状态下预隐藏，补间一律用 fromTo（目标终态 opacity:1）——
 * 若用 from()，补间会读到 CSS 的 opacity:0 并永远停在不可见状态
 *
 * 生命周期：本模块随 Layout 全局脚本在整页加载时执行一次；
 * Swup 切页不会重新执行模块脚本，因此挂载/卸载通过 swup 钩子显式调用
 * （content:replace → teardown + setup，page:view / load / wallpaperModeChange → refresh）
 */
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

let engineReady = false;
let lenis: Lenis | null = null;
/** 当前页面创建的时间轴，切页时统一销毁（其 ScrollTrigger 由 teardown 单独清） */
let pageTimelines: gsap.core.Timeline[] = [];
/** 待执行的延迟回调（gsap.delayedCall），切页时统一清掉，避免残留触发已销毁的时间轴 */
let pendingDelays: gsap.core.Tween[] = [];
/** 被补间触碰过的元素，切页时清除内联样式，交还 CSS 控制 */
let managedEls: Element[] = [];

const prefersReducedMotion = () =>
	window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/** 官网首页路径判定（与 Layout.astro 的 isCurrentPageHome 保持一致） */
export function isMotionHome(): boolean {
	const baseUrl = import.meta.env.BASE_URL || "/";
	const pathname = window.location.pathname;
	if (pathname === "/" || pathname === baseUrl) return true;
	return baseUrl !== "/" && pathname === baseUrl.replace(/\/$/, "");
}

/** 内容里需要原生滚动的容器打上 data-lenis-prevent（Lenis 只劫持页面级滚动） */
function applyLenisPrevent(): void {
	if (!lenis) return;
	const selector = [
		".float-panel",
		"#toc-wrapper",
		"pre",
		".horizontal-scroll-container",
		".katex-display-container",
	].join(",");
	document.querySelectorAll<HTMLElement>(selector).forEach((el) => {
		if (!el.hasAttribute("data-lenis-prevent")) {
			el.setAttribute("data-lenis-prevent", "");
		}
	});
}

/** 注册插件 + 启动 Lenis 平滑滚动（整页加载只执行一次） */
export function initMotionEngine(): void {
	if (engineReady) return;
	engineReady = true;
	gsap.registerPlugin(ScrollTrigger);

	if (prefersReducedMotion()) return;

	lenis = new Lenis({
		// 滚动缓动：指数衰减，惯性感与 kanako/fqzlr 一类站点的手感对齐
		duration: 1.15,
		easing: (t: number) => Math.min(1, 1.001 - 2 ** (-10 * t)),
	});
	lenis.on("scroll", ScrollTrigger.update);
	gsap.ticker.add((time) => {
		lenis?.raf(time * 1000);
	});
	gsap.ticker.lagSmoothing(0);
	if (import.meta.env.DEV) {
		(window as { __ST?: typeof ScrollTrigger }).__ST = ScrollTrigger;
	}
	applyLenisPrevent();
	releaseContentWrapperTransform();
	bindLenisToSwupTransitions();
}

/**
 * Swup 整页切换时冻结 Lenis，切完再把滚动归位。
 *
 * 背景：这个 swup 配置下切页不会自动回顶——从首页深处切走再切回，
 * 页面停留在原深滚动处。全屏壁纸模式下 hero scrub（滚动驱动）progress=1，
 * hero 文案会被顶出视口外不可见。Layout 的 scroll:top 钩子实际不触发
 * （ScrollPlugin 未启用），因此需要在此处主动归位。
 *
 * 目标遵循模板语义：首页 → 0；全屏模式其它页 → #main-grid 顶部（与
 * ScrollDownIndicator / Layout scroll:top 意图一致）；其余 → 0。
 */
function bindLenisToSwupTransitions(): void {
	if (!lenis) return;
	const freeze = () => lenis?.stop();
	const release = () => {
		lenis?.start();
		const mode = document.documentElement.getAttribute("data-wallpaper-mode");
		let target = 0;
		if (mode === "fullscreen" && !isMotionHome()) {
			const grid = document.getElementById("main-grid");
			if (grid) {
				// 目标 = main-grid 文档顶部 - 实际导航占位（CSS scroll-margin-top）。
				// 固定导航栏在视口 y=0，若把 main-grid 顶部对齐到 y=0 会被它盖住约
				// 5.5rem（Layout scroll:top 的 scrollIntoView 受同一 scroll-margin-top
				// 影响，此处读取计算值保持一致，避免两处偏移不一致）。
				const scrollMargin = parseFloat(getComputedStyle(grid).scrollMarginTop) || 0;
				target = Math.max(0, Math.round(grid.getBoundingClientRect().top + window.scrollY - scrollMargin));
			}
		}
		// force: true 强制覆盖任何进行中的惯性滚动，immediate 直接跳转
		lenis?.scrollTo(target, { immediate: true, force: true });
	};
	["swup:visit:start", "swup:content:replace"].forEach((name) => {
		document.addEventListener(name, freeze);
	});
	document.addEventListener("swup:page:view", () => setTimeout(release, 0));
}

/**
 * 释放 #content-wrapper 的 onload 动画残留 transform。
 * onload-animation 的 forwards 填充会永久留下 translateY(0)——它也是 transform，
 * 会让后代 position:fixed 退化（ScrollTrigger 的 pin 就靠 fixed），必须清掉。
 * 视觉零变化（translateY(0) 等价无 transform），仅在动画播完后清除。
 *
 * 注意：Swup 每次切页都会重建 #content-wrapper 节点，因此 clear 内部必须
 * 重新查询元素，不能闭包持有首次加载时的旧节点（旧节点已从 DOM 移除，
 * 写它的样式对新页面毫无作用，动画残留会永久存在导致 pin 锚错包含块）。
 */
function releaseContentWrapperTransform(): void {
	const clear = () => {
		// forwards 填充的动画会以更高优先级持续写入 transform，必须连同 animation 一起清；
		// 但该动画同时负责 opacity 0→1，清掉后必须把终态钉住，否则整个内容区隐形
		const wrapper = document.getElementById("content-wrapper");
		if (!wrapper) return;
		wrapper.style.animation = "none";
		wrapper.style.transform = "none";
		wrapper.style.opacity = "1";
	};
	// onload 动画总时长 ≈ 120ms + 交错延迟 ≈ 240ms；播完即清。
	// 不能挂 load 事件——随机壁纸大图会把它拖到几秒之后
	setTimeout(clear, 600);
	// Swup 派发的 DOM 事件是 swup:content:replace（冒号形式，v4 命名）。
	// 清理本身幂等，重复触发无害。
	document.addEventListener("swup:content:replace", () => {
		setTimeout(clear, 300);
	});
}

/** 内容替换 / 壁纸模式切换 / 资源加载后校正触发器位置 */
export function refreshMotion(): void {
	if (!engineReady) return;
	ScrollTrigger.refresh();
}

/** 销毁当前页面的动效：杀掉触发器与补间，清空内联样式 */
export function teardownPageMotion(): void {
	ScrollTrigger.getAll().forEach((st) => {
		st.kill();
	});
	pageTimelines.forEach((tl) => {
		tl.kill();
	});
	pageTimelines = [];
	// 清理未执行的延迟回调（入场停顿等），避免切页后触发已销毁的时间轴
	pendingDelays.forEach((d) => {
		d.kill();
	});
	pendingDelays = [];
	managedEls.forEach((el) => {
		gsap.set(el as HTMLElement, {
			clearProps: "opacity,transform,filter,visibility,transition",
		});
	});
	managedEls = [];
	document.documentElement.classList.remove("motion-hero");
}

/** 按当前页面挂载动效（官网首页编舞 + 全站页脚签名） */
export function setupPageMotion(): void {
	teardownPageMotion();

	setupFooterSignature();

	if (!isMotionHome()) return;

	const homeRoot = document.getElementById("home-sections");
	const heroContainer = document.getElementById("banner-overlay-container");
	if (!homeRoot && !heroContainer) return;

	if (prefersReducedMotion()) {
		// 降级：不做动画，直接展示全部内容
		document.documentElement.classList.remove("reveal-pending");
		return;
	}
	document.documentElement.classList.add("reveal-pending");
	applyLenisPrevent();

	const wallpaperMode = document.documentElement.getAttribute(
		"data-wallpaper-mode",
	);
	const overlay = heroContainer?.querySelector(".banner-home-text-overlay");
	const heroVisible = !!overlay && !overlay.classList.contains("hidden");

	setupHeroIntro(heroContainer);

	// 开场戏只在全屏壁纸模式做（壁纸 sticky 钉住，滚动进度才有"播放"语义）；
	// banner 模式下壁纸随页面自然滚走，维持 Layout 的原生 Hero 位移即可
	if (heroVisible && wallpaperMode === "fullscreen") {
		setupHeroScrub();
		document.documentElement.classList.add("motion-hero");
	}

	setupSectionChoreography(homeRoot);
	setupPostStream();
	setupAnnouncementVisibility();
	refreshMotion();
	setTimeout(refreshMotion, 400);
	setTimeout(() => {
		// 兜底：视口内的板块 3s 后仍不可见则强制显示（防引擎异常导致内容永久不可见）
		document.querySelectorAll<HTMLElement>(".reveal-section").forEach((el) => {
			const r = el.getBoundingClientRect();
			const inView = r.top < window.innerHeight * 0.9 && r.bottom > 0;
			if (inView && getComputedStyle(el).opacity === "0") {
				el.classList.add("revealed");
			}
		});
	}, 3000);
}

/**
 * 公告气泡：随滚动自然淡入淡出。
 * 绑定气泡自身：顶部从视口底部进入时淡入；继续上滚直到其顶部完全越过
 * 视口上缘（top -20%）才淡出——高竖签不会在仍可见时提前消失。
 */
function setupAnnouncementVisibility(): void {
	const el = document.getElementById("home-announcement");
	if (!el?.classList.contains("announce-in-explore")) return;
	ScrollTrigger.create({
		trigger: el,
		start: "top bottom",
		end: "top -20%",
		onEnter: () => el.classList.add("is-visible"),
		onEnterBack: () => el.classList.add("is-visible"),
		onLeave: () => el.classList.remove("is-visible"),
		onLeaveBack: () => el.classList.remove("is-visible"),
	});
}

/**
 * 页脚手写签名描边（源自主页草图 v6）：滚到页脚视口 85% 处起笔，
 * 2.4s power2.inOut 画完。页脚是跨页持久元素（不在 Swup 容器内），
 * 用 sign-drawn 标记保证整站只画一次：起笔即记账，切页不重播。
 * reduced-motion 不会进入本函数（setupPageMotion 前置短路），SVG 默认完整显示。
 */
function setupFooterSignature(): void {
	if (prefersReducedMotion()) return; // SVG 默认完整显示，不做描边动画
	const svg = document.getElementById("footer-signature");
	const path = document.querySelector<SVGPathElement>("#footer-sign-path");
	if (!svg || !path) return;

	if (svg.classList.contains("sign-drawn")) {
		// 已画过但内联样式可能被 teardown 清残：确保笔画完整
		gsap.set(path, { clearProps: "strokeDasharray,strokeDashoffset" });
		return;
	}

	const signLen = path.getTotalLength();
	gsap.set(path, { strokeDasharray: signLen, strokeDashoffset: signLen });
	const tl = gsap.timeline({
		scrollTrigger: {
			trigger: svg,
			start: "top 85%",
			toggleActions: "play none none none",
		},
		onStart: () => svg.classList.add("sign-drawn"),
	});
	tl.to(path, { strokeDashoffset: 0, duration: 3.6, ease: "power2.inOut" }, 0);
	pageTimelines.push(tl);
	managedEls.push(path);
	collectTimelineTargets(tl);
}

/** 收集时间轴触碰过的元素，供切页时 clearProps */
function collectTimelineTargets(tl: gsap.core.Timeline): void {
	tl.getChildren(false, true, true).forEach((tw) => {
		const targets = (tw as gsap.core.Tween).targets?.() ?? [];
		targets.forEach((el) => {
			if (el instanceof Element && !managedEls.includes(el)) {
				managedEls.push(el);
			}
		});
	});
}

/** Hero 文案开场：标题/副标题/标签/按钮按 data-reveal-hero 标记依次浮出 */
function setupHeroIntro(heroContainer: HTMLElement | null): void {
	const overlay = heroContainer?.querySelector(".banner-home-text-overlay");
	if (!overlay || overlay.classList.contains("hidden")) return;

	const parts = overlay.querySelectorAll<HTMLElement>("[data-reveal-hero]");
	if (parts.length === 0) return;

	// hero-tag 带 transition-all，会拖慢逐帧补间；补间结束后恢复 CSS 过渡（hover 手感）
	gsap.set(parts, { transition: "none" });
	const intro = gsap.timeline({
		defaults: { ease: "back.out(1.5)" },
		onComplete: () => {
			gsap.set(parts, { clearProps: "transition,filter,transform" });
		},
	});
	// 弹性冲过头再弹回，带轻微缩放
	intro.fromTo(
		parts,
		{ y: 44, opacity: 0, scale: 0.96 },
		{ y: 0, opacity: 1, scale: 1, duration: 1.1, stagger: 0.09 },
		0.1,
	);
	pageTimelines.push(intro);
	collectTimelineTargets(intro);
}

/** Hero 开场戏：滚动 scrub 驱动文案淡出上移 + 壁纸视差变焦 */
function setupHeroScrub(): void {
	const heroContainer = document.getElementById("banner-overlay-container");
	const wallpaperImages = document.getElementById("banner-images-container");
	if (!heroContainer) return;

	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: "body",
			start: "top top",
			end: () => `+=${window.innerHeight * 0.9}`,
			scrub: 0.6,
			invalidateOnRefresh: true,
		},
	});
	tl.to(
		heroContainer,
		{
			y: () => -window.innerHeight * 0.6,
			opacity: 0,
		},
		0,
	);
	if (wallpaperImages) {
		// 壁纸 img 的宽高被主题 CSS !important 锁定，变焦作用在图片容器上
		tl.to(wallpaperImages, { scale: 1.08, yPercent: 3 }, 0);
		managedEls.push(wallpaperImages);
	}
	pageTimelines.push(tl);
	managedEls.push(heroContainer);
}

/** 单个板块的入场：滚到区块主体入眼后，自动完整播放一遍 */
function choreograph(
	trigger: HTMLElement,
	build: (tl: gsap.core.Timeline) => void,
): void {
	gsap.set(trigger, { transition: "none" });
	// 时间轴暂停创建，仅由 onUpdate 实时判定后手动播放：
	// 不用 onEnter/toggleActions（它们依赖 ScrollTrigger 的初始 start 计算——
	// explore 顶部贴首屏，布局未稳时 start 可能算错而提前播放）。
	// onUpdate 每次滚动都用 getBoundingClientRect 实时判断区块是否真正进入视口，
	// 从根上避免"还没滚到区块动画就放完"
	const tl = gsap.timeline({ paused: true });
	let played = false;
	ScrollTrigger.create({
		trigger,
		start: "top bottom",
		end: "bottom top",
		onUpdate: () => {
			if (played) return;
			// 页面刚加载时（scrollY=0）ScrollTrigger 也会跑一次 update，
			// 此时壁纸/图片未加载、explore 顶部可能被误判进视口——
			// 只有用户发生真实滚动后才允许入场
			if (window.scrollY <= 0) return;
			// 区块顶部进入视口上半（用户已能看到区块主体）才播放入场
			const r = trigger.getBoundingClientRect();
			if (r.top <= window.innerHeight * 0.55) {
				played = true;
				tl.play();
			}
		},
		invalidateOnRefresh: true,
	});
	build(tl);
	// paused timeline 不会自动渲染 fromTo 的 from 态——子元素（资料卡/右侧对向入场等）
	// 在入场前若保持 opacity 1，play 瞬间会被 fromTo 强行拉到 0 再滑入，产生"闪一下"跳变。
	// 这里把每个 tween 的 from 值预置到目标上：入场前元素就是隐藏/就位的起点状态，
	// 播放时平滑过渡到终态，视觉连贯
	tl.getChildren(false, true, false).forEach((tw) => {
		const from = tw.vars?.from;
		if (!from) return;
		const targets = (tw as gsap.core.Tween).targets();
		gsap.set(targets, from);
	});
	pageTimelines.push(tl);
	collectTimelineTargets(tl);
}

/** 板块编舞：每次滚入重播 + 成对板块对向入场 */
function setupSectionChoreography(homeRoot: HTMLElement | null): void {
	if (!homeRoot) return;
	const isMobile = window.innerWidth < 1024;
	// 移动端窄屏不用水平位移，避免编舞触发横向溢出
	const shift = isMobile ? 0 : 44;

	const sections = Array.from(
		homeRoot.querySelectorAll<HTMLElement>(".reveal-section"),
	);

	sections.forEach((el) => {
		// sweepReveal（Layout 全局扫描器）据此跳过该板块，改由 ScrollTrigger 驱动
		el.classList.add("motion-managed");

		choreograph(el, (tl) => {
			// 板块整体先浮出（CSS 预隐藏是 translateY(26px) + opacity 0，fromTo 与之对齐）；
			// 弹性曲线：back.out 冲过头再弹回
			const baseY = el.id === "home-announcement" ? -26 : 40;
			tl.fromTo(
				el,
				{ opacity: 0, y: baseY, scale: 0.97 },
				{ opacity: 1, y: 0, scale: 1, duration: 0.9, ease: "back.out(1.6)" },
				0,
			);

			const children = Array.from(el.children) as HTMLElement[];
			const exploreCards =
				el.dataset.motion === "explore"
					? el.querySelectorAll<HTMLElement>(".explore-grid > a")
					: [];

			// 成对内容：时钟+统计（合并场景上半）、资料卡+右侧副位（对向入场）
			let pair: HTMLElement[] | null = null;
			if (el.dataset.motion === "showcase") {
				const grid = el.querySelector<HTMLElement>(".showcase-grid");
				pair = grid ? (Array.from(grid.children) as HTMLElement[]) : null;
			} else if (el.classList.contains("grid")) {
				pair = children;
			}

			if (exploreCards.length) {
				// 入场前先把子元素显式预置为 from 态（inline 写入）——
				// paused timeline 中非首位 tween 的 from 值不会自动渲染，
				// 不预置会导致播放瞬间元素从可见跳到隐藏再滑入的"闪一下"
				gsap.set(exploreCards, { y: 30, opacity: 0 });
				tl.fromTo(
					exploreCards,
					{ y: 30, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						stagger: 0.06,
						duration: 0.8,
						ease: "back.out(1.6)",
					},
					0.12,
				);
			} else if (pair && pair.length >= 2) {
				gsap.set(pair[0], opposingShift(-shift, isMobile));
				gsap.set(pair[1], opposingShift(shift, isMobile));
				tl.fromTo(
					pair[0],
					opposingShift(-shift, isMobile),
					opposingReset(isMobile),
					0.1,
				).fromTo(
					pair[1],
					opposingShift(shift, isMobile),
					opposingReset(isMobile),
					0.18,
				);
			}
		});
	});
}

function opposingShift(shift: number, isMobile: boolean): gsap.TweenVars {
	return isMobile ? { y: 26, opacity: 0 } : { x: shift, opacity: 0 };
}

function opposingReset(isMobile: boolean): gsap.TweenVars {
	return isMobile
		? { y: 0, opacity: 1, duration: 0.9, ease: "back.out(1.5)" }
		: { x: 0, opacity: 1, duration: 0.9, ease: "back.out(1.5)" };
}

/**
 * 最新文章卡片流（#home-posts-stream）：滚动经过区块时卡片从右向左扫过。
 * 不用 pin——以"区块穿过视口"的进度做 scrub，卡片在区块可见期间持续移动。
 */
function setupPostStream(): void {
	const section = document.getElementById("home-posts-stream");
	const track = document.getElementById("stream-track");
	if (!section || !track) return;
	// 取景框 .stream-track-wrap（与头部同宽居中）：scrub 平移以框宽为基准，
	// 使起点首卡贴框左缘、终点末卡贴框右缘；无框（异常）时回退视口宽
	const frame = track.parentElement as HTMLElement | null;
	const travel = () =>
		Math.max(
			600,
			Math.round(
				track.scrollWidth - (frame ? frame.offsetWidth : window.innerWidth),
			),
		);

	// 经典 GSAP 横向滚动：整行钉住，滚动驱动整行向左流过；
	// 起始位 = 自然位（首卡对齐框左缘，任何失败模式下区块都不空），
	// 终点 = 末卡贴齐框右缘，pin 恰好结束、刚好凑成一整行
	const pace = 1.6; // 动画节奏系数：滚动区间拉长后，卡片移动相对滚动更慢、更从容
	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: section,
			start: "top top",
			end: () => `+=${Math.round(travel() * pace)}`,
			pin: true,
			// Lenis 使用 window 的原生滚动位置，保持 ScrollTrigger 默认的 fixed pin。
			// 强制 transform pin 会在钉住边界额外叠加位移补偿，容易造成视觉抖动。
			// 直连模式（scrub: true）：卡片位置 1:1 映射滚动。Lenis 已对滚动做平滑，
			// 数值 scrub 会二次插值，产生"强制吸回/颤抖抽搐"的拉扯感
			scrub: true,
			invalidateOnRefresh: true,
		},
	});
	tl.fromTo(track, { x: 0 }, { x: () => -travel() }, 0);
	pageTimelines.push(tl);
	managedEls.push(track);
	collectTimelineTargets(tl);
}
