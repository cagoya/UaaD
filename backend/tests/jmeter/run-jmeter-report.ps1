# JMeter 无界面跑计划并生成 HTML 报告。
# 生成物统一写入子目录 out/（该目录已加入 .gitignore）。
# 说明：-o 的目标目录必须不存在或为空。
# 用法（在 tests/jmeter 目录）: .\run-jmeter-report.ps1

param(
    [string]$ReportDir = "",
    [string]$Jmx = "enrollment-load.jmx"
)

$ErrorActionPreference = "Stop"
$here = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $here

$outRoot = Join-Path $here "out"
if (-not (Test-Path -LiteralPath $outRoot)) {
    New-Item -ItemType Directory -Path $outRoot -Force | Out-Null
}

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
if ($ReportDir -eq "") {
    $ReportDir = Join-Path $outRoot ("report-" + $ts)
} elseif (-not [System.IO.Path]::IsPathRooted($ReportDir)) {
    $ReportDir = Join-Path $outRoot $ReportDir
}

if (Test-Path -LiteralPath $ReportDir) {
    Remove-Item -LiteralPath $ReportDir -Recurse -Force
}

$jtl = Join-Path $outRoot ("results-" + $ts + ".jtl")
$jmLog = Join-Path $outRoot ("jmeter-" + $ts + ".log")

Write-Host "JTL: $jtl"
Write-Host "Log: $jmLog"
Write-Host "Report: $ReportDir"
# -j 将 JMeter 运行日志写入 out/，避免在 tests/jmeter 根目录产生 jmeter.log
& jmeter -n -t $Jmx -l $jtl -j $jmLog -e -o $ReportDir
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
Write-Host "Done. Open $ReportDir\index.html"
