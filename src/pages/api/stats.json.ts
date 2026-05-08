export async function GET() {
  const res = await fetch("https://page.yrlwa666.workers.dev");
  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: { "Content-Type": "application/json" }
  });
}