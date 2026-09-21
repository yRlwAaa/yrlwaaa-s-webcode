# AI 去水印 —— 在 E5 上做成常驻服务(可与对话/画图并存, 前提是显存够)
# ------------------------------------------------------------------
# 与 e5-inpaint-setup.ps1 的区别: 那个是"装好 + 手动起", 这个把它做成
# 开机自启的常驻服务, 并打印 E5-gpu-manager.py 需要加的代理代码。
#
# 用法(在 E5 上以管理员身份运行):
#   powershell -ExecutionPolicy Bypass -File e5-inpaint-service.ps1
#   powershell -ExecutionPolicy Bypass -File e5-inpaint-service.ps1 -Remove   # 卸载
param([switch]$Remove)

$ErrorActionPreference = "Stop"
$Root   = "C:\e5\inpaint"
$Venv   = "$Root\venv"
$Port   = 7861
$Model  = "lama"
$Task   = "E5-Inpaint"
$LogDir = "$Root\logs"

if ($Remove) {
	Write-Host "== 卸载常驻服务 ==" -ForegroundColor Cyan
	Unregister-ScheduledTask -TaskName $Task -Confirm:$false -ErrorAction SilentlyContinue
	Get-Process python -ErrorAction SilentlyContinue |
		Where-Object { $_.Path -like "$Venv*" } | Stop-Process -Force -ErrorAction SilentlyContinue
	Write-Host "已移除计划任务 $Task 并停止进程(文件与模型保留在 $Root)" -ForegroundColor Green
	exit 0
}

if (-not (Test-Path "$Venv\Scripts\iopaint.exe")) {
	Write-Host "没找到 IOPaint, 请先运行 e5-inpaint-setup.ps1" -ForegroundColor Red
	exit 1
}
New-Item -ItemType Directory -Force -Path $LogDir | Out-Null

# 用计划任务而不是 Windows 服务: 服务跑在 Session 0 拿不到完整的 GPU/桌面环境, 计划任务更稳
$cmd = "$Venv\Scripts\iopaint.exe start --model=$Model --device=cuda --host=127.0.0.1 --port=$Port --no-interactive --low-mem"
$action = New-ScheduledTaskAction -Execute "cmd.exe" `
	-Argument "/c `"$cmd`" >> `"$LogDir\inpaint.log`" 2>&1"
$trigger = New-ScheduledTaskTrigger -AtStartup
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries `
	-RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1) -ExecutionTimeLimit (New-TimeSpan -Days 0)

Register-ScheduledTask -TaskName $Task -Action $action -Trigger $trigger -Settings $settings `
	-RunLevel Highest -Force | Out-Null

Write-Host "== 已注册计划任务 $Task(开机自启、崩溃自动重启)==" -ForegroundColor Green
Start-ScheduledTask -TaskName $Task
Write-Host "已尝试启动, 30 秒后可这样验证:" -ForegroundColor Green
Write-Host "  Invoke-RestMethod http://127.0.0.1:$Port/api/v1/server-config" -ForegroundColor Yellow
Write-Host ""
Write-Host "== 显存实测(决定能不能常驻) ==" -ForegroundColor Cyan
Write-Host "跑一次推理后再看 nvidia-smi; 如果 LaMa 稳定占用 <= 4G, 且对话模型满载后仍有富余," -ForegroundColor DarkGray
Write-Host "就可以让它一直开着; 否则请把 inpaint 也接进 E5-gpu-manager.py 的模式切换。" -ForegroundColor DarkGray
Write-Host ""
Write-Host "== E5-gpu-manager.py 需要加的代理(把这段接到现有路由里) ==" -ForegroundColor Cyan
@'
INPAINT_URL = "http://127.0.0.1:7861"

# GET /api/inpaint —— 探活(站点 /api/inpaint 的 GET 会读它)
# 让 stats 里带上 inpaint, 前端据此决定 AI 模式是否可用:
#   services["inpaint"] = {"alive": <bool>, "port": 7861}
def inpaint_alive():
    try:
        r = requests.get(INPAINT_URL + "/api/v1/server-config", timeout=2)
        return r.status_code == 200
    except Exception:
        return False

# POST /api/inpaint —— 转发 {image, mask}(纯 base64)给 IOPaint, 把结果原样回传
def handle_inpaint(body):
    r = requests.post(INPAINT_URL + "/api/v1/inpaint",
                      json={"image": body["image"], "mask": body["mask"]},
                      timeout=120)
    r.raise_for_status()
    # IOPaint 返回 image/webp 二进制; 这里转成站点约定的 {ok, image: dataURL}
    b64 = base64.b64encode(r.content).decode()
    return {"ok": True, "image": "data:image/webp;base64," + b64}
'@ | Write-Host
