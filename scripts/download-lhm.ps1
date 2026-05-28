# Download LibreHardwareMonitor portable for bundling with ChronoDesk
$ErrorActionPreference = 'Stop'
$lhmDir = Join-Path $PSScriptRoot '..\build\lhm'

if (Test-Path "$lhmDir\LibreHardwareMonitor.exe") {
    Write-Host "LHM already exists at $lhmDir"
    exit 0
}

Write-Host "Downloading LibreHardwareMonitor..."
$release = Invoke-RestMethod 'https://api.github.com/repos/LibreHardwareMonitor/LibreHardwareMonitor/releases/latest'
$asset = $release.assets | Where-Object { $_.name -eq 'LibreHardwareMonitor.zip' }
$url = $asset.browser_download_url

$tmpZip = Join-Path $env:TEMP 'lhm.zip'
Invoke-WebRequest -Uri $url -OutFile $tmpZip -UseBasicParsing

$tmpDir = Join-Path $env:TEMP 'lhm-extract'
if (Test-Path $tmpDir) { Remove-Item $tmpDir -Recurse -Force }
Expand-Archive -Path $tmpZip -DestinationPath $tmpDir -Force

if (-not (Test-Path $lhmDir)) { New-Item -ItemType Directory -Path $lhmDir -Force | Out-Null }
Copy-Item "$tmpDir\*" -Destination $lhmDir -Recurse -Force

# Clean up unnecessary files
Remove-Item "$lhmDir\*.pdb" -ErrorAction SilentlyContinue
Remove-Item "$lhmDir\*.xml" -ErrorAction SilentlyContinue
@('de','es','fr','it','ja','pl','ru','sv','tr','zh-Hant') | ForEach-Object {
    Remove-Item "$lhmDir\$_" -Recurse -Force -ErrorAction SilentlyContinue
}

Remove-Item $tmpZip -Force
Remove-Item $tmpDir -Recurse -Force

Write-Host "LHM downloaded to $lhmDir"
