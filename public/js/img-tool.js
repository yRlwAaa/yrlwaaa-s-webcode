/**
 * 图片转换器页面交互
 * ------------------------------------------------------------------
 * 依赖 public/js/tool-kit.js 暴露的 window.ToolKit (ZIP 打包等纯计算)。
 * 解码与编码全部走浏览器原生能力 (createImageBitmap / canvas),
 * 不引入任何第三方库, 不上传任何文件。
 *
 * 要点:
 *   - 编码能力运行时探测: canvas 对不支持的格式会静默回退成 PNG,
 *     所以必须拿返回 blob 的 type 判断, 不能只看浏览器版本。
 *   - 缩放逐级折半: 一步从 4000px 拉到 800px 会出锯齿/摩尔纹。
 *   - EXIF 方向: createImageBitmap 传 imageOrientation: "from-image";
 *     不支持该参数时回退 <img>, 由浏览器默认的 from-image 处理。
 *   - JPEG 不支持透明, 转 JPEG 前先铺白底, 否则透明区变黑。
 *
 * Swup 切换页面后本脚本会重新执行, 所以每次先撤销上一次挂的 window 监听。
 */
(function () {
	"use strict";

	var prev = window.__imgToolState;
	if (prev && typeof prev.detach === "function") {
		try {
			prev.detach();
		} catch (e) {}
	}
	window.__imgToolState = { detach: null };

	var root = document.getElementById("imgRoot");
	var KIT = window.ToolKit;
	if (!root || !KIT) return;

	var dropEl = document.getElementById("imgDrop");
	var inputEl = document.getElementById("imgInput");
	var pickBtn = document.getElementById("imgPick");
	var listEl = document.getElementById("imgList");
	var statusEl = document.getElementById("imgStatus");
	var outEl = document.getElementById("imgOut");
	var barWrap = document.getElementById("imgBarWrap");
	var barEl = document.getElementById("imgBar");
	var dlBtn = document.getElementById("imgDownload");
	var clearBtn = document.getElementById("imgClear");
	var rerunBtn = document.getElementById("imgRerun");
	var fmtSel = document.getElementById("imgFormat");
	var widthSel = document.getElementById("imgMaxWidth");
	var qRange = document.getElementById("imgQuality");
	var qVal = document.getElementById("imgQualityVal");
	var fmtHint = document.getElementById("imgFormatHint");

	var MIME = {
		webp: "image/webp",
		png: "image/png",
		jpeg: "image/jpeg",
		avif: "image/avif",
	};
	var EXT = { webp: "webp", png: "png", jpeg: "jpg", avif: "avif" };
	var LABEL = {
		webp: "WebP",
		png: "PNG",
		jpeg: "JPEG",
		avif: "AVIF",
	};

	var supported = { webp: true, png: true, jpeg: true, avif: false };
	var items = [];
	var busy = false;
	var stale = false;
	var ignoredTotal = 0;
	var lastUrl = null;
	var staleUrls = [];

	/* ---------- 小工具 ---------- */
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
		statusEl.className = "img-status" + (kind ? " " + kind : "");
	}
	function setProgress(done, total) {
		if (!total) {
			barWrap.hidden = true;
			return;
		}
		barWrap.hidden = false;
		barEl.style.width = Math.round((done / total) * 100) + "%";
	}
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

	/* ---------- canvas 封装 ---------- */
	function makeCanvas(w, h) {
		var c = document.createElement("canvas");
		c.width = w;
		c.height = h;
		return c;
	}
	function toBlob(canvas, type, quality) {
		return new Promise(function (resolve) {
			try {
				if (typeof canvas.toBlob === "function") {
					canvas.toBlob(function (b) {
						resolve(b || null);
					}, type, quality);
				} else if (typeof canvas.convertToBlob === "function") {
					canvas.convertToBlob({ type: type, quality: quality }).then(resolve, function () {
						resolve(null);
					});
				} else {
					resolve(null);
				}
			} catch (e) {
				resolve(null);
			}
		});
	}

	/* ---------- 解码 ---------- */
	// SVG 没有固有像素尺寸的时候(只有 viewBox), 从源码里推一个出来
	function svgIntrinsicSize(txt) {
		var w = 0;
		var h = 0;
		var s = txt || "";
		var vb = /viewBox\s*=\s*["']\s*([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)[\s,]+([-\d.]+)/i.exec(s);
		if (vb) {
			w = parseFloat(vb[3]);
			h = parseFloat(vb[4]);
		}
		if (!w || !h) {
			var mw = /width\s*=\s*["'](\d+(?:\.\d+)?)/i.exec(s);
			var mh = /height\s*=\s*["'](\d+(?:\.\d+)?)/i.exec(s);
			w = mw ? parseFloat(mw[1]) : 0;
			h = mh ? parseFloat(mh[1]) : 0;
		}
		if (!w || !h) {
			w = 1024;
			h = 1024;
		}
		return { w: w, h: h };
	}

	function loadViaImg(file) {
		return new Promise(function (resolve, reject) {
			var url = URL.createObjectURL(file);
			var img = new Image();
			img.onload = function () {
				var w = img.naturalWidth || img.width;
				var h = img.naturalHeight || img.height;
				if (!w || !h) {
					var isSvg =
						file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
					if (isSvg && typeof file.text === "function") {
						file.text().then(
							function (txt) {
								var d = svgIntrinsicSize(txt);
								resolve({
									source: img,
									width: d.w,
									height: d.h,
									cleanup: function () {
										URL.revokeObjectURL(url);
									},
								});
							},
							function () {
								URL.revokeObjectURL(url);
								reject(new Error("读不到图片尺寸"));
							},
						);
						return;
					}
					URL.revokeObjectURL(url);
					reject(new Error("读不到图片尺寸"));
					return;
				}
				resolve({
					source: img,
					width: w,
					height: h,
					cleanup: function () {
						URL.revokeObjectURL(url);
					},
				});
			};
			img.onerror = function () {
				URL.revokeObjectURL(url);
				reject(new Error("浏览器无法解码这个格式"));
			};
			img.src = url;
		});
	}

	function loadImage(file) {
		var isSvg = file.type === "image/svg+xml" || /\.svg$/i.test(file.name || "");
		if (!isSvg && typeof window.createImageBitmap === "function") {
			return window
				.createImageBitmap(file, { imageOrientation: "from-image" })
				.then(function (bmp) {
					return {
						source: bmp,
						width: bmp.width,
						height: bmp.height,
						cleanup: function () {
							if (bmp.close) bmp.close();
						},
					};
				})
				.catch(function () {
					return loadViaImg(file);
				});
		}
		return loadViaImg(file);
	}

	/* ---------- 缩放 + 编码 ---------- */
	function drawScaled(ctx, src, sw, sh, tw, th) {
		var cur = src;
		var cw = sw;
		var ch = sh;
		var guard = 0;
		// 逐级折半, 避免一步大比例缩放出锯齿
		while ((cw > tw * 2 || ch > th * 2) && guard++ < 12) {
			var nw = Math.max(tw, Math.floor(cw / 2));
			var nh = Math.max(th, Math.floor(ch / 2));
			var tmp = makeCanvas(nw, nh);
			var tctx = tmp.getContext("2d");
			tctx.imageSmoothingEnabled = true;
			tctx.imageSmoothingQuality = "high";
			tctx.drawImage(cur, 0, 0, cw, ch, 0, 0, nw, nh);
			cur = tmp;
			cw = nw;
			ch = nh;
		}
		ctx.drawImage(cur, 0, 0, cw, ch, 0, 0, tw, th);
	}

	function convert(file, opts) {
		return loadImage(file).then(function (loaded) {
			var done = function (r) {
				loaded.cleanup();
				return r;
			};
			try {
				var tw = loaded.width;
				var th = loaded.height;
				if (opts.maxWidth && tw > opts.maxWidth) {
					th = Math.max(1, Math.round((th * opts.maxWidth) / tw));
					tw = opts.maxWidth;
				}
				var canvas = makeCanvas(tw, th);
				var ctx = canvas.getContext("2d");
				if (!ctx) throw new Error("取不到 canvas 上下文");
				// JPEG 不支持透明 → 先铺白底
				if (opts.format === "jpeg") {
					ctx.fillStyle = "#ffffff";
					ctx.fillRect(0, 0, tw, th);
				}
				ctx.imageSmoothingEnabled = true;
				ctx.imageSmoothingQuality = "high";
				drawScaled(ctx, loaded.source, loaded.width, loaded.height, tw, th);
				var quality = opts.format === "png" ? undefined : opts.quality / 100;
				return toBlob(canvas, MIME[opts.format], quality).then(function (blob) {
					if (!blob || blob.type !== MIME[opts.format]) {
						throw new Error(
							"当前浏览器不支持导出 " + LABEL[opts.format],
						);
					}
					return done({
						blob: blob,
						width: tw,
						height: th,
						origWidth: loaded.width,
						origHeight: loaded.height,
					});
				});
			} catch (e) {
				loaded.cleanup();
				throw e;
			}
		});
	}

	/* ---------- 选项 ---------- */
	function readOptions() {
		var fmt = (fmtSel && fmtSel.value) || "webp";
		if (!supported[fmt]) {
			var fallback = null;
			for (var k in supported) {
				if (supported[k]) {
					fallback = k;
					break;
				}
			}
			fmt = fallback || "png";
		}
		return {
			format: fmt,
			maxWidth: widthSel ? parseInt(widthSel.value, 10) || 0 : 0,
			quality: qRange ? parseInt(qRange.value, 10) || 80 : 80,
		};
	}

	function syncQualityState() {
		var fmt = (fmtSel && fmtSel.value) || "webp";
		var lossless = fmt === "png";
		if (qRange) qRange.disabled = lossless;
		if (qVal) qVal.textContent = lossless ? "无损" : (qRange ? qRange.value : "80");
		if (fmtHint) {
			if (lossless) {
				fmtHint.textContent = "PNG 为无损, 体积通常比 WebP 大; 适合截图/线稿/需要透明时";
			} else if (fmt === "jpeg") {
				fmtHint.textContent = "JPEG 不支持透明, 透明区域会被填成白底";
			} else if (fmt === "webp") {
				fmtHint.textContent = "WebP 兼顾体积与质量, 网页配图首选";
			} else {
				fmtHint.textContent = "AVIF 体积最小, 但编码较慢且旧浏览器可能不支持";
			}
		}
	}

	/* ---------- 输出命名 ---------- */
	function baseName(name) {
		return String(name || "image").replace(/\.[^./\\]+$/, "");
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

	/* ---------- 列表渲染 ---------- */
	function renderList() {
		if (!items.length) {
			listEl.innerHTML = "";
			outEl.hidden = true;
			return;
		}
		var html = "";
		var okCount = 0;
		var inSize = 0;
		var outSize = 0;
		for (var i = 0; i < items.length; i++) {
			var it = items[i];
			var cls = "img-row";
			var badge = "";
			var note = "";
			if (it.state === "done") {
				cls += " ok";
				badge = '<span class="img-badge">' + esc(it.outLabel) + "</span>";
				var pct = it.srcSize
					? Math.round((1 - it.outSize / it.srcSize) * 100)
					: 0;
				note =
					esc(it.srcLabel) +
					" " +
					KIT.formatSize(it.srcSize) +
					" · " +
					it.origWidth +
					"×" +
					it.origHeight +
					"  →  " +
					(it.outName ? esc(it.outName) + " · " : "") +
					esc(it.outLabel) +
					" " +
					KIT.formatSize(it.outSize) +
					" · " +
					it.width +
					"×" +
					it.height +
					(pct > 0 ? " · 省 " + pct + "%" : pct < 0 ? " · 增大 " + -pct + "%" : "");
				okCount++;
				inSize += it.srcSize;
				outSize += it.outSize;
			} else if (it.state === "work") {
				badge = '<span class="img-badge dim">' + esc(it.note || "处理中") + "</span>";
			} else if (it.state === "fail") {
				cls += " bad";
				badge = '<span class="img-badge red">失败</span>';
				note = esc(it.note);
			}
			html +=
				'<div class="' +
				cls +
				'">' +
				'<div class="img-row-main">' +
				'<div class="img-row-name">' +
				esc(it.label) +
				"</div>" +
				(note ? '<div class="img-row-note">' + note + "</div>" : "") +
				"</div>" +
				badge +
				"</div>";
		}
		listEl.innerHTML = html;

		if (okCount > 0) {
			outEl.hidden = false;
			var saved = inSize > outSize ? Math.round((1 - outSize / inSize) * 100) : 0;
			dlBtn.textContent =
				"下载压缩包 (" +
				okCount +
				" 张 · " +
				KIT.formatSize(outSize) +
				(saved > 0 ? " · 省 " + saved + "%" : "") +
				")";
			dlBtn.disabled = false;
		} else {
			outEl.hidden = true;
			dlBtn.disabled = true;
		}
	}

	/* ---------- 主流程 ---------- */
	function addFiles(fileList) {
		if (busy) return;
		var added = 0;
		var skipped = 0;
		for (var i = 0; i < fileList.length; i++) {
			var f = fileList[i];
			var isImg = /^image\//.test(f.type || "") || /\.(jpe?g|png|gif|webp|avif|bmp|ico|svg)$/i.test(f.name || "");
			if (!isImg) {
				skipped++;
				continue;
			}
			items.push({
				file: f,
				label: f.name,
				srcSize: f.size,
				srcLabel: String(f.type || "").replace("image/", "").toUpperCase() || "FILE",
				state: "wait",
				note: "排队中",
			});
			added++;
		}
		if (skipped) ignoredTotal += skipped;
		if (!added) {
			setStatus(
				skipped ? "已忽略 " + skipped + " 个非图片文件" : "没有选择图片",
				"warn",
			);
			return;
		}
		stale = false;
		rerunBtn.hidden = true;
		run();
	}

	async function run() {
		if (busy) return;
		var opts = readOptions();
		var pending = [];
		for (var i = 0; i < items.length; i++) {
			if (items[i].state !== "done" || items[i].stale) pending.push(items[i]);
		}
		if (!pending.length) return;

		busy = true;
		dlBtn.disabled = true;
		var total = pending.length;

		for (var n = 0; n < total; n++) {
			var it = pending[n];
			it.state = "work";
			it.note = "解码中…";
			setProgress(n, total);
			setStatus("正在处理 " + (n + 1) + " / " + total + " · " + it.label);
			renderList();
			await tick();

			try {
				var r = await convert(it.file, opts);
				var buf = await r.blob.arrayBuffer();
				it.blobData = new Uint8Array(buf);
				it.outSize = it.blobData.length;
				it.width = r.width;
				it.height = r.height;
				it.origWidth = r.origWidth;
				it.origHeight = r.origHeight;
				it.outLabel = LABEL[opts.format];
				it.ext = EXT[opts.format];
				it.state = "done";
				it.stale = false;
			} catch (err) {
				it.state = "fail";
				it.note = (err && err.message) || "转换失败";
			}
			renderList();
			await tick();
		}

		// 打包
		var used = {};
		var entries = [];
		var count = 0;
		for (var m = 0; m < items.length; m++) {
			var x = items[m];
			if (x.state !== "done" || x.zipped || !x.blobData) continue;
			var name = uniqueName(used, KIT.sanitizeName(baseName(x.label), "image"), x.ext);
			x.outName = name;
			entries.push({ name: name, data: x.blobData });
			x.zipped = true;
			count++;
		}

		busy = false;
		setProgress(total, total);

		if (!count) {
			setStatus("没有可输出的图片", "warn");
			renderList();
			return;
		}
		try {
			var zip = KIT.zipStore(entries, new Date());
			releaseLater(lastUrl);
			lastUrl = URL.createObjectURL(
				new Blob(zip.chunks, { type: "application/zip" }),
			);
			dlBtn.dataset.url = lastUrl;
			dlBtn.dataset.name = "images-" + KIT.stamp() + ".zip";
			setStatus(
				"已完成 " +
					count +
					" 张 · 压缩包 " +
					KIT.formatSize(zip.size) +
					(ignoredTotal ? " · 已忽略 " + ignoredTotal + " 个非图片文件" : "") +
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

	/* ---------- 事件 ---------- */
	var detachFns = [];
	function on(el, type, fn, opts) {
		if (!el) return;
		el.addEventListener(type, fn, opts);
		detachFns.push(function () {
			el.removeEventListener(type, fn, opts);
		});
	}

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
		if (e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files);
	});
	on(dropEl, "click", function () {
		inputEl.click();
	});
	on(pickBtn, "click", function (e) {
		e.stopPropagation();
		inputEl.click();
	});
	on(inputEl, "change", function () {
		if (inputEl.files && inputEl.files.length) addFiles(inputEl.files);
		inputEl.value = "";
	});

	// 选项改变 → 标记旧结果为过期, 提示重新转换
	function markStale() {
		syncQualityState();
		if (busy || !items.length) return;
		var hasDone = false;
		for (var i = 0; i < items.length; i++) {
			if (items[i].state === "done") {
				items[i].stale = true;
				hasDone = true;
			}
		}
		if (hasDone) {
			stale = true;
			rerunBtn.hidden = false;
			setStatus("设置已更改, 点「按新设置重新转换」重跑", "warn");
		}
	}
	on(fmtSel, "change", markStale);
	on(widthSel, "change", markStale);
	on(qRange, "input", function () {
		syncQualityState();
	});
	on(qRange, "change", markStale);

	on(rerunBtn, "click", function () {
		if (busy) return;
		for (var i = 0; i < items.length; i++) {
			if (items[i].state === "done") items[i].stale = true;
			items[i].zipped = false;
		}
		rerunBtn.hidden = true;
		stale = false;
		setStatus("");
		run();
	});

	function stopWin(e) {
		if (!document.getElementById("imgRoot")) {
			detachWin();
			return;
		}
		e.preventDefault();
	}
	function detachWin() {
		window.removeEventListener("dragover", stopWin);
		window.removeEventListener("drop", stopWin);
	}
	window.addEventListener("dragover", stopWin);
	window.addEventListener("drop", stopWin);

	on(dlBtn, "click", function () {
		var url = dlBtn.dataset.url;
		if (!url) return;
		var a = document.createElement("a");
		a.href = url;
		a.download = dlBtn.dataset.name || "images.zip";
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		setStatus("压缩包已开始保存到本地下载目录", "ok");
	});

	on(clearBtn, "click", function () {
		if (busy) return;
		items = [];
		ignoredTotal = 0;
		releaseLater(lastUrl);
		lastUrl = null;
		dlBtn.dataset.url = "";
		rerunBtn.hidden = true;
		stale = false;
		renderList();
		setStatus("");
		barWrap.hidden = true;
	});

	window.__imgToolState = {
		detach: function () {
			for (var i = 0; i < detachFns.length; i++) detachFns[i]();
			detachFns = [];
			detachWin();
			releaseLater(lastUrl);
			lastUrl = null;
		},
	};

	/* ---------- 初始化: 探测能导出哪些格式 ---------- */
	(async function init() {
		var probeCanvas = makeCanvas(2, 2);
		var pctx = probeCanvas.getContext("2d");
		if (pctx) {
			pctx.fillStyle = "#123456";
			pctx.fillRect(0, 0, 2, 2);
		}
		for (var key in MIME) {
			var b = await toBlob(probeCanvas, MIME[key], 0.8);
			supported[key] = !!b && b.type === MIME[key];
		}
		if (fmtSel) {
			var opts = fmtSel.querySelectorAll("option");
			for (var i = 0; i < opts.length; i++) {
				var v = opts[i].value;
				if (!supported[v]) {
					opts[i].disabled = true;
					opts[i].textContent = opts[i].textContent.replace(" (不可用)", "") + " (不可用)";
				}
			}
			// 默认选 WebP, 不支持就退到 PNG
			if (!supported[fmtSel.value]) {
				fmtSel.value = supported.png ? "png" : "jpeg";
			}
		}
		syncQualityState();
		renderList();
		setStatus("");
	})();
})();
