# 照片收件箱

把要入库的照片丢进这个文件夹（可以建子文件夹），然后运行：

```bash
node scripts/footprint-import.mjs --input scripts/footprint-inbox --geocode
```

脚本会读照片 EXIF 里的 GPS/海拔/拍摄时间，把「同一天 + 相距 200 米内」的照片
聚成一个标点，压缩成 webp 放进 `public/images/footprints/`，并生成
`src/content/footprints/<id>.md`。

## 照片没有 GPS 怎么办

把文件名改成 `名称@纬度,经度.jpg`，脚本优先用文件名里的坐标：

```
外滩@31.23972,121.49028.jpg
外滩夜景@31.24012,121.49055.jpg
```

## 注意

- 本目录里除本说明与 `.gitkeep` 外**都不入库**（见 `.gitignore`），照片是原料不是产物。
- 只处理图片扩展名：jpg / jpeg / png / webp / tif / tiff / heic / avif。
- 先 `--dry-run` 看一遍解析结果，确认坐标对了再正式跑。
