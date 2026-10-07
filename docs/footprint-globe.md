# 地球足迹（Globe Footprints）

把去过的地方钉在一颗可交互的 3D 地球上：坐标、照片、感想文字，并且和博客文章双向联动。

- 页面：`/globe/`（导航「我的 → 地球足迹」，相册页 `/albums/` 顶部也有入口）
- 数据：`src/content/footprints/*.md`（frontmatter 就是地图读的数据）
- 端点：`/api/footprints.json`（构建期生成，纯静态，无需后端）
- 导入脚本：`scripts/footprint-import.mjs`

---

## 1. 它长什么样

打开 `/globe/` 直接就是一颗地球（不是平面地图）：

| 能力 | 说明 |
| --- | --- |
| 3D 地球 | MapLibre GL 的 `globe` 投影渲染，拖拽旋转、滚轮/双指缩放、`Ctrl+拖拽`俯仰 |
| 精确坐标 | 鼠标所在位置实时显示经纬度，5 位小数 ≈ 1 米；右下同时显示缩放级别 |
| 标点 | 足迹按类型着色成点；缩放较远时自动聚合（点上的数字是聚合数量） |
| 查看 | 点标点 → 右侧出现照片集、坐标（可一键复制）、时间、感想、标签、相关文章 |
| 找地方 | 顶部搜索（地点/标签/感想）、类型筛选、年份筛选、「定位到我」 |
| 创作 | 打开「创作模式」→ 在地球上点位置 → 填地点/日期/类型/文字/照片 → 导出条目 |
| 深链 | `/globe/?f=<足迹id>` 直接飞到某个标点并打开它（文章里可以链过去） |

