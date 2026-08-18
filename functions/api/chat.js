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

    // ---- 存用户消息 ----
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

    // ---- 站点检索 ----
    let siteContext = '';
    let siteOverview = '';
    try {
      const indexUrl = new URL('/site-index.json', request.url).toString();
      const res = await fetch(indexUrl, { headers: { 'Cache-Control': 'max-age=3600' } });
      if (res.ok) {
        const index = await res.json();
        siteOverview = `这是 yRlwAaa 的个人网站（yrlwa.top），共 ${index.length} 篇文章，主要栏目有：小说连载、博客教程、相册、音乐播放器、追番列表、友链、关于等。`;
        let hits = searchSite(index, message, 5);
        if (!hits.length) {
          hits = index.slice(0, 5); // 没匹配到就兜底给最近几篇，至少能介绍网站
        }
        siteContext = buildContext(hits);
      }
    } catch (e) {}

    const system =
      '你是 yRlwAaa 网站的 AI 助手。你的任务：帮助用户了解网站内容、总结文章、查找信息，也可以正常聊天和知识问答。\n' +
      '规则：\n' +
      '1. 优先依据下方【网站资料】回答，不得编造网站里没有的内容。\n' +
      '2. 如果用户问的是“网站里有什么 / 介绍网站”这类整体性问题，优先用网站概况 + 资料里的文章列表来介绍。\n' +
      '3. 资料不足时诚实说明“网站上没有找到相关信息”，不要瞎编链接。\n' +
      '4. 引用网站内容时尽量带上资料里的链接。\n' +
      `【网站概况】${siteOverview || '（无）'}`;

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

    // ---- 转发流式数据，同时攒完整回复存库 ----
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

// ==================== 中文检索（多层兜底） ====================

function splitWords(q) {
  return q.toLowerCase().split(/[\s,，。.!?！？、;；:：“”"'"（）()【】\[\]{}<>《》~·]+/).filter(w => w.length >= 2);
}

function bigrams(q) {
  const out = new Set();
  const clean = q.toLowerCase().replace(/[\s,，。.!?！？、;；:：“”"'"（）()【】\[\]{}<>《》~·]+/g, '');
  for (let i = 0; i < clean.length - 1; i++) {
    out.add(clean.slice(i, i + 2));
  }
  return [...out];
}

function scoreItem(item, terms, weight) {
  const hay = (
    (item.title || '') + ' ' +
    (item.category || '') + ' ' +
    (Array.isArray(item.tags) ? item.tags.join(' ') : '') + ' ' +
    (item.summary || '') + ' ' +
    (item.content || '').slice(0, 3000)
  ).toLowerCase();
  let score = 0;
  for (const t of terms) {
    let c = 0, pos = -1;
    while ((pos = hay.indexOf(t, pos + 1)) !== -1) c++;
    if (c > 0) score += c * weight;
  }
  return score;
}

function searchSite(index, query, limit = 5) {
  const q = (query || '').trim();
  if (!q || !index.length) return [];

  // 方案1：整句直接匹配标题/摘要
  const whole = index.filter(it =>
    ((it.title || '') + ' ' + (it.summary || '')).toLowerCase().includes(q.toLowerCase())
  );
  if (whole.length) return whole.slice(0, limit);

  // 方案2：拆词匹配（标题命中加权）
  const words = splitWords(q);
  if (words.length) {
    const scored = index
      .map(it => ({ it, s: scoreItem(it, words, 3) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);
    if (scored.length) return scored.slice(0, limit).map(x => x.it);
  }

  // 方案3：2字子串兜底（近似中文分词）
  const gs = bigrams(q);
  if (gs.length) {
    const scored = index
      .map(it => ({ it, s: scoreItem(it, gs, 1) }))
      .filter(x => x.s > 0)
      .sort((a, b) => b.s - a.s);
    if (scored.length) return scored.slice(0, limit).map(x => x.it);
  }

  // 方案4：全都没匹配 → 空数组，调用方用最近文章兜底
  return [];
}

function buildContext(items) {
  if (!items.length) return '';
  return items.map((it, i) =>
    `【资料${i + 1}】\n标题：${it.title}\n链接：${it.url}\n分类：${it.category || '无'}\n标签：${(it.tags || []).join('、') || '无'}\n摘要：${it.summary || ''}\n正文：${(it.content || '').slice(0, 1500)}\n`
  ).join('\n\n');
}