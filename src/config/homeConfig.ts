import type { HomeConfig } from "../types/homeConfig";

// ============================================================================
// 官网风格首页配置
// 首页 Hero 文字（标题/打字机副标题）请在 backgroundWallpaper.common.homeText 中配置
// 文章列表页位于 /posts/（含分页 /posts/page/N），导航入口在 navBarConfig 的「文章」菜单
// ============================================================================
export const homeConfig: HomeConfig = {
	// 是否启用官网风格首页；关闭后首页回退为文章列表（第一页）
	enable: true,

	// Hero 区域按钮（全屏壁纸文字下方）
	heroButtons: [
		{
			name: "进入博客",
			url: "/posts/",
			icon: "material-symbols:article",
			primary: true,
		},
		{
			name: "关于我",
			url: "/about/",
			icon: "material-symbols:person",
		},
	],

	// 内容板块入口卡片
	sectionCards: {
		enable: true,
		title: "探索",
		subtitle: "这个网站里的各个角落",
		cards: [
			{
				name: "博客文章",
				description: "技术笔记与折腾记录",
				icon: "material-symbols:article",
				url: "/posts/",
			},
			{
				name: "动态",
				description: "碎碎念与日常记录",
				icon: "material-symbols:forum-rounded",
				url: "/dynamic/",
				pageKey: "dynamic",
			},
			{
				name: "相册",
				description: "镜头里的瞬间",
				icon: "material-symbols:photo-library",
				url: "/gallery/",
				pageKey: "gallery",
			},
			{
				name: "追番",
				description: "每个季度的番剧清单",
				icon: "material-symbols:live-tv",
				url: "/anime/",
				pageKey: "anime",
			},
			{
				name: "书签导航",
				description: "常逛的优质站点",
				icon: "material-symbols:bookmarks",
				url: "/booknav/",
				pageKey: "booknav",
			},
			{
				name: "友链",
				description: "隔壁的大佬们",
				icon: "material-symbols:link-2-rounded",
				url: "/friends/",
				pageKey: "friends",
			},
			{
				name: "留言板",
				description: "来聊两句吧",
				icon: "material-symbols:chat",
				url: "/guestbook/",
				pageKey: "guestbook",
			},
			{
				name: "关于我",
				description: "站在树下的人",
				icon: "material-symbols:info",
				url: "/about/",
			},
		],
	},

	// 统计条
	stats: {
		enable: true,
		showWords: true,
	},

	// 最新文章
	latestPosts: {
		enable: true,
		// 展示文章数量
		count: 4,
		// 「查看全部」按钮文字
		moreText: "查看全部",
	},
};
