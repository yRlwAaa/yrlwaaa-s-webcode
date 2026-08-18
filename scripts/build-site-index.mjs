import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'public', 'functions', 'scripts', '.astro']);
const IGNORE_FILES = /^(readme|package|pnpm-lock|yarn\.lock|\.)/i;

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

// 提取文章里的图片（alt + 地址），让 AI 至少知道每篇有哪些图
function extractImages(md) {
  const images = [];
  const re = /!\[([^\]]*)\]\(([^)\s]+)[^)]*\)/g;
  let m;
  while ((m = re.exec(md))) {
    images.push({ alt: (m[1] || '').trim(), src: m[2] });
  }
  const re2 = /<img[^>]*?alt=["']([^"']*)["'][^>]*?(?:src|data-src)=["']([^"']+)["'][^>]*>/g;
  while ((m = re2.exec(md))) {
    images.push({ alt: (m[1] || '').trim(), src: m[2] });
  }
  return images;
}

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

  // 真实链接格式：/posts/{slug}/
  const slug = String(fm.slug || base).replace(/^\/+|\/+$/g, '');
  const url = '/posts/' + slug + '/';

  // 去重（同一文章中文名/英文别名会各有一个文件）
  if (seen.has(url)) continue;
  seen.add(url);

  const summary = String(fm.description || fm.summary || fm.excerpt || '').trim() ||
                 stripMarkdown(body).slice(0, 120);

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

if (!existsSync('public')) mkdirSync('public', { recursive: true });
writeFileSync('public/site-index.json', JSON.stringify(items, null, 2));

console.log(`[site-index] 生成 ${items.length} 篇文章索引 -> public/site-index.json`);
for (const it of items.slice(0, 10)) {
  console.log(`  - ${it.title} | ${it.url} | ${it.content.length}字 | 图片${it.images.length}张`);
}
if (items.length === 0) console.warn('[site-index] 警告：没找到任何文章');