/**
 * POST /api/inpaint —— AI 去水印代理
 * ------------------------------------------------------------------
 * 浏览器把「原图 + 遮罩」发到这里, 由本函数转发给 E5 上的修复服务
 * (IOPaint / LaMa), 再把结果原样返回。控制口令只存在 Cloudflare 的
 * 环境变量里, 不下发到浏览器。
 *
 * 需要在 Cloudflare Pages 后台配置的环境变量:
 *   E5_TOKEN  —— E5 控制口令(与站点其它控制操作同一个)
 *   E5_API    —— 可选, 默认 https://e5.yrlwa.top
 *
 * 请求: { image: "data:image/png;base64,...", mask: "data:image/png;base64,..." }
 * 应答: { ok: true, image: "data:image/png;base64,..." } 或 { ok: false, msg }
 */
const MAX_DATA_URL = 12 * 1024 * 1024; // 单张 dataURL 上限, 超过就让前端走本地修复

function json(data, status = 200) {
	return new Response(JSON.stringify(data), {
		status,
		headers: { "Content-Type": "application/json; charset=utf-8" },
	});
}

export async function onRequestPost(context) {
	const { request, env } = context;
	const base = (env.E5_API || "https://e5.yrlwa.top").replace(/\/+$/, "");
	const token = env.E5_TOKEN || "";

	let body;
	try {
		body = await request.json();
	} catch {
		return json({ ok: false, msg: "请求体不是合法 JSON" }, 400);
	}

	const image = body && body.image;
	const mask = body && body.mask;
	if (typeof image !== "string" || typeof mask !== "string") {
		return json({ ok: false, msg: "缺少 image 或 mask" }, 400);
	}
	if (image.length > MAX_DATA_URL || mask.length > MAX_DATA_URL) {
		return json(
			{ ok: false, msg: "图片太大, 请改用本地修复模式, 或先缩小尺寸" },
			413,
		);
	}

	// E5 上的 IOPaint 接口要纯 base64, 这里把 dataURL 前缀去掉
	const strip = (s) => s.replace(/^data:[^;]+;base64,/, "");

	try {
		const res = await fetch(base + "/api/inpaint", {
			method: "POST",
			headers: Object.assign(
				{ "Content-Type": "application/json" },
				token ? { "X-Token": token } : {},
			),
			body: JSON.stringify({ image: strip(image), mask: strip(mask) }),
		});
		const text = await res.text();
		let data;
		try {
			data = JSON.parse(text);
		} catch {
			return json(
				{ ok: false, msg: "E5 返回了非 JSON 内容(HTTP " + res.status + ")" },
				502,
			);
		}
		if (res.status === 401) {
			return json({ ok: false, msg: "口令错误: 请检查 E5_TOKEN 环境变量" }, 401);
		}
		return json(data, res.status);
	} catch (e) {
		return json(
			{
				ok: false,
				msg:
					"连不上 E5(" +
					(e && e.message ? e.message : e) +
					"): 可能关机或修复服务未启动",
			},
			502,
		);
	}
}

/** GET /api/inpaint —— 探活, 前端用它决定「AI 模式」是否可用 */
export async function onRequestGet(context) {
	const { env } = context;
	const base = (env.E5_API || "https://e5.yrlwa.top").replace(/\/+$/, "");
	try {
		const res = await fetch(base + "/api/stats", {
			headers: { "Cache-Control": "max-age=0" },
		});
		const d = await res.json().catch(() => ({}));
		const svc = (d && d.services && d.services.inpaint) || null;
		return json(
			{
				ok: !!(svc && svc.alive),
				alive: !!(svc && svc.alive),
				mode: d && d.mode,
			},
			200,
		);
	} catch {
		return json({ ok: false, alive: false, msg: "E5 不可达" }, 200);
	}
}
