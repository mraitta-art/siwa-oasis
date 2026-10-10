$ErrorActionPreference = 'SilentlyContinue'

function Get-DirSizeGB($path) {
    if (-not (Test-Path $path)) { return $null }
    try {
        $size = (Get-ChildItem $path -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object Length -Sum).Sum
        return [math]::Round($size / 1GB, 2)
    }
    catch {
        return $null
    }
}

$driveBefore = Get-PSDrive C
Write-Host ('Free space before cleanup: ' + [math]::Round($driveBefore.Free / 1GB, 2) + ' GB')

$targets = @(
    'C:\Windows\Temp',
    'C:\Windows\SoftwareDistribution\Download',
    'C:\Windows\Panther',
    'C:\Users\mega tech\AppData\Local\Temp',
    'C:\Users\mega tech\AppData\Local\Microsoft\Windows\WER\ReportArchive',
    'C:\Users\mega tech\AppData\Local\Microsoft\Windows\WER\ReportQueue',
    'C:\Users\mega tech\AppData\Local\CrashDumps',
    'C:\Users\mega tech\AppData\Local\npm-cache',
    'C:\Users\mega tech\AppData\Roaming\npm-cache',
    'C:\Users\mega tech\.cache',
    'C:\Users\mega tech\.npm',
    'C:\Users\mega tech\AppData\Local\Google\Chrome\User Data\Default\Cache',
    'C:\Users\mega tech\AppData\Local\Google\Chrome\User Data\Default\Code Cache',
    'C:\Users\mega tech\AppData\Local\Microsoft\Edge\User Data\Default\Cache',
    'C:\Users\mega tech\AppData\Local\Microsoft\Edge\User Data\Default\Code Cache',
    'C:\Users\mega tech\AppData\Roaming\Code\CachedData',
    'C:\Users\mega tech\AppData\Local\Programs\Microsoft VS Code\CachedData'
)

foreach ($p in $targets) {
    if (Test-Path $p) {
        try {
            Remove-Item $p -Recurse -Force -ErrorAction SilentlyContinue
            Write-Host ('Removed: ' + $p)
        }
        catch {
            Write-Host ('Skipped: ' + $p)
        }
    }
}

$downloads = 'C:\Users\mega tech\Downloads'
if (Test-Path $downloads) {
    $oldFiles = Get-ChildItem $downloads -Recurse -File -ErrorAction SilentlyContinue |
        Where-Object { $_.Extension -match '\.(zip|exe|msi|iso|rar|7z|cab)$' -and $_.LastWriteTime -lt (Get-Date).AddDays(-30) }
    if ($oldFiles) {
        $oldFiles | Remove-Item -Force -ErrorAction SilentlyContinue
        Write-Host ('Removed old installer/archive files: ' + $oldFiles.Count)
    }
    else {
        Write-Host 'No old installer/archive files found in Downloads'
    }
}

Clear-RecycleBin -Force -ErrorAction SilentlyContinue
Write-Host 'Running Windows component cleanup...'
DISM /Online /Cleanup-Image /StartComponentCleanup /ResetBase | Out-Null

$driveAfter = Get-PSDrive C
Write-Host ('Free space after cleanup: ' + [math]::Round($driveAfter.Free / 1GB, 2) + ' GB')
Write-Host ('Recovered: ' + [math]::Round(($driveAfter.Free - $driveBefore.Free) / 1GB, 2) + ' GB')
