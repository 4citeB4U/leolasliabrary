$alias = "C:\Users\Leona\AppData\Local\Microsoft\WindowsApps\blender-launcher.exe"
$script = "C:\Users\Leona\.gemini\antigravity\brain\cb12fcba-0fde-4f97-ae29-adeaf48b9241\scratch\blender_stylize.py"
Copy-Item $script "d:\Leeway-Ecosystem v2.1.4\leolas-liabrary\tools\blender_stylize.py" -Force

$p = Start-Process -FilePath $alias -ArgumentList "--background", "--python", "`"$script`"" -PassThru
$p.WaitForExit(15000)

Start-Sleep -Seconds 3

if (Test-Path "d:\Leeway-Ecosystem v2.1.4\leolas-liabrary\tools\blender_trace.txt") {
    Get-Content "d:\Leeway-Ecosystem v2.1.4\leolas-liabrary\tools\blender_trace.txt"
} else {
    Write-Host "No trace file found"
}
