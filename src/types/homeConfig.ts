// 官网风格首页配置类型
// Hero 主标题与打字机副标题沿用 backgroundWallpaper.common.homeText 配置，此处只管构图与装饰

/** Hero 身份标签 */
export interface HomeHeroTag {
	/** 标签文字 */
	name: string;
	/** 可选图标（iconify 名称） */
	icon?: string;
	/** 可选链接（设置后标签可点击） */
	url?: string;
	/** 是否外部链接（新窗口打开） */
	external?: boolean;
}

/** Hero 右下角装饰性欢迎卡（斜置玻璃卡） */
export interface HomeHeroBadge {
	enable: boolean;
	/** 主文字 */
	title: string;
	/** 小字说明 */
	text: string;
}

export interface HomeHeroConfig {
	/**
	 * Hero 排版构图
	 * "left"  ：左对齐大标题构图（大标题 + 标签 + 口号，右侧竖排装饰）
	 * "center"：居中构图（原版：标题 + 打字机副标题居中）
	 */
	layout: "left" | "center";
	/** 左对齐构图下的标题字号（不填则桌面端默认 5.5rem，居中构图沿用 backgroundWallpaper 的 titleSize） */
	titleSize?: string;
	/** 身份标签（左对齐构图显示在标题下方） */
	tags: HomeHeroTag[];
	/** 右侧竖排装饰文字（左对齐构图） */
	verticalText?: string;
	/** 右下角斜置欢迎玻璃卡（左对齐构图） */
	badge: HomeHeroBadge;
	/** 标签下方的快捷跳转按钮（左对齐构图） */
	jumpButton?: HomeHeroJumpButton;
}

/** Hero 快捷跳转按钮 */
export interface HomeHeroJumpButton {
	enable?: boolean;
	/** 按钮文字 */
	name: string;
	/** 链接地址 */
	url: string;
	/** 是否外部链接（新窗口打开） */
	external?: boolean;
}

/** 板块入口卡片 */
export interface HomeSectionCard {
	/** 卡片标题 */
	name: string;
	/** 一句话描述 */
	description: string;
	/** 图标（iconify 名称） */
	icon: string;
	/** 链接地址，支持站内路径与外链 */
	url: string;
	/** 是否外部链接（新窗口打开） */
	external?: boolean;
	/**
	 * 关联的页面开关键（对应 siteConfig.pages）
	 * 设置后当对应页面在 siteConfig.pages 中关闭时，卡片自动隐藏
	 */
	pageKey?: string;
}

/** 板块入口卡片区域配置 */
export interface HomeSectionCardsConfig {
	enable: boolean;
	/** 板块标题 */
	title: string;
	/** 板块副标题 */
	subtitle?: string;
	cards: HomeSectionCard[];
}

/** 统计卡配置 */
export interface HomeStatsConfig {
	enable: boolean;
	/** 是否显示总字数 */
	showWords: boolean;
}

/** 实时时钟卡配置 */
export interface HomeClockConfig {
	enable: boolean;
}

/** 主页公告横条卡配置（内容沿用 announcementConfig） */
export interface HomeAnnouncementConfig {
	enable: boolean;
}

/** 主页音乐播放卡配置（与导航栏播放器共用全局状态） */
export interface HomeMusicConfig {
	enable: boolean;
}

/** 主页个人资料卡配置（与音乐卡并排；内容沿用 profileConfig） */
export interface HomeProfileConfig {
	enable: boolean;
}

/** 最新文章板块配置 */
export interface HomeLatestPostsConfig {
	enable: boolean;
	/** 展示文章数量，默认 4 */
	count: number;
	/** 杂志式列表是否显示小封面 */
	showCover: boolean;
	/** 板块标题，默认使用 i18n 的「最新文章」 */
	title?: string;
	/** 「查看全部」按钮文字 */
	moreText: string;
}

export interface HomeConfig {
	/**
	 * 是否启用官网风格首页
	 * true ：首页展示便当盒卡片 / 板块入口 / 最新文章，文章列表位于 /posts/
	 * false：首页回退为文章列表（第一页），保持旧行为
	 */
	enable: boolean;
	/** Hero 构图与装饰 */
	hero: HomeHeroConfig;
	/** 实时时钟卡 */
	clock: HomeClockConfig;
	/** 主页公告横条卡 */
	announcement: HomeAnnouncementConfig;
	/** 主页音乐播放卡 */
	music: HomeMusicConfig;
	/** 主页个人资料卡（与音乐卡并排） */
	profile: HomeProfileConfig;
	/** 板块入口卡片 */
	sectionCards: HomeSectionCardsConfig;
	/** 统计卡 */
	stats: HomeStatsConfig;
	/** 最新文章 */
	latestPosts: HomeLatestPostsConfig;
}
