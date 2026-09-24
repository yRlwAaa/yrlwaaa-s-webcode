#!/usr/bin/env node
/**
 * 时间线同步工具
 * ------------------------------------------------------------------
 * 「网页构建」时间线的唯一数据源是 src/data/project-timeline.ts 里的 webBuildSteps，
 * 页面上的 build 分类条目由它自动派生（见同文件末尾的 webBuildTimeline）。
 * 所以新增一条功能记录，只需要往 webBuildSteps 顶部插一个对象。
 *
 * 用法：
 *   node scripts/timeline-sync.mjs add --title "在线播放器 Folia" --category music \
 *        --summary "音乐页多了个入口，点进去是全屏播放器" [--date 2026-09-24] [--highlight] [--id folia-player]
 *
 *   node scripts/timeline-sync.mjs check
 *       列出「最近有功能提交、但时间线可能还没跟上」的提交，只提示不报错。
 *
 * 设计取舍：check 永远不会以非 0 退出，也**没有**挂进 npm run build。
 * 线上构建链路（Cloudflare Pages）不该为了一个提醒功能而承担构建失败的风险。
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// 本文件位于 scripts/，仓库根在上一级
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TIMELINE_FILE = resolve(ROOT, "src/data/project-timeline.ts");
const CATEGORY_FILE = resolve(
	ROOT,
	"src/components/features/timeline/project-categories.ts",
);

/** 这些路径下的改动算「功能变更」，值得提醒补时间线 */
const FEATURE_PATHS = [
	"src/pages/",
	"src/components/",
	"src/data/",
	"src/services/",
	"functions/",
	"public/js/",
	"scripts/",
	"astro.config.mjs",
];

/** 时间线自身与纯样式/文案文件不算功能变更，避免自己提醒自己 */
const IGNORED_PATHS = [
	"src/data/project-timeline.ts",
	"src/data/timeline.ts",
	"src/i18n/",
];

/** 从 project-categories.ts 读出允许的分类 id，避免这里再维护一份 */
function readCategories() {
	const source = readFileSync(CATEGORY_FILE, "utf8");
	return [...source.matchAll(/id:\s*"([a-z0-9-]+)"/g)].map((m) => m[1]);
}

/** 解析形如 `--key value` / `--flag` 的参数 */
function parseArgs(argv) {
	const args = { _: [] };
	for (let i = 0; i < argv.length; i++) {
		const token = argv[i];
		if (token.startsWith("--")) {
			const key = token.slice(2);
			const next = argv[i + 1];
			if (next === undefined || next.startsWith("--")) {
				args[key] = true;
			} else {
				args[key] = next;
				i++;
			}
		} else {
			args._.push(token);
		}
	}
	return args;
}

/** 把中文标题转成可读的 slug；纯中文时退化成时间戳后缀 */
function toSlug(input) {
	const ascii = String(input)
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return ascii || `step-${Date.now().toString(36)}`;
}

