/**
 * 足迹数据端点
 *
 * 地球页是纯静态页（没有后端），因此这里在构建期把 `footprints` 内容集合
 * 编译成一份 JSON 交给浏览器。前端只依赖这个结构，数据源换了不用改前端。
 *
 * 线上地址： /api/footprints.json
 */
import type { APIRoute } from "astro";

import { getFootprintsIndex } from "@utils/footprint-utils";

export const prerender = true;

export const GET: APIRoute = async () => {
	const index = await getFootprintsIndex();
	return new Response(JSON.stringify(index, null, 0), {
		status: 200,
		headers: {
			"Content-Type": "application/json; charset=utf-8",
			// 每次构建换一份数据，让 CDN 缓存 5 分钟即可
			"Cache-Control": "public, max-age=300",
		},
	});
};
