import { readdirSync, readFileSync, writeFileSync } from 'fs';
import path from 'path';

const POSTS_DIR = './src/content/posts';
const OUT_FILE = './functions/site-data.js';

function stripMarkdown(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>|-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseFrontmatter(raw) {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?/);
  if (!m) return { data: {}, body: raw };
  const data = {};
  for (const line of m[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx > 0) {
      let val = line.slice(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      data[line.slice(0, idx).trim()] = val;
    }
  }
  return { data, body: raw.slice(m[0].length) };
}

const docs = [];

function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (/\.(md|mdx)$/.test(entry.name)) {
      const raw = readFileSync(full, 'utf8');
      const { data, body } = parseFrontmatter(raw);
      const slug = path.relative(POSTS_DIR, full)
        .replace(/\.(md|mdx)$/, '')
        .replace(/\\/g, '/');
      const url = data.permalink
        || (data.alias ? `/${data.alias.replace(/^\//, '')}` : `/posts/${slug}`);
      docs.push({
        title: data.title || slug,
        url,
        description: data.description || '',
        tags: data.tags || '',
        category: data.category || '',
        content: stripMarkdown(body).slice(0, 4000),
      });
    }
  }
}

walk(POSTS_DIR);

writeFileSync(OUT_FILE, `export default ${JSON.stringify(JSON.stringify(docs))};\n`);
console.log(`[site-data] ${docs.length} posts -> ${OUT_FILE}`);