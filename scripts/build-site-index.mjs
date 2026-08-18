import { readFileSync, writeFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const IGNORE_DIRS = new Set(['node_modules', '.git', 'dist', 'public', 'functions', 'scripts', '.astro']);
const IGNORE_FILES = /^(readme|package|pnpm-lock|yarn\.lock|\.)/i;

const EMBEDDING_API_KEY = process.env.EMBEDDING_API_KEY || '';
const EMBEDDING_API = 'https://api.siliconflow.cn/v1/embeddings';
const EMBEDDING_MODEL = 'BAAI/bge-m3';
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

// ===== 从 src/data/music.json 自动生成音乐板块描述 =====
function buildMusicDesc() {
  const p = 'src/data/music.json';
  if (!existsSync(p)) return null;
  try {
    const data = JSON.parse(readFileSync(p, 'utf8'));
    const artists = data.artists || [];
    const albums = data.albums || [];
    const nameOf = (id) => {
      const a = artists.find(x => x.id === id);
      return a ? a.name : id;
    };
    const albumLine = albums.map(al =>
      `《${al.title}》by ${nameOf(al.artistId)}（${al.year}年，${al.genre || ''}，共${(al.tracks || []).length}首）`
    ).join('；');
    const artistLine = artists.length
      ? '歌手：' + artists.map(a => a.name + (a.bio ? `（${a.bio}）` : '')).join('、')
      : '';
    return `音乐专辑页收录：${artistLine}。收录专辑：${albumLine}。完整试听请访问 /music/ 页面。`;
  } catch (e) { return null; }
}

// ===== 从 src/data/bilibili-data.json 自动生成追番板块描述 =====
function buildAnimeDesc() {
  const p = 'src/data/bilibili-data.json';
  if (!existsSync(p)) return null;
  try {
    const list = JSON.parse(readFileSync(p, 'utf8'));
    if (!Array.isArray(list)) return null;
    const total = list.length;
    const statusCount = {};
    for (const it of list) {
      const s = it.status || 'unknown';
      statusCount[s] = (statusCount[s] || 0) + 1;
    }
    const countLine = Object.entries(statusCount)
      .map(([k, v]) => `${k}${v}`).join('、');
    const sample = list.slice(0, 25).map(x => x.title).join('、');
    return `追番页收录共 ${total} 部（${countLine}），代表作：${sample}${total > 25 ? '…等' : ''}。完整列表请访问 /anime/ 页面。`;
  } catch (e) { return null; }
}

// ===== 组装站点指南（静态基础 + 动态音乐/追番） =====
function copySiteGuide() {
  const src = 'scripts/site-guide.json';
  const dst = 'public/site-guide.json';
  let guide = { sections: [] };
  if (existsSync(src)) {
    try { guide = JSON.parse(readFileSync(src, 'utf8')); } catch (e) {
      console.warn('[site-guide] 解析失败，使用默认：' + e.message);
    }
  }
  if (!Array.isArray(guide.sections)) guide.sections = [];

  // 用动态数据覆盖音乐、追番板块的 desc
  const musicDesc = buildMusicDesc();
  const animeDesc = buildAnimeDesc();
  for (const s of guide.sections) {
    if (s.name === '音乐' && musicDesc) s.desc = musicDesc;
    if (s.name === '追番' && animeDesc) s.desc = animeDesc;
  }

  if (!existsSync('public')) mkdirSync('public', { recursive: true });
  writeFileSync(dst, JSON.stringify(guide, null, 2));
  console.log(`[site-guide] 已生成站点指南，共 ${guide.sections.length} 个板块 -> public/site-guide.json`);
  if (musicDesc) console.log(`[site-guide] 音乐板块已自动更新（来源 src/data/music.json）`);
  if (animeDesc) console.log(`[site-guide] 追番板块已自动更新（来源 src/data/bilibili-data.json）`);
  return guide;
}

async function main() {
  const guide = copySiteGuide();

  // ---- 文章索引 ----
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

  // ---- 向量 ----
  if (EMBEDDING_API_KEY) {
    let ok = 0;
    for (const it of items) {
      const doc = QUERY_PREFIX + (it.title + '。' + (it.summary || '') + '。' + (it.content || '').slice(0, 6000));
      try {
        it.embedding = await embedOne(doc);
        ok++;
      } catch (e) {
        console.warn(`  [embedding] ${it.title} 失败: ${e.message}`);
      }
    }
    console.log(`[embedding] 成功为 ${ok}/${items.length} 篇文章生成向量`);
  } else {
    console.warn('[embedding] 未设置 EMBEDDING_API_KEY，跳过向量（将用关键词检索）');
  }

  if (!existsSync('public')) mkdirSync('public', { recursive: true });
  writeFileSync('public/site-index.json', JSON.stringify(items, null, 2));

  console.log(`[site-index] 生成 ${items.length} 篇文章索引 -> public/site-index.json`);
  for (const it of items.slice(0, 8)) {
    const dim = it.embedding ? `向量${it.embedding.length}维` : '无向量';
    console.log(`  - ${it.title} | ${it.url} | ${it.content.length}字 | ${dim}`);
  }
  const music = buildMusicDesc();
  if (music) console.log('[site-guide] 音乐示例: ' + music.slice(0, 120));
  if (items.length === 0) console.warn('[site-index] 警告：没找到任何文章');
}

main().catch((e) => {
  console.error('[site-index] 构建失败：', e);
  process.exit(1);
});