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
	if (!root) return;
	var CORE = window.NCMCore;
	if (!CORE) {
		// 核心脚本没加载成功时不能默默无反应, 否则页面看起来就是"点了没动静"
		var errEl = document.getElementById("ncmStatus");
		if (errEl) {
			errEl.textContent = "核心脚本未加载成功, 请按 Ctrl+F5 强制刷新页面";
			errEl.className = "ncm-status err";
		}
		return;
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
				(r.state === "done" && r.audio
					? '<button type="button" class="ncm-dl" data-dl="' +
						i +
						'">下载</button>'
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
		setStatus("已保存:" + r.outName, "ok");
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
					"合计 " +
						CORE.formatSize(total) +
						", 打包会额外占一份内存, 可能很慢。\n确定继续吗? 也可以点每首右侧的「下载」单独保存。",
				)
			) {
				return;
			}
		}
		setStatus("正在打包 " + entries.length + " 个文件…");
		setTimeout(function () {
			try {
				var zip = CORE.zipStore(entries, new Date());
				saveBlob(
					new Blob(zip.chunks, { type: "application/zip" }),
					zipName(),
				);
				setStatus(
					"已保存压缩包 · " +
						entries.length +
						" 个文件 · " +
						CORE.formatSize(zip.size),
					"ok",
				);
			} catch (e) {
				setStatus("打包失败:" + ((e && e.message) || e), "err");
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

		// 只统计, 压缩包改成点按钮时才打包
		var count = 0;
		for (var m = 0; m < results.length; m++) {
			if (results[m].state === "done") count++;
		}

		busy = false;
		setProgress(files.length, files.length);
		renderList();

		if (!count) {
			setStatus("没有可输出的音频文件", "warn");
			return;
		}
		setStatus(
			"已完成 " +
				count +
				" 首 · 点每首右侧「下载」单独保存, 或点下方打包下载",
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
