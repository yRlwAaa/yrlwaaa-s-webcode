/**
 * 去水印核心: 多尺度金字塔 + 迭代扩散 (inpainting)
 * ------------------------------------------------------------------
 * 纯计算模块, 不依赖 DOM, 可同时在浏览器和 Node 中运行。
 * 浏览器: 作为普通脚本加载后暴露 window.WatermarkCore
 * Node  : require('./watermark-core.js')
 *
 * 算法 (与 Telea / Navier-Stokes 那类"由外向内推进"的做法不同, 走的是
 * "多分辨率 + 调和插值" 路线, 好处是零依赖且结果绝对确定):
 *   1. 逐级 1/2 下采样建金字塔。下采样只对"未标记"的像素求平均(按有效
 *      采样点归一化), 所以纯色区域缩多少级都还是那个颜色; 只要 2x2 里
 *      有一个未标记像素, 这个粗像素的值就是已知的, 否则标记为未知。
 *   2. 从最粗的一层开始解: 未知像素先取该层已知像素的均值, 再用带松弛
 *      因子的 Gauss-Seidel 迭代扩散填满(8 邻域, 正交权重 2 / 对角权重 1,
 *      该模板对线性函数是精确的, 所以渐变背景不会被抹平)。
 *   3. 逐级上采样: 每个标记像素的值由上一层双线性插值给出, 然后只在这一
 *      层的标记像素上继续迭代细化。层数越细, 边界条件越真实, 最细一层
 *      的边界就是原图真实像素, 因此收敛到的是"以真实像素为边界条件的
 *      调和延拓", 不会有接缝, 也不会有棋盘格。
 *
 * 关键约定:
 *   - 未标记像素逐字节不变(最细一层只写标记像素, 其余直接从输入拷贝)。
 *   - 全部确定性: 不用随机数, 同样的输入必然得到同样的输出。
 *   - 不修改入参, 返回新的 Uint8ClampedArray。
 */
