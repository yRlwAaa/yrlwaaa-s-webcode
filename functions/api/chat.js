const DEEPSEEK_API = 'https://api.deepseek.com/chat/completions';
const EMBEDDING_API = 'https://api.siliconflow.cn/v1/embeddings';
const QUERY_PREFIX = '为这个句子生成表示以用于检索相关文章：';
const TOP_N = 5;
const MAX_CONTEXT = 3000;
const ALL_CONTEXT = 1200;

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isOverviewQuestion(q) {
  return /(全部|每章|每篇|所有文章|所有内容|全部章节|全站|都概括|每章内容|每篇内容|概括一下|介绍.*网站|网站.*介绍|全部文章|列.*所有|全部内容|有什么|有哪些|收.?入了什么|都是什么)/.test(q);
}

async function embedQuery(env, text) {
  if (!env.EMBEDDING_API_KEY) throw new Error('EMBEDDING_API_KEY 未配置');
  const res = await fetch(EMBEDDING_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${env.EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({ model: 'BAAI/bge-m3', input: QUERY_PREFIX + text, encoding_format: 'float' }),
  });
  if (!res.ok) throw new Error('embedding HTTP ' + res.status);
  const data = await res.json();
  return data.data[0].embedding;
}

function cosine(a, b) {
  let dot = 0, na = 0, nb = 0;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const sessionId = String(body.sessionId || '');
    const message = String(body.message || '').trim();
    if (!message) return json({ error: '消息不能为空' }, 400);

    const now = Date.now();

    await env.DB.prepare(
      'INSERT INTO messages (session_id, user_id, role, content, created_at) VALUES (?, NULL, ?, ?, ?)'
    ).bind(sessionId, 'user', message, now).run();

    const session = await env.DB.prepare('SELECT id FROM sessions WHERE id = ?').bind(sessionId).first();
    if (!session) {
      await env.DB.prepare(
        'INSERT INTO sessions (id, title, user_id, created_at, updated_at) VALUES (?, ?, NULL, ?, ?)'
      ).bind(sessionId, message.slice(0, 30), now, now).run();
    } else {
      await env.DB.prepare('UPDATE sessions SET updated_at = ? WHERE id = ?').bind(now, sessionId).run();
    }

    // ---- 拉取站点索引 + 站点指南 ----
    let index = [];
    let guide = { sections: [] };
    try {
      const idxUrl = new URL('/site-index.json', request.url).toString();
      const res = await fetch(idxUrl, { headers: { 'Cache-Control': 'max-age=3600' } });
      if (res.ok) index = await res.json();
    } catch (e) {}
    try {
      const gUrl = new URL('/site-guide.json', request.url).toString();
      const res = await fetch(gUrl, { headers: { 'Cache-Control': 'max-age=3600' } });
      if (res.ok) guide = await res.json();
    } catch (e) {}
    if (!Array.isArray(guide.sections)) guide.sections = [];

    const inventory = buildInventory(index);
    const guideText = buildGuideText(guide);

    // ---- 决定喂哪些内容 ----
    let context;
    if (isOverviewQuestion(message) && index.length) {
      context = buildContext(index, ALL_CONTEXT);
    } else {
      let hits = null;
      try {
        const qv = await embedQuery(env, message);
        hits = semanticSearch(index, qv, TOP_N);
      } catch (e) {}
      if (!hits || !hits.length) hits = searchSite(index, message, TOP_N);
      context = buildContext(hits.length ? hits : index.slice(0, TOP_N), MAX_CONTEXT);
    }

    const siteOverview = index.length
      ? `这是 yRlwAaa 的个人网站（yrlwa.top）。网站除文章外，还有相册、音乐、追番、词典、友链等多个板块，详见【全站板块】。`
      : '（暂未获取到站点索引）';

    const system =
      '你是 yRlwAaa 网站的 AI 助手。你对这个网站了如指掌——它的文章、小说、音乐、追番、相册、词典你都清楚。\n' +
      '回答要求：\n' +
      '1. 像懂这个网站的朋友一样说话，自然、有条理、有重点，不要机械地罗列清单，不要每句都堆链接。\n' +
      '2. 先理解再回答：介绍内容时用自己的话总结，而不是照抄资料。\n' +
      '3. 涉及具体文章/音乐/追番时，基于下方资料回答；资料里确实没有的，诚实说没有，但不故意装傻。\n' +
      '4. 给链接时用资料里的真实链接（形如 /posts/xxx/ 或 /music/），自然地附在相关文字后面，不要单独开一段刷链接。\n' +
      '5. 语气友好、有温度，可以适当用表情，但别滥用。\n' +
      `【网站概况】${siteOverview}\n` +
      `【全站板块】\n${guideText}\n` +
      `【全站文章清单】\n${inventory}`;

    const userPrompt = context
      ? `【文章资料】\n${context}\n\n【用户问题】\n${message}`
      : message;

    const upstream = await fetch(DEEPSEEK_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        stream: true,
        temperature: 0.8,
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

// ===== 站点指南文本 =====
function buildGuideText(guide) {
  const lines = [];
  if (guide.siteName) lines.push(`站点名称：${guide.siteName}`);
  if (guide.domain) lines.push(`域名：https://${guide.domain}`);
  for (const s of guide.sections || []) {
    lines.push(`- ${s.name}｜链接：${s.url}｜说明：${s.desc || '（无说明）'}`);
  }
  if (guide.links && typeof guide.links === 'object') {
    const ext = Object.entries(guide.links).map(([k, v]) => `${k}: ${v}`).join('；');
    if (ext) lines.push(`外部链接：${ext}`);
  }
  return lines.length ? lines.join('\n') : '（暂无站点指南）';
}

// ===== 全站清单 =====
function buildInventory(index) {
  if (!index.length) return '（空）';
  return index.map((it, i) =>
    `${i + 1}. ${it.title}｜链接：${it.url}｜分类：${it.category || '无'}｜标签：${(it.tags || []).join('、') || '无'}｜摘要：${it.summary || '（无摘要）'}`
  ).join('\n');
}

function semanticSearch(index, qv, limit) {
  const scored = index
    .filter(it => Array.isArray(it.embedding) && it.embedding.length)
    .map(it => ({ it, s: cosine(qv, it.embedding) }))
    .sort((a, b) => b.s - a.s);
  if (!scored.length) return [];
  return scored.slice(0, limit).map(x => x.it);
}

function splitWords(q) {
  return q.toLowerCase().split(/[\s,，。.!?！？、;；:：“”"'"（）()【】\[\]{}<>《》~·]+/).filter(w => w.length >= 2);
}

function bigrams(q) {
  const out = new Set();
  const clean = q.toLowerCase().replace(/[\s,，。.!?！？、;；:：“”"'"（）()【】\[\]{}<>《》~·]+/g, '');
  for (let i = 0; i < clean.length - 1; i++) out.add(clean.slice(i, i + 2));
  return [...out];
}

function scoreItem(item, terms, weight) {
  const hay = (
    (item.title || '') + ' ' +
    (item.category || '') + ' ' +
    (Array.isArray(item.tags) ? item.tags.join(' ') : '') + ' ' +
    (item.summary || '') + ' ' +
    (item.content || '').slice(0, 4000)
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
  const whole = index.filter(it =>
    ((it.title || '') + ' ' + (it.summary || '')).toLowerCase().includes(q.toLowerCase())
  );
  if (whole.length) return whole.slice(0, limit);
  const words = splitWords(q);
  if (words.length) {
    const scored = index.map(it => ({ it, s: scoreItem(it, words, 3) }))
      .filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    if (scored.length) return scored.slice(0, limit).map(x => x.it);
  }
  const gs = bigrams(q);
  if (gs.length) {
    const scored = index.map(it => ({ it, s: scoreItem(it, gs, 1) }))
      .filter(x => x.s > 0).sort((a, b) => b.s - a.s);
    if (scored.length) return scored.slice(0, limit).map(x => x.it);
  }
  return [];
}

function buildContext(items, maxLen) {
  if (!items.length) return '';
  return items.map((it, i) => {
    let imgNote = '';
    if (Array.isArray(it.images) && it.images.length) {
      imgNote = '\n文中图片：' + it.images.map(img => img.alt || img.src).join('；') + '\n';
    }
    return `【资料${i + 1}】\n标题：${it.title}\n链接：${it.url}\n分类：${it.category || '无'}\n标签：${(it.tags || []).join('、') || '无'}\n摘要：${it.summary || ''}${imgNote}\n正文：${(it.content || '').slice(0, maxLen)}\n`;
  }).join('\n\n');
}