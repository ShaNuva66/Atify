param(
    [string]$RootServer = "root@89.47.113.106",
    [string]$DeployUser = "atify",
    [string]$AppDir = "/opt/atify",
    [string]$SourceDir = "/root/atify",
    [string]$KeyPath = "$env:USERPROFILE\.ssh\atify_prod_ed25519"
)

$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $PSScriptRoot
$publicKeyPath = "$KeyPath.pub"

if (-not (Test-Path (Split-Path -Parent $KeyPath))) {
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $KeyPath) | Out-Null
}

if ((-not (Test-Path $KeyPath)) -or (-not (Test-Path $publicKeyPath))) {
    $sshKeygenCmd = "ssh-keygen -t ed25519 -f `"$KeyPath`" -N `"`" -C `"atify-prod-access`""
    $keygen = Start-Process -FilePath "cmd.exe" -ArgumentList "/c", $sshKeygenCmd -NoNewWindow -Wait -PassThru
    if ($keygen.ExitCode -ne 0) {
        throw "ssh-keygen basarisiz oldu."
    }
}

$publicKey = (Get-Content $publicKeyPath -Raw).Trim()
if ([string]::IsNullOrWhiteSpace($publicKey)) {
    throw "Public key okunamadi: $publicKeyPath"
}

Push-Location $repoRoot
try {
    scp "deploy/harden-server.sh" "${RootServer}:${SourceDir}/deploy/harden-server.sh"
    ssh $RootServer "sed -i 's/\r$//' ${SourceDir}/deploy/harden-server.sh && chmod +x ${SourceDir}/deploy/harden-server.sh && DEPLOY_USER='${DeployUser}' DEPLOY_PUBLIC_KEY='${publicKey}' ATIFY_DIR='${AppDir}' SOURCE_DIR='${SourceDir}' bash ${SourceDir}/deploy/harden-server.sh"
    ssh -i $KeyPath "${DeployUser}@89.47.113.106" "bash -lc 'whoami && test -d ${AppDir} && docker ps --format \"table {{.Names}}\t{{.Status}}\" | head -n 5'"
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Kurulum tamamlandi."
Write-Host "Yeni SSH key: $KeyPath"
Write-Host "Yeni baglanti: ssh -i `"$KeyPath`" ${DeployUser}@89.47.113.106"
