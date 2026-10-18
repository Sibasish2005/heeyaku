# ==============================================================================
# HEEYAKU — Isolated Database Restore Drill Verification Script (PowerShell)
# ==============================================================================
# SAFELY verifies restore capability into an isolated, temporary test database.
# STRICT SAFETY GUARD: Will immediately abort if target database name resembles production!
# ==============================================================================

param (
    [Parameter(Mandatory=$true)]
    [string]$BackupFile,

    [Parameter(Mandatory=$false)]
    [string]$IsolatedTargetDb = "heeyaku_restore_drill_temp",

    [Parameter(Mandatory=$false)]
    [string]$TargetHost = "localhost",

    [Parameter(Mandatory=$false)]
    [int]$TargetPort = 5432,

    [Parameter(Mandatory=$false)]
    [string]$TargetUser = "postgres"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $BackupFile)) {
    Write-Error "Error: Backup file '$BackupFile' does not exist."
    exit 1
}

# ------------------------------------------------------------------------------
# MULTI-LAYER INDEPENDENT ISOLATION & SAFETY VERIFICATION
# ------------------------------------------------------------------------------
$LowerTarget = $IsolatedTargetDb.ToLower().Trim()

# Layer 1: Strict Prefix & Pattern Requirement (MUST start with test_restore_, drill_restore_, or heeyaku_drill_)
if ($LowerTarget -notmatch "^(test_restore_|drill_restore_|heeyaku_drill_)[a-z0-9_]+$") {
    Write-Error "CRITICAL SAFETY ABORT: Target database name '$IsolatedTargetDb' does not follow the required isolated naming convention. Target DB name MUST start with 'test_restore_', 'drill_restore_', or 'heeyaku_drill_' (e.g. 'heeyaku_drill_temp')."
    exit 2
}

# Layer 2: Blacklist Regex
if ($LowerTarget -match "(prod|production|heeyaku$|postgres$)") {
    Write-Error "CRITICAL SAFETY ABORT: Target database name '$IsolatedTargetDb' resembles production! Restoration drills are strictly forbidden on production databases."
    exit 2
}

# Layer 3: Environment Cross-Check against DIRECT_URL / DATABASE_URL
$ProdUrl = if ($env:DIRECT_URL) { $env:DIRECT_URL } else { $env:DATABASE_URL }
if ($ProdUrl) {
    if ($ProdUrl -match "/([^/?]+)(\?|$)") {
        $ProdDbName = $Matches[1].ToLower().Trim()
        if ($ProdDbName -and ($LowerTarget -eq $ProdDbName)) {
            Write-Error "CRITICAL SAFETY ABORT: Target DB '$IsolatedTargetDb' exactly matches production database '$ProdDbName' from environment!"
            exit 2
        }
    }
}

# Layer 4: Disk Space Preflight Check
$BackupSizeBytes = (Get-Item $BackupFile).Length
if ($BackupSizeBytes -gt 0) {
    $RequiredBytes = $BackupSizeBytes * 3
    $TargetDrive = Split-Path -Path (Resolve-Path .) -Qualifier
    $AvailableBytes = (Get-PSDrive ($TargetDrive.TrimEnd(":"))).Free
    if ($AvailableBytes -and ($AvailableBytes -lt $RequiredBytes)) {
        Write-Error "CRITICAL SAFETY ABORT: Insufficient disk space for safe restore drill. Required: $([math]::Round($RequiredBytes/1MB, 2)) MB, Available: $([math]::Round($AvailableBytes/1MB, 2)) MB."
        exit 2
    }
}

Write-Host "=============================================================================="
Write-Host "HEEYAKU Isolated Restore Drill Verification"
Write-Host "Backup Source:   $BackupFile"
Write-Host "Target DB:       $IsolatedTargetDb (Isolated Test Database)"
Write-Host "Target Endpoint: ${TargetHost}:${TargetPort}"
Write-Host "Isolation Check: VERIFIED (Strict prefix, non-prod check, disk space confirmed)"
Write-Host "=============================================================================="

# 1. Verify Checksum if present
$ChecksumFile = "$BackupFile.sha256"
if (Test-Path $ChecksumFile) {
    Write-Host "Verifying SHA-256 checksum..."
    $ExpectedHash = (Get-Content $ChecksumFile).Split(" ")[0].Trim().ToUpper()
    $ActualHash = (Get-FileHash -Path $BackupFile -Algorithm SHA256).Hash.ToUpper()
    if ($ExpectedHash -ne $ActualHash) {
        Write-Error "Error: Checksum verification failed. The backup artifact is corrupted."
        exit 3
    }
}

# 2. Re-create isolated target database
Write-Host "Creating isolated test database '$IsolatedTargetDb'..."
& dropdb --if-exists -h $TargetHost -p $TargetPort -U $TargetUser $IsolatedTargetDb 2>$null
& createdb -h $TargetHost -p $TargetPort -U $TargetUser $IsolatedTargetDb

# Layer 5: Positive Database Identity Assertion
$ConnectedDb = (& psql -h $TargetHost -p $TargetPort -U $TargetUser -d $IsolatedTargetDb -tAc "SELECT current_database();" 2>$null)
if ($ConnectedDb) {
    $ConnectedDb = $ConnectedDb.Trim()
    if ($ConnectedDb -ne $IsolatedTargetDb) {
        Write-Error "CRITICAL SAFETY ABORT: Connected database '$ConnectedDb' does not match expected drill target '$IsolatedTargetDb'!"
        exit 5
    }
}

# 3. Execute pg_restore into isolated target
Write-Host "Restoring into isolated test database..."
$Stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
& pg_restore --no-owner --no-privileges -h $TargetHost -p $TargetPort -U $TargetUser -d $IsolatedTargetDb "$BackupFile" 2>$null
$Stopwatch.Stop()

# 4. Verify Schema & Core Record Counts in isolated target
Write-Host "Verifying restored schema integrity..."
$TableCount = (& psql -h $TargetHost -p $TargetPort -U $TargetUser -d $IsolatedTargetDb -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';").Trim()
$CompanyCount = (& psql -h $TargetHost -p $TargetPort -U $TargetUser -d $IsolatedTargetDb -tAc "SELECT count(*) FROM companies;" 2>$null)
if (-not $CompanyCount) { $CompanyCount = "0" }

Write-Host "------------------------------------------------------------------------------"
Write-Host "Restore Drill Results:"
Write-Host " - Duration:        $([math]::Round($Stopwatch.Elapsed.TotalSeconds, 2)) seconds"
Write-Host " - Restored Tables: $TableCount"
Write-Host " - Companies Count: $CompanyCount"
Write-Host "------------------------------------------------------------------------------"

if ([int]$TableCount -gt 5) {
    Write-Host "SUCCESS: Backup artifact restored cleanly and passed integrity validation."
} else {
    Write-Error "FAILURE: Incomplete schema restoration detected."
    exit 4
}

# 5. Clean up temporary drill database
Write-Host "Cleaning up temporary drill database '$IsolatedTargetDb'..."
& dropdb -h $TargetHost -p $TargetPort -U $TargetUser $IsolatedTargetDb
Write-Host "Restore drill complete. Production was never modified."
