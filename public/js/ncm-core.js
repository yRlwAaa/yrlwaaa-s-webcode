/**
 * NCM 解密核心 + 极简 ZIP 打包器
 * ------------------------------------------------------------------
 * 纯计算模块, 不依赖 DOM, 可同时在浏览器和 Node 中运行。
 * 浏览器: 作为普通脚本加载后暴露 window.NCMCore
 * Node  : require('./ncm-core.js')
 *
 * 原理 (NCM 容器格式, 与 ncmdump 一致):
 *   1. 文件头 "CTENFDAM" + 2 字节空位
 *   2. key 区: 每字节 XOR 0x64 后 AES-128-ECB 解密, 去掉 PKCS7 填充,
 *      再去掉前 17 字节 "neteasecloudmusic", 剩下的就是 RC4 密钥
 *   3. meta 区: 每字节 XOR 0x63 后 base64 解码并跳过前 22 字节,
 *      再 AES-128-ECB 解密得到 JSON 元数据(歌名/歌手/专辑/格式等)
 *   4. 4 字节 CRC + 5 字节空位 + 4 字节封面长度 + 封面数据
 *   5. 剩余部分为加密音频: 用 key 区生成的密钥盒逐字节异或即可还原
 * 还原出来的是原始音频流本身 (FLAC 就是真无损 FLAC, MP3 就是原 MP3),
 * 不存在二次转码, 因此质量与原文件完全一致。
 */