(function (root, factory) {
	var api = factory();
	if (typeof module !== "undefined" && module.exports) {
		module.exports = api;
	}
	if (root) {
		root.WatermarkCore = api;
	}
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
	"use strict";

	/* ============================ 参数 ============================ */

	var MAX_LEVELS = 7; // 金字塔最多 7 层(最粗大约 1/64)
	var MIN_SIDE = 4; // 某一边小到这个尺寸就不再往下采样
	/**
	 * 最细一层允许的最大像素更新次数(所有层共享的一个软上限)。
	 * 一个 800x600 的选区大约 4.8e5 像素, 按这个预算大约 25 次扫描,
	 * 实测在桌面浏览器里是几百毫秒量级。
	 */
	var WORK_BUDGET = 12000000;

	/* ============================ 掩膜外扩 ============================ */

	/**
	 * 把选区向外扩 radius 像素(切比雪夫距离, 也就是方形膨胀)。
	 * 目的是把水印半透明的边缘、抗锯齿过渡一起算进修复区,
	 * 否则修完之后水印边上会留一圈淡淡的残影。
	 *
	 * @param {Uint8Array|ArrayLike<number>} mask 1 = 要修掉
	 * @param {number} width
	 * @param {number} height
	 * @param {number} [radius=2]
	 * @returns {Uint8Array} 新的掩膜
	 */
	function expandMask(mask, width, height, radius) {
		var w = width | 0;
		var h = height | 0;
		var r = radius === undefined || radius === null ? 2 : Math.floor(radius);
		if (r < 0) r = 0;
		var n = w * h;
		var out = new Uint8Array(n);
		if (n <= 0) return out;

		var i;
		// 半径 0 也要走一遍归一化(把任意非零值统一成 1)
		var base = new Uint8Array(n);
		for (i = 0; i < n; i++) base[i] = mask[i] ? 1 : 0;
		if (r === 0) return base;

		var tmp = new Uint8Array(n);
		var x, y, run;
		// 横向: 左→右 与 右→左 各扫一遍, 距离 <= r 就置 1
		for (y = 0; y < h; y++) {
			var row = y * w;
			run = -1;
			for (x = 0; x < w; x++) {
				if (base[row + x]) run = x;
				if (run >= 0 && x - run <= r) tmp[row + x] = 1;
			}
			run = -1;
			for (x = w - 1; x >= 0; x--) {
				if (base[row + x]) run = x;
				if (run >= 0 && run - x <= r) tmp[row + x] = 1;
			}
		}
		// 纵向: 上→下 与 下→上 各扫一遍
		for (x = 0; x < w; x++) {
			run = -1;
			for (y = 0; y < h; y++) {
				if (tmp[y * w + x]) run = y;
				if (run >= 0 && y - run <= r) out[y * w + x] = 1;
			}
			run = -1;
			for (y = h - 1; y >= 0; y--) {
				if (tmp[y * w + x]) run = y;
				if (run >= 0 && run - y <= r) out[y * w + x] = 1;
			}
		}
		return out;
	}

	/* ============================ 金字塔 ============================ */

	function buildLevel(w, h, rgba, mask) {
		var n = w * h;
		var data = new Float32Array(n * 4);
		var m = new Uint8Array(n);
		var i, s;
		for (i = 0; i < n; i++) {
			s = i * 4;
			data[s] = rgba[s];
			data[s + 1] = rgba[s + 1];
			data[s + 2] = rgba[s + 2];
			data[s + 3] = rgba[s + 3];
			m[i] = mask[i] ? 1 : 0;
		}
		return { w: w, h: h, data: data, mask: m };
	}

	/** 只对未标记像素求平均(按有效点数归一化), 全被标记的粗像素记为未知 */
	function downsample(src) {
		var sw = src.w;
		var sh = src.h;
		var dw = sw >> 1;
		var dh = sh >> 1;
		if (dw < 1 || dh < 1) return null;
		var data = new Float32Array(dw * dh * 4);
		var mask = new Uint8Array(dw * dh);
		for (var y = 0; y < dh; y++) {
			for (var x = 0; x < dw; x++) {
				var count = 0;
				var a0 = 0;
				var a1 = 0;
				var a2 = 0;
				var a3 = 0;
				for (var dy = 0; dy < 2; dy++) {
					var sy = (y << 1) + dy;
					if (sy >= sh) continue;
					var srow = sy * sw;
					for (var dx = 0; dx < 2; dx++) {
						var sx = (x << 1) + dx;
						if (sx >= sw) continue;
						var si = srow + sx;
						if (src.mask[si]) continue;
						var so = si * 4;
						a0 += src.data[so];
						a1 += src.data[so + 1];
						a2 += src.data[so + 2];
						a3 += src.data[so + 3];
						count++;
					}
				}
				var di = y * dw + x;
				if (!count) {
					mask[di] = 1;
					continue;
				}
				var dof = di * 4;
				data[dof] = a0 / count;
				data[dof + 1] = a1 / count;
				data[dof + 2] = a2 / count;
				data[dof + 3] = a3 / count;
			}
		}
		return { w: dw, h: dh, data: data, mask: mask };
	}

	function buildPyramid(rgba, width, height, mask, maxLevels) {
		var levels = [buildLevel(width, height, rgba, mask)];
		while (levels.length < maxLevels) {
			var prev = levels[levels.length - 1];
			if (prev.w < MIN_SIDE * 2 || prev.h < MIN_SIDE * 2) break;
			var next = downsample(prev);
			if (!next) break;
			levels.push(next);
		}
		return levels;
	}

	/** 每层标记像素的包围盒(迭代只需要在这个盒子里跑) */
	function computeBounds(level) {
		var w = level.w;
		var h = level.h;
		var mask = level.mask;
		var x0 = w;
		var y0 = h;
		var x1 = -1;
		var y1 = -1;
		for (var y = 0; y < h; y++) {
			var row = y * w;
			for (var x = 0; x < w; x++) {
				if (!mask[row + x]) continue;
				if (x < x0) x0 = x;
				if (x > x1) x1 = x;
				if (y < y0) y0 = y;
				if (y > y1) y1 = y;
			}
		}
		level.x0 = x0;
		level.y0 = y0;
		level.x1 = x1;
		level.y1 = y1;
		level.empty = x1 < x0 || y1 < y0;
		return level;
	}

	/* ============================ 迭代扩散 ============================ */

	/**
	 * 带松弛因子的 Gauss-Seidel 迭代(8 邻域, 正交 2 / 对角 1)。
	 * 该模板对线性函数精确成立, 所以渐变不会被抹平; 对角线方向的平滑
	 * 又保证了不会出现棋盘格。
	 */
	function relax(level, omega, passes) {
		if (level.empty || passes <= 0) return;
		var w = level.w;
		var h = level.h;
		var data = level.data;
		var mask = level.mask;
		var x0 = level.x0;
		var y0 = level.y0;
		var x1 = level.x1;
		var y1 = level.y1;
		var om = omega;
		var omi = 1 - omega;

		for (var p = 0; p < passes; p++) {
			for (var y = y0; y <= y1; y++) {
				var row = y * w;
				var ym = y > 0;
				var yp = y < h - 1;
				for (var x = x0; x <= x1; x++) {
					var idx = row + x;
					if (!mask[idx]) continue;
					var xm = x > 0;
					var xp = x < w - 1;
					var sum = 0;
					var a0 = 0;
					var a1 = 0;
					var a2 = 0;
					var a3 = 0;
					var o;
					if (xm) {
						o = (idx - 1) * 4;
						a0 += 2 * data[o];
						a1 += 2 * data[o + 1];
						a2 += 2 * data[o + 2];
						a3 += 2 * data[o + 3];
						sum += 2;
					}
					if (xp) {
						o = (idx + 1) * 4;
						a0 += 2 * data[o];
						a1 += 2 * data[o + 1];
						a2 += 2 * data[o + 2];
						a3 += 2 * data[o + 3];
						sum += 2;
					}
					if (ym) {
						o = (idx - w) * 4;
						a0 += 2 * data[o];
						a1 += 2 * data[o + 1];
						a2 += 2 * data[o + 2];
						a3 += 2 * data[o + 3];
						sum += 2;
					}
					if (yp) {
						o = (idx + w) * 4;
						a0 += 2 * data[o];
						a1 += 2 * data[o + 1];
						a2 += 2 * data[o + 2];
						a3 += 2 * data[o + 3];
						sum += 2;
					}
					if (xm && ym) {
						o = (idx - w - 1) * 4;
						a0 += data[o];
						a1 += data[o + 1];
						a2 += data[o + 2];
						a3 += data[o + 3];
						sum += 1;
					}
					if (xp && ym) {
						o = (idx - w + 1) * 4;
						a0 += data[o];
						a1 += data[o + 1];
						a2 += data[o + 2];
						a3 += data[o + 3];
						sum += 1;
					}
					if (xm && yp) {
						o = (idx + w - 1) * 4;
						a0 += data[o];
						a1 += data[o + 1];
						a2 += data[o + 2];
						a3 += data[o + 3];
						sum += 1;
					}
					if (xp && yp) {
						o = (idx + w + 1) * 4;
						a0 += data[o];
						a1 += data[o + 1];
						a2 += data[o + 2];
						a3 += data[o + 3];
						sum += 1;
					}
					if (!sum) continue;
					var off = idx * 4;
					data[off] = omi * data[off] + om * (a0 / sum);
					data[off + 1] = omi * data[off + 1] + om * (a1 / sum);
					data[off + 2] = omi * data[off + 2] + om * (a2 / sum);
					data[off + 3] = omi * data[off + 3] + om * (a3 / sum);
				}
			}
		}
	}

	/** 最粗一层: 标记像素先用该层已知像素的均值铺一遍, 迭代会把它拉向调和解 */
	function seedCoarse(level) {
		if (level.empty) return;
		var mask = level.mask;
		var data = level.data;
		var n = level.w * level.h;
		var count = 0;
		var a0 = 0;
		var a1 = 0;
		var a2 = 0;
		var a3 = 0;
		var i;
		for (i = 0; i < n; i++) {
			if (mask[i]) continue;
			var o = i * 4;
			a0 += data[o];
			a1 += data[o + 1];
			a2 += data[o + 2];
			a3 += data[o + 3];
			count++;
		}
		if (!count) return;
		var m0 = a0 / count;
		var m1 = a1 / count;
		var m2 = a2 / count;
		var m3 = a3 / count;
		for (i = 0; i < n; i++) {
			if (!mask[i]) continue;
			var oo = i * 4;
			data[oo] = m0;
			data[oo + 1] = m1;
			data[oo + 2] = m2;
			data[oo + 3] = m3;
		}
	}

	/** 由粗层双线性插值给细层的标记像素一个初值(像素中心对齐) */
	function upsampleInto(coarse, fine) {
		if (fine.empty) return;
		var cw = coarse.w;
		var ch = coarse.h;
		var cd = coarse.data;
		var w = fine.w;
		var h = fine.h;
		var fd = fine.data;
		var fm = fine.mask;
		var x0 = fine.x0;
		var y0 = fine.y0;
		var x1 = fine.x1;
		var y1 = fine.y1;
		for (var y = y0; y <= y1; y++) {
			var u = y * 0.5 - 0.25;
			var iy0 = Math.floor(u);
			var fy = u - iy0;
			var ya = iy0 < 0 ? 0 : iy0 > ch - 1 ? ch - 1 : iy0;
			var yb = iy0 + 1 < 0 ? 0 : iy0 + 1 > ch - 1 ? ch - 1 : iy0 + 1;
			var row = y * w;
			for (var x = x0; x <= x1; x++) {
				var idx = row + x;
				if (!fm[idx]) continue;
				var t = x * 0.5 - 0.25;
				var ix0 = Math.floor(t);
				var fx = t - ix0;
				var xa = ix0 < 0 ? 0 : ix0 > cw - 1 ? cw - 1 : ix0;
				var xb = ix0 + 1 < 0 ? 0 : ix0 + 1 > cw - 1 ? cw - 1 : ix0 + 1;
				var w00 = (1 - fx) * (1 - fy);
				var w10 = fx * (1 - fy);
				var w01 = (1 - fx) * fy;
				var w11 = fx * fy;
				var o00 = (ya * cw + xa) * 4;
				var o10 = (ya * cw + xb) * 4;
				var o01 = (yb * cw + xa) * 4;
				var o11 = (yb * cw + xb) * 4;
				var off = idx * 4;
				fd[off] =
					w00 * cd[o00] + w10 * cd[o10] + w01 * cd[o01] + w11 * cd[o11];
				fd[off + 1] =
					w00 * cd[o00 + 1] + w10 * cd[o10 + 1] + w01 * cd[o01 + 1] + w11 * cd[o11 + 1];
				fd[off + 2] =
					w00 * cd[o00 + 2] + w10 * cd[o10 + 2] + w01 * cd[o01 + 2] + w11 * cd[o11 + 2];
				fd[off + 3] =
					w00 * cd[o00 + 3] + w10 * cd[o10 + 3] + w01 * cd[o01 + 3] + w11 * cd[o11 + 3];
			}
		}
	}

	/* ============================ 迭代计划 ============================ */

	function clampInt(v, lo, hi) {
		v = Math.round(v);
		if (v < lo) return lo;
		if (v > hi) return hi;
		return v;
	}

	/**
	 * 松弛因子: 区域越大越接近 2(收敛快), 越小越保守(不会过冲)。
	 * 上限 1.9 是为了留出稳定裕量。
	 */
	function autoOmega(size) {
		var n = Math.max(2, size);
		var s = Math.sin(Math.PI / (n + 2));
		var om = 2 / (1 + s);
		if (om > 1.9) om = 1.9;
		if (om < 1.0) om = 1.0;
		return om;
	}

	/* ============================ 主流程 ============================ */

	/**
	 * 建一个可分段执行的修复任务(页面靠它做进度条, Node 侧直接用 inpaint)。
	 * @returns {{total:number, stage:function(number):void, finish:function():Uint8ClampedArray}}
	 */
	function createJob(rgba, width, height, mask, opts) {
		opts = opts || {};
		var w = width | 0;
		var h = height | 0;
		if (w <= 0 || h <= 0) throw new Error("inpaint: 宽高必须为正数");
		if (!rgba || rgba.length < w * h * 4)
			throw new Error("inpaint: rgba 长度不足");
		if (!mask || mask.length < w * h)
			throw new Error("inpaint: mask 长度不足");

		var maxLevels = opts.levels > 0 ? Math.floor(opts.levels) : MAX_LEVELS;
		if (maxLevels < 1) maxLevels = 1;
		var budget = opts.workBudget > 0 ? opts.workBudget : WORK_BUDGET;
		var omegaOverride = opts.omega > 0 ? opts.omega : 0;

		var levels = buildPyramid(rgba, w, h, mask, maxLevels);
		var i;
		for (i = 0; i < levels.length; i++) computeBounds(levels[i]);

		var top = levels.length - 1;
		var finest = levels[0];

		// 计划: 由粗到细, 每层 = 一次初始化 + 若干次迭代
		var steps = [];

		/**
		 * 一个像素都没被标记 → 没有选区; 最粗一层全被标记 → 整张图都在
		 * 选区里, 一个可参考的像素都没有。两种情况都没有可推断的信息,
		 * 原样返回(不做任何"凭空的"填充)。
		 */
		var hasSample = false;
		var topMask = levels[top].mask;
		for (i = 0; i < topMask.length; i++) {
			if (!topMask[i]) {
				hasSample = true;
				break;
			}
		}
		if (finest.empty || !hasSample) {
			return {
				total: 0,
				stage: function () {},
				finish: function () {
					return new Uint8ClampedArray(rgba);
				},
			};
		}

		for (var L = top; L >= 0; L--) {
			var lv = levels[L];
			if (lv.empty) continue;
			var size = Math.max(lv.x1 - lv.x0 + 1, lv.y1 - lv.y0 + 1);
			var area = (lv.x1 - lv.x0 + 1) * (lv.y1 - lv.y0 + 1);
			var sweeps;
			if (L === top) {
				// 最粗一层很小, 直接多跑几轮跑到收敛
				sweeps = Math.max(64, size * 4);
			} else if (L === 0) {
				// 最细一层: 按区域尺度估算, 再用工作量预算兜底
				sweeps = clampInt(0.6 * size + 8, 8, 240);
				var cap = Math.floor(budget / Math.max(1, area));
				if (sweeps > cap) sweeps = cap;
				if (sweeps < 4) sweeps = 4;
			} else {
				sweeps = 16;
			}
			var omega = omegaOverride || autoOmega(size);
			// 迭代切成几段, 页面才能把进度条推动起来
			var chunks = sweeps > 8 ? 8 : sweeps;
			var per = Math.ceil(sweeps / chunks);
			steps.push({ level: L, kind: "init", passes: 0, omega: omega });
			for (var c = 0; c < chunks; c++) {
				var left = sweeps - c * per;
				if (left <= 0) break;
				steps.push({
					level: L,
					kind: "relax",
					passes: per < left ? per : left,
					omega: omega,
				});
			}
		}

		var out = null;

		function stage(index) {
			var st = steps[index];
			if (!st) return;
			var lv = levels[st.level];
			if (st.kind === "init") {
				if (st.level === top) seedCoarse(lv);
				else upsampleInto(levels[st.level + 1], lv);
				return;
			}
			relax(lv, st.omega, st.passes);
		}

		function finish() {
			if (out) return out;
			out = new Uint8ClampedArray(rgba);
			var m = finest.mask;
			var d = finest.data;
			var n = w * h;
			for (var k = 0; k < n; k++) {
				if (!m[k]) continue;
				var o = k * 4;
				out[o] = d[o];
				out[o + 1] = d[o + 1];
				out[o + 2] = d[o + 2];
				out[o + 3] = d[o + 3];
			}
			return out;
		}

		return { total: steps.length, stage: stage, finish: finish };
	}

	/**
	 * 修复: 把 mask 标出来的区域用周围像素的调和延拓填掉。
	 *
	 * @param {Uint8ClampedArray|Uint8Array|Array<number>} rgba 长度 w*h*4
	 * @param {number} width
	 * @param {number} height
	 * @param {Uint8Array|ArrayLike<number>} mask 长度 w*h, 非 0 = 要修掉
	 * @param {{levels?:number, omega?:number, workBudget?:number, onProgress?:function}} [opts]
	 * @returns {Uint8ClampedArray} 新数组, 未标记像素与输入逐字节相同
	 */
	function inpaint(rgba, width, height, mask, opts) {
		var job = createJob(rgba, width, height, mask, opts);
		var onProgress = opts && opts.onProgress;
		for (var i = 0; i < job.total; i++) {
			job.stage(i);
			if (typeof onProgress === "function") onProgress(i + 1, job.total);
		}
		return job.finish();
	}

	/**
	 * 异步版: 每个阶段之间让出主线程, 页面才能刷新进度条。
	 * 与 inpaint 的结果完全一致(阶段划分不影响结果, 只影响是否让出)。
	 *
	 * @param {function} yieldTo 形如 () => Promise, 由调用方提供(setTimeout(0) 即可)
	 */
	function inpaintAsync(rgba, width, height, mask, opts) {
		opts = opts || {};
		var job = createJob(rgba, width, height, mask, opts);
		var onProgress = opts.onProgress;
		var yieldTo = opts.yieldTo;
		var i = 0;
		function next() {
			if (i >= job.total) return Promise.resolve(job.finish());
			var idx = i++;
			job.stage(idx);
			if (typeof onProgress === "function") onProgress(idx + 1, job.total);
			if (typeof yieldTo === "function") {
				return Promise.resolve(yieldTo()).then(next);
			}
			return next();
		}
		return next();
	}

	return {
		inpaint: inpaint,
		inpaintAsync: inpaintAsync,
		expandMask: expandMask,
		createJob: createJob,
	};
});
