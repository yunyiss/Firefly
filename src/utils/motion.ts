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
}

/**
 * 释放 #content-wrapper 的 onload 动画残留 transform。
 * onload-animation 的 forwards 填充会永久留下 translateY(0)——它也是 transform，
 * 会让后代 position:fixed 退化（ScrollTrigger 的 pin 就靠 fixed），必须清掉。
 * 视觉零变化（translateY(0) 等价无 transform），仅在动画播完后清除。
 */
function releaseContentWrapperTransform(): void {
	const wrapper = document.getElementById("content-wrapper");
	if (!wrapper) return;
	const clear = () => {
		// forwards 填充的动画会以更高优先级持续写入 transform，必须连同 animation 一起清；
		// 但该动画同时负责 opacity 0→1，清掉后必须把终态钉住，否则整个内容区隐形
		wrapper.style.animation = "none";
		wrapper.style.transform = "none";
		wrapper.style.opacity = "1";
	};
	// onload 动画总时长 ≈ 120ms + 交错延迟 ≈ 240ms；播完即清。
	// 不能挂 load 事件——随机壁纸大图会把它拖到几秒之后
	setTimeout(clear, 600);
	document.addEventListener("swup:contentReplaced", () => {
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
	managedEls.forEach((el) => {
		gsap.set(el as HTMLElement, {
			clearProps: "opacity,transform,filter,visibility,transition",
		});
	});
	managedEls = [];
	document.documentElement.classList.remove("motion-hero");
}

/** 按当前页面挂载动效（目前只有官网首页有编舞） */
export function setupPageMotion(): void {
	teardownPageMotion();

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

/** 单个板块的入场触发器：每次滚入视口都重播（离开回上方后复位） */
function choreograph(
	trigger: HTMLElement,
	build: (tl: gsap.core.Timeline) => void,
): void {
	// .reveal-section 的 CSS 过渡（opacity/transform）会与逐帧补间叠加，必须关闭；
	// 同时解除 CSS 预隐藏（透明度/位移交给下面的补间接管）
	gsap.set(trigger, { opacity: 1, y: 0, transition: "none" });
	const tl = gsap.timeline({
		scrollTrigger: {
			trigger,
			start: "top 78%",
			toggleActions: "play none none reset",
		},
	});
	build(tl);
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

	// 经典 GSAP 横向滚动：整行钉住，滚动驱动整行向左流过；
	// 起始位 = 自然位（首卡对齐左缘，任何失败模式下区块都不空），
	// 终点 = 末卡贴齐视口右缘，pin 恰好结束、刚好凑成一整行
	const tl = gsap.timeline({
		defaults: { ease: "none" },
		scrollTrigger: {
			trigger: section,
			start: "top top",
			end: () =>
				"+=" + Math.max(600, Math.round(track.scrollWidth - window.innerWidth)),
			pin: true,
			scrub: 0.4,
			anticipatePin: 1,
			invalidateOnRefresh: true,
		},
	});
	tl.fromTo(
		track,
		{ x: 0 },
		{ x: () => -(track.scrollWidth - window.innerWidth) },
		0,
	);
	pageTimelines.push(tl);
	managedEls.push(track);
	collectTimelineTargets(tl);
}