(function (root, factory) {
	var api = factory();
	if (typeof module !== "undefined" && module.exports) {
		module.exports = api;
	}
	if (root) {
		root.NCMCore = api;
	}
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
	"use strict";

	/* ============================ AES-128-ECB 解密 ============================ */
	// 运行时生成 S 盒 / 逆 S 盒 / 倍乘表, 避免手抄常量出错
	function gmul(a, b) {
		var p = 0;
		for (var i = 0; i < 8; i++) {
			if (b & 1) p ^= a;
			var hi = a & 0x80;
			a = (a << 1) & 0xff;
			if (hi) a ^= 0x1b;
			b >>= 1;
		}
		return p & 0xff;
	}

	var SBOX = new Uint8Array(256);
	var INV_SBOX = new Uint8Array(256);
	(function buildSbox() {
		var inv = new Uint8Array(256);
		for (var a = 0; a < 256; a++) {
			var r = 1;
			for (var k = 0; k < 254; k++) r = gmul(r, a);
			inv[a] = a === 0 ? 0 : r;
		}
		for (var i = 0; i < 256; i++) {
			var x = inv[i];
			var s =
				x ^
				((x << 1) | (x >>> 7)) ^
				((x << 2) | (x >>> 6)) ^
				((x << 3) | (x >>> 5)) ^
				((x << 4) | (x >>> 4)) ^
				0x63;
			SBOX[i] = s & 0xff;
		}
		for (var j = 0; j < 256; j++) INV_SBOX[SBOX[j]] = j;
	})();

	var MUL9 = new Uint8Array(256);
	var MUL11 = new Uint8Array(256);
	var MUL13 = new Uint8Array(256);
	var MUL14 = new Uint8Array(256);
	(function buildMulTables() {
		for (var i = 0; i < 256; i++) {
			MUL9[i] = gmul(i, 9);
			MUL11[i] = gmul(i, 11);
			MUL13[i] = gmul(i, 13);
			MUL14[i] = gmul(i, 14);
		}
	})();

	function expandKey(key) {
		var w = new Uint8Array(176);
		w.set(key, 0);
		var rcon = 1;
		for (var i = 16; i < 176; i += 4) {
			var t0 = w[i - 4];
			var t1 = w[i - 3];
			var t2 = w[i - 2];
			var t3 = w[i - 1];
			if (i % 16 === 0) {
				var tmp = t0;
				t0 = SBOX[t1] ^ rcon;
				t1 = SBOX[t2];
				t2 = SBOX[t3];
				t3 = SBOX[tmp];
				rcon = gmul(rcon, 2);
			}
			w[i] = w[i - 16] ^ t0;
			w[i + 1] = w[i - 15] ^ t1;
			w[i + 2] = w[i - 14] ^ t2;
			w[i + 3] = w[i - 13] ^ t3;
		}
		return w;
	}

	function invShiftRows(s) {
		var t = s[13];
		s[13] = s[9];
		s[9] = s[5];
		s[5] = s[1];
		s[1] = t;
		t = s[2];
		s[2] = s[10];
		s[10] = t;
		t = s[6];
		s[6] = s[14];
		s[14] = t;
		t = s[3];
		s[3] = s[7];
		s[7] = s[11];
		s[11] = s[15];
		s[15] = t;
	}

	function invMixColumns(s) {
		for (var c = 0; c < 16; c += 4) {
			var a0 = s[c];
			var a1 = s[c + 1];
			var a2 = s[c + 2];
			var a3 = s[c + 3];
			s[c] = MUL14[a0] ^ MUL11[a1] ^ MUL13[a2] ^ MUL9[a3];
			s[c + 1] = MUL9[a0] ^ MUL14[a1] ^ MUL11[a2] ^ MUL13[a3];
			s[c + 2] = MUL13[a0] ^ MUL9[a1] ^ MUL14[a2] ^ MUL11[a3];
			s[c + 3] = MUL11[a0] ^ MUL13[a1] ^ MUL9[a2] ^ MUL14[a3];
		}
	}

	function decryptBlock(src, srcOff, dst, dstOff, w) {
		var s = new Uint8Array(16);
		var i;
		for (i = 0; i < 16; i++) s[i] = src[srcOff + i] ^ w[160 + i];
		for (var round = 9; round >= 1; round--) {
			invShiftRows(s);
			for (i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]];
			for (i = 0; i < 16; i++) s[i] ^= w[round * 16 + i];
			invMixColumns(s);
		}
		invShiftRows(s);
		for (i = 0; i < 16; i++) s[i] = INV_SBOX[s[i]];
		for (i = 0; i < 16; i++) dst[dstOff + i] = s[i] ^ w[i];
	}

	/** AES-128-ECB 解密(输入长度必须是 16 的倍数) */
	function aes128EcbDecrypt(key, data) {
		if (data.length % 16 !== 0) {
			throw new Error("AES 输入长度不是 16 的倍数");
		}
		var w = expandKey(key);
		var out = new Uint8Array(data.length);
		for (var off = 0; off < data.length; off += 16) {
			decryptBlock(data, off, out, off, w);
		}
		return out;
	}

	/* ============================ 工具函数 ============================ */

	function pkcs7Unpad(bytes) {
		if (bytes.length === 0) return bytes;
		var pad = bytes[bytes.length - 1];
		if (pad < 1 || pad > 16 || pad > bytes.length) return bytes;
		for (var i = bytes.length - pad; i < bytes.length; i++) {
			if (bytes[i] !== pad) return bytes;
		}
		return bytes.subarray(0, bytes.length - pad);
	}

	function utf8Decode(bytes) {
		if (typeof TextDecoder !== "undefined") {
			try {
				return new TextDecoder("utf-8").decode(bytes);
			} catch (e) {
				/* 回退到手写解码 */
			}
		}
		var out = "";
		for (var i = 0; i < bytes.length; i++) {
			var c = bytes[i];
			if (c < 0x80) out += String.fromCharCode(c);
			else if (c > 0xbf && c < 0xe0) {
				out += String.fromCharCode(((c & 0x1f) << 6) | (bytes[++i] & 0x3f));
			} else if (c > 0xdf && c < 0xf0) {
				out += String.fromCharCode(
					((c & 0x0f) << 12) |
						((bytes[++i] & 0x3f) << 6) |
						(bytes[++i] & 0x3f),
				);
			} else {
				var cp =
					((c & 0x07) << 18) |
					((bytes[++i] & 0x3f) << 12) |
					((bytes[++i] & 0x3f) << 6) |
					(bytes[++i] & 0x3f);
				cp -= 0x10000;
				out += String.fromCharCode(0xd800 + (cp >> 10), 0xdc00 + (cp & 0x3ff));
			}
		}
		return out;
	}

	var B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
	var B64LOOKUP = (function () {
		var t = new Int16Array(256);
		for (var i = 0; i < 256; i++) t[i] = -1;
		for (var j = 0; j < 64; j++) t[B64.charCodeAt(j)] = j;
		return t;
	})();

	function base64Decode(bytes) {
		var out = [];
		var buf = 0;
		var bits = 0;
		for (var i = 0; i < bytes.length; i++) {
			var v = B64LOOKUP[bytes[i]];
			if (v < 0) continue; // 跳过换行/等号等
			buf = (buf << 6) | v;
			bits += 6;
			if (bits >= 8) {
				bits -= 8;
				out.push((buf >> bits) & 0xff);
			}
		}
		return new Uint8Array(out);
	}

	/** 用 key 区还原 256 字节密钥盒(RC4 变体 KSA) */
	function buildKeyBox(key) {
		var box = new Uint8Array(256);
		for (var i = 0; i < 256; i++) box[i] = i;
		var c = 0;
		var last = 0;
		var off = 0;
		for (var j = 0; j < 256; j++) {
			var swap = box[j];
			c = (swap + last + key[off]) & 0xff;
			off++;
			if (off >= key.length) off = 0;
			box[j] = box[c];
			box[c] = swap;
			last = c;
		}
		return box;
	}

	/* ============================ NCM 解析 ============================ */

	var CORE_KEY = new Uint8Array([
		0x68, 0x7a, 0x48, 0x52, 0x41, 0x6d, 0x73, 0x6f, 0x35, 0x6b, 0x49, 0x6e,
		0x62, 0x61, 0x78, 0x57,
	]);
	var META_KEY = new Uint8Array([
		0x23, 0x31, 0x34, 0x6c, 0x6a, 0x6b, 0x5f, 0x21, 0x5c, 0x5d, 0x26, 0x30,
		0x55, 0x3c, 0x27, 0x28,
	]);

	/** 歌手字段在 NCM meta 里有多种历史形态: 数组/数组套数组/斜杠串 */
	function pickName(value) {
		if (!value) return "";
		if (Array.isArray(value)) {
			var names = [];
			for (var i = 0; i < value.length; i++) {
				var item = value[i];
				var n = Array.isArray(item) ? item[0] : item;
				if (n) names.push(String(n));
			}
			return names.join(" / ");
		}
		return String(value).split("/").join(" / ");
	}

	/** 根据解出来的音频头判断真实格式 */
	function sniffFormat(bytes) {
		if (bytes.length >= 4) {
			if (bytes[0] === 0x66 && bytes[1] === 0x4c && bytes[2] === 0x61 && bytes[3] === 0x43) {
				return { format: "flac", ext: "flac", label: "FLAC 无损", lossless: true };
			}
			if (bytes[0] === 0x4f && bytes[1] === 0x67 && bytes[2] === 0x67 && bytes[3] === 0x53) {
				return { format: "ogg", ext: "ogg", label: "OGG", lossless: false };
			}
			if (bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) {
				return { format: "mp3", ext: "mp3", label: "MP3 有损", lossless: false };
			}
			if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) {
				return { format: "mp3", ext: "mp3", label: "MP3 有损", lossless: false };
			}
			if (bytes.length >= 12) {
				var brand = String.fromCharCode(
					bytes[4],
					bytes[5],
					bytes[6],
					bytes[7],
				);
				if (brand === "ftyp") {
					return { format: "m4a", ext: "m4a", label: "M4A", lossless: false };
				}
			}
			if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46) {
				return { format: "wav", ext: "wav", label: "WAV", lossless: true };
			}
		}
		return { format: "bin", ext: "bin", label: "未知格式", lossless: false };
	}

	function formatFromMeta(format) {
		if (!format) return null;
		var f = String(format).toLowerCase();
		if (f === "flac") return { format: "flac", ext: "flac", label: "FLAC 无损", lossless: true };
		if (f === "mp3") return { format: "mp3", ext: "mp3", label: "MP3 有损", lossless: false };
		if (f === "m4a" || f === "mp4") return { format: "m4a", ext: "m4a", label: "M4A", lossless: false };
		if (f === "ogg") return { format: "ogg", ext: "ogg", label: "OGG", lossless: false };
		if (f === "wav") return { format: "wav", ext: "wav", label: "WAV", lossless: true };
		return null;
	}

	/**
	 * 解密一个 NCM 文件
	 * @param {ArrayBuffer} buffer
	 * @returns {{audio: Uint8Array, info: object, cover: Uint8Array|null}}
	 */
	function decryptNcm(buffer) {
		var bytes = new Uint8Array(buffer);
		var view = new DataView(buffer);
		if (bytes.length < 32) throw new Error("文件过小, 不是有效的 NCM");

		var magic = "";
		for (var m = 0; m < 8; m++) magic += String.fromCharCode(bytes[m]);
		if (magic !== "CTENFDAM") throw new Error("文件头不是 CTENFDAM, 不是 NCM 格式");

		var pos = 10; // 8 字节 magic + 2 字节空位

		// --- key 区 ---
		if (pos + 4 > bytes.length) throw new Error("文件结构损坏(缺少 key 长度)");
		var keyLen = view.getUint32(pos, true);
		pos += 4;
		if (keyLen <= 0 || pos + keyLen > bytes.length) throw new Error("文件结构损坏(key 区越界)");
		var keyData = bytes.slice(pos, pos + keyLen);
		pos += keyLen;
		for (var i = 0; i < keyData.length; i++) keyData[i] ^= 0x64;
		if (keyData.length % 16 !== 0) keyData = keyData.subarray(0, keyData.length - (keyData.length % 16));
		var decKey = pkcs7Unpad(aes128EcbDecrypt(CORE_KEY, keyData));
		if (decKey.length < 17) throw new Error("密钥解出失败");
		var rc4Key = decKey.subarray(17); // 去掉 "neteasecloudmusic"

		// --- meta 区 ---
		var info = {};
		if (pos + 4 <= bytes.length) {
			var metaLen = view.getUint32(pos, true);
			pos += 4;
			if (metaLen > 0 && pos + metaLen <= bytes.length) {
				var metaData = bytes.slice(pos, pos + metaLen);
				pos += metaLen;
				for (var k = 0; k < metaData.length; k++) metaData[k] ^= 0x63;
				try {
					var b64 = base64Decode(metaData.subarray(22)); // 跳过 "163 key(Don't modify):"
					if (b64.length % 16 !== 0) b64 = b64.subarray(0, b64.length - (b64.length % 16));
					var plain = pkcs7Unpad(aes128EcbDecrypt(META_KEY, b64));
					var text = utf8Decode(plain);
					var start = text.indexOf("{");
					var end = text.lastIndexOf("}");
					if (start >= 0 && end > start) {
						info = JSON.parse(text.slice(start, end + 1)) || {};
					}
				} catch (e) {
					info = {}; // 元数据坏了不影响音频还原
				}
			} else if (metaLen > 0) {
				throw new Error("文件结构损坏(meta 区越界)");
			}
		}

		// --- CRC / 空位 / 封面 ---
		pos += 4; // CRC32
		pos += 5; // 空位
		var cover = null;
		if (pos + 4 <= bytes.length) {
			var imgLen = view.getUint32(pos, true);
			pos += 4;
			if (imgLen > 0 && pos + imgLen <= bytes.length) {
				cover = bytes.slice(pos, pos + imgLen);
				pos += imgLen;
			} else if (imgLen > 0) {
				imgLen = 0;
			}
		}

		// --- 音频 ---
		if (pos >= bytes.length) throw new Error("文件结构损坏(没有音频数据)");
		var audio = bytes.slice(pos);

		var box = buildKeyBox(rc4Key);
		var ks = new Uint8Array(256);
		for (var t = 0; t < 256; t++) {
			ks[t] = box[(box[t] + box[(box[t] + t) & 0xff]) & 0xff];
		}
		for (var n = 0; n < audio.length; n++) {
			audio[n] ^= ks[(n + 1) & 0xff];
		}

		var fmt = sniffFormat(audio) || formatFromMeta(info.format);
		if (!fmt || fmt.format === "bin") {
			fmt = formatFromMeta(info.format) || {
				format: "bin",
				ext: "bin",
				label: "未知格式",
				lossless: false,
			};
		}

		return {
			audio: audio,
			cover: cover,
			info: {
				title: info.musicName || "",
				artist: pickName(info.artist) || pickName(info.artistName),
				album: info.album || "",
				albumArtist: pickName(info.albumArtist) || pickName(info.albumArtistName),
				bitrate: info.bitrate || 0,
				duration: info.duration || 0,
				format: fmt.format,
				// 供页面脚本查词条用的稳定标识(flac/mp3/ogg/m4a/wav/bin);
				// formatLabel 是中文兜底文案, 纯计算模块不依赖 DOM/i18n
				formatKey: fmt.format,
				formatLabel: fmt.label,
				lossless: !!fmt.lossless,
				ext: fmt.ext,
				coverExt:
					cover && cover.length > 3 && cover[0] === 0x89 && cover[1] === 0x50
						? "png"
						: "jpg",
			},
		};
	}

	/* ============================ ZIP 打包(仅存储) ============================ */

	var CRC_TABLE = (function () {
		var table = new Uint32Array(256);
		for (var n = 0; n < 256; n++) {
			var c = n;
			for (var k = 0; k < 8; k++) {
				c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
			}
			table[n] = c >>> 0;
		}
		return table;
	})();

	function crc32(bytes) {
		var c = 0xffffffff;
		for (var i = 0; i < bytes.length; i++) {
			c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
		}
		return (c ^ 0xffffffff) >>> 0;
	}

	function utf8Encode(str) {
		if (typeof TextEncoder !== "undefined") return new TextEncoder().encode(str);
		var out = [];
		for (var i = 0; i < str.length; i++) {
			var c = str.charCodeAt(i);
			if (c < 0x80) out.push(c);
			else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 0x3f));
			else out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 0x3f), 0x80 | (c & 0x3f));
		}
		return new Uint8Array(out);
	}

	function dosDateTime(date) {
		var d = date || new Date();
		var year = d.getFullYear();
		if (year < 1980) year = 1980;
		return {
			time: ((d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1)) & 0xffff,
			date: (((year - 1980) << 9) | ((d.getMonth() + 1) << 5) | d.getDate()) & 0xffff,
		};
	}

	function u32(view, off, v) {
		view.setUint32(off, v >>> 0, true);
	}
	function u16(view, off, v) {
		view.setUint16(off, v & 0xffff, true);
	}

	/**
	 * 生成 ZIP(不压缩, 音频本身已是压缩格式)
	 * @param {Array<{name: string, data: Uint8Array}>} entries
	 * @param {Date} [when]
	 * @returns {{chunks: Uint8Array[], size: number}}
	 */
	function zipStore(entries, when) {
		var dt = dosDateTime(when);
		var chunks = [];
		var central = [];
		var offset = 0;
		var total = 0;

		for (var i = 0; i < entries.length; i++) {
			var entry = entries[i];
			var nameBytes = utf8Encode(entry.name);
			var data = entry.data;
			var crc = crc32(data);

			if (offset + data.length > 0xffffffff) {
				throw new Error("打包内容超过 4GB, 请分批转换");
			}

			var header = new Uint8Array(30 + nameBytes.length);
			var hv = new DataView(header.buffer);
			u32(hv, 0, 0x04034b50);
			u16(hv, 4, 20); // version needed
			u16(hv, 6, 0x0800); // UTF-8 文件名
			u16(hv, 8, 0); // 存储, 不压缩
			u16(hv, 10, dt.time);
			u16(hv, 12, dt.date);
			u32(hv, 14, crc);
			u32(hv, 18, data.length);
			u32(hv, 22, data.length);
			u16(hv, 26, nameBytes.length);
			u16(hv, 28, 0);
			header.set(nameBytes, 30);

			var cRec = new Uint8Array(46 + nameBytes.length);
			var cv = new DataView(cRec.buffer);
			u32(cv, 0, 0x02014b50);
			u16(cv, 4, 20); // version made by
			u16(cv, 6, 20); // version needed
			u16(cv, 8, 0x0800);
			u16(cv, 10, 0);
			u16(cv, 12, dt.time);
			u16(cv, 14, dt.date);
			u32(cv, 16, crc);
			u32(cv, 20, data.length);
			u32(cv, 24, data.length);
			u16(cv, 28, nameBytes.length);
			u16(cv, 30, 0);
			u16(cv, 32, 0);
			u16(cv, 34, 0);
			u16(cv, 36, 0);
			u32(cv, 38, 0);
			u32(cv, 42, offset);
			cRec.set(nameBytes, 46);

			chunks.push(header, data);
			central.push(cRec);
			offset += header.length + data.length;
			total += header.length + data.length;
		}

		var cdSize = 0;
		for (var c = 0; c < central.length; c++) cdSize += central[c].length;

		var eocd = new Uint8Array(22);
		var ev = new DataView(eocd.buffer);
		u32(ev, 0, 0x06054b50);
		u16(ev, 4, 0);
		u16(ev, 6, 0);
		u16(ev, 8, central.length);
		u16(ev, 10, central.length);
		u32(ev, 12, cdSize);
		u32(ev, 16, offset);
		u16(ev, 20, 0);

		for (var d = 0; d < central.length; d++) chunks.push(central[d]);
		chunks.push(eocd);

		return { chunks: chunks, size: total + cdSize + 22 };
	}

	/* ============================ 文件名处理 ============================ */

	var ILLEGAL = /[\\/:*?"<>|\u0000-\u001f]/g;

	function sanitizeName(name, fallback) {
		var s = String(name == null ? "" : name)
			.replace(ILLEGAL, "_")
			.replace(/[.\s]+$/, "")
			.trim();
		if (s.length > 120) s = s.slice(0, 120);
		return s || fallback || "track";
	}

	function formatSize(bytes) {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
		return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
	}

	return {
		decryptNcm: decryptNcm,
		zipStore: zipStore,
		sniffFormat: sniffFormat,
		crc32: crc32,
		formatSize: formatSize,
		sanitizeName: sanitizeName,
		aes128EcbDecrypt: aes128EcbDecrypt,
		buildKeyBox: buildKeyBox,
		pkcs7Unpad: pkcs7Unpad,
	};
});
