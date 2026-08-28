// 官网风格首页配置类型
// 首页 Hero（主标题/副标题/打字机）沿用 backgroundWallpaper.common.homeText 配置，此处不重复配置

/** Hero 区域入口按钮（显示在壁纸文字下方） */
export interface HomeHeroButton {
	/** 按钮文字 */
	name: string;
	/** 链接地址，支持站内路径与外链 */
	url: string;
	/** 可选图标（iconify 名称） */
	icon?: string;
	/** 是否外部链接（新窗口打开） */
	external?: boolean;
	/** 是否主按钮（主题色高亮样式） */
	primary?: boolean;
}

/** 内容板块入口卡片 */
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

/** 统计条配置 */
export interface HomeStatsConfig {
	enable: boolean;
	/** 是否显示总字数 */
	showWords: boolean;
}

/** 最新文章板块配置 */
export interface HomeLatestPostsConfig {
	enable: boolean;
	/** 展示文章数量，默认 4 */
	count: number;
	/** 板块标题，默认使用 i18n 的「最新文章」 */
	title?: string;
	/** 「查看全部」按钮文字 */
	moreText: string;
}

export interface HomeConfig {
	/**
	 * 是否启用官网风格首页
	 * true ：首页展示板块卡片 / 统计 / 最新文章，文章列表位于 /posts/
	 * false：首页回退为文章列表（第一页），保持旧行为
	 */
	enable: boolean;
	/** Hero 区域按钮 */
	heroButtons: HomeHeroButton[];
	/** 板块入口卡片 */
	sectionCards: HomeSectionCardsConfig;
	/** 统计条 */
	stats: HomeStatsConfig;
	/** 最新文章 */
	latestPosts: HomeLatestPostsConfig;
}
