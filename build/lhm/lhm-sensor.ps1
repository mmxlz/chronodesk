# LibreHardwareMonitor sensor reader - runs with admin, writes to JSON file
# Usage: powershell -ExecutionPolicy Bypass -File lhm-sensor.ps1 -OutputPath <path>

param(
    [string]$OutputPath = "$env:TEMP\chronodesk-sensors.json"
)

[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$ErrorActionPreference = 'SilentlyContinue'

# Find DLL path relative to script
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$dllPath = Join-Path $scriptDir 'LibreHardwareMonitorLib.dll'

if (-not (Test-Path $dllPath)) {
    Write-Error "LHM DLL not found at $dllPath"
    exit 1
}

Add-Type -Path $dllPath

$computer = New-Object LibreHardwareMonitor.Hardware.Computer
$computer.IsCpuEnabled = $true
$computer.IsGpuEnabled = $true
$computer.Open()

# Wait for sensors to initialize
Start-Sleep -Seconds 3

# Create sentinel file to indicate we're running
$sentinelPath = [System.IO.Path]::ChangeExtension($OutputPath, '.running')
'running' | Out-File -FilePath $sentinelPath -Encoding UTF8 -Force

try {
    while ($true) {
        # Check if sentinel file still exists (parent process deletes it to stop us)
        if (-not (Test-Path $sentinelPath)) {
            break
        }

        # Force sensor updates
        for ($i = 0; $i -lt 2; $i++) {
            foreach ($h in $computer.Hardware) {
                $h.Update()
                foreach ($s in $h.SubHardware) { $s.Update() }
            }
            Start-Sleep -Milliseconds 200
        }

        # Collect temperatures
        $result = @{
            cpu = @{}
            gpu = @{}
            timestamp = [DateTime]::Now.ToString("HH:mm:ss")
        }

        foreach ($h in $computer.Hardware) {
            foreach ($s in $h.Sensors) {
                if ($s.SensorType -eq 'Temperature' -and $s.Value -ne $null) {
                    $val = [math]::Round($s.Value, 1)
                    if ($h.HardwareType -like '*Cpu*') {
                        $result.cpu[$s.Name] = $val
                    } elseif ($h.HardwareType -like '*Gpu*') {
                        $result.gpu[$s.Name] = $val
                    }
                }
            }
        }

        # Write to temp file then atomic rename (avoid partial reads)
        $tempPath = "$OutputPath.tmp"
        $result | ConvertTo-Json -Compress | Out-File -FilePath $tempPath -Encoding UTF8 -Force
        Move-Item -Path $tempPath -Destination $OutputPath -Force

        Start-Sleep -Seconds 2
    }
} finally {
    $computer.Close()
    Remove-Item -Path $sentinelPath -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $OutputPath -Force -ErrorAction SilentlyContinue
}
