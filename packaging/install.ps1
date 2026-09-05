# OpenSource Hub 1-Line PowerShell Installer (Windows)
# Installs standalone binary without Node.js prerequisite.
# Usage: irm https://raw.githubusercontent.com/bengowtham70-dev/opensource-hub/main/packaging/install.ps1 | iex

[CmdletBinding()]
param(
    [string]$Version = $env:OSH_VERSION
)

$ErrorActionPreference = 'Stop'

Write-Host ""
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host "       Installing OpenSource Hub (CLI)       " -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan
Write-Host ""

$RepoSlug = "bengowtham70-dev/opensource-hub"
$BinaryName = "opensource-hub.exe"

# 1. Detect Architecture
$ArchTarget = "x64"
if ($env:PROCESSOR_ARCHITECTURE -eq "ARM64") {
    $ArchTarget = "arm64"
} elseif (-not [System.Environment]::Is64BitOperatingSystem) {
    Write-Error "Error: 32-bit Windows is not supported. Please run on 64-bit Windows (x64 or ARM64)."
    exit 1
}

$PlatformTag = "windows-$ArchTarget"
Write-Host "Detected platform: $PlatformTag" -ForegroundColor DarkGray

# 2. Determine Version
if (-not $Version) {
    try {
        $ReleaseUri = "https://api.github.com/repos/$RepoSlug/releases/latest"
        $ReleaseJson = Invoke-RestMethod -Uri $ReleaseUri -Headers @{ "User-Agent" = "OpenSourceHub-Installer" } -TimeoutSec 10
        if ($ReleaseJson.tag_name) {
            $Version = $ReleaseJson.tag_name -replace '^v', ''
        }
    } catch {
        # Fallback to default canonical release
        $Version = "0.1.0"
    }
}
if (-not $Version) {
    $Version = "0.1.0"
}
$Version = $Version -replace '^v', ''

$AssetName = "opensource-hub-v$Version-$PlatformTag.exe"
$DownloadBase = "https://github.com/$RepoSlug/releases/download/v$Version"
$BinaryUri = "$DownloadBase/$AssetName"
$SumsUri = "$DownloadBase/SHA256SUMS.txt"

# 3. Setup Target Directory in %LOCALAPPDATA%\Programs\opensource-hub
$TargetDir = Join-Path $env:LOCALAPPDATA "Programs\opensource-hub"
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
}
$TargetExePath = Join-Path $TargetDir $BinaryName
$TempExePath = Join-Path $TargetDir "temp_$AssetName"

Write-Host "Downloading OpenSource Hub v$Version..." -ForegroundColor White

try {
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12 -bor [Net.SecurityProtocolType]::Tls13
} catch {}

try {
    Invoke-WebRequest -Uri $BinaryUri -OutFile $TempExePath -UseBasicParsing
} catch {
    Write-Error "Failed to download $BinaryUri : $_"
    exit 1
}

# 4. Optional Checksum Verification
try {
    $SumsContent = (Invoke-WebRequest -Uri $SumsUri -UseBasicParsing -TimeoutSec 10).Content
    if ($SumsContent) {
        $Match = ($SumsContent -split "`n") | Where-Object { $_ -match $AssetName }
        if ($Match) {
            $ExpectedHash = ($Match[0] -split '\s+')[0].Trim().ToLower()
            $ActualHash = (Get-FileHash -Path $TempExePath -Algorithm SHA256).Hash.ToLower()
            if ($ExpectedHash -and ($ActualHash -ne $ExpectedHash)) {
                Remove-Item -Path $TempExePath -Force -ErrorAction SilentlyContinue
                Write-Error "Checksum verification failed! Expected: $ExpectedHash, Got: $ActualHash"
                exit 1
            }
            Write-Host "SHA256 checksum verified: $ActualHash" -ForegroundColor Green
        }
    }
} catch {
    Write-Host "Notice: Release checksum file unavailable; skipping hash check." -ForegroundColor DarkGray
}

# Move binary to final target name
Move-Item -Path $TempExePath -Destination $TargetExePath -Force

# 5. Ensure TargetDir is on User PATH
$UserPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
$Paths = $UserPath -split ";" | ForEach-Object { $_.Trim() } | Where-Object { $_ }

if ($Paths -notcontains $TargetDir) {
    Write-Host "Adding $TargetDir to User PATH..." -ForegroundColor DarkCyan
    $NewUserPath = ($Paths + $TargetDir) -join ";"
    [System.Environment]::SetEnvironmentVariable("Path", $NewUserPath, "User")
}

# Also update current session PATH
if (($env:PATH -split ";") -notcontains $TargetDir) {
    $env:PATH = "$TargetDir;" + $env:PATH
}

Write-Host ""
Write-Host "Successfully installed OpenSource Hub v$Version!" -ForegroundColor Green
Write-Host "Installed location: $TargetExePath" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Run the command below in any terminal to launch your dashboard:" -ForegroundColor White
Write-Host "  opensource-hub" -ForegroundColor Yellow
Write-Host ""
