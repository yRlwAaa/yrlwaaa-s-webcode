/**
 * NCM 转换器页面交互
 * ------------------------------------------------------------------
 * 依赖 public/js/ncm-core.js 暴露的 window.NCMCore (纯计算)。
 * 本脚本以普通全局脚本加载, Swup 切换页面后会重新执行, 因此:
 *   1. 每次执行先撤销上一次挂在 window 上的监听(防止重复累积)
 *   2. 找不到页面根节点就直接退出(不在本页时不做事)
 * 所有解密与打包都在浏览器内存里完成, 文件不会离开本机。
 */
(function () {
	"use strict";

	/* ---------- 清理上一次执行残留的全局监听 ---------- */
	var prev = window.__ncmToolState;
	if (prev && typeof prev.detach === "function") {
		try {
			prev.detach();
		} catch (e) {}
	}
	window.__ncmToolState = { detach: null };

	/* ---------- 文案: 跟随站点语言(词条在 src/i18n/languages/*.ts) ---------- */
	function t(key, fallback) {
		try {
			var lang = document.documentElement.getAttribute("lang") || "";
			var d = window.I18N_DICTS || {};
			var dict =
				d[lang] || d[lang.toLowerCase()] || d[lang.split("_")[0]] || {};
			if (dict[key]) return dict[key];
		} catch (e) {}
		return fallback;
	}
	function tf(key, fallback, vars) {
		var s = t(key, fallback);
		for (var k in vars) s = s.split("{" + k + "}").join(vars[k]);
		return s;
	}

	var root = document.getElementById("ncmRoot");
	if (!root) return;
	var CORE = window.NCMCore;
	if (!CORE) {
		// 核心脚本没加载成功时不能默默无反应, 否则页面看起来就是"点了没动静"
		var errEl = document.getElementById("ncmStatus");
		if (errEl) {
			errEl.textContent = t(
				"toolCoreMissing",
				"核心脚本未加载成功, 请按 Ctrl+F5 强制刷新页面",
			);
			errEl.className = "ncm-status err";
		}
		return;
	}
	// 页面 HTML 与脚本版本对不上(Swup 页面缓存 / 浏览器缓存了旧页面)时明确提示, 避免"改了没生效"
	var VER = "3";
	if (window.__TOOL_VER && window.__TOOL_VER !== VER) {
		var verEl = document.getElementById("ncmStatus");
		if (verEl) {
			verEl.textContent = tf(
				"toolStatusVerMismatch",
				"页面是旧版本(页面 v{page} / 脚本 v{script}), 请按 Ctrl+F5 强制刷新",
				{ page: window.__TOOL_VER, script: VER },
			);
			verEl.className = "ncm-status err";
		}
	}

	/* ---------- 音频格式标签: 由 ncm-core 的 info.formatKey 映射到词条 ---------- */
	// 旧版 ncm-core(浏览器缓存)可能没有 formatKey, 此时回落到它给的中文 label
	var FMT_KEYS = {
		flac: "toolFmtFlac",
		mp3: "toolFmtMp3",
		ogg: "toolFmtOgg",
		m4a: "toolFmtM4a",
		wav: "toolFmtWav",
		bin: "toolFmtBin",
	};
	var FMT_FALLBACK = {
		flac: "FLAC 无损",
		mp3: "MP3 有损",
		ogg: "OGG",
		m4a: "M4A",
		wav: "WAV",
		bin: "未知格式",
	};
	function fmtLabel(formatKey, fallbackLabel) {
		var key = FMT_KEYS[formatKey];
		if (!key) return fallbackLabel || t("toolFmtBin", "未知格式");
		return t(key, FMT_FALLBACK[formatKey]);
	}

	var dropEl = document.getElementById("ncmDrop");
	var inputEl = document.getElementById("ncmInput");
	var listEl = document.getElementById("ncmList");
	var statusEl = document.getElementById("ncmStatus");
	var outEl = document.getElementById("ncmOut");
	var barWrap = document.getElementById("ncmBarWrap");
	var barEl = document.getElementById("ncmBar");
	var dlBtn = document.getElementById("ncmDownload");
	var clearBtn = document.getElementById("ncmClear");
	var pickBtn = document.getElementById("ncmPick");
	var optLossless = document.getElementById("ncmLosslessOnly");
	var optCover = document.getElementById("ncmCover");

	var results = [];
	var busy = false;
	var staleUrls = [];

	/** 延迟释放旧的 blob 地址, 避免打断正在进行的下载 */
	function releaseLater(url) {
		if (!url) return;
		staleUrls.push(url);
		var list = staleUrls;
		setTimeout(function () {
			for (var i = 0; i < list.length; i++) {
				try {
					URL.revokeObjectURL(list[i]);
				} catch (e) {}
			}
			list.length = 0;
		}, 60000);
		staleUrls = [];
	}

	function esc(s) {
		return String(s == null ? "" : s)
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	}

	function tick() {
		return new Promise(function (r) {
			setTimeout(r, 0);
		});
	}

	function setStatus(text, kind) {
		statusEl.textContent = text || "";
		statusEl.className = "ncm-status" + (kind ? " " + kind : "");
	}

	function setProgress(done, total) {
		if (!total) {
			barWrap.hidden = true;
			return;
		}
		barWrap.hidden = false;
		barEl.style.width = Math.round((done / total) * 100) + "%";
	}

	/* ---------- 列表渲染 ---------- */
	function renderList() {
		var sumEl = document.getElementById("ncmSum");
		if (!results.length) {
			listEl.innerHTML = "";
			outEl.hidden = true;
			if (sumEl) sumEl.hidden = true;
			return;
		}
		assignNames();
		var html = "";
		var usable = 0;
		var usableSize = 0;
		var inUsedSize = 0;
		var pendCount = 0;
		var failCount = 0;
		var inAll = 0;
		for (var i = 0; i < results.length; i++) {
			var r = results[i];
			var cls = "ncm-row";
			var badge = "";
			var note = "";
			inAll += r.srcSize || 0;
			if (r.state === "done") {
				cls += r.lossless ? " ok" : " ok lossy";
				badge =
					'<span class="ncm-badge">' +
					esc(fmtLabel(r.formatKey, r.formatLabel)) +
					"</span>";
				var pct = r.srcSize
					? Math.round((1 - r.size / r.srcSize) * 100)
					: 0;
				note =
					"NCM " +
					CORE.formatSize(r.srcSize) +
					"  →  " +
					(r.outName ? esc(r.outName) + " · " : "") +
					CORE.formatSize(r.size) +
					(pct > 1
						? tf("toolPctSaved", " · 省 {n}%", { n: pct })
						: pct < -1
							? tf("toolPctBigger", " · 增大 {n}%", { n: -pct })
							: "");
				usable++;
				usableSize += r.size;
				inUsedSize += r.srcSize;
			} else if (r.state === "skip") {
				cls += " skip";
				badge = '<span class="ncm-badge dim">' + esc(t("toolSkipped", "已跳过")) + "</span>";
				note =
					"NCM " +
					CORE.formatSize(r.srcSize) +
					" · " +
					esc(r.note);
			} else if (r.state === "fail") {
				cls += " bad";
				badge = '<span class="ncm-badge red">' + esc(t("toolFail", "失败")) + "</span>";
				note =
					"NCM " +
					CORE.formatSize(r.srcSize) +
					" · " +
					esc(r.note);
				failCount++;
			} else {
				// 还没解密完也先把原始大小列出来
				badge =
					'<span class="ncm-badge dim">' +
					esc(r.note || t("toolStatusProcessing", "处理中")) +
					"</span>";
				note = "NCM " + CORE.formatSize(r.srcSize);
				pendCount++;
			}
			html +=
				'<div class="' +
				cls +
				'">' +
				'<div class="ncm-row-main">' +
				'<div class="ncm-row-name">' +
				esc(r.label) +
				"</div>" +
				(note ? '<div class="ncm-row-note">' + note + "</div>" : "") +
				"</div>" +
				badge +
				(r.state === "done" && r.audio
					? '<button type="button" class="ncm-dl" data-dl="' +
						i +
						'">' +
						esc(t("toolDownload", "下载")) +
						"</button>"
					: "") +
				"</div>";
		}
		listEl.innerHTML = html;

		// 合计: 输入总量 → 输出总量
		if (sumEl) {
			var savedPct =
				inUsedSize > usableSize
					? Math.round((1 - usableSize / inUsedSize) * 100)
					: 0;
			var text = "";
			if (usable > 0) {
				text = tf("toolSumInOutNcm", "共 {n} 首 · 输入 {in} → 输出 {out}", {
					n: results.length,
					in: CORE.formatSize(inUsedSize),
					out: CORE.formatSize(usableSize),
				});
				if (savedPct > 0) text += tf("toolPctSaved", " · 省 {n}%", { n: savedPct });
			} else {
				text = tf("toolSumInNcm", "共 {n} 首 · 输入合计 {in}", {
					n: results.length,
					in: CORE.formatSize(inAll),
				});
				if (pendCount) text += t("toolSumDecrypting", " · 解密中…");
			}
			if (failCount) text += tf("toolSumFailNcm", " · {n} 首失败", { n: failCount });
			if (usable > 0 && pendCount)
				text += tf("toolSumPendNcm", " · {n} 首待处理", { n: pendCount });
			sumEl.textContent = text;
			sumEl.hidden = false;
		}

		if (usable > 0) {
			outEl.hidden = false;
			dlBtn.textContent =
				t("toolZip", "打包下载") +
				" (" +
				usable +
				" · " +
				CORE.formatSize(usableSize) +
				")";
			dlBtn.disabled = false;
		} else {
			outEl.hidden = true;
			dlBtn.disabled = true;
		}
	}

	/* ---------- 输出命名 ---------- */
	function buildOutputName(info, fallbackBase) {
		var base = "";
		if (info.title) {
			base = info.artist ? info.artist + " - " + info.title : info.title;
		}
		if (!base) base = fallbackBase;
		return CORE.sanitizeName(base, "track");
	}

	// 每次渲染前重算输出名, 重名自动加序号
	function assignNames() {
		var used = {};
		for (var i = 0; i < results.length; i++) {
			var r = results[i];
			if (r.state !== "done" || !r.ext) continue;
			var name = r.base + "." + r.ext;
			var n = 2;
			while (used[name]) {
				name = r.base + " (" + n + ")." + r.ext;
				n++;
			}
			used[name] = true;
			r.outName = name;
		}
	}

	/* ---------- 下载 ---------- */
	var MIME_BY_EXT = {
		flac: "audio/flac",
		mp3: "audio/mpeg",
		m4a: "audio/mp4",
		ogg: "audio/ogg",
		wav: "audio/wav",
	};

	function saveBlob(blob, filename) {
		var url = URL.createObjectURL(blob);
		var a = document.createElement("a");
		a.href = url;
		a.download = filename;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		releaseLater(url);
	}

	function saveOne(index) {
		var r = results[index];
		if (!r || r.state !== "done" || !r.audio) return;
		saveBlob(
			new Blob([r.audio], {
				type: MIME_BY_EXT[r.ext] || "application/octet-stream",
			}),
			r.outName,
		);
		if (r.withCover && r.cover && r.cover.length) {
			saveBlob(
				new Blob([r.cover], { type: "image/" + (r.coverExt === "png" ? "png" : "jpeg") }),
				r.base + "." + (r.coverExt || "jpg"),
			);
		}
		setStatus(tf("toolStatusSaved", "已保存: {name}", { name: r.outName }), "ok");
	}

	// 压缩包改成点的时候才打包, 不点就不占内存
	function saveZip() {
		var entries = [];
		var total = 0;
		for (var i = 0; i < results.length; i++) {
			var r = results[i];
			if (r.state !== "done" || !r.audio) continue;
			entries.push({ name: r.outName, data: r.audio });
			total += r.audio.length;
			if (r.withCover && r.cover && r.cover.length) {
				entries.push({ name: r.base + "." + (r.coverExt || "jpg"), data: r.cover });
				total += r.cover.length;
			}
		}
		if (!entries.length) return;
		if (total > 1.5 * 1024 * 1024 * 1024) {
			if (
				!window.confirm(
					tf(
						"toolZipWarn",
						"合计 {size}, 打包会额外占一份内存, 可能很慢。\n确定继续吗? 也可以点每首右侧的「下载」单个保存。",
						{ size: CORE.formatSize(total) },
					),
				)
			) {
				return;
			}
		}
		setStatus(tf("toolStatusZipping", "正在打包 {n} 个文件…", { n: entries.length }));
		setTimeout(function () {
			try {
				var zip = CORE.zipStore(entries, new Date());
				saveBlob(
					new Blob(zip.chunks, { type: "application/zip" }),
					zipName(),
				);
				setStatus(
					tf("toolStatusZipSaved", "已保存压缩包 · {n} 个文件 · {size}", {
						n: entries.length,
						size: CORE.formatSize(zip.size),
					}),
					"ok",
				);
			} catch (e) {
				setStatus(
					t("toolStatusZipFail", "打包失败: ") + ((e && e.message) || e),
					"err",
				);
			}
		}, 0);
	}

	/* ---------- 主流程 ---------- */
	async function handleFiles(fileList) {
		if (busy) return;
		var files = [];
		var ignored = 0;
		for (var i = 0; i < fileList.length; i++) {
			var f = fileList[i];
			if (/\.ncm$/i.test(f.name || "")) files.push(f);
			else ignored++;
		}
		if (ignored > 0) {
			setStatus(
				tf("toolStatusIgnored", "已忽略 {n} 个非目标格式文件", { n: ignored }),
				"warn",
			);
		}
		if (!files.length) {
			if (!ignored) setStatus(t("toolStatusNothing", "没有选择文件"), "warn");
			return;
		}

		busy = true;
		dlBtn.disabled = true;
		var onlyLossless = !!(optLossless && optLossless.checked);
		var withCover = !!(optCover && optCover.checked);

		var startIndex = results.length;
		for (var k = 0; k < files.length; k++) {
			results.push({
				label: files[k].name,
				srcSize: files[k].size || 0,
				state: "work",
				note: t("toolStatusQueued", "排队中"),
			});
		}
		renderList();

		for (var n = 0; n < files.length; n++) {
			var file = files[n];
			var rec = results[startIndex + n];
			rec.note = t("toolStatusReading", "读取文件…");
			setProgress(n, files.length);
			setStatus(
				tf("toolStatusWorking", "正在处理 {done} / {total} · {name}", {
					done: n + 1,
					total: files.length,
					name: file.name,
				}),
			);
			renderList();
			await tick();

			try {
				var buffer = await file.arrayBuffer();
				rec.note = t("toolStatusDecrypting", "解密中…");
				renderList();
				await tick();

				var decoded = CORE.decryptNcm(buffer);
				var info = decoded.info;
				if (info.format === "bin") {
					throw new Error(
						t("toolErrUnknownFormat", "还原出的音频格式无法识别"),
					);
				}
				if (onlyLossless && !info.lossless) {
					rec.state = "skip";
					rec.note = tf(
						"toolNcmSkip",
						"有损音频({format}), 按设置跳过",
						{ format: fmtLabel(info.formatKey, info.formatLabel) },
					);
					renderList();
					continue;
				}
				rec.state = "done";
				rec.audio = decoded.audio;
				rec.cover = decoded.cover;
				rec.coverExt = info.coverExt || "jpg";
				rec.size = decoded.audio.length;
				rec.lossless = info.lossless;
				rec.formatKey = info.formatKey;
				rec.formatLabel = info.formatLabel;
				rec.base = buildOutputName(
					info,
					String(file.name).replace(/\.ncm$/i, ""),
				);
				rec.ext = info.ext;
				rec.withCover = withCover;
			} catch (err) {
				rec.state = "fail";
				rec.note = (err && err.message) || t("toolErrDecrypt", "解密失败");
			}
			renderList();
			await tick();
		}

		// 只统计, 压缩包改成点按钮时才打包
		var count = 0;
		for (var m = 0; m < results.length; m++) {
			if (results[m].state === "done") count++;
		}

		busy = false;
		setProgress(files.length, files.length);
		renderList();

		if (!count) {
			setStatus(t("toolStatusNoOutputNcm", "没有可输出的音频文件"), "warn");
			return;
		}
		setStatus(
			tf(
				"toolStatusDoneNcm",
				"已完成 {n} 首 · 点每首右侧「下载」单个保存, 或点下方打包下载",
				{ n: count },
			),
			"ok",
		);
		setTimeout(function () {
			barWrap.hidden = true;
		}, 1200);
	}

	function pad(n) {
		return n < 10 ? "0" + n : String(n);
	}

	function zipName() {
		var d = new Date();
		return (
			"ncm-flac-" +
			d.getFullYear() +
			pad(d.getMonth() + 1) +
			pad(d.getDate()) +
			"-" +
			pad(d.getHours()) +
			pad(d.getMinutes()) +
			".zip"
		);
	}

	/* ---------- 事件 ---------- */
	var detachFns = [];

	function on(el, type, fn, opts) {
		if (!el) return;
		el.addEventListener(type, fn, opts);
		detachFns.push(function () {
			el.removeEventListener(type, fn, opts);
		});
	}

	// 拖拽
	var dragDepth = 0;
	function highlight(on) {
		dropEl.classList[on ? "add" : "remove"]("over");
	}
	on(dropEl, "dragenter", function (e) {
		e.preventDefault();
		dragDepth++;
		highlight(true);
	});
	on(dropEl, "dragover", function (e) {
		e.preventDefault();
		if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
		highlight(true);
	});
	on(dropEl, "dragleave", function (e) {
		e.preventDefault();
		dragDepth = Math.max(0, dragDepth - 1);
		if (!dragDepth) highlight(false);
	});
	on(dropEl, "drop", function (e) {
		e.preventDefault();
		dragDepth = 0;
		highlight(false);
		if (e.dataTransfer && e.dataTransfer.files) handleFiles(e.dataTransfer.files);
	});
	// 点拖拽区打开文件选择框。必须挡住 input 自己冒泡上来的那次点击,
	// 否则 input.click() → 事件冒泡回这里 → 又 input.click() → 无限递归爆栈, 选择框根本打不开。
	on(dropEl, "click", function (e) {
		if (e && e.target === inputEl) return;
		inputEl.click();
	});
	on(pickBtn, "click", function (e) {
		e.stopPropagation();
		inputEl.click();
	});
	on(inputEl, "click", function (e) {
		if (e && e.stopPropagation) e.stopPropagation();
	});
	on(inputEl, "change", function () {
		if (inputEl.files && inputEl.files.length) handleFiles(inputEl.files);
		inputEl.value = "";
	});

	// 每首右侧的「下载」: 事件委托, 列表重绘也不用重新绑
	on(listEl, "click", function (e) {
		var t = e && e.target;
		var btn = t && t.closest ? t.closest("[data-dl]") : null;
		if (!btn) return;
		e.preventDefault();
		e.stopPropagation();
		saveOne(parseInt(btn.getAttribute("data-dl"), 10));
	});

	// 避免拖到页面其它位置时浏览器直接打开文件
	function stopWin(e) {
		if (!document.getElementById("ncmRoot")) {
			detachWin();
			return;
		}
		e.preventDefault();
	}
	function onWinDrop(e) {
		if (!document.getElementById("ncmRoot")) {
			detachWin();
			return;
		}
		e.preventDefault();
	}
	function detachWin() {
		window.removeEventListener("dragover", stopWin);
		window.removeEventListener("drop", onWinDrop);
	}
	window.addEventListener("dragover", stopWin);
	window.addEventListener("drop", onWinDrop);

	on(dlBtn, "click", function () {
		saveZip();
	});

	on(clearBtn, "click", function () {
		if (busy) return;
		results = [];
		renderList();
		setStatus("");
		barWrap.hidden = true;
	});

	window.__ncmToolState = {
		detach: function () {
			for (var i = 0; i < detachFns.length; i++) detachFns[i]();
			detachFns = [];
			detachWin();
		},
	};

	setStatus("");
	renderList();
})();
