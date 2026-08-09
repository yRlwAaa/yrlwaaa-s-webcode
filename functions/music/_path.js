// functions/music/_path.js

export async function onRequest(context) {
  // 获取请求路径
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/music/', '');
  
  // 直接用公开 R2 URL
  const r2Url = `https://pub-d77dbb19357f4d6fb7e0269c8aef4ed7.r2.dev/${path}`;
  
  // 从 R2 获取文件
  const response = await fetch(r2Url);
  
  if (!response.ok) {
    return new Response('文件不存在', { status: 404 });
  }
  
  const filename = path.split('/').pop();
  
  return new Response(response.body, {
    headers: {
      'Content-Type': 'audio/flac',
      'Cache-Control': 'public, max-age=86400',
      'Content-Disposition': `attachment; filename="${filename}"`,
    }
  });
}