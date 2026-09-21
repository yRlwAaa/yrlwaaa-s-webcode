/**
 * 词典数据代理 + 结构规范化
 *
 *   GET /api/dict?q=hello            词条详情
 *   GET /api/dict?type=suggest&q=hel 搜索联想
 *
 * 由 Cloudflare Pages Functions 执行，同源提供给 /dictionary/ 页面，
 * 因此浏览器端不再受第三方接口 CORS 限制，也不再直接暴露上游结构。
 */

const UPSTREAM = "https://dict.youdao.com/jsonapi";
const UPSTREAM_SUGGEST = "https://dict.youdao.com/suggest";
const VOICE_BASE = "https://dict.youdao.com/dictvoice?audio=";
const CACHE_SECONDS = 86400;
const MAX_WORD_LEN = 64;
const MAX_QUERY = 256;

/* ------------------------------------------------------------------ *
 * 基础工具
 * ------------------------------------------------------------------ */

function toArray(value) {
	if (value === null || value === undefined) return [];
	return Array.isArray(value) ? value : [value];
}

function stripTags(value) {
	if (value === null || value === undefined) return "";
	return String(value)
		.replace(/<[^>]*>/g, "")
		.replace(/&nbsp;/gi, " ")
		.replace(/&lt;/gi, "<")
		.replace(/&gt;/gi, ">")
		.replace(/&quot;/gi, '"')
		.replace(/&#39;/gi, "'")
		.replace(/&amp;/gi, "&")
		.replace(/\s+/g, " ")
		.trim();
}

/** 有道把文本塞在 { l: { i: string | string[] } } 里 */
function lx(node) {
	if (!node || !node.l) return [];
	const i = node.l.i;
	if (i === null || i === undefined) return [];
	return toArray(i).map(stripTags).filter(Boolean);
}

function firstWord(field) {
	const words = toArray(field && field.word);
	return words.length ? words[0] : null;
}

function voiceUrl(speech, fallbackWord, type) {
	const raw = stripTags(speech);
	if (raw) return VOICE_BASE + raw.replace(/\s/g, "+");
	if (!fallbackWord) return "";
	return VOICE_BASE + encodeURIComponent(fallbackWord) + "&type=" + type;
}

/* ------------------------------------------------------------------ *
 * 分板块解析
 * ------------------------------------------------------------------ */

const POS_RULE = /^([A-Za-z]+(?:\s*\.\s*(?:&\s*)?[A-Za-z]+)*\.)\s+(.+)$/;

function splitPos(line) {
	const m = POS_RULE.exec(line);
	if (m) return { pos: m[1].replace(/\s+/g, " "), text: m[2].trim() };
	return { pos: "", text: line };
}

function parseSimple(raw) {
	const simple = firstWord(raw.simple);
	const ec = firstWord(raw.ec);
	const src = simple || ec || {};
	const bookWord = stripTags(raw.input || "");

	let matched = "";
	const phrase = src["return-phrase"];
	if (typeof phrase === "string") matched = stripTags(phrase);
	else matched = lx(phrase).join(" ");

	const uk = stripTags(src.ukphone);
	const us = stripTags(src.usphone);
	return {
		word: matched || bookWord,
		ukPhone: uk,
		usPhone: us,
		ukVoice: uk || src.ukspeech ? voiceUrl(src.ukspeech, bookWord, 1) : "",
		usVoice: us || src.usspeech ? voiceUrl(src.usspeech, bookWord, 2) : "",
	};
}

function parseEc(raw) {
	const src = firstWord(raw.ec);
	const translations = [];
	if (src) {
		toArray(src.trs).forEach((group) => {
			toArray(group && group.tr).forEach((tr) => {
				lx(tr).forEach((line) => translations.push(splitPos(line)));
			});
		});
	}

	const forms = toArray(src && src.wfs)
		.map((item) => {
			const wf = item && item.wf;
			if (!wf) return null;
			const name = stripTags(wf.name);
			const value = stripTags(wf.value);
			return name && value ? { name, value } : null;
		})
		.filter(Boolean);

	return {
		translations,
		forms,
		examTypes: toArray(raw.ec && raw.ec.exam_type).map(stripTags).filter(Boolean),
	};
}

function parseIndividual(raw) {
	const ind = toArray(raw.individual)[0];
	if (!ind) return { level: "", examSentences: [] };
	const examSentences = toArray(ind.pastExamSents)
		.map((s) => ({
			en: stripTags(s && s.en),
			zh: stripTags(s && s.zh),
			source: stripTags(s && s.source),
		}))
		.filter((s) => s.en)
		.slice(0, 8);
	return { level: stripTags(ind.level), examSentences };
}

function parseCollins(raw) {
	const head = toArray(raw.collins && raw.collins.collins_entries)[0];
	if (!head) return null;
	const entries = [];
	toArray(head.entries && head.entries.entry).forEach((entry) => {
		toArray(entry && entry.tran_entry).forEach((te) => {
			if (!te) return;
			const posEntry = te.pos_entry || {};
			const tran = stripTags(te.tran);
			const examples = toArray(te.exam_sents && te.exam_sents.sent)
				.map((x) => ({ en: stripTags(x && x.eng_sent), zh: stripTags(x && x.chn_sent) }))
				.filter((x) => x.en)
				.slice(0, 3);
			if (tran || examples.length) {
				entries.push({
					pos: stripTags(posEntry.pos),
					posTips: stripTags(posEntry.pos_tips),
					tran,
					examples,
				});
			}
		});
	});
	if (!entries.length) return null;
	return {
		star: Number(stripTags(head.star)) || 0,
		phonetic: stripTags(head.phonetic),
		headword: stripTags(head.headword),
		entries: entries.slice(0, 12),
	};
}

function parseEe(raw) {
	const src = firstWord(raw.ee);
	if (!src) return [];
	return toArray(src.trs)
		.map((group) => {
			const defs = [];
			const similar = [];
			toArray(group && group.tr).forEach((tr) => {
				if (!tr) return;
				lx(tr).forEach((line) => defs.push(line));
				toArray(tr["similar-words"]).forEach((s) => {
					const w = stripTags(s && s.similar);
					if (w) similar.push(w);
				});
			});
			return { pos: stripTags(group && group.pos), defs, similar };
		})
		.filter((x) => x.defs.length)
		.slice(0, 6);
}

function parseSentences(raw) {
	return toArray(raw.blng_sents_part && raw.blng_sents_part["sentence-pair"])
		.map((pair) => {
			if (!pair) return null;
			const en = stripTags(pair.sentence);
			if (!en) return null;
			const speech = stripTags(pair["sentence-speech"]);
			return {
				en,
				zh: stripTags(pair["sentence-translation"]),
				source: stripTags(pair.source),
				audio: speech ? VOICE_BASE + speech : "",
			};
		})
		.filter(Boolean)
		.slice(0, 8);
}

function parseMediaSentences(raw) {
	return toArray(raw.media_sents_part && raw.media_sents_part.sent)
		.map((sent) => {
			if (!sent) return null;
			const en = stripTags(sent.eng);
			if (!en) return null;
			const snippet = toArray(sent.snippets && sent.snippets.snippet)[0] || {};
			return {
				en,
				source: stripTags(snippet.source),
				name: stripTags(snippet.name),
				audio: stripTags(snippet.streamUrl),
			};
		})
		.filter(Boolean)
		.slice(0, 5);
}

function parseAuthSentences(raw) {
	return toArray(raw.auth_sents_part && raw.auth_sents_part.sent)
		.map((sent) => {
			if (!sent) return null;
			const en = stripTags(sent.foreign);
			if (!en) return null;
			const speech = stripTags(sent.speech);
			return {
				en,
				source: stripTags(sent.source).replace(/\[[^\]]*\]/g, "").trim(),
				audio: speech ? VOICE_BASE + speech : "",
			};
		})
		.filter(Boolean)
		.slice(0, 5);
}

