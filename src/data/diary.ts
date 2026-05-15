// 日记数据配置
// 用于管理日记页面的数据

export interface DiaryItem {
	id: number;
	content: string;
	date: string;
	images?: string[];
	location?: string;
	mood?: string;
	tags?: string[];
}

// 示例日记数据
const diaryData: DiaryItem[] = [
	{
		id: 1,
		content:
			"2025.5.5 X粉丝达到100！！！",
		date: "2026-05-05T16:40:00Z",
		images: ["/images/diary/2026-5-5/微信图片_20260506124340_502_110.jpg", "/images/diary/2026-5-5/微信图片_20260506124342_503_110.jpg", "/images/diary/2026-5-5/微信图片_20260506124952_505_110.jpg", "/images/diary/2026-5-5/微信图片_20260506124344_504_110.jpg"],
	},
	{
		id: 2,
		content:
			"2026.5.7 修复了网站主页图片显示问题和音乐api调用问题。",
		date: "2026-05-07T18:00:00Z",
		images: ["/images/diary/2026-5-7/1.png","/images/diary/2026-5-7/2.jpg"],
	},
	{
		id: 3,
		content:
			"2026.5.8 添加了主页显示访问人数的功能，分为总访问人数与今日访问。",
		date: "2026-05-08T14:00:00Z",
		images: ["/images/diary/2026-5-8/1.png","/images/diary/2026-5-8/2.png"],
	},
	{
		id: 4,
		content:
			"2026.5.14 X粉丝达到200！！！",
		date: "2026-05-14T14:00:00Z",
		images: ["/images/diary/2026-5-14/1.jpg","/images/diary/2026-5-14/2.jpg","/images/diary/2026-5-14/3.jpg","/images/diary/2026-5-14/4.jpg"],
	}
];

// 获取日记列表（按时间倒序）
export const getDiaryList = (limit?: number) => {
	const sortedData = [...diaryData].sort(
		(a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
	);

	if (limit && limit > 0) {
		return sortedData.slice(0, limit);
	}

	return sortedData;
};

// 获取所有标签
export const getAllTags = () => {
	const tags = new Set<string>();
	diaryData.forEach((item) => {
		if (item.tags) {
			item.tags.forEach((tag) => tags.add(tag));
		}
	});
	return Array.from(tags).sort();
};