function today() {
	const now = new Date();
	const pad = (n) => String(n).padStart(2, "0");
	return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

function readTimelineSource() {
	if (!existsSync(TIMELINE_FILE)) {
		throw new Error(`找不到时间线数据文件：${TIMELINE_FILE}`);
	}
	return readFileSync(TIMELINE_FILE, "utf8");
}

/** add：把一个新条目插到 webBuildSteps 数组最前面 */
function addEntry(args) {
	const title = typeof args.title === "string" ? args.title.trim() : "";
	const summary = typeof args.summary === "string" ? args.summary.trim() : "";
	const category =
		typeof args.category === "string" ? args.category.trim() : "";

	if (!title || !summary || !category) {
		console.error(
			'缺少参数。用法：node scripts/timeline-sync.mjs add --title "..." --category music --summary "..."',
		);
		process.exitCode = 1;
		return;
	}

	const categories = readCategories();
	if (!categories.includes(category)) {
		console.error(
			`分类 "${category}" 不存在。可用分类：${categories.join(" / ")}`,
		);
		process.exitCode = 1;
		return;
	}

	const date = typeof args.date === "string" ? args.date : today();
	if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
		console.error(`日期格式应为 YYYY-MM-DD，收到："${date}"`);
		process.exitCode = 1;
		return;
	}

	const source = readTimelineSource();
	const id = typeof args.id === "string" ? args.id : toSlug(title);

	if (new RegExp(`id:\\s*"${id}"`).test(source)) {
		console.error(`id "${id}" 已存在，换一个 --id 或先删掉旧条目。`);
		process.exitCode = 1;
		return;
	}

	// 与文件既有风格保持一致：制表符缩进、summary 换行写值
	const lines = [
		"\t{",
		`\t\tid: ${JSON.stringify(id)},`,
		`\t\ttitle: ${JSON.stringify(title)},`,
		`\t\tcategory: ${JSON.stringify(category)},`,
		`\t\tdate: ${JSON.stringify(date)},`,
		"\t\tsummary:",
		`\t\t\t${JSON.stringify(summary)},`,
	];
	if (args.highlight) {
		lines.push("\t\thighlight: true,");
	}
	lines.push("\t},");
	const block = lines.join("\n");

	const anchor = "export const webBuildSteps: ProjectTimelineItem[] = [";
	const at = source.indexOf(anchor);
	if (at === -1) {
		console.error("没找到 webBuildSteps 数组开头，文件结构可能变了。");
		process.exitCode = 1;
		return;
	}

	const insertAt = at + anchor.length;
	const next = `${source.slice(0, insertAt)}\n${block}${source.slice(insertAt)}`;
	writeFileSync(TIMELINE_FILE, next, "utf8");

	console.log(`已写入 ${date} / ${category} / ${title}`);
	console.log(`  id: ${id}`);
	console.log(
		"记得跑一次 prettier：npx prettier --write src/data/project-timeline.ts",
	);
}

/** check：找出「动过功能代码但时间线可能没跟上」的提交，只提示 */
function check() {
	try {
		const source = readTimelineSource();
		const dates = [
			...source.matchAll(/date:\s*"(\d{4}-\d{2}-\d{2})"/g),
		].map((m) => m[1]);
		if (dates.length === 0) {
			console.log("[timeline] 时间线里还没有任何日期，无法比对。");
			return;
		}
		const newest = dates.sort().at(-1);

		const raw = execFileSync(
			"git",
			[
				"log",
				`--since=${newest} 23:59:59`,
				"--date=short",
				"--name-only",
				"--pretty=format:@@%h %ad %s",
			],
			{
				cwd: ROOT,
				encoding: "utf8",
				stdio: ["ignore", "pipe", "ignore"],
			},
		);

		const commits = [];
		let current = null;
		for (const line of raw.split("\n")) {
			if (line.startsWith("@@")) {
				current = { header: line.slice(2), files: [] };
				commits.push(current);
			} else if (line.trim() && current) {
				current.files.push(line.trim().replace(/\\/g, "/"));
			}
		}

		const pending = commits.filter((c) =>
			c.files.some(
				(f) =>
					FEATURE_PATHS.some((p) => f.startsWith(p)) &&
					!IGNORED_PATHS.some((p) => f.startsWith(p)),
			),
		);

		if (pending.length === 0) {
			console.log(`[timeline] 最新记录 ${newest} 之后没有新的功能提交。`);
			return;
		}

		console.log(
			`[timeline] 最新记录是 ${newest}，之后有 ${pending.length} 个功能提交可能还没进时间线：`,
		);
		for (const c of pending.slice(0, 15)) {
			console.log(`  - ${c.header}`);
		}
		if (pending.length > 15) {
			console.log(`  ...还有 ${pending.length - 15} 个`);
		}
		console.log(
			'  补一条：node scripts/timeline-sync.mjs add --title "..." --category <分类> --summary "..."',
		);
	} catch (error) {
		// git 不可用、不是 git 仓库、沙箱限制……都只提示，不阻断
		console.log(`[timeline] 跳过检查：${error.message}`);
	}
}

const args = parseArgs(process.argv.slice(2));
const mode = args._[0] || "check";

if (mode === "add") {
	addEntry(args);
} else if (mode === "check") {
	check();
} else {
	console.error(`未知子命令 "${mode}"，可用：add / check`);
	process.exitCode = 1;
}
