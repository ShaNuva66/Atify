param(
    [string]$Server = "root@89.47.113.106",
    [string]$RemoteDir = "/root/atify"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$archiveName = "atify-$timestamp.tar"
$archivePath = Join-Path $env:TEMP $archiveName

Push-Location $repoRoot
try {
    git archive --format=tar --output=$archivePath HEAD

    if (-not (Test-Path ".env.prod")) {
        throw ".env.prod bulunamadi. Prod env dosyasi olmadan sync yapilamaz."
    }

    ssh $Server "mkdir -p $RemoteDir"
    scp $archivePath "${Server}:${RemoteDir}/$archiveName"
    scp ".env.prod" "${Server}:${RemoteDir}/.env.prod"
    ssh $Server "tar -xf $RemoteDir/$archiveName -C $RemoteDir && rm -f $RemoteDir/$archiveName && chmod +x $RemoteDir/deploy/*.sh && $RemoteDir/deploy/start-prod.sh"
}
finally {
    Pop-Location
    if (Test-Path $archivePath) {
        Remove-Item $archivePath -Force
    }
}
