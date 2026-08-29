import type { HomeConfig } from "../types/homeConfig";

// ============================================================================
// 官网风格首页配置
// Hero 主标题/打字机副标题请在 backgroundWallpaper.common.homeText 中配置
// 文章列表页位于 /posts/（含分页 /posts/page/N），导航入口在 navBarConfig 的「文章」菜单
// ============================================================================
export const homeConfig: HomeConfig = {
	// 是否启用官网风格首页；关闭后首页回退为文章列表（第一页）
	enable: true,

	// Hero 构图与装饰（左对齐构图参考 lxya.net）
	hero: {
		// "left" 左对齐大标题构图；"center" 居中构图（原版）
		layout: "left",
		// 左对齐构图标题字号（不填则桌面端默认 5.5rem，居中构图沿用壁纸配置的 titleSize）
		// titleSize: "5.5rem",
		// 身份标签（显示在标题下方，按需自行增删）
		tags: [
			{
				name: "ACGN 爱好者",
				icon: "material-symbols:favorite",
			},
			{
				name: "技术宅",
				icon: "material-symbols:terminal",
			},
			{
				name: "躺平大师",
				icon: "material-symbols:airline-seat-individual-suite",
			},
		],
		// 右侧竖排装饰文字
		verticalText: "虚数之树",
		// 右下角斜置欢迎玻璃卡
		badge: {
			enable: true,
			title: "未白 ?",
			text: "WELCOME TO MY BLOG, ENJOY YOUR STAY!",
		},
	},

	// 实时时钟卡
	clock: {
		enable: true,
	},

	// 主页公告横条卡（内容请在 announcementConfig 中配置）
	announcement: {
		enable: true,
	},

	// 主页音乐播放卡（与导航栏播放器共用状态；歌单在 musicConfig 中配置）
	music: {
		enable: true,
	},

	// 主页个人资料卡（与音乐卡并排；内容请在 profileConfig 中配置）
	profile: {
		enable: true,
	},

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

	// 统计卡
	stats: {
		enable: true,
		showWords: true,
	},

	// 最新文章（杂志式列表）
	latestPosts: {
		enable: true,
		// 展示文章数量
		count: 4,
		// 是否显示小封面
		showCover: true,
		// 「查看全部」按钮文字
		moreText: "查看全部",
	},
};
