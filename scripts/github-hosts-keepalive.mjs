#!/usr/bin/env node
/**
 * GitHub 网页访问自愈脚本
 * ------------------------------------------------------------------
 * 背景: 本机 DNS 会把 github.com 解析到某个被封的节点(实测 20.205.243.166:443
 * 不通), 而 GitHub 其余节点是通的 —— 于是网页打不开, 但 git push(SSH) 正常。
 *
 * 这个脚本做四件事:
 *   1. 从 GitHub 官方 https://api.github.com/meta 取 web 服务的 /32 节点列表
 *      (该 API 在本机可正常访问, 所以这条路不依赖被污染的解析结果)
 *   2. 逐个做 TCP + TLS 握手(SNI=github.com), 挑出真正可用的节点
 *   3. 把最快的几个写进 hosts 的标记块里(不动你自己写的其它行)
 *   4. 刷新 DNS 缓存
 *
 * 用法:
 *   node scripts/github-hosts-keepalive.mjs            # 只检测并打印结果(不改文件)
 *   node scripts/github-hosts-keepalive.mjs --apply    # 真正写入 hosts(需管理员权限)
 *   node scripts/github-hosts-keepalive.mjs --apply --check   # 当前节点可用就直接退出, 不做改动
 *   node scripts/github-hosts-keepalive.mjs --remove   # 删掉本脚本写入的整块内容(改用代理后清理用)
 *
 * 想让它自动跑: 用任务计划程序定时以最高权限执行 --apply, 见 README 说明。
 *
 * 注意: 本机已安装 Clash Verge(混合端口 7897)。如果有可用节点, 开启代理 + 系统代理
 * 才是真正稳定的方案, 那种情况下建议用 --remove 撤掉这里的 hosts 改动, 免得排查网络时互相干扰。
 */
import { promises as fs } from "node:fs";
import https from "node:https";
import net from "node:net";
import tls from "node:tls";
import path from "node:path";
import { execFileSync } from "node:child_process";

const HOSTS_DEFAULT = path.join(process.env.SystemRoot || "C:\\Windows", "System32", "drivers", "etc", "hosts");
const BEGIN = "# >>> github-keepalive >>>";
const END = "# <<< github-keepalive <<<";
const TARGETS = ["github.com"]; // 需要钉住的域名
const KEEP = 3; // 保留几个可用 IP
const CONCURRENCY = 12;
const TIMEOUT = 4000;

// 兜底 IP(往期实测可用, 排在官方列表之后)
const FALLBACK = ["20.27.177.113", "20.200.245.247", "140.82.113.4", "140.82.112.4"];

const args = process.argv.slice(2);
const argSet = new Set(args);
const APPLY = argSet.has("--apply");
const ONLY_IF_BROKEN = argSet.has("--check");
const REMOVE = argSet.has("--remove");
// --hosts <路径>: 指定要改写的 hosts 文件(默认系统 hosts; 便于先拿副本试跑)
const hostsArgIdx = args.indexOf("--hosts");
const HOSTS = hostsArgIdx >= 0 && args[hostsArgIdx + 1] ? path.resolve(args[hostsArgIdx + 1]) : HOSTS_DEFAULT;

function log(msg) {
	console.log(msg);
}

function fetchJson(url) {
	return new Promise((resolve, reject) => {
		const req = https.get(url, { timeout: 15000, headers: { "User-Agent": "github-hosts-keepalive" } }, (res) => {
			let d = "";
			res.on("data", (c) => (d += c));
			res.on("end", () => {
				try {
					resolve(JSON.parse(d));
				} catch (e) {
					reject(new Error("响应不是 JSON"));
				}
			});
		});
		req.on("timeout", () => {
			req.destroy();
			reject(new Error("请求超时"));
		});
		req.on("error", reject);
	});
}

/** TCP 连得上 + 用 SNI=github.com 完成 TLS 握手(证书必须匹配), 返回耗时毫秒 */
function probe(ip, host) {
	return new Promise((resolve) => {
		const t0 = Date.now();
		const socket = net.connect({ host: ip, port: 443, family: 4 });
		let settled = false;
		const done = (r) => {
			if (settled) return;
			settled = true;
			try {
				socket.destroy();
			} catch {}
			resolve(r);
		};
		socket.setTimeout(TIMEOUT);
		socket.on("timeout", () => done(null));
		socket.on("error", () => done(null));
		socket.on("connect", () => {
			const tlsSock = tls.connect({ socket, servername: host, timeout: TIMEOUT }, () => {
				const ok = tlsSock.authorized;
				tlsSock.destroy();
				done(ok ? Date.now() - t0 : null);
			});
			tlsSock.on("timeout", () => {
				tlsSock.destroy();
				done(null);
			});
			tlsSock.on("error", () => done(null));
		});
	});
}

async function mapLimit(items, limit, fn) {
	const out = [];
	let i = 0;
	const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
		while (i < items.length) {
			const idx = i++;
			out[idx] = await fn(items[idx], idx);
		}
	});
	await Promise.all(workers);
	return out;
}

async function readHosts() {
	try {
		return await fs.readFile(HOSTS, "utf8");
	} catch (e) {
		return null;
	}
}

function currentBlock(hostsText) {
	if (!hostsText) return [];
	const lines = hostsText.split(/\r?\n/);
	const out = [];
	let inBlock = false;
	for (const line of lines) {
		if (line.includes(BEGIN)) {
			inBlock = true;
			continue;
		}
		if (line.includes(END)) break;
		if (inBlock) {
			const m = /^\s*(\d+\.\d+\.\d+\.\d+)\s+(\S+)/.exec(line);
			if (m) out.push({ ip: m[1], host: m[2] });
		}
	}
	return out;
}

