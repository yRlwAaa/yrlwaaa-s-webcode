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
  return /(全部|每章|每篇|所有文章|所有内容|全部章节|全站|都概括|每章内容|每篇内容|概括一下|介绍.*网站|网站.*介绍|全部文章|列.*所有|全部内容)/.test(q);
}

// ===== 硅基流动 embedding =====
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

    // 拉索引
    let index = [];
    try {
      const indexUrl = new URL('/site-index.json', request.url).toString();
      const res = await fetch(indexUrl, { headers: { 'Cache-Control': 'max-age=3600' } });
      if (res.ok) index = await res.json();
    } catch (e) {}

    const inventory = buildInventory(index);

    // ===== 决定喂哪些内容 =====
    let context;
    if (isOverviewQuestion(message) && index.length) {
      // 全站问题：所有文章都喂（每篇截 ALL_CONTEXT）
      context = buildContext(index, ALL_CONTEXT);
    } else {
      // 单篇问题：先语义检索（向量相似度），失败则关键词降级
      let hits = null;
      try {
        const qv = await embedQuery(env, message);
        hits = semanticSearch(index, qv, TOP_N);
      } catch (e) {}
      if (!hits || !hits.length) {
        hits = searchSite(index, message, TOP_N);
      }
      context = buildContext(hits.length ? hits : index.slice(0, TOP_N), MAX_CONTEXT);
    }

    const siteOverview = index.length
      ? `这是 yRlwAaa 的个人网站（yrlwa.top）。共收录 ${index.length} 篇文章。`
      : '（暂未获取到站点索引）';

    const system =
      '你是 yRlwAaa 网站的 AI 助手，负责回答访客关于网站内容的任何问题，以及总结、解析网站文章。\n' +
      '规则：\n' +
      '1. 依据下方【全站清单】和【文章资料】回答；清单保证你知道全站所有内容。\n' +
      '2. 具体文章内容以【文章资料】中的正文为准，正文没有的就诚实说没有，不要编造情节或数据。\n' +
      '3. 给访客链接时，必须原样使用清单/资料中的链接字段（形如 /posts/xxx/），绝对禁止编造或省略前缀；资料里没有的链接就不给。\n' +
      '4. 文章里的图片请根据资料中的图片说明（alt）向访客介绍。\n' +
      `【网站概况】${siteOverview}\n` +
      `【全站清单】\n${inventory}`;

    const userPrompt = context
      ? `【文章资料】\n${context}\n\n【用户问题】\n${message}`
      : message;

    // ===== DeepSeek 流式 =====
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

// ===== 全站清单 =====
function buildInventory(index) {
  if (!index.length) return '（空）';
  return index.map((it, i) =>
    `${i + 1}. ${it.title}｜链接：${it.url}｜分类：${it.category || '无'}｜标签：${(it.tags || []).join('、') || '无'}｜摘要：${it.summary || '（无摘要）'}`
  ).join('\n');
}

// ===== 语义检索 =====
function semanticSearch(index, qv, limit) {
  const scored = index
    .filter(it => Array.isArray(it.embedding) && it.embedding.length)
    .map(it => ({ it, s: cosine(qv, it.embedding) }))
    .sort((a, b) => b.s - a.s);
  if (!scored.length) return [];
  return scored.slice(0, limit).map(x => x.it);
}

// ===== 关键词检索（降级用） =====
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

// ===== 拼装资料 =====
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