import type { TimelineItem } from "../components/features/timeline/types";

export const timelineData: TimelineItem[] = [
	{
		id: "my-birth",
		title: "我的出生",
		description:
			"没有我的出生，也就不会发生未来这些美好的故事啦。",
		type: "achievement",
		startDate: "2007-03-05",
		location: "Wenzhou",
		organization: "无",
		skills: ["精准投胎"],
		achievements: [
			"成为人类",
		],
		icon: "material-symbols:school",
		color: "#ffd452",
		featured: true,
	},
	{
		id: "primary-school",
		title: "小学时光",
		description:
			"小学六年也是不可磨灭的回忆呢。",
		type: "education",
		startDate: "2013-09-01",
		endDate: "2019-06-30",
		location: "Wenzhou",
		skills: ["Growing"],
		achievements: [
			"四年级加入航模社团",
			"2018年车模建筑模型比赛",
			"顺利毕业！",
		],
		icon: "material-symbols:school",
		color: "#7C3AED",
		featured: true,
	},
	{
		id: "bilibili-start",
		title: "创建b站账号",
		description:
			"我的自媒体时代的开端，正式成为up主。",
		type: "work",
		startDate: "2018-10-01",
		location: "Wenzhou",
		organization: "上海宽娱数码科技有限公司",
		position: "Frontend Development Intern",
		skills: ["剪辑", "Minecraft", "File management"],
		achievements: [
			"600fans get！",
			"50w+views",
		],
		links: [
			{
				name: "bilibili",
				url: "https://space.bilibili.com/381710006?spm_id_from=333.1007.0.0",
				type: "project",
			},
		],
		icon: "material-symbols:work",
		color: "#DC2626",
		featured: true,
	},
	{
		id: "web-development-course",
		title: "Completed Web Development Online Course",
		description:
			"Completed a full-stack web development online course, systematically learning frontend and backend development technologies.",
		type: "achievement",
		startDate: "2024-01-15",
		endDate: "2024-05-30",
		organization: "Mooc Website",
		skills: ["HTML", "CSS", "JavaScript", "Node.js", "Express"],
		achievements: [
			"Received course completion certificate",
			"Completed 5 practical projects",
			"Mastered full-stack development fundamentals",
		],
		links: [
			{
				name: "Course Certificate",
				url: "https://certificates.example.com/web-dev",
				type: "certificate",
			},
		],
		icon: "material-symbols:verified",
		color: "#059669",
	},
	{
		id: "student-management-system",
		title: "Student Management System Course Project",
		description:
			"Final project for the database course, developed a complete student information management system.",
		type: "project",
		startDate: "2023-11-01",
		endDate: "2023-12-15",
		skills: ["Java", "MySQL", "Swing", "JDBC"],
		achievements: [
			"Received excellent course project grade",
			"Implemented complete CRUD functionality",
			"Learned database design and optimization",
		],
		icon: "material-symbols:database",
		color: "#EA580C",
	},
	{
		id: "programming-contest",
		title: "University Programming Contest",
		description:
			"Participated in a programming contest held by the university, improving algorithm and programming skills.",
		type: "achievement",
		startDate: "2023-10-20",
		location: "Beijing Institute of Technology",
		organization: "School of Computer Science",
		skills: ["C++", "Algorithms", "Data Structures"],
		achievements: [
			"Won third prize in university contest",
			"Improved algorithmic thinking ability",
			"Strengthened programming fundamentals",
		],
		icon: "material-symbols:emoji-events",
		color: "#7C3AED",
	},
	{
		id: "part-time-tutor",
		title: "Part-time Programming Tutor",
		description:
			"Provided programming tutoring for high school students, helping them learn Python basics.",
		type: "work",
		startDate: "2023-09-01",
		endDate: "2024-01-31",
		position: "Programming Tutor",
		skills: ["Python", "Teaching", "Communication"],
		achievements: [
			"Helped 3 students master Python basics",
			"Improved expression and communication skills",
			"Gained teaching experience",
		],
		icon: "material-symbols:school",
		color: "#059669",
	},
	{
		id: "high-school-graduation",
		title: "High School Graduation",
		description:
			"Graduated from high school with excellent grades and was admitted to the Computer Science and Technology program at Beijing Institute of Technology.",
		type: "education",
		startDate: "2019-09-01",
		endDate: "2022-06-30",
		location: "Jinan, Shandong",
		organization: "No.1 High School of Jinan",
		achievements: [
			"College entrance exam score: 620",
			"Received municipal model student award",
			"Won provincial second prize in math competition",
		],
		icon: "material-symbols:school",
		color: "#2563EB",
	},
	{
		id: "first-programming-experience",
		title: "First Programming Experience",
		description:
			"First encountered programming in high school IT class, started learning Python basic syntax.",
		type: "education",
		startDate: "2021-03-01",
		skills: ["Python", "Basic Programming Concepts"],
		achievements: [
			'Completed first "Hello World" program',
			"Learned basic loops and conditional statements",
			"Developed interest in programming",
		],
		icon: "material-symbols:code",
		color: "#7C3AED",
	},
];