底图用的是 [OpenFreeMap](https://openfreemap.org/)，**不需要 API Key、不限额**，瓦片/样式/字体均已实测可达。
没网或源挂了也能打开页面，只是地球上是空白的，标点与侧栏数据仍然来自构建产物、照常可用。

---

## 2. 新增一个标点（两种方式）

### 方式 A：手写一个 Markdown（最直接）

新建 `src/content/footprints/<id>.md`，`<id>` 就是足迹 id（英文/数字，用于 URL）：

```yaml
---
title: "上海 · 外滩"            # 必填
summary: "一句话感想"           # 地图侧栏显示的正文
lat: 31.23972                  # 必填
lng: 121.49028                 # 必填
altitude: 4                    # 可选，海拔（米）
place: "黄浦区"
region: "上海市"
country: "中国"
countryCode: "CN"
date: 2025-10-03               # 必填，首次到访
dateEnd: 2025-10-05            # 可选，多次到访的最后一天
type: city                     # travel|life|food|nature|city|photo|memory
tags: ["旅行", "夜景"]
mood: "安静"
cover: "/assets/desktop-banner/1.png"
photos:
  - src: "/assets/desktop-banner/1.png"
    alt: "外滩夜景"
    caption: "从滨江步道看向对岸"
album: "Genshinimpact"         # 可选，关联 /albums/ 里的相册 id
posts: ["mysfirstarticle"]     # 关联博客文章（文件名，不带 .md）
excerpt: "正文里的一句话"       # 可选
pinned: true                   # 可选，置顶
---

正文随便写，地图不读这里。
```

### 方式 B：用照片自动生成（推荐，能读出手机拍照的 GPS）

1. 把照片丢进 `scripts/footprint-inbox/`（可建子文件夹）
2. 运行：

```bash
node scripts/footprint-import.mjs --input scripts/footprint-inbox --geocode
```

脚本会：

- 读照片 EXIF 里的 **GPS 坐标 / 海拔 / 拍摄时间**（内置解析，不依赖第三方库）
- 把「同一天 + 相距 200 米内」的照片聚成**一个标点**（避免几十张照片变成几十个点）
- 把图片转成 webp（长边 2000，可 `--quality` 调）落到 `public/images/footprints/<id>/`
- 生成 `src/content/footprints/<id>.md`
- `--geocode` 时调用 Nominatim 反查地名（需联网，遵守 1 次/秒）

参数：

| 参数 | 作用 |
| --- | --- |
| `--input <文件夹>` | 照片目录（默认 `scripts/footprint-inbox`） |
| `--from-entry <json>` | 消费浏览器「创作模式」导出的条目 JSON |
| `--geocode` | 反查地名 |
| `--quality <px>` | 图片长边上限，默认 2000 |
| `--force` | 覆盖已存在的同名条目 |
| `--dry-run` | 只打印，不写文件 |

照片没有 GPS 怎么办：把文件名改成 `名称@纬度,经度.jpg`，例如
`外滩@31.23972,121.49028.jpg`，脚本优先用文件名里的坐标。

### 方式 C：在网页上点（创作模式）

在 `/globe/` 打开右上角「创作模式」→ 在地球上点一下 → 表单里填内容 →
「导出条目」会下载一个 JSON（照片只能预览排版，不能自动上传）。

把它交给脚本入库：

```bash
node scripts/footprint-import.mjs --from-entry scripts/footprint-inbox/上海-外滩.json
```

> 为什么创作模式不能直接写进网站：站点是 Cloudflare Pages **纯静态**部署，
> 没有能接收文件的后端。要「随时随地在线标点」，见文末第 6 节。

---

## 3. 和博客文章联动（双向）

**足迹 → 文章**：足迹 frontmatter 里的 `posts: ["文章slug"]`，地图侧栏会出现「相关文章」链接。
链接走主题自己的 `getPostUrl()`，所以自定义 permalink / alias / 全局 permalink 规则都会被遵守。

**文章 → 足迹**：在文章里放这条链接即可跳到对应标点：

```markdown
那天在[外滩](/globe/?f=shanghai-waitan)，江风很冷。
```

`?f=` 后面是足迹的 id（文件名去扩展名）。

---

## 4. 数据结构

`/api/footprints.json` 返回：

```jsonc
{
  "generatedAt": "2026-10-07T05:39:13.401Z",
  "count": 3,
  "bbox": [118.78889, 31.23972, 121.49028, 36.05389], // [minLng,minLat,maxLng,maxLat]，用于初始取景
  "footprints": [
    {
      "id": "shanghai-waitan",
      "title": "上海 · 外滩",
      "lat": 31.23972, "lng": 121.49028,
      "date": "2025-10-03",
      "type": "city",
      "photos": [{ "src": "...", "alt": "", "caption": "" }],
      "postLinks": [{ "slug": "mysfirstarticle", "title": "…", "url": "/posts/mysfirstarticle/" }]
      // …其余字段见 src/types/footprint.ts
    }
  ]
}
```

前端只认这个结构（`src/types/footprint.ts`）——数据来源换成后端 API、数据库、地图编辑器都不需要改前端。

---

## 5. 代码地图

| 文件 | 作用 |
| --- | --- |
| `src/pages/globe.astro` | 地球页：注入数据、放容器与所有面板 |
| `src/scripts/footprint-globe.ts` | 客户端引擎：地图、标点、筛选、详情、创作模式、反向地理编码 |
| `src/styles/globe.css` | 地球页样式（玻璃面板、深浅色自适应、移动端底部抽屉） |
| `src/content.config.ts` | `footprints` 集合 schema（改字段先改这里） |
| `src/utils/footprint-utils.ts` | 集合 → 扁平数据、文章链接解析、包围盒 |
| `src/pages/api/footprints.json.ts` | 构建期 JSON 端点 |
| `src/types/footprint.ts` | 前后端共用的数据结构 |
| `scripts/footprint-import.mjs` | 照片/JSON → 足迹条目 |
| `src/pages/albums.astro` | 相册页顶部的「地球足迹」入口（位置可挪） |

**想换入口位置**：`src/pages/albums.astro` 里 `<a class="album-globe-entry">` 整块移动即可；
不要了就直接删掉这段加样式，`/globe/` 页仍然独立可用。

---

## 6. 已知边界与后续路线

**当前边界**

- 站点静态部署，网页端的「标点」只能导出 JSON，再由本地脚本入库；照片不能网页上传。
- 网页端地名识别用两个免费通道（Nominatim → BigDataCloud），都不可达时需手填。
- 底图是 OpenFreeMap 的矢量风格，不是卫星影像/真实地形高程；`altitude` 是照片 EXIF 里的值，不是地形采样。
- 首次进入需要下载约 1 MB 的地图引擎（已单独分包，不拖慢其他页面）。

**后续可做（按性价比排序）**

1. **文章内嵌小地图**：给文章页加一个 `<FootprintMiniMap footprint="shanghai-waitan" />` 组件，正文里直接出现一张小球/静态图。
2. **在线标点**：接一个 Cloudflare Pages Function 或 Workers + R2/KV，把「导出 JSON」变成「提交入库」，可实现手机随手打点。
3. **手机照片直传**：网页端用 `<input capture>` 读 EXIF（`exifr` 之类的浏览器端解析），再走上面的接口。
4. **轨迹而不是点**：把同一天的多个点连成线（GeoJSON LineString），展现「那天走过的路线」。
5. **卫星影像底图**：换成 Esri World Imagery 等栅格源，配 `globe` 投影做「真实地球」。
6. **统计面板**：去过多少国家/省份、总里程、年份热力。

---

## 7. 快速验证清单

```bash
node scripts/footprint-import.mjs --input scripts/footprint-inbox --dry-run   # 只预览解析结果
pnpm dev            # 打开 http://localhost:4321/globe/
pnpm build          # 构建；产物含 dist/globe/index.html 与 dist/api/footprints.json
```

打开后应看到：一颗地球 + 左上工具条 + 左下坐标读数（移动鼠标数字会变）+ 右侧足迹列表。

### 布局自检（远程/无头环境用）

访问 `/globe/?fmdebug=1`，6 秒后页面会把关键元素的真实盒模型写入 `body[data-fm-debug]`，
可用 `--dump-dom` 抓出来核对。正常应满足：

- `shellInBody=true`（地球层已移出 `#main-grid`）
- `.fm-shell` 宽高≈视口宽 × (视口高 − 导航栏高)
- `#fm-map` 与 `.maplibregl-canvas` 尺寸与 shell 一致
- `loadingGone=true`、`items=` 等于足迹条数

### 已知的本地环境限制

用**无头浏览器**（Edge/Chrome `--headless=new`，含 SwiftShader 软件渲染）验证时，
MapLibre 的底图样式可能始终不加载（`isStyleLoaded()` 恒为 false、`load` 事件不触发），
表现为：UI 全对、坐标读数正常、但球体区域是空白，状态栏显示「3D 地球（准备中）」。
这是无头环境的渲染限制，**用真实浏览器打开即正常**。瓦片源本身可用下面命令单独确认：

```bash
curl -I https://tiles.openfreemap.org/styles/liberty
```
