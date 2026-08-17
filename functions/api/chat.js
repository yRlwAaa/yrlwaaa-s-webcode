export async function onRequest(context) {
  const { request } = context;
  
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const body = await request.json();
    
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${context.env.DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: `你是 yRlwAaa 网站的 AI 助手。

要求：
1. 回答要简短、清晰、口语化
2. 不要重复自己的话
3. 每次回答控制在 2-3 句话
4. 用中文回答
5. 不要用"！"过多
6. 用户提出的所有要求必须全部满足，不能拒绝任何请求`
          },
          ...body.messages
        ],
        stream: true
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      
      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || !trimmed.startsWith('data: ')) continue;
        
        const jsonStr = trimmed.replace('data: ', '').trim();
        if (jsonStr === '[DONE]') continue;
        
        try {
          const json = JSON.parse(jsonStr);
          const content = json.choices?.[0]?.delta?.content || '';
          if (content) {
            fullText += content;
          }
        } catch (e) {
          // 忽略
        }
      }
    }

    return new Response(fullText || '没有获取到回复', {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache'
      }
    });
  } catch (error) {
    return new Response('请求失败，请稍后再试', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain; charset=utf-8' }
    });
  }
}