function parsePhrases(raw) {
	return toArray(raw.phrs && raw.phrs.phrs)
		.map((item) => {
			const phr = item && item.phr;
			if (!phr) return null;
			const en = lx(phr.headword).join(" ");
			if (!en) return null;
			const zh = toArray(phr.trs)
				.map((t) => lx(t && t.tr).join("；"))
				.filter(Boolean)
				.join("；");
			return { en, zh, source: stripTags(phr.source) };
		})
		.filter(Boolean)
		.slice(0, 30);
}

function parseSynonyms(raw) {
	return toArray(raw.syno && raw.syno.synos)
		.map((item) => {
			const syno = item && item.syno;
			if (!syno) return null;
			const words = toArray(syno.ws)
				.map((w) => stripTags(w && w.w))
				.filter(Boolean);
			if (!words.length) return null;
			return { pos: stripTags(syno.pos), tran: stripTags(syno.tran), words };
		})
		.filter(Boolean);
}

function parseRelWords(raw) {
	return toArray(raw.rel_word && raw.rel_word.rels)
		.map((item) => {
			const rel = item && item.rel;
			if (!rel) return null;
			const words = toArray(rel.words)
				.map((w) => ({ word: stripTags(w && w.word), tran: stripTags(w && w.tran) }))
				.filter((w) => w.word);
			if (!words.length) return null;
			return { pos: stripTags(rel.pos), words };
		})
		.filter(Boolean)
		.slice(0, 8);
}

function parseWebTrans(raw) {
	return toArray(raw.web_trans && raw.web_trans["web-translation"])
		.map((item) => {
			if (!item) return null;
			const key = stripTags(item.key);
			const values = toArray(item.trans)
				.map((t) => stripTags(t && t.value))
				.filter(Boolean);
			if (!key || !values.length) return null;
			return { key, values };
		})
		.filter(Boolean)
		.slice(0, 8);
}

function parseEtym(raw) {
	const zh = toArray(raw.etym && raw.etym.etyms && raw.etym.etyms.zh);
	return zh
		.map((x) => stripTags(x && x.value))
		.filter(Boolean)
		.join("\n\n")
		.slice(0, 2000);
}

function parseAiDefinition(raw) {
	const word = toArray(raw.aiDefinition && raw.aiDefinition.words)[0];
	if (!word) return "";
	return stripTags(word.content).slice(0, 1200);
}

