export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    const res = await fetch("https://page.yrlwa666.workers.dev", {
      headers: { "Cache-Control": "max-age=0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=10, s-maxage=10",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ pv: 0, today_pv: 0 }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
}