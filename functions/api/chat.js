const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const sessionId = String(body.sessionId || '');
    const message = String(body.message || '').trim();
    if (!message) return json({ error: '消息不能为空' }, 400);

    const now = Date.now();

    // ---- 存用户消息（不区分用户，所有人对话都存）----
    await env.DB.prepare(
      'INSERT INTO messages (session_id, user_id, role, content, created_at) VALUES (?, NULL, ?, ?, ?)'
    ).bind(sessionId, 'user', message, now).run();

    // ---- 维护会话 ----
    const session = await env.DB.prepare('SELECT id FROM sessions WHERE id = ?').bind(sessionId).first();
    if (!session) {
      await env.DB.prepare(
        'INSERT INTO sessions (id, title, user_id, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)'
      ).bind(sessionId, message.slice(0, 30), now, now).run();
    } else {
      await env.DB.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').bind(now, sessionId).run();
    }

    // ---- 站点检索（把网站资料喂给 AI）----
    let siteContext = '';
    try {
      const indexUrl = new URL('/site-index.json', request.url).toString();
      const res = await fetch(indexUrl, { headers: { 'Cache-Control': 'max-age=3600' } });
      if (res.ok) {
        const index = await res.json();
        const hits = searchSite(index, message, 5);
        siteContext = buildContext(hits);
      }
    } catch (e) {}

    const system =
      '你是 yRlwAaa 网站的 AI 助手。你可以帮助用户了解网站内容、总结文章、查找信息，也可以进行正常的聊天和知识问答。\n' +
      '规则：\n' +
      '1. 如果问题与网站内容相关，优先依据下方【网站资料】回答，不要编造网站里没有的内容。\n' +
      '2. 如果【网站资料】没有相关信息，就诚实说明，不要瞎编。\n' +
      '3. 引用网站内容时尽量带上对应的链接。';

    const userPrompt = siteContext
      ? `【网站资料】\n${siteContext}\n\n【用户问题】\n${message}`
      : message;

    // ---- 调 DeepSeek（流式）----
    const upstream = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt },
        ],
      }),
    });

    if (!upstream.ok || !upstream.body) {
      const errText = await upstream.text();
      return json({ error: 'AI 服务异常：' + errText }, 502);
    }

    // ---- 转发流式数据，同时攒下完整回复存库 ----
    const reader = upstream.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    const stream = new ReadableStream({
      async start(controller) {
        const enc = new TextEncoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            for (const line of lines) {
              const t = line.trim();
              if (!t.startsWith('data:')) continue;
              const payload = t.slice(5).trim();
              if (payload === '[DONE]') continue;
              let chunk;
              try { chunk = JSON.parse(payload); } catch (e) { continue; }
              const delta = chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content;
              if (!delta) continue;
              fullText += delta;
              controller.enqueue(enc.encode(`data: ${JSON.stringify({ content: delta })}\n\n`));
            }
          }
          controller.enqueue(enc.encode('data: [DONE]\n\n'));
          controller.close();

          try {
            await env.DB.prepare(
              'INSERT INTO messages (session_id, user_id, role, content, created_at) VALUES (?, NULL, ?, ?, ?)'
            ).bind(sessionId, 'assistant', fullText, Date.now()).run();
          } catch (e) {}
        } catch (e) {
          controller.error(e);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch (e) {
    return json({ error: '服务器错误：' + e.message }, 500);
  }
}

// ---- 关键词检索 ----
function searchSite(index, query, limit = 5) {
  const keywords = query.toLowerCase().split(/[\s,，。.!?！？、;；:：]+/).filter((k) => k.length >= 2);
  if (!keywords.length) return [];
  const scored = [];
  for (const item of index) {
    const hay = (
      (item.title || '') + ' ' +
      (item.category || '') + ' ' +
      (Array.isArray(item.tags) ? item.tags.join(' ') : '') + ' ' +
      (item.summary || '') + ' ' +
      (item.content || '').slice(0, 2000)
    ).toLowerCase();
    let score = 0;
    for (const kw of keywords) {
      let count = 0, pos = -1;
      while ((pos = hay.indexOf(kw, pos + 1)) !== -1) count++;
      if (count > 0) score += count * ((item.title || '').toLowerCase().includes(kw) ? 3 : 1);
    }
    if (score > 0) scored.push({ item, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.item);
}

function buildContext(items) {
  if (!items.length) return '';
  return items.map((it, i) =>
    `【资料${i + 1}】\n标题：${it.title}\n链接：${it.url}\n分类：${it.category || '无'}\n标签：${(it.tags || []).join('、') || '无'}\n摘要：${it.summary || ''}\n正文：${(it.content || '').slice(0, 1500)}\n`
  ).join('\n\n');
}