function hasEntry(raw) {
	return Boolean(
		firstWord(raw.ec) ||
			firstWord(raw.simple) ||
			firstWord(raw.ee) ||
			(raw.collins && raw.collins.collins_entries) ||
			toArray(raw.web_trans && raw.web_trans["web-translation"]).length
	);
}

function normalize(raw, query) {
	if (!hasEntry(raw)) {
		return { ok: false, error: "not_found", query };
	}

	const simple = parseSimple(raw);
	const ec = parseEc(raw);
	const individual = parseIndividual(raw);
	const sentences = parseSentences(raw);
	const mediaSentences = parseMediaSentences(raw);
	const authSentences = sentences.length ? [] : parseAuthSentences(raw);
	const etym = parseEtym(raw);

	return {
		ok: true,
		query,
		word: simple.word || query,
		ukPhone: simple.ukPhone,
		usPhone: simple.usPhone,
		ukVoice: simple.ukVoice,
		usVoice: simple.usVoice,
		examTypes: ec.examTypes,
		level: individual.level,
		translations: ec.translations,
		forms: ec.forms,
		collins: parseCollins(raw),
		ee: parseEe(raw),
		sentences,
		mediaSentences,
		authSentences,
		phrases: parsePhrases(raw),
		synonyms: parseSynonyms(raw),
		relWords: parseRelWords(raw),
		webTrans: parseWebTrans(raw),
		examSentences: individual.examSentences,
		etym,
		aiDefinition: parseAiDefinition(raw),
	};
}

/* ------------------------------------------------------------------ *
 * 上游请求
 * ------------------------------------------------------------------ */

function upstreamHeaders() {
	return {
		"User-Agent":
			"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
		Referer: "https://dict.youdao.com/",
		Accept: "application/json, text/plain, */*",
	};
}

async function lookup(word) {
	const res = await fetch(UPSTREAM + "?q=" + encodeURIComponent(word), {
		headers: upstreamHeaders(),
	});
	if (!res.ok) throw new Error("upstream " + res.status);
	const raw = await res.json();
	return normalize(raw, word);
}

async function suggest(query) {
	const url =
		UPSTREAM_SUGGEST +
		"?num=8&ver=3.0&doctype=json&cache=false&le=en&q=" +
		encodeURIComponent(query);
	const res = await fetch(url, { headers: upstreamHeaders() });
	if (!res.ok) throw new Error("upstream " + res.status);
	const raw = await res.json();
	const entries = toArray(raw && raw.data && raw.data.entries)
		.map((item) => {
			if (!item) return null;
			const entry = stripTags(item.entry);
			if (!entry) return null;
			let explain = stripTags(item.explain);
			if (explain.length > 72) explain = explain.slice(0, 72) + "…";
			return { word: entry, explain };
		})
		.filter(Boolean)
		.slice(0, 8);
	return { ok: true, query, entries };
}

/* ------------------------------------------------------------------ *
 * 入口
 * ------------------------------------------------------------------ */

function json(data, status, extraHeaders) {
	return new Response(JSON.stringify(data), {
		status: status || 200,
		headers: Object.assign(
			{
				"Content-Type": "application/json; charset=utf-8",
				"X-Content-Type-Options": "nosniff",
			},
			extraHeaders || {}
		),
	});
}

export async function onRequestGet(context) {
	const { request, waitUntil } = context;
	const url = new URL(request.url);
	const query = (url.searchParams.get("q") || "").trim().slice(0, MAX_QUERY);
	const type = url.searchParams.get("type") === "suggest" ? "suggest" : "dict";

	if (!query) return json({ ok: false, error: "empty_query" }, 400);
	if (type === "dict" && query.length > MAX_WORD_LEN) {
		return json({ ok: false, error: "too_long", query }, 400);
	}

	const cacheKeyUrl = new URL(request.url);
	cacheKeyUrl.search = "?v=2&type=" + type + "&q=" + encodeURIComponent(query);
	const cacheKey = new Request(cacheKeyUrl.toString(), { method: "GET" });

	let cache = null;
	try {
		if (typeof caches !== "undefined" && caches.default) cache = caches.default;
	} catch (error) {
		cache = null;
	}

	if (cache) {
		try {
			const hit = await cache.match(cacheKey);
			if (hit) return hit;
		} catch (error) {
			/* 缓存不可用时忽略 */
		}
	}

	let payload;
	try {
		payload = type === "suggest" ? await suggest(query) : await lookup(query);
	} catch (error) {
		return json(
			{ ok: false, error: "upstream", query, message: String((error && error.message) || error) },
			502
		);
	}

	const status = payload.ok === false && payload.error === "not_found" ? 404 : 200;
	const response = json(payload, status, {
		"Cache-Control": "public, max-age=" + CACHE_SECONDS + ", s-maxage=" + CACHE_SECONDS,
	});

	if (cache && waitUntil) {
		try {
			waitUntil(cache.put(cacheKey, response.clone()));
		} catch (error) {
			/* 写入缓存失败不影响响应 */
		}
	}

	return response;
}
