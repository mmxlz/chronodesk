[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$dllPath = 'E:\vsproject\chronodesk\build\lhm\LibreHardwareMonitorLib.dll'
Add-Type -Path $dllPath

$c = New-Object LibreHardwareMonitor.Hardware.Computer
$c.IsCpuEnabled = $true
$c.IsGpuEnabled = $true
$c.Open()
Start-Sleep -Seconds 5

for ($i = 0; $i -lt 3; $i++) {
    foreach ($h in $c.Hardware) {
        $h.Update()
        foreach ($s in $h.SubHardware) { $s.Update() }
    }
    Start-Sleep -Seconds 1
}

$output = @()
foreach ($h in $c.Hardware) {
    foreach ($s in $h.Sensors) {
        if ($s.SensorType -eq 'Temperature' -and $s.Value -ne $null) {
            $output += "$($s.Name)=$([math]::Round($s.Value,1))"
        }
    }
}
$c.Close()

$output | Out-File -FilePath 'E:\vsproject\chronodesk\scripts\lhm-output.txt' -Encoding UTF8
