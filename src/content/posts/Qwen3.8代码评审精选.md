---
title: Qwen3.8-27B代码评审精选
published: 2026-09-04
description: 模型：Qwen3.8-27B-UD-IQ4_XS.gguf。对上一份 30B 逐文件评审做了二次筛选，只保留确定的 bug 和实锤的性能问题，by-P100。
encrypted: false
pinned: true
alias: "Code-Review-Refined"
tags: ["AI", "Review"]
category: "AI"
---

# Mizuki-master 代码评审·精选

model: Qwen3.8-27B-UD-IQ4_XS.gguf

上一份 30B 逐文件评审（212 个文件）产出了大量「可能 XSS」「可能内存泄漏」之类的套话。本轮让 27B 重新筛了一遍，只保留**确定的 bug**和**实锤的性能/内存问题**，每条都给出具体改法。共筛出约 140 条，下面按严重程度分组。

---

## 一、确定的功能性 Bug（改完功能才正常）

### Svelte 语法错误（会导致运行时崩溃）

- **Search.svelte** 用了未导入的 `$state` → 从 `svelte` 导入 `$state`，或改用正确的响应式语法。
- **ArchivePanel.svelte** 对 `export` 的 `tags`/`categories` 变量重新赋值（Svelte 不允许）→ 移除 `export` 关键字，改用 `let` 内部变量 + props 传初始值。
- **SidebarPlaylist.svelte** 错误解构 `$props()`（Svelte 5 返回对象不可直接解构赋值）→ 先 `const props = $props()` 再从中解构。
- **VolumeControl.svelte** 把 `volumeBarRef` 当 props 传 → 应从 props 移除，在对应 DOM 元素上用 `use:volumeBarRef` 指令。
- **TrackListItem.svelte** 用 `{onclick}` 属性展开绑定事件 → 改为 `on:click={onclick}`。
- **FabMusicPanel.svelte** 用 `$state(musicPlayerStore.getState())` 初始化（语法错误）→ 改用 `let state = $state(...)` 或 store 订阅方式。
- **MusicPlayer.svelte** `state` 未声明为响应式 → 用 `let state = $state(...)` / `$derived(...)`。

### Astro / HTML / CSS 语法错误

- **Image.astro** 非 async 函数里用了 `await` → 函数声明为 `async`，或移除 `await` 正确处理 Promise。
- **ButtonLink.astro** `<a>` 里套 `<button>`（HTML 嵌套非法）→ 只保留 `<a>`（导航）或只保留 `<button>`（交互）。
- **albums.astro / skills.astro** `<script is:inline src="...">` 语法错误（is:inline 只用于内联）→ 移除 `is:inline`，保留 `src` 加载外部脚本。
- **expressive-code.css** `.copy-btn.success .copy-icon` 的 `fill-(--deep-text)` 写法无效 → 改为 `fill: var(--deep-text)`。
- **scrollbar.css** 用了无效的 `@reference` 指令 → 改为 `@tailwind`。
- **WordCount.astro** 用了错误的 `class:list` 语法 → 改为 Astro 的 `class:`。

### 逻辑错误（结果与实际相反或异常）

- **content-utils.ts** 日期排序写反 `dateA > dateB ? -1 : 1` → 改为 `dateA.getTime() - dateB.getTime()`。
- **[...permalink].astro** PostNavigation 的 `prevSlug`/`nextSlug` 传颠倒 → 交换传递值。
- **toc-calculator.ts** 深度过滤 `h.level < minLevel + depth` 应为 `<=` → 改 `<=`。
- **responsive-sidebar.ts** 桌面分支误用 tablet 的 `hasComponents` → 改用 desktop 的值。
- **useCalendar.ts** 月份键用了错误的索引（month-1）→ 修正月份索引。
- **sakura-manager.ts** `this.y = this.fn.y(this.y, this.y)` 参数错误 → 改为 `this.fn.y(this.x, this.y)`。
- **ArchivePanel.svelte** `params.get("uncategorized")` 是字符串却当布尔判断 → 用 `=== "true"`。
- **useTocHighlight.ts** rect 计算多加了 scroll 值 → 直接 `getBoundingClientRect().top`。
- **useMobileTOC.ts** 首页正则 `/^\/\d+\/?$/` 会误匹配 `/123` → 收紧正则只匹配 `/` 或特定首页标识。
- **Announcement.astro** 查询用 `data-id="announcement"` 但元素设的是 `id="announcement"` → 选择器改 `#announcement` 或元素加 data-id。
- **referrerPolicy** 拼写错误应为 `referrerpolicy`（Image.astro）。

---

## 二、性能问题（影响流畅度）

- **diary.astro** 计数用 `filter` 嵌套遍历，O(n*m) → 单次遍历或 Map 统计，降到 O(n+m)。
- **projects.astro** 分类计数每次映射都重新过滤 → 预计算计数映射表。
- **GridScripts.astro** 多次 `void document.body.offsetHeight` 强制重排 → 合并 DOM 操作，减少强制同步布局。
- **MobileTOC.svelte** scroll 事件里频繁 `document.querySelectorAll` → 缓存结果或用 requestAnimationFrame 节流。
- **BackToTop.astro** scroll 监听未节流 → 加 throttle/debounce 或 requestAnimationFrame。
- **useFloatingTOC.ts** 每次滚动全量遍历标题 → 二分查找或缓存标题位置。
- **GridScripts.astro** 重复 DOM 查询 → 缓存 `getElementById`/`querySelector` 结果。
- **NavMenuPanel.astro** 动态新增元素没绑事件 → 用事件委托。

