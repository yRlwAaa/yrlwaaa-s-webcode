// 构建期抓取天气(CI 在海外, 访问 Open-Meteo 稳定), 生成同源静态 JSON
// 页面只读 /weather-data.json, 不再让访客浏览器去请求国外接口
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";

const CITIES = [
	{ city: "北京", lat: 39.9075, lon: 116.3972 },
	{ city: "上海", lat: 31.2304, lon: 121.4737 },
	{ city: "广州", lat: 23.1291, lon: 113.2644 },
	{ city: "西安", lat: 34.3416, lon: 108.9398 },
];

const OUT = "public/weather-data.json";

function url(lat, lon) {
	return (
		`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
		`&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min` +
		`&hourly=relativehumidity_2m&timezone=auto&forecast_days=7`
	);
}

async function main() {
	const out = { generatedAt: new Date().toISOString(), cities: {} };
	for (const c of CITIES) {
		try {
			const res = await fetch(url(c.lat, c.lon), {
				headers: { "User-Agent": "yrlwa-weather-builder/1.0" },
			});
			if (!res.ok) throw new Error("HTTP " + res.status);
			out.cities[c.city] = { lat: c.lat, lon: c.lon, data: await res.json() };
			console.log("[weather] ok:", c.city);
		} catch (e) {
			console.warn("[weather] fail:", c.city, String(e).slice(0, 120));
		}
	}
	mkdirSync(dirname(OUT), { recursive: true });
	writeFileSync(OUT, JSON.stringify(out), "utf8");
	console.log("[weather] written", OUT, "cities:", Object.keys(out.cities).join(","));
}

main().catch((e) => {
	console.warn("[weather] skipped:", String(e).slice(0, 200));
	process.exit(0); // 天气失败不影响构建
});
