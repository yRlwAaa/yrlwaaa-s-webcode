/**
 * 工具箱公共库 (纯计算, 无 DOM 依赖)
 * ------------------------------------------------------------------
 * 浏览器: 作为普通脚本加载后暴露 window.ToolKit
 * Node  : require('./tool-kit.js')
 *
 * 目前提供: CRC32 / ZIP(仅存储) 打包 / 文件大小格式化 / 文件名清洗。
 * 图片、音频这类已经是压缩格式的内容再用 deflate 压没有收益, 所以 ZIP 只存储不压缩。
 * (注: public/js/ncm-core.js 里有一份等价的内联实现, 为保持已上线工具不被改动而保留;
 *  新增工具一律走本文件。)
 */
(function (root, factory) {
	var api = factory();
	if (typeof module !== "undefined" && module.exports) {
		module.exports = api;
	}
	if (root) {
		root.ToolKit = api;
	}
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
	"use strict";

	/* ============================ CRC32 ============================ */

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

	/* ============================ UTF-8 ============================ */

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

	/* ============================ ZIP(仅存储) ============================ */

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
	 * 生成 ZIP(不压缩)
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
				throw new Error("打包内容超过 4GB, 请分批下载");
			}

			var header = new Uint8Array(30 + nameBytes.length);
			var hv = new DataView(header.buffer);
			u32(hv, 0, 0x04034b50);
			u16(hv, 4, 20);
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
			u16(cv, 4, 20);
			u16(cv, 6, 20);
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

	/* ============================ 杂项 ============================ */

	var ILLEGAL = /[\\/:*?"<>|\u0000-\u001f]/g;

	function sanitizeName(name, fallback) {
		var s = String(name == null ? "" : name)
			.replace(ILLEGAL, "_")
			.replace(/[.\s]+$/, "")
			.trim();
		if (s.length > 120) s = s.slice(0, 120);
		return s || fallback || "file";
	}

	function formatSize(bytes) {
		if (bytes < 1024) return bytes + " B";
		if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
		if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + " MB";
		return (bytes / 1024 / 1024 / 1024).toFixed(2) + " GB";
	}

	function stamp(date) {
		var d = date || new Date();
		var p = function (n) {
			return n < 10 ? "0" + n : String(n);
		};
		return (
			d.getFullYear() +
			p(d.getMonth() + 1) +
			p(d.getDate()) +
			"-" +
			p(d.getHours()) +
			p(d.getMinutes())
		);
	}

	return {
		crc32: crc32,
		zipStore: zipStore,
		utf8Encode: utf8Encode,
		sanitizeName: sanitizeName,
		formatSize: formatSize,
		stamp: stamp,
	};
});
