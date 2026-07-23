$ErrorActionPreference = 'Stop'
$mysqlRoot = 'E:\mysql'
$binDir = Join-Path $mysqlRoot 'bin'
$mysqld = Join-Path $binDir 'mysqld.exe'
$iniFile = Join-Path $mysqlRoot 'my.ini'
$datadir = Join-Path $mysqlRoot 'data'

if (-not (Test-Path $mysqld)) {
  Write-Host 'MySQL server binary not found at E:\mysql\bin\mysqld.exe' -ForegroundColor Red
  Write-Host 'Please extract MySQL into E:\mysql\bin or install it there first.' -ForegroundColor Yellow
  exit 1
}

if (-not (Test-Path $datadir)) {
  New-Item -ItemType Directory -Force -Path $datadir | Out-Null
}

if (-not (Test-Path $iniFile)) {
  @'
[mysqld]
basedir=E:/mysql
odatadir=E:/mysql/data
port=3306
server_id=1
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci
bind-address=127.0.0.1
skip-networking=0
'@ | Set-Content $iniFile
}

$initialized = Join-Path $datadir 'mysql' 
if (-not (Test-Path $initialized)) {
  Write-Host 'Initializing MySQL data directory...' -ForegroundColor Cyan
  & $mysqld --defaults-file=$iniFile --initialize-insecure --console
  if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
}

Write-Host 'Starting MySQL server...' -ForegroundColor Green
Start-Process -FilePath $mysqld -ArgumentList "--defaults-file=$iniFile" -WindowStyle Hidden
Write-Host 'MySQL startup command sent.' -ForegroundColor Green
