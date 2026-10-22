param(
    [Parameter(Mandatory = $true)]
    [string] $Message
)

if ([string]::IsNullOrWhiteSpace($Message)) {
    Write-Error "A commit message is required."
    exit 1
}

Set-Location (Split-Path -Parent $PSScriptRoot)

& git diff --cached --quiet
$stagedDiffExitCode = $LASTEXITCODE
if ($stagedDiffExitCode -eq 0) {
    Write-Error "No staged changes. Stage the files you want to commit in Source Control, then run this task again."
    exit 1
}
if ($stagedDiffExitCode -ne 1) {
    Write-Error "Could not check staged changes (git exit code $stagedDiffExitCode)."
    exit $stagedDiffExitCode
}

& git commit -m $Message
if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
}

& git push
exit $LASTEXITCODE