function replaceBlock(hostsText, ips, when) {
	const kept = stripBlock(hostsText).split(/\r?\n/);
	while (kept.length && kept[kept.length - 1].trim() === "") kept.pop();
	const block = [BEGIN, "# 由 scripts/github-hosts-keepalive.mjs 自动维护, 勿手改(可整块删除)", "# 更新时间: " + when];
	for (const host of TARGETS) for (const ip of ips) block.push(ip + "\t" + host);
	block.push(END, "");
	return kept.join("\r\n") + "\r\n" + block.join("\r\n");
}

/** 去掉标记块, 其它行原样保留 */
function stripBlock(hostsText) {
	const lines = (hostsText || "").split(/\r?\n/);
	const kept = [];
	let skip = false;
	for (const line of lines) {
		if (line.includes(BEGIN)) {
			skip = true;
			continue;
		}
		if (line.includes(END)) {
			skip = false;
			continue;
		}
		if (!skip) kept.push(line);
	}
	return kept.join("\r\n");
}

(async () => {
	log("=== GitHub 网页访问自愈 ===  " + new Date().toLocaleString());

	// --remove: 只做清理
	if (REMOVE) {
		const text = await readHosts();
		if (text === null) {
			log("读不到 hosts: " + HOSTS);
			process.exitCode = 1;
			return;
		}
		if (!text.includes(BEGIN)) {
			log("hosts 里没有本脚本写入的内容, 无需清理。");
			return;
		}
		try {
			await fs.writeFile(HOSTS, stripBlock(text), "utf8");
			log("✅ 已移除 hosts 里由本脚本写入的整块内容");
			execFileSync("ipconfig", ["/flushdns"], { stdio: "ignore" });
			log("✅ 已刷新 DNS 缓存");
		} catch (e) {
			log("❌ 写入失败: " + e.message + "(需要管理员权限)");
			process.exitCode = 1;
		}
		return;
	}

	// 先看当前生效的 github.com 能不能用, 能用就不折腾
	let currentIp = null;
	try {
		const dns = await import("node:dns");
		const addrs = await dns.promises.resolve4("github.com");
		currentIp = addrs[0];
	} catch {}
	if (currentIp) {
		const ms = await probe(currentIp, "github.com");
		log("当前 github.com → " + currentIp + (ms ? "  ✅ 可用 " + ms + "ms" : "  ❌ 不可用"));
		if (ms && ONLY_IF_BROKEN) {
			log("已经通的, 不需要改。");
			return;
		}
	}

	// 1. 官方节点列表
	let candidates = [];
	try {
		const meta = await fetchJson("https://api.github.com/meta");
		for (const cidr of meta.web || []) {
			const m = /^(\d+\.\d+\.\d+\.\d+)\/32$/.exec(cidr);
			if (m) candidates.push(m[1]);
		}
		log("从官方 API 取到 " + candidates.length + " 个候选节点");
	} catch (e) {
		log("取官方列表失败(" + e.message + "), 用内置兜底 IP");
	}
	for (const ip of FALLBACK) if (!candidates.includes(ip)) candidates.push(ip);

	// 2. 实测握手
	log("正在实测 " + candidates.length + " 个节点的 443 端口(并发 " + CONCURRENCY + ")…");
	const results = await mapLimit(candidates, CONCURRENCY, async (ip) => ({ ip, ms: await probe(ip, "github.com") }));
	const good = results.filter((r) => r.ms).sort((a, b) => a.ms - b.ms);
	log("可用节点 " + good.length + " / " + candidates.length + (good.length ? " : " + good.slice(0, 6).map((g) => g.ip + "(" + g.ms + "ms)").join(", ") : ""));

	if (!good.length) {
		log("❌ 一个可用节点都没找到。可能是整体网络问题, 不是单纯换 IP 能解决的 —— 建议挂代理。");
		process.exitCode = 1;
		return;
	}

	const picked = good.slice(0, KEEP).map((g) => g.ip);
	const hostsText = await readHosts();
	if (hostsText === null) {
		log("读不到 hosts(路径 " + HOSTS + "), 下面是需要写入的内容:");
		for (const ip of picked) log("  " + ip + "  github.com");
		return;
	}
	const oldBlock = currentBlock(hostsText);
	const unchanged =
		oldBlock.length === TARGETS.length * picked.length &&
		oldBlock.every((b, i) => b.ip === picked[Math.floor(i / TARGETS.length)]);
	if (unchanged && !ONLY_IF_BROKEN) {
		log("hosts 里的记录已经是最优的, 无需改动。");
		return;
	}

	if (!APPLY) {
		log("\n[预演] 会把 hosts 的标记块写成(加 --apply 才真正写入):");
		for (const ip of picked) log("  " + ip + "\tgithub.com");
		log("[预演] hosts 路径: " + HOSTS);
		return;
	}

	try {
		const next = replaceBlock(hostsText, picked, new Date().toLocaleString());
		await fs.writeFile(HOSTS, next, "utf8");
		log("✅ 已更新 hosts");
	} catch (e) {
		log("❌ 写入 hosts 失败: " + e.message);
		log("   请用「以管理员身份运行」的终端再执行一次。");
		process.exitCode = 1;
		return;
	}
	try {
		execFileSync("ipconfig", ["/flushdns"], { stdio: "ignore" });
		log("✅ 已刷新 DNS 缓存");
	} catch {
		log("(刷新 DNS 缓存失败, 手动执行 ipconfig /flushdns 即可)");
	}
	log("现在浏览器直接访问 https://github.com 应该就通了。");
})();
