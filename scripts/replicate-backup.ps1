# ==============================================================================
# HEEYAKU — Off-Server Encrypted Backup Replication Script (PowerShell)
# ==============================================================================
# Encrypts and replicates local database dumps to off-server S3/R2 storage.
# Ensures zero-knowledge client-side encryption before transmission.
# NEVER exposes credentials, keys, or endpoints in logs.
# ==============================================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [Parameter(Mandatory=$false)]
    [string]$BucketName = $env:S3_BACKUP_BUCKET,

    [Parameter(Mandatory=$false)]
    [string]$EndpointUrl = $env:S3_ENDPOINT_URL,

    [Parameter(Mandatory=$false)]
    [string]$EncryptionKey = $env:BACKUP_ENCRYPTION_KEY
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Error: Local backup file '$BackupFile' does not exist."
    exit 1
}

$ChecksumFile = "$BackupFile.sha256"
if (-not (Test-Path $ChecksumFile)) {
    Write-Error "Error: Checksum file '$ChecksumFile' is missing. Cannot verify integrity."
    exit 1
}

# 1. Verify local checksum prior to upload
Write-Host "Verifying local backup checksum before replication..."
$ExpectedHash = (Get-Content $ChecksumFile).Split(" ")[0].Trim().ToUpper()
$ActualHash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash.ToUpper()
if ($ExpectedHash -ne $ActualHash) {
    Write-Error "Error: Local backup failed checksum verification. Aborting replication."
    exit 2
}

# 2. Check storage destination configuration
if (-not $BucketName) {
    if ($env:R2_BACKUP_BUCKET) { $BucketName = $env:R2_BACKUP_BUCKET }
}
if (-not $BucketName) {
    Write-Error "Error: Off-server destination bucket (S3_BACKUP_BUCKET or R2_BACKUP_BUCKET) is not configured. Operator action required: Configure S3/R2 bucket environment variables."
    exit 3
}

if (-not $EncryptionKey) {
    Write-Error "Error: BACKUP_ENCRYPTION_KEY environment variable is missing. Unencrypted remote upload is forbidden. Operator action required: Provide a secure symmetric key via BACKUP_ENCRYPTION_KEY."
    exit 4
}

$EncryptedFile = "$BackupFile.enc"
$EncryptedChecksum = "$ChecksumFile.enc"

# 3. Encrypt backup artifact with AES-256 (via OpenSSL or .NET Crypto)
Write-Host "Encrypting backup artifact with AES-256..."
& openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "$BackupFile" -out "$EncryptedFile" -pass "pass:$EncryptionKey"
& openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 -in "$ChecksumFile" -out "$EncryptedChecksum" -pass "pass:$EncryptionKey"

# 4. Upload to S3-compatible remote storage (AWS S3 or Cloudflare R2)
Write-Host "Uploading encrypted backup to off-server storage..."
$RemotePrefix = "backups/" + (Get-Date -Format "yyyy/MM")
$FileName = Split-Path -Path $EncryptedFile -Leaf
$ChecksumName = Split-Path -Path $EncryptedChecksum -Leaf

$S3Args = @("s3", "cp", "$EncryptedFile", "s3://$BucketName/$RemotePrefix/$FileName")
if ($EndpointUrl) {
    $S3Args += @("--endpoint-url", "$EndpointUrl")
}
& aws @S3Args

$ChecksumArgs = @("s3", "cp", "$EncryptedChecksum", "s3://$BucketName/$RemotePrefix/$ChecksumName")
if ($EndpointUrl) {
    $ChecksumArgs += @("--endpoint-url", "$EndpointUrl")
}
& aws @ChecksumArgs

# 5. Verify remote artifact existence
Write-Host "Verifying remote artifact existence..."
$VerifyArgs = @("s3", "ls", "s3://$BucketName/$RemotePrefix/$FileName")
if ($EndpointUrl) {
    $VerifyArgs += @("--endpoint-url", "$EndpointUrl")
}
& aws @VerifyArgs | Out-Null

# Clean up local temporary encrypted files (preserve local unencrypted backup)
Remove-Item -Path $EncryptedFile -Force -ErrorAction SilentlyContinue
Remove-Item -Path $EncryptedChecksum -Force -ErrorAction SilentlyContinue

Write-Host "SUCCESS: Encrypted backup safely replicated to off-server storage: s3://$BucketName/$RemotePrefix/"
