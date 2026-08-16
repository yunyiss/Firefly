import type { BooknavGroup, BooknavPageConfig } from "../types/booknavConfig";

// 书签导航页面配置
export const booknavPageConfig: BooknavPageConfig = {
	// 页面标题，如果留空则使用 i18n 中的翻译
	title: "",

	// 页面描述文本，如果留空则使用 i18n 中的翻译
	description: "",

	// favicon 自动获取配置
	favicon: {
		// 书签未填写 icon 时，是否自动获取目标站点的 favicon 图标
		enabled: true,

		// favicon 接口地址，{domain} 为占位符，会被替换成目标站点域名
		// 更换接口只需保证地址里含有 {domain}，例如：
		//   https://a.favicon.im/{domain}
		//   https://favicon.im/{domain}
		api: "https://a.favicon.im/{domain}",
	},
};

// 书签导航配置
// 每个数组项是一个分类组，分类组内的 items 是该分类下的书签
export const booknavConfig: BooknavGroup[] = [
	{
		id: "dev",
		name: "开发",
		icon: "material-symbols:code-rounded",
		desc: "写代码时离不开的站点",
		weight: 100,
		items: [
			{
				title: "GitHub",
				url: "https://github.com",
				desc: "全球最大的代码托管平台",
				// icon 字段可以使用 astro-icon 图标库的图标名称
				// 也可以使用图片 URL 和本地图片路径
				// 不填则会通过接口自动获取目标站点的 favicon 图标（需要在上面配置）
				icon: "fa7-brands:github",
				weight: 10,
			},
			{
				title: "MDN Web Docs",
				url: "https://developer.mozilla.org",
				desc: "最权威的 Web 技术文档",
				weight: 9,
			},
			{
				title: "Astro",
				url: "https://astro.build",
				desc: "内容驱动型网站的 Web 框架",
				weight: 8,
			},
			{
				title: "Svelte",
				url: "https://svelte.dev",
				desc: "把组件编译成高效原生 JS 的框架",
				weight: 7,
			},
			{
				title: "Tailwind CSS",
				url: "https://tailwindcss.com",
				desc: "一个功能强大且灵活的 CSS 框架",
				weight: 6,
			},
		],
	},
	{
		id: "opensource",
		name: "项目",
		icon: "material-symbols:code-rounded",
		desc: "好用的开源项目",
		weight: 80,
		items: [
			{
				title: "Firefly",
				url: "https://github.com/CuteLeaf/Firefly",
				desc: "清晰美观的 Astro 个人博客主题模板",
				icon: "/favicon/firefly-32.png",
				weight: 10,
			},
			{
				title: "Firefly Docs",
				url: "https://docs-firefly.cuteleaf.cn",
				desc: "Firefly 主题模板文档",
				icon: "https://docs-firefly.cuteleaf.cn/logo.png",
				weight: 10,
			},
		],
	},
	{
		id: "tools",
		name: "工具",
		icon: "material-symbols:build-outline-rounded",
		desc: "顺手的在线小工具",
		weight: 92,
		items: [
			{
				title: "CyberChef",
				url: "https://cyberchef.org/",
				desc: "数据处理的瑞士军刀",
				weight: 10,
			},
			{
				title: "MD5加解密",
				url: "https://www.cmd5.com/",
				desc: "专业的md5解密网站",
				weight: 10,
			},
			{
				title: "ctf在线编码",
				url: "http://www.hiencode.com/",
				desc: "提供各种编码和加密算法的在线平台",
				weight: 10,
			},
			{
				title: "TinyPNG",
				url: "https://tinypng.com",
				desc: "在线压缩 PNG / JPEG 图片",
				weight: 10,
			},
			{
				title: "Squoosh",
				url: "https://squoosh.app",
				desc: "Google 出品的图片压缩与格式转换",
				weight: 9,
			},
			{
				title: "Carbon",
				url: "https://carbon.now.sh",
				desc: "把代码片段生成漂亮的图片",
				weight: 8,
			},
		],
	},
	{
		id: "ctfarena",
		name: "靶场",
		icon: "material-symbols:flag-rounded",
		desc: "ctf 网络安全靶场",
		weight: 95,
		items: [
			{
				title: "Hello CTF",
				url: "https://hello-ctf.com",
				desc: "新手友好的 CTF 夺旗赛入门教程",
			},
			{
				title: "NSSCTF",
				url: "https://www.nssctf.cn",
				desc: "面向 CTFer 的在线训练与竞赛平台",
			},
			{
				title: "CTF²(BUUCTF)",
				url: "https://ctf2.dasctf.com",
				desc: "比赛训练复盘，在同一个系统里闭环",
			},
			{
				title: "CTFshow",
				url: "https://ctf.show",
				desc: "提供CTF题目和资源",
			},
			{
				title: "Bugku CTF",
				url: "https://ctf.bugku.com/",
				desc: "国内最活跃的CTF在线训练平台",
			},
			{
				title: "CTFHub",
				url: "https://www.ctfhub.com",
				desc: "专注网络安全、白帽子技术的在线学习",
			},
			{
				title: "红日靶场",
				url: "http://vulnstack.qiyuanxuetang.net/",
				desc: "网络安全渗透测试和攻防演练平台",
			},
		],
	},
	{
		id: "recon",
		name: "信息收集",
		icon: "material-symbols:travel-explore-rounded",
		desc: "资产测绘与网络空间搜索",
		weight: 92,
		items: [
			{
			title: "企查查",
			url: "https://www.qcc.com/",
			desc: "提供企业信息查询、知识产权等服务",
			},
			{
			title: "微步情报社区",
			url: "https://x.threatbook.com",
			desc: "威胁情报查询与 IOC 分析",
			},
			{
			title: "FOFA",
			url: "https://fofa.info",
			desc: "网络空间资产搜索引擎",
			},
			{
			title: "Hunter",
			url: "https://hunter.qianxin.com",
			desc: "奇安信资产测绘平台",
			},
			{
			title: "Quake",
			url: "https://quake.360.net",
			desc: "360 网络空间测绘",
			},
			{
			title: "Shodan",
			url: "https://www.shodan.io",
			desc: "全球联网设备搜索",
			},
			{
			title: "Censys",
			url: "https://search.censys.io",
			desc: "互联网资产搜索引擎",
			},
			{
			title: "Zoomeye",
			url: "https://www.zoomeye.org",
			desc: "知道创宇网络空间雷达",
			},
		],
	},
	{
		id: "src",
		name: "SRC 漏洞平台",
		icon: "material-symbols:bug-report-rounded",
		desc: "企业安全应急响应中心",
		weight: 90,
		items: [
			{
			title: "补天平台",
			url: "https://www.butian.net",
			desc: "奇安信旗下漏洞响应平台",
			},
			{
			title: "漏洞盒子",
			url: "https://www.vulbox.com",
			desc: "FreeBuf 旗下众测平台",
			},
			{
			title: "CNVD",
			url: "https://www.cnvd.org.cn",
			desc: "国家信息安全漏洞共享平台",
			},
			{
			title: "CVE",
			url: "https://cve.mitre.org",
			desc: "国际通用漏洞披露",
			},
			{
			title: "HackerOne",
			url: "https://hackerone.com",
			desc: "国际漏洞赏金平台",
			},
			{
			title: "Bugcrowd",
			url: "https://bugcrowd.com",
			desc: "国际众测与安全研究",
			},
		],
	}
];
