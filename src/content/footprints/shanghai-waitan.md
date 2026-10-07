---
# 示例条目（随便删）：演示一条足迹怎么写。
# 复制这个文件改名，把坐标换成你的地方就是新标点；也可以直接跑
#   node scripts/footprint-import.mjs --input scripts/footprint-inbox
# 用照片里的 GPS 自动生成，不用手写。
title: "上海 · 外滩"
summary: "第一次站在黄浦江边，风从江面吹上来，对岸的灯一排排亮起来。"
lat: 31.23972
lng: 121.49028
altitude: 4
place: "黄浦区"
region: "上海市"
country: "中国"
countryCode: "CN"
date: 2025-10-03
type: city
tags: ["旅行", "夜景"]
cover: "/assets/desktop-banner/1.png"
photos:
  - src: "/assets/desktop-banner/1.png"
    alt: "外滩夜景"
  - src: "/assets/desktop-banner/3.png"
    alt: "江边"
# 关联博客文章：填 src/content/posts/ 下的文件名（不带 .md），
# 地图侧栏就会出现「相关文章」链接。反过来文章里写 /globe/?f=shanghai-waitan 就能跳回这个标点。
posts: ["mysfirstarticle"]
---

地图只读 frontmatter 里的 `summary` 作为「感想」，这里的正文留给你以后渲染独立页面时用。
