export async function GET() {
  try {
    const res = await fetch("https://page.yrlwa666.workers.dev");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("stats worker 不可用，返回空统计:", err);
    return new Response(JSON.stringify({ pv: 0, today_pv: 0 }), {
      headers: { "Content-Type": "application/json" }
    });
  }
}