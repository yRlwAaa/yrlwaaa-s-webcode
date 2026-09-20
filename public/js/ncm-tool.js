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

	var root = document.getElementById("ncmRoot");
	var CORE = window.NCMCore;
	if (!root || !CORE) return;

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
	var lastUrl = null;
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
				badge = '<span class="ncm-badge">' + esc(r.formatLabel) + "</span>";
				var pct = r.srcSize
					? Math.round((1 - r.size / r.srcSize) * 100)
					: 0;
				note =
					"NCM " +
					CORE.formatSize(r.srcSize) +
					"  →  " +
					(r.outName ? esc(r.outName) + " · " : "") +
					CORE.formatSize(r.size) +
					(pct > 1 ? " · 省 " + pct + "%" : pct < -1 ? " · 大 " + -pct + "%" : "");
				usable++;
				usableSize += r.size;
				inUsedSize += r.srcSize;
			} else if (r.state === "skip") {
				cls += " skip";
				badge = '<span class="ncm-badge dim">已跳过</span>';
				note =
					"NCM " +
					CORE.formatSize(r.srcSize) +
					" · " +
					esc(r.note);
			} else if (r.state === "fail") {
				cls += " bad";
				badge = '<span class="ncm-badge red">失败</span>';
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
					esc(r.note === "排队中" ? "排队中" : r.note || "处理中") +
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
				text =
					"共 " +
					results.length +
					" 首 · 输入 " +
					CORE.formatSize(inUsedSize) +
					" → 输出 " +
					CORE.formatSize(usableSize) +
					(savedPct > 0 ? " · 省 " + savedPct + "%" : "");
			} else {
				text = "共 " + results.length + " 首 · 输入合计 " + CORE.formatSize(inAll);
				if (pendCount) text += " · 解密中…";
			}
			if (failCount) text += " · " + failCount + " 首失败";
			if (usable > 0 && pendCount) text += " · " + pendCount + " 首待处理";
			sumEl.textContent = text;
			sumEl.hidden = false;
		}

		if (usable > 0) {
			outEl.hidden = false;
			dlBtn.textContent =
				"下载压缩包 (" + usable + " 首 · " + CORE.formatSize(usableSize) + ")";
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

	function uniqueName(used, base, ext) {
		var name = base + "." + ext;
		var n = 2;
		while (used[name]) {
			name = base + " (" + n + ")." + ext;
			n++;
		}
		used[name] = true;
		return name;
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
			setStatus("已忽略 " + ignored + " 个非 .ncm 文件", "warn");
		}
		if (!files.length) {
			if (!ignored) setStatus("没有选择文件", "warn");
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
				note: "排队中",
			});
		}
		renderList();

		for (var n = 0; n < files.length; n++) {
			var file = files[n];
			var rec = results[startIndex + n];
			rec.note = "读取文件…";
			setProgress(n, files.length);
			setStatus(
				"正在处理 " + (n + 1) + " / " + files.length + " · " + file.name,
			);
			renderList();
			await tick();

			try {
				var buffer = await file.arrayBuffer();
				rec.note = "解密中…";
				renderList();
				await tick();

				var decoded = CORE.decryptNcm(buffer);
				var info = decoded.info;
				if (info.format === "bin") {
					throw new Error("还原出的音频格式无法识别");
				}
				if (onlyLossless && !info.lossless) {
					rec.state = "skip";
					rec.note = "有损音频(" + info.formatLabel + "), 按设置跳过";
					renderList();
					continue;
				}
				rec.state = "done";
				rec.audio = decoded.audio;
				rec.cover = decoded.cover;
				rec.coverExt = info.coverExt || "jpg";
				rec.size = decoded.audio.length;
				rec.lossless = info.lossless;
				rec.formatLabel = info.formatLabel;
				rec.base = buildOutputName(
					info,
					String(file.name).replace(/\.ncm$/i, ""),
				);
				rec.ext = info.ext;
				rec.withCover = withCover;
			} catch (err) {
				rec.state = "fail";
				rec.note = (err && err.message) || "解密失败";
			}
			renderList();
			await tick();
		}

		// 生成压缩包
		var used = {};
		var entries = [];
		var count = 0;
		// 之前几批已经定过名字的先占位, 避免同名覆盖
		for (var p = 0; p < results.length; p++) {
			if (results[p].outName) used[results[p].outName] = true;
		}
		for (var m = 0; m < results.length; m++) {
			var it = results[m];
			if (it.state !== "done" || it.zipped) continue;
			var name = uniqueName(used, it.base, it.ext);
			it.outName = name;
			entries.push({ name: name, data: it.audio });
			if (it.withCover && it.cover && it.cover.length) {
				var coverName = uniqueName(used, it.base, it.coverExt || "jpg");
				entries.push({ name: coverName, data: it.cover });
			}
			it.zipped = true;
			count++;
		}

		busy = false;
		setProgress(files.length, files.length);

		if (!count) {
			setStatus("没有可输出的音频文件", "warn");
			renderList();
			return;
		}
		try {
			var zip = CORE.zipStore(entries, new Date());
			releaseLater(lastUrl);
			lastUrl = URL.createObjectURL(
				new Blob(zip.chunks, { type: "application/zip" }),
			);
			dlBtn.dataset.url = lastUrl;
			dlBtn.dataset.name = zipName();
			setStatus(
				"已完成 " +
					count +
					" 首 · 压缩包 " +
					CORE.formatSize(zip.size) +
					" · 点击下方按钮保存",
				"ok",
			);
		} catch (e) {
			setStatus("打包失败:" + ((e && e.message) || e), "err");
		}
		renderList();
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
	on(dropEl, "click", function () {
		inputEl.click();
	});
	on(pickBtn, "click", function (e) {
		e.stopPropagation();
		inputEl.click();
	});
	on(inputEl, "change", function () {
		if (inputEl.files && inputEl.files.length) handleFiles(inputEl.files);
		inputEl.value = "";
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
		var url = dlBtn.dataset.url;
		if (!url) return;
		var a = document.createElement("a");
		a.href = url;
		a.download = dlBtn.dataset.name || "ncm-flac.zip";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setStatus("压缩包已开始保存到本地下载目录", "ok");
	});

	on(clearBtn, "click", function () {
		if (busy) return;
		results = [];
		releaseLater(lastUrl);
		lastUrl = null;
		dlBtn.dataset.url = "";
		renderList();
		setStatus("");
		barWrap.hidden = true;
	});

	window.__ncmToolState = {
		detach: function () {
			for (var i = 0; i < detachFns.length; i++) detachFns[i]();
			detachFns = [];
			detachWin();
			releaseLater(lastUrl);
			lastUrl = null;
		},
	};

	setStatus("");
	renderList();
})();
