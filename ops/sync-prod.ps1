param(
    [string]$Server = "root@89.47.113.106",
    [string]$RemoteDir = "/root/atify",
    [string]$IdentityFile = ""
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

    $sshArgs = @()
    $scpArgs = @()
    if ($IdentityFile) {
        $sshArgs += @("-i", $IdentityFile)
        $scpArgs += @("-i", $IdentityFile)
    }

    & ssh @sshArgs $Server "mkdir -p $RemoteDir"
    & scp @scpArgs $archivePath "${Server}:${RemoteDir}/$archiveName"
    & scp @scpArgs ".env.prod" "${Server}:${RemoteDir}/.env.prod"
    & ssh @sshArgs $Server "tar -xf $RemoteDir/$archiveName -C $RemoteDir && rm -f $RemoteDir/$archiveName && sed -i 's/\r$//' $RemoteDir/deploy/*.sh && chmod +x $RemoteDir/deploy/*.sh && bash $RemoteDir/deploy/start-prod.sh"
}
finally {
    Pop-Location
    if (Test-Path $archivePath) {
        Remove-Item $archivePath -Force
    }
}
