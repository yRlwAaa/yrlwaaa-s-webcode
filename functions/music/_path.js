// functions/music/_path.js

export async function onRequest(context) {
  // 获取请求路径
  const url = new URL(context.request.url);
  const path = url.pathname.replace('/music/', '');
  
  // 你的账号 ID
  const accountId = '975ca95c89248f0b5305055e36bec32c';
  const bucketName = 'music-storage';
  
  // 从 R2 获取文件
  const r2Url = `https://${accountId}.r2.cloudflarestorage.com/${bucketName}/audio/${path}`;
  
  // 需要认证
  const response = await fetch(r2Url, {
    headers: {
      'Authorization': `Bearer ${context.env.R2_TOKEN}`
    }
  });
  
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