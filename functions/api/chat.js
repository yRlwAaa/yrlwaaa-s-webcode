import siteDataJson from '../site-data.js';

const siteDocs = JSON.parse(siteDataJson);
const SITE_URL = 'https://yrlwa.top';

// ---------- 简单关键词检索 ----------
function tokenize(q) {
  const clean = q.toLowerCase();
  const words = clean.match(/[a-z0-9]+/g) || [];
  const han = clean.match(/[\u4e00-\u9fff]+/g) || [];
  const grams = [];
  for (const seg of han) {
    for (let i = 0; i < seg.length - 1; i++) grams.push(seg.slice(i, i + 2));
  }
  return [...new Set([...words, ...grams])];
}

function searchDocs(query, topK = 3) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  return siteDocs
    .map((doc) => {
      const hay = `${doc.title} ${doc.description} ${doc.tags} ${doc.category} ${doc.content}`.toLowerCase();
      let score = 0;
      for (const t of tokens) {
        if (doc.title.toLowerCase().includes(t)) score += 5;
        if (doc.tags.toLowerCase().includes(t)) score += 3;
        if (doc.description.toLowerCase().includes(t)) score += 2;
        const hits = hay.match(new RegExp(t, 'g'));
        if (hits) score += Math.min(hits.length, 10);
      }
      return { doc, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((x) => x.doc);
}

function buildSystemPrompt(docs) {
  const contextText = docs.length
    ? docs.map((d, i) => `【${i + 1}】标题：${d.title}
链接：${SITE_URL}${d.url}
简介：${d.description}
正文摘录：${d.content.slice(0, 1200)}`).join('\n\n')
    : '（无相关内容）';

  return `你是 yRlwAaa 网站（${SITE_URL}）的全职 AI 助手，也是站长的私人助理。

网站内容检索结果（回答"网站里有什么/在哪/某章讲了什么"类问题时优先参考，并给出链接）：
${contextText}

规则：
1. 用自然、口语化的中文，像朋友聊天，不要机器人腔。
2. 引用网站文章时必须给出完整链接。
3. 检索内容里没有的，如实说不知道，不要瞎编。`;
}

// ---------- 主入口 ----------
export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { sessionId, message } = await request.json();
    if (!sessionId || !message) {
      return Response.json({ error: 'missing sessionId or message' }, { status: 400 });
    }

    // 读历史（最近 20 条）
    const historyRows = await env.DB.prepare(
      'SELECT role, content FROM messages WHERE session_id = ? ORDER BY id DESC LIMIT 20'
    ).bind(sessionId).all();
    const history = historyRows.results.reverse();

    // 检索网站内容
    const docs = searchDocs(message, 3);

    const messages = [
      { role: 'system', content: buildSystemPrompt(docs) },
      ...history,
      { role: 'user', content: message },
    ];

    const resp = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-v4-pro',
        messages,
        thinking: { type: 'disabled' },
        stream: true,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('DeepSeek API error:', resp.status, errText.slice(0, 300));
      return Response.json({ error: 'upstream error', detail: errText.slice(0, 200) }, { status: 502 });
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    const enc = new TextEncoder();
    let buffer = '';
    let fullText = '';

    const out = new ReadableStream({
      async start(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const payload = trimmed.slice(6).trim();
            if (payload === '[DONE]') continue;
            try {
              const json = JSON.parse(payload);
              const content = json.choices?.[0]?.delta?.content || '';
              if (content) {
                fullText += content;
                controller.enqueue(enc.encode(`data: ${JSON.stringify({ content })}\n\n`));
              }
            } catch (e) {}
          }
        }

        // 存库
        const now = Date.now();
        const exists = await env.DB.prepare('SELECT id FROM sessions WHERE id = ?').bind(sessionId).all();
        await env.DB.batch([
          env.DB.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)')
            .bind(sessionId, 'user', message, now),
          env.DB.prepare('INSERT INTO messages (session_id, role, content, created_at) VALUES (?, ?, ?, ?)')
            .bind(sessionId, 'assistant', fullText, now),
          exists.results.length
            ? env.DB.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').bind(now, sessionId)
            : env.DB.prepare('INSERT INTO sessions (id, title, created_at, updated_at) VALUES (?, ?, ?, ?)')
                .bind(sessionId, message.slice(0, 30), now, now),
        ]);

        controller.enqueue(enc.encode('data: [DONE]\n\n'));
        controller.close();
      },
    });

    return new Response(out, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('chat error:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}