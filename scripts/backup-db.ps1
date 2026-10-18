# ==============================================================================
# HEEYAKU — Operational Database Backup Script (PowerShell)
# ==============================================================================
# Creates a consistent, custom-format binary dump (.dump) with SHA-256 checksum.
# Connects via direct port 5432 (DIRECT_URL) to bypass transaction poolers.
# NEVER prints passwords or sensitive credentials in terminal logs.
# ==============================================================================

$ErrorActionPreference = "Stop"

$BackupDir = "backups"
if (-not (Test-Path $BackupDir)) {
    New-Item -ItemType Directory -Path $BackupDir | Out-Null
}

$Timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$BackupFile = Join-Path $BackupDir "backup_heeyaku_$Timestamp.dump"
$ChecksumFile = "$BackupFile.sha256"

$TargetUrl = $env:DIRECT_URL
if ([string]::IsNullOrWhiteSpace($TargetUrl)) {
    $TargetUrl = $env:DATABASE_URL
}

if ([string]::IsNullOrWhiteSpace($TargetUrl)) {
    Write-Error "Error: DIRECT_URL or DATABASE_URL environment variable must be set."
    exit 1
}

Write-Host "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Starting HEEYAKU database backup..."

# Execute pg_dump
& pg_dump --format=custom --no-owner --no-privileges --dbname="$TargetUrl" --file="$BackupFile"

if (-not (Test-Path $BackupFile) -or (Get-Item $BackupFile).Length -eq 0) {
    Write-Error "Error: Backup file was created empty or missing. Aborting."
    if (Test-Path $BackupFile) { Remove-Item $BackupFile }
    exit 1
}

# Verify structure
& pg_restore --list "$BackupFile" | Out-Null

# Generate SHA-256 Checksum
$Hash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash
Set-Content -Path $ChecksumFile -Value "$Hash  $((Get-Item $BackupFile).Name)"

$SizeMB = [math]::Round((Get-Item $BackupFile).Length / 1MB, 2)
Write-Host "[$((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))] Backup completed successfully."
Write-Host "Artifact: $BackupFile ($SizeMB MB)"
Write-Host "Checksum: $ChecksumFile"
Write-Host "Recommendation: Offload $BackupFile to secure off-server cloud storage (S3/R2) with encryption."
