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
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Update-HardwareTree($hardware) {
    $hardware.Update()
    foreach ($subHardware in $hardware.SubHardware) {
        Update-HardwareTree $subHardware
    }
}

function Read-TemperatureSensors($hardware, $result) {
    foreach ($s in $hardware.Sensors) {
        if ($s.SensorType -eq 'Temperature' -and $s.Value -ne $null) {
            $val = [math]::Round($s.Value, 1)
            if ($hardware.HardwareType -like '*Cpu*') {
                $result.cpu[$s.Name] = $val
            } elseif ($hardware.HardwareType -like '*Gpu*') {
                $result.gpu[$s.Name] = $val
            }
        }
    }

    foreach ($subHardware in $hardware.SubHardware) {
        Read-TemperatureSensors $subHardware $result
    }
}

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

        # Single sensor update pass
        foreach ($h in $computer.Hardware) {
            Update-HardwareTree $h
        }

        # Collect temperatures
        $result = @{
            cpu = @{}
            gpu = @{}
            timestamp = [DateTime]::Now.ToString("HH:mm:ss")
        }

        foreach ($h in $computer.Hardware) {
            Read-TemperatureSensors $h $result
        }

        # Write to temp file then atomic rename (avoid partial reads)
        $tempPath = "$OutputPath.tmp"
        $json = $result | ConvertTo-Json -Compress
        [System.IO.File]::WriteAllText($tempPath, $json, $utf8NoBom)
        Move-Item -Path $tempPath -Destination $OutputPath -Force

        # Poll every 5 seconds (reduces CPU usage)
        Start-Sleep -Seconds 5
    }
} finally {
    $computer.Close()
    Remove-Item -Path $sentinelPath -Force -ErrorAction SilentlyContinue
    Remove-Item -Path $OutputPath -Force -ErrorAction SilentlyContinue
}