---

## 三、内存泄漏（未清理的定时器/监听器，站点越用越卡的根源）

以下文件都存在「事件监听器 / 定时器 / IntersectionObserver / MutationObserver 未在组件卸载时清理」的问题，统一改法：在 `onDestroy` / cleanup 里补 `clearInterval`、`clearTimeout`、`removeEventListener`、`observer.disconnect()`。

- **MusicPlayer.svelte** — `startVolumeDrag` 的 mousemove/mouseup 未移除。
- **GridScripts.astro** — `setupSwupLayoutSync` 的 setInterval 未 clear。
- **SharePoster.svelte** — MutationObserver 未 disconnect。
- **MobileTOC.svelte** — `swup:enable` 监听器未移除。
- **Calendar.svelte** — 每分钟日期检查定时器未清除。
- **code-collapse.js** — debounceTimer 未 clearTimeout、MutationObserver 未 disconnect。
- **FloatingTOC.astro** — window.scroll/resize 监听未移除。
- **FullscreenWallpaper.astro** — setInterval 未清除。
- **LastModified.astro** — setInterval 未清除。
- **Icon.astro** — MutationObserver 未 disconnect。
- **scroll-handler.ts** — ScrollHandler 无 destroy 方法。
- **responsive-sidebar.ts** — resize 监听未清理。
- **CustomScrollbar.astro** — MutationObserver + scroll/resize 监听未移除。
- **navigation-utils.ts** — IntersectionObserver + waitForSwup 监听未移除。
- **Markdown.astro** — document 监听 + 定时器未清理。
- **Giscus.astro** — observer_theme 未 disconnect。
- **animation-utils.ts** — IntersectionObserver 未 disconnect。
- **anime-filter-handler.ts** — 事件监听重复添加、IntersectionObserver 未断开。
- **site-stats/SiteStats.astro** — setInterval 未清除。
- **LayoutSwitch.svelte** — mediaQueryList + swup 监听未移除。
- **card-toc/CardTOC.astro** — 事件重复绑定、WeakMap 未清理。
- **panel-handler.ts** — 点击外部监听重复绑定、boundClickHandlers 未清理。
- **ThemeSwitch.svelte** — setTimeout 未清理。
- **Pio.svelte** — pioInstance 未销毁、setTimeout 可能无限重试。
- **SidebarMusicClient.svelte** — 事件监听可能重复注册。
- **useVolumeControl.ts** — rafId 未 cancelAnimationFrame。
- **usePlayerState.ts** — showErrorMessageUI 的 setTimeout 未清理。
- **post-lastmodified.ts / animation-test.js** — setInterval 未清除。
- **BackToHome.astro** — document 监听未清理。
- **useTocScroll.ts** — scroll 监听未移除。
- **tocManager.ts / toc-utils.ts** — IntersectionObserver 未断开旧实例。

---

## 四、空值/边界校验缺失（特定输入下崩溃）

- **content-utils.ts** `post.data.category` 为 null 时直接 `trim()` → 先判空。
- **SiteStats.astro** posts 空数组直接 `posts[0]` → 判空或给默认值。
- **devices.astro** `devices[brands[0]]` 未判 brands 空 → 先查 length。
- **Profile.astro** `links[0]` 未判空、`==` 应改 `===`、重试未设上限。
- **useAudioPlayer.ts** `audio` 未判 undefined 就 play/pause、`audio.duration` 可能 NaN → 补 `if (!audio) return` 和 NaN 检查。
- **SidebarTrackInfo.svelte** `event.currentTarget` 可能 null、音量未 clamp、拖拽没绑到 document → 补判空 + `Math.max(0, Math.min(1, v))` + 事件绑 document。
- **useVolumeControl.ts** `rect.width` 为 0 会除零 → 判 width > 0。
- **SidebarProgress.svelte** `rect.width` 为 0 除零 → 判 width > 0。
- **PostListItem.astro** `published` 非 Date 时 `toDateString()` 崩 → 先转 Date 或校验。
- **TechStack.astro** `techStack` 为 null 时 `.map()` 崩 → `techStack ?? []`。
- **Giscus.astro** `config.lang` 未定义时 `replace` 崩 → `(config.lang || "")`。
- **IconifyLoader.astro** 错误事件被当加载完成 → 区分 error/load。
- **YearPicker.svelte** minYear > maxYear 可能死循环 → 先校验范围。
- **widget-manager.ts / responsive-sidebar.ts / SideBar.astro** 空引用访问 → 补存在性检查。
- **toc-utils.ts / useMobileTOC.ts** `rootMargin: -80%` 疑似笔误（应为像素）→ 改 `-80px` 或 `0px`；h1Count 超数组长度时 badge 为 undefined → 补边界检查。
- **FriendCard.astro** `new URL(siteurl)` 无效 URL 崩 → try-catch。
- **setting-utils.ts / PostList.svelte** `parseInt` 未指定基数、前导零问题 → 指定基数 10 或用 Number()。
- **SkillCard.astro** `${skillColor}20` 十六进制拼接错误 → 用 rgba() 或 8 位 hex。

---

## 备注

- 上一份评审里 `styles\wikoo.css` 的 3 条意见对应文件在源码中不存在（30B 幻觉），本轮已剔除。
- 全部条目都定位到 `E:\yrlwa-web\Mizuki-master\src\` 下的真实文件，可直接对照修改。
