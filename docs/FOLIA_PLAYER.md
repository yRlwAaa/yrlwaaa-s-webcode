# 音乐页在线播放器（Folia）接入与部署

本站音乐页 `/music/` 上的「在线播放器」入口，通向 `/music/player/` 全屏页，
里面以 iframe 内嵌自建的 [Folia](https://github.com/chthollyphile/folia-major) Web 版。

本文说明**为什么这么接**、**你需要手动做什么**、以及**已知限制**。

---

## 1. 先说清楚一件事：Folia 的 exe 不能嵌进网页

Folia 同时提供两种形态：

| 形态 | 组成 | 能否嵌入网页 |
| --- | --- | --- |
| 桌面版 | Electron 打包，前后端都在里面 | ❌ 可执行文件无法嵌入网页 |
| **Web 版** | Vite/React 静态前端 + **独立的**网易云 API 服务 | ✅ 可全屏内嵌 |

所以本站走的是 **Web 版自建**。

## 2. 架构：这是三段式，不是一段

```
浏览器
 └─ https://yrlwa.top/music/player/          本站全屏壳页（src/pages/music/player.astro）
     └─ <iframe src="https://folia.yrlwa.top/">   Folia 前端（你自建的 Cloudflare Worker）
         └─ fetch https://<你的-api>.vercel.app/...  网易云 API（NeteaseCloudMusicApiEnhanced）
```

**关键点：Folia 官方明确要求「使用前端版本的话，需要先自行部署该 API 服务」——
前端包里不含网易云接口。** 少部署这一段，进去就是搜不了歌、登不了账号。

---

## 3. 你要手动做的四步

> 这三步必须由你在浏览器里点授权完成，凭据不需要交给任何人。

### 步骤 1 · 部署网易云 API（Vercel）

1. Fork [`NeteaseCloudMusicApiEnhanced/api-enhanced`](https://github.com/NeteaseCloudMusicApiEnhanced/api-enhanced)。
2. Vercel → **Add New → Project** → 导入你刚 fork 的仓库 → **Deploy**（保持默认，仓库自带 `vercel.json`）。
3. 部署完得到一个地址，形如 `https://xxx.vercel.app`。
4. **验证**：浏览器直接打开

   ```
   https://xxx.vercel.app/search?keywords=hello
   ```

   返回一整段 JSON（而不是报错页）就算成功。

5. **环境变量 `CORS_ALLOW_ORIGIN` 不要设成 `*`。**

   该服务的响应头同时带 `Access-Control-Allow-Credentials: true`，
   而 `*` 与携带凭据的跨域请求互斥，浏览器会直接判定非法、所有请求全挂。
   - 留空 = 回显请求来源（能用，最省事）
   - 收紧 = 填 `https://folia.yrlwa.top,https://folia-major.<你的账号>.workers.dev`

### 步骤 2 · 部署 Folia 前端（Cloudflare）

1. 打开官方一键部署入口：

   ```
   https://deploy.workers.cloudflare.com/?url=https://github.com/chthollyphile/folia-major
   ```

   它会把这个仓库 clone 到**你自己的 GitHub 账号**下，并创建一个 Worker（名 `folia-major`），
   同时开启 Workers Builds。首次需要授权 Cloudflare 访问 GitHub。

2. **在触发构建之前**，到 Worker 的 **Settings → Variables and Secrets** 加变量：

   | 变量 | 值 | 必需 |
   | --- | --- | --- |
   | `VITE_NETEASE_API_BASE` | 步骤 1 拿到的 `https://xxx.vercel.app` | ✅ 必需 |
   | `VITE_AI_PROVIDER` | `openai` 或 `google` | 可选（AI 主题生成） |
   | `OPENAI_API_KEY` / `OPENAI_API_URL` / `OPENAI_API_MODEL` | 你的 AI 接口 | 可选 |
   | `VITE_QQ_API_BASE` | `/api/qq`（用内置 serverless 入口） | 可选（QQ 音乐音源） |
   | `QQ_SESSION_SECRET` | 随机长串，存为 **Secret** | 用 `/api/qq` 时必需 |

   > ⚠️ `VITE_NETEASE_API_BASE` 是**构建期**注入的（Folia 源码里只读 `import.meta.env`，
   > 没有运行时设置项）。**改了它必须重新部署一次构建才生效**，重启 Worker 没用。

3. 构建完成后得到 `https://folia-major.<你的账号>.workers.dev`。

### 步骤 3 · 绑定自定义域名（强烈建议）

Worker → **Settings → Domains & Routes → Add Custom Domain** → 填 `folia.yrlwa.top`。

**为什么必须绑**：`yrlwa.top` 与 `folia.yrlwa.top` 属于同一个站点（same-site），
iframe 里的 localStorage / IndexedDB 会被浏览器当作第一方存储，不会被隐私策略清理。
用 `*.workers.dev` 也能跑，但那是一个完全不同的站点，长期登录态更容易被清掉。

### 步骤 4 · 本站配置

默认地址已经写成 `https://folia.yrlwa.top/`，**绑好域名后本站无需改任何代码**。

要换成别的地址，二选一（后者优先）：

- 改 `src/data/folia.ts` 里的 `url` 默认值
- 在 Cloudflare Pages 项目里设环境变量 `PUBLIC_FOLIA_PLAYER_URL`

改完 push，等 Pages 自动构建即可。

---

## 4. 为什么 iframe 里还能登网易云账号

一般担心的是「跨域 iframe 里第三方 Cookie 被拦，登录态存不住」。
Folia 不依赖 Cookie：

- 登录返回的 cookie 被它**存进 localStorage**（其 `src/services/onlineMusic/providerStorage.ts`）
- 每次请求再以 **`?cookie=` 查询参数**发给 API（其 `src/services/netease.ts`，
  源码注释原文：*"we rely on the `cookie` query param if cross-site cookies are blocked"*）

所以第三方 Cookie 策略不影响登录。**扫码/手机号登录均可在 iframe 内正常完成。**

---

## 5. 已知限制

### 5.1 本地音乐导入在 iframe 里用不了

Folia 的「本地音乐」用 File System Access API（`showDirectoryPicker()`），
**浏览器禁止跨域 iframe 调用文件选择器**，这是浏览器硬限制，改代码也绕不过。

→ 需要导入本地音乐时，用 `/music/player/` 右上角悬浮按钮里的**「在新标签页打开」**，
在独立标签页里打开 `folia.yrlwa.top`，那里没有 iframe 限制。

在线听歌、搜索、歌单、歌词、AI 主题等全部功能不受影响。

### 5.2 酷狗音源需要额外部署

Web 版用酷狗要另起一个 [KuGouMusicApi](https://github.com/MakcRe/KuGouMusicApi) 实例，
再把 `VITE_KUGOU_API_BASE` 指过去。官方没有公共实例，默认留空即不可用。

### 5.3 桌面端专属功能 Web 版没有

壁纸模式、遥控窗、Discord RPC、自动更新、本机歌词接口（`127.0.0.1:32109`）等只在 Electron 版存在。

### 5.4 Folia 是 PWA，但它在 iframe 里装不了

Service Worker 不允许在跨域 iframe 注册。想装 PWA，请到 `folia.yrlwa.top` 直接访问安装。

---

## 6. 代码放在哪、许可证怎么算

### 「Deploy to Cloudflare」按钮到底做了什么

按 [Cloudflare 官方文档](https://developers.cloudflare.com/workers/platform/deploy-buttons/)：

> **Clone a Git repository**: Cloudflare clones your source repository **into the user's GitHub/GitLab account** where they can continue development after deploying.

也就是说它会**把 Folia 源码克隆一份到你自己的 GitHub 账号下，建成一个独立仓库**，
Worker 再连着那个新仓库构建（之后往那个仓库提交会自动重新部署）。
创建页面上还能自定义仓库名和 Worker 名。

这一点要分清 —— 涉及的是**两个不同仓库**：

| 仓库 | 内容 | 含 Folia 代码？ |
| --- | --- | --- |
| 站点仓库 `yrlwaaa-s-webcode` | 入口链接 + iframe 壳页 + 本文档 | ❌ 一行都没有 |
| Cloudflare 新建的独立仓库 | Folia 完整源码副本 | ✅ 全在这里 |

站点侧接入一个第三方 Web 应用，实际只加了三个东西：`music/index.astro` 里一个 `<a>`、
`music/player.astro` 一个 iframe 壳、`data/folia.ts` 一处地址配置。**播放器实现代码不在站点仓库里。**

### 许可证：AGPL-3.0

克隆到你的账号下**不代表版权转移**，Folia 仍是 `AGPL-3.0`。要点：

- 别删克隆下来的 `LICENSE`。
- **当前跑的是未修改的原版** —— 源码在上游公开仓库，链接过去即可满足 AGPL 第 13 条
  （对外提供网络服务须向使用者提供对应源码）。
- ⚠️ **一旦你改了它的代码**（改界面、加功能），AGPL 要求你**公开修改后的版本**。
  到那时如果那个仓库是私有的，就构成合规问题。只当自己用、不改代码则无所谓。

### 不想让代码进 GitHub 的替代方案

1. **Docker 自部署**（仓库自带 `deploy/docker/`）：代码只在自己服务器上，完全不碰 GitHub。
   代价 —— 若跑在内网 NAS 上，还需额外配公网 HTTPS（Cloudflare Tunnel 或反代证书）才能被浏览器调用。
2. **本地构建后 `wrangler deploy`**：不落 GitHub，但需要先把源码弄到本机。

---

## 7. 排错

| 现象 | 原因 / 处理 |
| --- | --- |
| iframe 一片空白 | 看 Worker 是否发了 `X-Frame-Options`（默认不发）；F12 看 Console 报错 |
| 加载卡在转圈 | `src` 地址不通；直接在标签页打开 `folia.yrlwa.top` 验证 |
| 能进界面但搜不了歌 / 登录失败 | `VITE_NETEASE_API_BASE` 没配，或配了但**没重新构建** |
| 接口全部 403 / CORS 报错 | API 的 `CORS_ALLOW_ORIGIN` 被设成了 `*`，改回留空或写明确来源 |
| 点了播放没声音 | 浏览器自动播放策略，先在页面里点一下（iframe 已带 `allow="autoplay"`） |
| 改了环境变量不生效 | `VITE_*` 是构建期变量，必须 Redeploy |
| 本站入口卡片看不到 | `src/data/folia.ts` 的 `enabled` 是否被改成 `false` |

---

## 8. 相关文件

| 文件 | 作用 |
| --- | --- |
| `src/data/folia.ts` | 播放器地址与入口开关（唯一需要改的配置） |
| `src/pages/music/index.astro` | 音乐页入口卡片 |
| `src/pages/music/player.astro` | 全屏播放器壳页（刻意不使用 Layout，无侧栏/导航/页脚） |
| `src/i18n/i18nKey.ts` + `src/i18n/languages/*.ts` | 8 个新词条 × 4 语言 |
| `public/_headers` | 给 `/music/*` 加了 `no-cache`，改播放器地址后立刻生效 |
