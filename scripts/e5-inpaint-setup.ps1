# AI 去水印服务部署脚本 (在 E5 那台 Windows 机器上以管理员身份运行)
# ------------------------------------------------------------------
# 装什么: IOPaint(LaMa 模型), 它自带 HTTP API, 由 E5-gpu-manager.py 反代成
#         /api/inpaint 暴露给站点, 显存占用约 2~4G。
# 用法:   powershell -ExecutionPolicy Bypass -File e5-inpaint-setup.ps1
# 之后:   在 E5-gpu-manager.py 的 mode 里加 inpaint(与 chat / draw 三选一),
#         启动命令见本脚本最后打印的那行。
$ErrorActionPreference = "Stop"

$Root   = "C:\e5\inpaint"
$Venv   = "$Root\venv"
$Port   = 7861
$Model  = "lama"

Write-Host "== 1/5 检查 Python ==" -ForegroundColor Cyan
$py = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $py) { Write-Host "没找到 python, 请先装 Python 3.10/3.11 并勾选 Add to PATH" -ForegroundColor Red; exit 1 }
python -V

Write-Host "== 2/5 建虚拟环境 $Venv ==" -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path $Root | Out-Null
if (-not (Test-Path $Venv)) { python -m venv $Venv }
& "$Venv\Scripts\python.exe" -m pip install --upgrade pip

Write-Host "== 3/5 装 PyTorch(CUDA 12.1, 适配 P100 / Pascal) ==" -ForegroundColor Cyan
# P100 是 Pascal(sm_60), cu121 仍然支持; 不要装更新的 cu124+(已移除 Pascal 支持)
& "$Venv\Scripts\python.exe" -m pip install torch --index-url https://download.pytorch.org/whl/cu121

Write-Host "== 4/5 装 IOPaint ==" -ForegroundColor Cyan
& "$Venv\Scripts\python.exe" -m pip install iopaint

Write-Host "== 5/5 验证 GPU 可用性 ==" -ForegroundColor Cyan
& "$Venv\Scripts\python.exe" -c "import torch;print('torch',torch.__version__,'cuda',torch.cuda.is_available(),torch.cuda.get_device_name(0) if torch.cuda.is_available() else '')"

Write-Host ""
Write-Host "装完了。启动命令(把它加进 E5-gpu-manager.py 的 inpaint 模式):" -ForegroundColor Green
Write-Host "  $Venv\Scripts\iopaint.exe start --model=$Model --device=cuda --host=127.0.0.1 --port=$Port --no-interactive" -ForegroundColor Yellow
Write-Host ""
Write-Host "接口: http://127.0.0.1:$Port/api/v1/inpaint  (POST {image, mask} 纯 base64)" -ForegroundColor Green
Write-Host "站点侧: Cloudflare 环境变量 E5_TOKEN 配成与其它控制操作相同的口令即可。" -ForegroundColor Green
Write-Host ""
Write-Host "首次启动会自动下载 LaMa 模型(约 200MB), 耐心等一次。" -ForegroundColor DarkGray
