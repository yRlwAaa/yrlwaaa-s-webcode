import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'public', 'functions', 'scripts', '.astro']);
const IGNORE_FILES = /^(readme|package|pnpm-lock|yarn\.lock|\.)/i;

// ===== 硅基流动 embedding 配置 =====
const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || '';
const EMBEDDING_API = 'https://api.siliconflow.cn/v1/embeddings';
const EMBEDDING_MODEL = 'BAAI/bge-m3';
// bge 检索要求：文档和查询用相同的前缀，效果才最好
const QUERY_PREFIX = '为这个句子生成表示以用于检索相关文章：';

function walk(dir, out = []) {
  if (!existsSync(dir)) return out;
  for (const name of readdirSync(dir)) {
    if (name.startsWith('.') || IGNORE_DIRS.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (['.md', '.mdx'].includes(extname(name)) && !IGNORE_FILES.test(name)) out.push(p);
  }
  return out;
}

function parseFrontmatter(raw) {
  const fm = {};
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return fm;
  const re = /^([a-zA-Z0-9_]+):\s*(.*)$/gm;
  let mm;
  while ((mm = re.exec(m[1]))) {
    let val = mm[2].trim();
    if (val.startsWith('[') && val.endsWith(']')) {
      val = val.slice(1, -1).split(/[\s,，]+/).map((s) => s.replace(/^["']|["']$/g, '')).filter(Boolean);
    } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    fm[mm[1]] = val;
  }
  return fm;
}

function stripMarkdown(md) {
  return (md || '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractImages(md) {
  const images = [];
  const re = /!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g;
  let m;
  while ((m = re.exec(md))) images.push({ alt: (m[1] || '').trim(), src: m[2] });
  const re2 = /<img[^>]*?alt=["']([^"']*)["'][^>]*?(?:src|data-src)=["']([^"']+)["'][^>]*>/g;
  while ((m = re2.exec(md))) images.push({ alt: (m[1] || '').trim(), src: m[2] });
  return images;
}

async function embedOne(text) {
  const res = await fetch(EMBEDDING_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${EMBEDDING_API_KEY}`,
    },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: text, encoding_format: 'float' }),
  });
  if (!res.ok) throw new Error('HTTP ' + res.status + ': ' + (await res.text()).slice(0, 200));
  const data = await res.json();
  return data.data[0].embedding;
}

// ===== 主流程 =====
async function main() {
  const files = walk('.');
  const items = [];
  const seen = new Set();

  for (const p of files) {
    const raw = readFileSync(p, 'utf8');
    if (!/^---\r?\n/.test(raw)) continue;
    const fm = parseFrontmatter(raw);
    const body = raw.replace(/^---[\s\S]*?---\s*/, '').trim();
    if (!body) continue;

    const parts = p.split(/[\\/]/);
    const fileName = parts.pop() || '';
    let base = fileName.replace(/\.mdx?$/, '');
    if (base === 'index') base = parts[parts.length - 1] || 'index';

    const slug = String(fm.slug || base).replace(/^\/+|\/+$/g, '');
    const url = '/posts/' + slug + '/';
    if (seen.has(url)) continue;
    seen.add(url);

    let summary = String(fm.description || fm.summary || fm.excerpt || '').trim();
    if (!summary || /^chapter[\s_\-]?\d*$/i.test(summary) || summary.length < 3) {
      summary = stripMarkdown(body).slice(0, 120);
    }

    items.push({
      title: String(fm.title || base),
      url,
      category: String(fm.category || fm.categories || fm.collection || ''),
      tags: Array.isArray(fm.tags) ? fm.tags : [],
      summary,
      images: extractImages(body),
      content: body,
    });
  }

  // ===== 生成语义向量 =====
  if (EMBEDDING_API_KEY) {
    let ok = 0;
    for (const it of items) {
      const doc = QUERY_PREFIX + (it.title + '。' + (it.summary || '') + '。' + (it.content || '').slice(0, 6000));
      try {
        it.embedding = await embedOne(doc);
        ok++;
      } catch (e) {
        console.warn(`  [embedding] ${it.title} 失败，降级为纯文本: ${e.message}`);
      }
    }
    console.log(`[embedding] 成功为 ${ok}/${items.length} 篇文章生成向量`);
  } else {
    console.warn('[embedding] 未设置 EMBEDDING_API_KEY，跳过向量生成（将使用关键词检索）');
  }

  // ===== 写文件 =====
  if (!existsSync('public')) mkdirSync('public', { recursive: true });
  writeFileSync('public/site-index.json', JSON.stringify(items, null, 2));

  console.log(`[site-index] 生成 ${items.length} 篇文章索引 -> public/site-index.json`);
  for (const it of items.slice(0, 12)) {
    const dim = it.embedding ? `向量${it.embedding.length}维` : '无向量';
    console.log(`  - ${it.title} | ${it.url} | ${it.content.length}字 | ${dim} | 摘要:${it.summary.slice(0, 30)}`);
  }
  if (items.length === 0) console.warn('[site-index] 警告：没找到任何文章');
}

main().catch((e) => {
  console.error('[site-index] 构建失败：', e);
  process.exit(1);
});