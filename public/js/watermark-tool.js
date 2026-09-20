/**
 * 去水印页面交互(框选 + 内容修复)
 * ------------------------------------------------------------------
 * 依赖:
 *   public/js/tool-kit.js       → window.ToolKit (文件名清洗等纯计算)
 *   public/js/watermark-core.js → window.WatermarkCore (多尺度金字塔修复)
 * 解码/编码全部走浏览器原生能力 (createImageBitmap / canvas),
 * 不引入任何第三方库, 不上传任何文件。
 *
 * 要点:
 *   - 画布尺寸 = 原图像素尺寸, CSS 只负责按容器缩放显示; 鼠标/触摸坐标
 *     必须乘上 canvas.width / getBoundingClientRect().width 才能对上像素。
 *   - 选区画在另一个绝对定位的 overlay canvas 上, 不污染原图。
 *   - 修复始终以"原图"为基准, 掩膜 = 所有选区的并集(再向外扩 2px),
 *     所以重复点「开始修复」结果稳定, 不会越修越糊。
 *   - EXIF 方向: createImageBitmap 传 imageOrientation: "from-image";
 *     不支持时回退 <img>。
 *
 * Swup 切换页面后本脚本会重新执行, 所以每次先撤销上一次挂的监听。
 */
(function () {
	"use strict";

	var prev = window.__wmToolState;
	if (prev && typeof prev.detach === "function") {
		try {
			prev.detach();
		} catch (e) {}
	}
	window.__wmToolState = { detach: null };

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

	var root = document.getElementById("wmRoot");
	if (!root) return;
	var statusEl = document.getElementById("wmStatus");
	var KIT = window.ToolKit;
	if (!KIT) {
		// 公共库没加载成功时不能默默无反应, 否则页面看起来就是"点了没动静"
		if (statusEl) {
			statusEl.textContent = t(
				"toolKitMissing",
				"公共库未加载成功, 请按 Ctrl+F5 强制刷新页面",
			);
			statusEl.className = "wm-status err";
		}
		return;
	}
	var CORE = window.WatermarkCore;
	if (!CORE) {
		// 核心算法脚本没加载成功(部署漏了文件 / 缓存了旧页面)时明确提示
		if (statusEl) {
			statusEl.textContent = t(
				"toolCoreMissing",
				"核心脚本未加载成功, 请按 Ctrl+F5 强制刷新页面",
			);
			statusEl.className = "wm-status err";
		}
		return;
	}
	// 页面 HTML 与脚本版本对不上(Swup 页面缓存 / 浏览器缓存了旧页面)时明确提示
	var VER = "1";
	var verWarn = "";
	if (window.__TOOL_VER && window.__TOOL_VER !== VER) {
		verWarn = tf(
			"toolStatusVerMismatch",
			"页面是旧版本(页面 v{page} / 脚本 v{script}), 请按 Ctrl+F5 强制刷新",
			{ page: window.__TOOL_VER, script: VER },
		);
	}

	/* ---------- 元素 ---------- */
	var dropEl = document.getElementById("wmDrop");
	var inputEl = document.getElementById("wmInput");
	var pickBtn = document.getElementById("wmPick");
	var editorEl = document.getElementById("wmEditor");
	var stageEl = document.getElementById("wmStage");
	var canvas = document.getElementById("wmCanvas");
	var overlay = document.getElementById("wmOverlay");
	var regionsEl = document.getElementById("wmRegions");
	var startBtn = document.getElementById("wmStart");
	var undoBtn = document.getElementById("wmUndo");
	var clearSelBtn = document.getElementById("wmClearSel");
	var resetBtn = document.getElementById("wmReset");
	var barWrap = document.getElementById("wmBarWrap");
	var barEl = document.getElementById("wmBar");
	var outEl = document.getElementById("wmOut");
	var beforeBtn = document.getElementById("wmBefore");
	var afterBtn = document.getElementById("wmAfter");
	var dlBtn = document.getElementById("wmDownload");

	if (!canvas || !overlay) return;

	/* ---------- 状态 ---------- */
	var img = null; // {name, type, ext, mime, width, height}
	var original = null; // 载入时的 ImageData(修复永远以它为基准)
	var result = null; // 修复后的 ImageData
	var regions = []; // [{x,y,w,h}] 图像像素坐标
	var history = []; // 撤销快照, 最多 10 步
	var dragging = null;
	var view = "before"; // "before" | "after"
	var busy = false;
	var staleUrls = [];
	var MAX_HISTORY = 10;
	var EXPAND = 2; // 掩膜外扩 2px, 把水印的半透明边缘一起修掉

	/* ---------- 小工具 ---------- */
	function tick() {
		return new Promise(function (r) {
			setTimeout(r, 0);
		});
	}
	function setStatus(text, kind) {
		if (!statusEl) return;
		statusEl.textContent = text || "";
		statusEl.className = "wm-status" + (kind ? " " + kind : "");
	}
	function setProgress(frac) {
		if (!barWrap || !barEl) return;
		barWrap.hidden = false;
		barEl.style.width = Math.max(0, Math.min(100, Math.round(frac * 100))) + "%";
	}
	function hideProgress(delay) {
		if (!barWrap) return;
		setTimeout(function () {
			barWrap.hidden = true;
			if (barEl) barEl.style.width = "0%";
		}, delay || 900);
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
	function toBlob(target, type, quality) {
		return new Promise(function (resolve) {
			try {
				if (typeof target.toBlob === "function") {
					target.toBlob(function (b) {
						resolve(b || null);
					}, type, quality);
				} else {
					resolve(null);
				}
			} catch (e) {
				resolve(null);
			}
		});
	}
	function setBusy(on) {
		busy = !!on;
		var btns = [startBtn, undoBtn, clearSelBtn, resetBtn, dlBtn, beforeBtn, afterBtn];
		for (var i = 0; i < btns.length; i++) {
			if (!btns[i]) continue;
			if (on) {
				if (!btns[i].__wmWas) btns[i].__wmWas = !btns[i].disabled;
				btns[i].disabled = true;
			} else if (btns[i].__wmWas) {
				btns[i].__wmWas = false;
				btns[i].disabled = false;
			}
		}
		syncTabs();
	}

	/* ---------- 解码 ---------- */
	function loadViaImg(file) {
		return new Promise(function (resolve, reject) {
			var url = URL.createObjectURL(file);
			var el = new Image();
			el.onload = function () {
				var w = el.naturalWidth || el.width;
				var h = el.naturalHeight || el.height;
				if (!w || !h) {
					URL.revokeObjectURL(url);
					reject(new Error(t("toolErrImgSize", "读不到图片尺寸")));
					return;
				}
				resolve({
					source: el,
					width: w,
					height: h,
					cleanup: function () {
						URL.revokeObjectURL(url);
					},
				});
			};
			el.onerror = function () {
				URL.revokeObjectURL(url);
				reject(new Error(t("toolErrImgDecode", "浏览器无法解码这个格式")));
			};
			el.src = url;
		});
	}

	function loadImage(file) {
		if (typeof window.createImageBitmap === "function") {
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

	/* ---------- 输出格式 / 文件名 ---------- */
	// 输出格式跟随原图: png→png, jpg/webp→同名格式, 其它统一回退 png
	function outFormat() {
		var name = (img && img.name) || "";
		var m = /\.([a-z0-9]+)$/i.exec(name);
		var e = m ? m[1].toLowerCase() : "";
		var type = ((img && img.type) || "").toLowerCase();
		if (type === "image/jpeg" || e === "jpg" || e === "jpeg")
			return { ext: "jpg", mime: "image/jpeg" };
		if (type === "image/webp" || e === "webp")
			return { ext: "webp", mime: "image/webp" };
		return { ext: "png", mime: "image/png" };
	}
	function outName() {
		var f = outFormat();
		var base = String((img && img.name) || "image").replace(/\.[^./\\]+$/, "");
		base = KIT.sanitizeName(base + "-" + t("toolWmSuffix", "已修复"), "image");
		return base + "." + f.ext;
	}

	/* ---------- 选区 ---------- */
	function normRect(d) {
		var x = Math.min(d.x0, d.x1);
		var y = Math.min(d.y0, d.y1);
		var w = Math.abs(d.x1 - d.x0);
		var h = Math.abs(d.y1 - d.y0);
		if (x < 0) x = 0;
		if (y < 0) y = 0;
		return { x: x, y: y, w: w, h: h };
	}
	function clampPoint(x, y) {
		if (x < 0) x = 0;
		if (y < 0) y = 0;
		if (canvas.width && x > canvas.width) x = canvas.width;
		if (canvas.height && y > canvas.height) y = canvas.height;
		return { x: x, y: y };
	}
	// CSS 尺寸和像素尺寸不一致(容器缩放), 必须换算
	function toImageCoords(clientX, clientY) {
		var rect = canvas.getBoundingClientRect();
		var sx = rect.width ? canvas.width / rect.width : 1;
		var sy = rect.height ? canvas.height / rect.height : 1;
		var p = clampPoint((clientX - rect.left) * sx, (clientY - rect.top) * sy);
		// 落到像素中心, 免得右/下边界多吃一行一列
		return { x: Math.floor(p.x), y: Math.floor(p.y) };
	}

	function overlayCtx() {
		return overlay.getContext ? overlay.getContext("2d") : null;
	}
	/**
	 * 遮罩层必须像素级对齐画布。CSS 里已经按"外层贴合画布"写了, 但图片
	 * 被 max-height 限制时各浏览器对替换元素固有尺寸的处理略有差别, 所以
	 * 这里再按实际渲染框同步一次, 保证红框永远压在图上。
	 */
	function syncOverlayBox() {
		if (!stageEl || !overlay || !overlay.style || !canvas.getBoundingClientRect)
			return;
		var sr = stageEl.getBoundingClientRect
			? stageEl.getBoundingClientRect()
			: null;
		var cr = canvas.getBoundingClientRect();
		if (!sr || !cr) return;
		overlay.style.left = cr.left - sr.left + "px";
		overlay.style.top = cr.top - sr.top + "px";
		overlay.style.width = cr.width + "px";
		overlay.style.height = cr.height + "px";
	}
	function clearOverlay() {
		var c = overlayCtx();
		if (c) c.clearRect(0, 0, overlay.width, overlay.height);
		syncOverlayBox();
	}
	function paintRect(c, r, lineWidth) {
		c.fillStyle = "rgba(235,64,64,0.32)";
		c.fillRect(r.x, r.y, r.w, r.h);
		c.strokeStyle = "rgba(235,64,64,0.95)";
		c.lineWidth = lineWidth;
		c.strokeRect(r.x + 0.5, r.y + 0.5, Math.max(0, r.w - 1), Math.max(0, r.h - 1));
	}
	function redrawOverlay() {
		var c = overlayCtx();
		if (!c) return;
		syncOverlayBox();
		c.clearRect(0, 0, overlay.width, overlay.height);
		if (!original) return;
		var lw = Math.max(1, Math.round(overlay.width / 600));
		var i;
		for (i = 0; i < regions.length; i++) paintRect(c, regions[i], lw);
		// 正在拖的那一下用虚线框, 松手才变成正式选区
		if (dragging) {
			var r = normRect(dragging);
			c.fillStyle = "rgba(235,64,64,0.22)";
			c.fillRect(r.x, r.y, r.w, r.h);
			if (typeof c.setLineDash === "function") c.setLineDash([6, 4]);
			paintRect(c, r, lw);
			if (typeof c.setLineDash === "function") c.setLineDash([]);
		}
	}
	function updateRegions() {
		if (!regionsEl) return;
		regionsEl.textContent = regions.length
			? tf("toolWmRegions", "待修复区域: {n} 个", { n: regions.length })
			: t("toolWmRegionsNone", "还没有选区, 在图上框选水印");
	}

	/* ---------- 撤销快照 ---------- */
	function snapshot() {
		var copy = [];
		for (var i = 0; i < regions.length; i++) {
			copy.push({
				x: regions[i].x,
				y: regions[i].y,
				w: regions[i].w,
				h: regions[i].h,
			});
		}
		history.push({ regions: copy, result: result, view: view });
		while (history.length > MAX_HISTORY) history.shift();
	}
	function undo() {
		if (busy || !history.length) return;
		var s = history.pop();
		regions = s.regions;
		result = s.result;
		view = result ? s.view : "before";
		updateRegions();
		syncTabs();
		if (outEl) outEl.hidden = !result;
		showView();
		setStatus(t("toolWmStatusUndone", "已撤销上一步"));
	}

	/* ---------- 预览切换 ---------- */
	function syncTabs() {
		if (beforeBtn)
			beforeBtn.className = "wm-tab" + (view === "before" || !result ? " active" : "");
		if (afterBtn) {
			afterBtn.className = "wm-tab" + (view === "after" && result ? " active" : "");
			if (!busy) afterBtn.disabled = !result;
		}
	}
	function showView() {
		if (!original) return;
		var ctx = canvas.getContext("2d");
		if (!ctx) return;
		var useResult = view === "after" && !!result;
		ctx.putImageData(useResult ? result : original, 0, 0);
		if (useResult) clearOverlay();
		else redrawOverlay();
		syncTabs();
	}

	/* ---------- 载入 ---------- */
	function resetState(keepImage) {
		result = null;
		view = "before";
		history = [];
		if (!keepImage) {
			img = null;
			original = null;
		}
		if (outEl) outEl.hidden = true;
		if (barWrap) barWrap.hidden = true;
		if (barEl) barEl.style.width = "0%";
	}

	function openFile(file) {
		if (busy || !file) return;
		setStatus(t("toolStatusDecoding", "解码中…"));
		loadImage(file).then(
			function (loaded) {
				try {
					var w = loaded.width;
					var h = loaded.height;
					if (!w || !h) throw new Error(t("toolErrImgSize", "读不到图片尺寸"));
					canvas.width = w;
					canvas.height = h;
					overlay.width = w;
					overlay.height = h;
					var ctx = canvas.getContext("2d");
					if (!ctx) throw new Error(t("toolErrCanvas", "取不到 canvas 上下文"));
					ctx.clearRect(0, 0, w, h);
					ctx.drawImage(loaded.source, 0, 0, w, h);
					original = ctx.getImageData(0, 0, w, h);
					img = {
						name: file.name || "image",
						type: file.type || "",
						width: w,
						height: h,
					};
					resetState(true);
					regions = [];
					dragging = null;
					if (editorEl) editorEl.hidden = false;
					updateRegions();
					showView();
					if (startBtn) startBtn.disabled = false;
					setStatus(
						tf(
							"toolWmStatusLoaded",
							"已载入 {name} · {w}×{h}, 在水印上按住拖动即可框选",
							{ name: img.name, w: w, h: h },
						),
						"ok",
					);
				} catch (err) {
					setStatus(
						t("toolWmErrLoad", "图片载入失败") + ": " + ((err && err.message) || err),
						"err",
					);
				} finally {
					loaded.cleanup();
				}
			},
			function (err) {
				setStatus(
					t("toolWmErrLoad", "图片载入失败") +
						": " +
						((err && err.message) || err),
					"err",
				);
			},
		);
	}

	/* ---------- 框选 ---------- */
	function beginDrag(x, y) {
		if (busy || !original) return;
		dragging = { x0: x, y0: y, x1: x, y1: y };
		redrawOverlay();
	}
	function moveDrag(x, y) {
		if (!dragging) return;
		dragging.x1 = x;
		dragging.y1 = y;
		redrawOverlay();
	}
	function endDrag() {
		if (!dragging) return;
		var r = normRect(dragging);
		dragging = null;
		if (r.w < 3 || r.h < 3) {
			// 手抖点一下不算选区, 不然会留下一堆 0 像素的框
			redrawOverlay();
			setStatus(t("toolWmStatusTooSmall", "选区太小了, 请把水印完整框住再松手"), "warn");
			return;
		}
		snapshot();
		regions.push(r);
		redrawOverlay();
		updateRegions();
		setStatus(
			tf("toolWmStatusRegionAdded", "已添加选区 ({n} 个), 可以继续框选, 或点「开始修复」", {
				n: regions.length,
			}),
			"ok",
		);
	}

	/* ---------- 修复 ---------- */
	function buildMask(w, h) {
		var mask = new Uint8Array(w * h);
		for (var i = 0; i < regions.length; i++) {
			var r = regions[i];
			var x0 = Math.max(0, Math.floor(r.x));
			var y0 = Math.max(0, Math.floor(r.y));
			var x1 = Math.min(w, Math.ceil(r.x + r.w));
			var y1 = Math.min(h, Math.ceil(r.y + r.h));
			for (var y = y0; y < y1; y++) {
				var row = y * w;
				for (var x = x0; x < x1; x++) mask[row + x] = 1;
			}
		}
		return mask;
	}

	async function repair() {
		if (busy || !original) return;
		if (!regions.length) {
			setStatus(t("toolWmStatusNoSel", "这一步没有选区, 请先框选水印"), "warn");
			return;
		}
		var w = original.width;
		var h = original.height;
		var mask = buildMask(w, h);
		var marked = 0;
		for (var i = 0; i < mask.length; i++) if (mask[i]) marked++;
		if (!marked) {
			setStatus(t("toolWmStatusNoSel", "这一步没有选区, 请先框选水印"), "warn");
			return;
		}
		// 把水印半透明的边缘、抗锯齿过渡一起算进去
		mask = CORE.expandMask(mask, w, h, EXPAND);
		var covered = 0;
		for (var k = 0; k < mask.length; k++) if (mask[k]) covered++;
		if (covered >= w * h) {
			setStatus(
				t("toolWmStatusAllMasked", "选区覆盖了整张图片, 没有可参考的像素, 请把选区改小"),
				"warn",
			);
			return;
		}

		setBusy(true);
		snapshot();
		setProgress(0);
		setStatus(tf("toolWmStatusWorking", "正在修复… {p}%", { p: 0 }));
		await tick();

		try {
			var t0 = Date.now();
			var data = await CORE.inpaintAsync(original.data, w, h, mask, {
				onProgress: function (done, total) {
					var pct = total ? Math.round((done / total) * 100) : 100;
					setProgress(total ? done / total : 1);
					setStatus(tf("toolWmStatusWorking", "正在修复… {p}%", { p: pct }));
				},
				// 每个阶段之间让出主线程, 进度条才动得起来
				yieldTo: tick,
			});
			var ctx = canvas.getContext("2d");
			if (!ctx) throw new Error(t("toolErrCanvas", "取不到 canvas 上下文"));
			var out = ctx.createImageData(w, h);
			out.data.set(data);
			result = out;
			var secs = Math.max(0, (Date.now() - t0) / 1000);
			view = "after";
			showView();
			if (outEl) outEl.hidden = false;
			setProgress(1);
			setStatus(
				tf("toolWmStatusDone", "已修复, 可下载 · 用时 {s}s", { s: secs.toFixed(1) }),
				"ok",
			);
		} catch (err) {
			setStatus(
				t("toolWmErrInpaint", "修复失败: ") + ((err && err.message) || err),
				"err",
			);
		} finally {
			setBusy(false);
			hideProgress(1200);
		}
	}

	/* ---------- 下载 ---------- */
	function download() {
		if (busy || !result) return;
		var f = outFormat();
		var name = outName();
		var ctx = canvas.getContext("2d");
		if (!ctx) return;
		// 先确保画布上是修复结果(用户可能正停在"修复前"), 编码完再还原预览
		ctx.putImageData(result, 0, 0);
		var quality = f.mime === "image/png" ? undefined : 0.92;
		toBlob(canvas, f.mime, quality).then(function (blob) {
			showView();
			if (!blob) {
				setStatus(t("toolWmErrExport", "导出失败, 浏览器无法编码这个格式"), "err");
				return;
			}
			saveBlob(blob, name);
			setStatus(tf("toolWmStatusSaved", "已保存: {name}", { name: name }), "ok");
		});
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
		if (dropEl) dropEl.classList[on ? "add" : "remove"]("over");
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
		if (busy) return;
		var files = e.dataTransfer && e.dataTransfer.files;
		if (files && files.length) openFile(files[0]);
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
		if (inputEl.files && inputEl.files.length) openFile(inputEl.files[0]);
		inputEl.value = "";
	});

	// 鼠标框选: 起手在画布上, 移动/松开挂到 window, 拖出画布也不会丢
	function onDown(e) {
		if (busy || !original) return;
		e.preventDefault();
		var p = toImageCoords(e.clientX, e.clientY);
		beginDrag(p.x, p.y);
	}
	function onMove(e) {
		if (!dragging) return;
		e.preventDefault();
		var p = toImageCoords(e.clientX, e.clientY);
		moveDrag(p.x, p.y);
	}
	function onUp() {
		endDrag();
	}
	on(canvas, "mousedown", onDown);
	on(window, "mousemove", onMove);
	on(window, "mouseup", onUp);
	// 窗口尺寸变了, 画布的显示尺寸跟着变, 遮罩层要重新贴合
	on(window, "resize", function () {
		if (original) redrawOverlay();
	});

	function touchPoint(e) {
		var list = e.touches && e.touches.length ? e.touches : e.changedTouches;
		return list && list.length ? list[0] : null;
	}
	on(
		canvas,
		"touchstart",
		function (e) {
			if (busy || !original) return;
			var p = touchPoint(e);
			if (!p) return;
			e.preventDefault();
			var q = toImageCoords(p.clientX, p.clientY);
			beginDrag(q.x, q.y);
		},
		{ passive: false },
	);
	on(
		canvas,
		"touchmove",
		function (e) {
			if (!dragging) return;
			var p = touchPoint(e);
			if (!p) return;
			e.preventDefault();
			var q = toImageCoords(p.clientX, p.clientY);
			moveDrag(q.x, q.y);
		},
		{ passive: false },
	);
	on(canvas, "touchend", function (e) {
		if (!dragging) return;
		e.preventDefault();
		endDrag();
	});
	on(canvas, "touchcancel", function () {
		if (!dragging) return;
		dragging = null;
		redrawOverlay();
	});

	on(startBtn, "click", function () {
		repair();
	});
	on(undoBtn, "click", undo);
	on(clearSelBtn, "click", function () {
		if (busy || !original) return;
		snapshot();
		regions = [];
		result = null;
		view = "before";
		if (outEl) outEl.hidden = true;
		updateRegions();
		showView();
		setStatus(t("toolWmStatusCleared", "已清除全部选区"));
	});
	on(resetBtn, "click", function () {
		if (busy || !original) return;
		snapshot();
		regions = [];
		resetState(true);
		updateRegions();
		showView();
		setStatus(t("toolWmStatusReset", "已重置为原图"));
	});
	on(beforeBtn, "click", function () {
		if (busy || !original) return;
		view = "before";
		showView();
	});
	on(afterBtn, "click", function () {
		if (busy || !result) return;
		view = "after";
		showView();
	});
	on(dlBtn, "click", download);

	// 拖到页面空白处时不要让浏览器直接打开文件
	function stopWin(e) {
		if (!document.getElementById("wmRoot")) {
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

	window.__wmToolState = {
		detach: function () {
			for (var i = 0; i < detachFns.length; i++) detachFns[i]();
			detachFns = [];
			detachWin();
		},
	};

	/* ---------- 初始化 ---------- */
	(function init() {
		if (editorEl) editorEl.hidden = true;
		if (outEl) outEl.hidden = true;
		if (barWrap) barWrap.hidden = true;
		if (startBtn) startBtn.disabled = true;
		updateRegions();
		syncTabs();
		// 版本不一致的提示不能被这里的清空覆盖掉
		if (verWarn) setStatus(verWarn, "err");
		else setStatus("");
	})();
})();
