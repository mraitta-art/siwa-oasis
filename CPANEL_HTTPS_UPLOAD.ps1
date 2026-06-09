#!/usr/bin/env pwsh
# SIWA OASIS - cPanel HTTPS File Upload
# Uses cPanel's File Manager API via HTTPS (no FTP needed)

Set-Location "E:\ANitgravity\siwatoday\siwa-oasis"

$CpanelHost = "siwa.today"
$CpanelPort = 2083
$CpanelUser = "vercel"
$CpanelPass = "PiCo@@4##73"
$ZipName    = "siwa_production_latest.zip"
$RemoteDir  = "/home/vercel/public_html/siwa-oasis"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "  SIWA - cPanel HTTPS Upload Attempt               " -ForegroundColor Cyan
Write-Host "===================================================" -ForegroundColor Cyan

if (-not (Test-Path $ZipName)) {
    Write-Host "[ERR] $ZipName not found!" -ForegroundColor Red
    exit 1
}

$zipSize = [math]::Round((Get-Item $ZipName).Length / 1MB, 2)
Write-Host "[OK] Package ready: $ZipName ($zipSize MB)" -ForegroundColor Green

# Try cPanel UAPI via HTTPS
$baseUrl = "https://${CpanelHost}:${CpanelPort}"
$authB64  = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("${CpanelUser}:${CpanelPass}"))

Write-Host ""
Write-Host "Testing cPanel HTTPS connection..." -ForegroundColor Cyan

# Ignore SSL cert errors (self-signed on cPanel is normal)
Add-Type @"
using System.Net;
using System.Security.Cryptography.X509Certificates;
public class TrustAll : ICertificatePolicy {
    public bool CheckValidationResult(ServicePoint sp, X509Certificate cert, WebRequest req, int prob) { return true; }
}
"@
[System.Net.ServicePointManager]::CertificatePolicy = New-Object TrustAll
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.SecurityProtocolType]::Tls12

try {
    $testReq = [System.Net.WebRequest]::Create("$baseUrl/execute/Fileman/list_files?dir=/&include_mime=0")
    $testReq.Headers.Add("Authorization", "Basic $authB64")
    $testReq.Timeout = 15000
    $testResp = $testReq.GetResponse()
    $testStream = $testResp.GetResponseStream()
    $reader = New-Object System.IO.StreamReader($testStream)
    $testBody = $reader.ReadToEnd()
    $reader.Close()
    $testResp.Close()
    Write-Host "[OK] cPanel HTTPS connected!" -ForegroundColor Green
    Write-Host "     Response: $($testBody.Substring(0, [Math]::Min(200, $testBody.Length)))" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Direct cPanel API test: $_" -ForegroundColor Yellow
}

# Upload via cPanel File Manager API (multipart/form-data)
Write-Host ""
Write-Host "Attempting file upload via cPanel File Manager API..." -ForegroundColor Cyan

try {
    $boundary   = [System.Guid]::NewGuid().ToString("N")
    $fileBytes  = [System.IO.File]::ReadAllBytes((Resolve-Path $ZipName))
    $fileName   = [System.IO.Path]::GetFileName($ZipName)

    # Build multipart body
    $preamble   = [Text.Encoding]::UTF8.GetBytes(
        "--$boundary`r`n" +
        "Content-Disposition: form-data; name=`"dir`"`r`n`r`n" +
        "$RemoteDir`r`n" +
        "--$boundary`r`n" +
        "Content-Disposition: form-data; name=`"file-1`"; filename=`"$fileName`"`r`n" +
        "Content-Type: application/zip`r`n`r`n"
    )
    $epilogue   = [Text.Encoding]::UTF8.GetBytes("`r`n--$boundary--`r`n")

    $bodyStream = New-Object System.IO.MemoryStream
    $bodyStream.Write($preamble, 0, $preamble.Length)
    $bodyStream.Write($fileBytes, 0, $fileBytes.Length)
    $bodyStream.Write($epilogue, 0, $epilogue.Length)
    $bodyBytes = $bodyStream.ToArray()

    $uploadReq = [System.Net.WebRequest]::Create("$baseUrl/execute/Fileman/upload_files")
    $uploadReq.Method        = "POST"
    $uploadReq.Headers.Add("Authorization", "Basic $authB64")
    $uploadReq.ContentType   = "multipart/form-data; boundary=$boundary"
    $uploadReq.ContentLength = $bodyBytes.Length
    $uploadReq.Timeout       = 300000

    $reqStream = $uploadReq.GetRequestStream()
    $reqStream.Write($bodyBytes, 0, $bodyBytes.Length)
    $reqStream.Close()

    $uploadResp   = $uploadReq.GetResponse()
    $uploadStream = $uploadResp.GetResponseStream()
    $reader2      = New-Object System.IO.StreamReader($uploadStream)
    $respBody     = $reader2.ReadToEnd()
    $reader2.Close()
    $uploadResp.Close()

    Write-Host "[OK] UPLOAD SUCCESSFUL!" -ForegroundColor Green
    Write-Host "     Response: $respBody" -ForegroundColor Gray

    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "  FILE UPLOADED! Do 2 final steps in cPanel:       " -ForegroundColor Green
    Write-Host "===================================================" -ForegroundColor Green
    Write-Host "  1. File Manager -> /public_html/siwa-oasis"        -ForegroundColor Cyan
    Write-Host "     Right-click siwa_production_latest.zip -> Extract" -ForegroundColor Cyan
    Write-Host "  2. Setup Node.js App -> siwa-oasis -> RESTART"     -ForegroundColor Cyan
    Write-Host ""
    Start-Process "https://siwa.today:2083"

} catch {
    Write-Host "[ERR] cPanel API upload failed: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "===================================================" -ForegroundColor Yellow
    Write-Host "  FINAL OPTION: Use cPanel File Manager manually   " -ForegroundColor Yellow
    Write-Host "===================================================" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  Your package is ready at:" -ForegroundColor White
    Write-Host "  E:\ANitgravity\siwatoday\siwa-oasis\$ZipName ($zipSize MB)" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Steps:"  -ForegroundColor White
    Write-Host "  1. Open https://siwa.today:2083 (cPanel login)" -ForegroundColor Cyan
    Write-Host "  2. File Manager -> Navigate to siwa-oasis folder" -ForegroundColor Cyan
    Write-Host "  3. Click UPLOAD -> Choose $ZipName" -ForegroundColor Cyan
    Write-Host "  4. After upload: Right-click ZIP -> Extract" -ForegroundColor Cyan
    Write-Host "  5. Setup Node.js App -> RESTART" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  OR ask your hosting provider for SSH/SFTP access" -ForegroundColor Yellow
    Write-Host ""
    Start-Process explorer.exe "E:\ANitgravity\siwatoday\siwa-oasis"
    Start-Process "https://siwa.today:2083"
}
