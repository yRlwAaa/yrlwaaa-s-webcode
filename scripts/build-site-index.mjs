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
    } else if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    fm[mm[1]] = val;
  }
  return fm;
}
const files = walk('.');
const items = [];
for (const p of files) {
  const raw = readFileSync(p, 'utf8');
  if (!/^---\r?\n/.test(raw)) continue;
  const fm = parseFrontmatter(raw);
  const content = raw.replace(/^---[\s\S]*?---\s*/, '').trim();
  if (!content) continue;
  const parts = p.split(/[\\/]/);
  const fileName = parts.pop() || '';
  let base = fileName.replace(/\.mdx?$/, '');
  if (base === 'index') base = parts[parts.length - 1] || 'index';
  const slug = String(fm.slug || fm.url || base).replace(/^\/+|\/+$/g, '');
  items.push({
    title: String(fm.title || base),
    url: '/' + slug,
    category: String(fm.category || fm.categories || fm.collection || ''),
    tags: Array.isArray(fm.tags) ? fm.tags : [],
    summary: String(fm.description || fm.summary || fm.excerpt || ''),
    content,
  });
}
if (!existsSync('public')) mkdirSync('public', { recursive: true });
writeFileSync('public/site-index.json', JSON.stringify(items, null, 2));
console.log(`[site-index] 生成 ${items.length} 篇文章索引 -> public/site-index.json`);
if (items.length === 0) console.warn('[site-index] 警告：没找到任何文章，请确认文章存放目录');
