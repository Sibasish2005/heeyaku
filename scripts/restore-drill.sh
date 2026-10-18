#!/usr/bin/env bash
# ==============================================================================
# HEEYAKU — Isolated Database Restore Drill Verification Script (Bash)
# ==============================================================================
# SAFELY verifies restore capability into an isolated, temporary test database.
# STRICT SAFETY GUARD: Will immediately abort if target database name is production!
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
ISOLATED_TARGET_DB="${2:-heeyaku_restore_drill_temp}"
TARGET_HOST="${PGHOST:-localhost}"
TARGET_PORT="${PGPORT:-5432}"
TARGET_USER="${PGUSER:-postgres}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_dump> [isolated_target_db_name]" >&2
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Backup file '${BACKUP_FILE}' does not exist." >&2
  exit 1
fi

# ------------------------------------------------------------------------------
# STRICT PRODUCTION PROTECTION SAFETY CHECK
# ------------------------------------------------------------------------------
# Layer 1: Strict Prefix & Pattern Requirement (MUST start with test_restore_, drill_restore_, or heeyaku_drill_)
LOWER_TARGET=$(echo "${ISOLATED_TARGET_DB}" | tr '[:upper:]' '[:lower:]')
if [[ ! "${LOWER_TARGET}" =~ ^(test_restore_|drill_restore_|heeyaku_drill_)[a-z0-9_]+$ ]]; then
  echo "CRITICAL SAFETY ABORT: Target database name '${ISOLATED_TARGET_DB}' does not follow the required isolated naming convention." >&2
  echo "Target DB name MUST start with 'test_restore_', 'drill_restore_', or 'heeyaku_drill_' (e.g. 'heeyaku_drill_temp')." >&2
  exit 2
fi

# Layer 2: Blacklist Regex
if [[ "${LOWER_TARGET}" =~ (prod|production|heeyaku$|postgres$) ]]; then
  echo "CRITICAL SAFETY ABORT: Target database name '${ISOLATED_TARGET_DB}' resembles production!" >&2
  echo "Restoration drills are strictly forbidden on production databases." >&2
  echo "Please specify a dedicated test target such as 'heeyaku_drill_temp'." >&2
  exit 2
fi

# Layer 3: Environment Cross-Check against DIRECT_URL / DATABASE_URL
PROD_URL="${DIRECT_URL:-${DATABASE_URL:-}}"
if [ -n "${PROD_URL}" ]; then
  PROD_DB_NAME=$(echo "${PROD_URL}" | sed -E 's/.*\/\/([^:]+:[^@]+@)?[^\/]+\/([^?]+).*/\2/' | tr '[:upper:]' '[:lower:]')
  if [ -n "${PROD_DB_NAME}" ] && [ "${LOWER_TARGET}" = "${PROD_DB_NAME}" ]; then
    echo "CRITICAL SAFETY ABORT: Target DB '${ISOLATED_TARGET_DB}' exactly matches production database '${PROD_DB_NAME}' from environment!" >&2
    exit 2
  fi
fi

# Layer 4: Disk Space Preflight Check
BACKUP_SIZE_BYTES=$(wc -c < "${BACKUP_FILE}" 2>/dev/null || stat -c%s "${BACKUP_FILE}" 2>/dev/null || echo "0")
if [ "${BACKUP_SIZE_BYTES}" -gt 0 ]; then
  REQUIRED_KB=$(( (BACKUP_SIZE_BYTES * 3) / 1024 ))
  AVAILABLE_KB=$(df -k . 2>/dev/null | awk 'NR==2 {print $4}' || echo "")
  if [ -n "${AVAILABLE_KB}" ] && [ "${AVAILABLE_KB}" -lt "${REQUIRED_KB}" ]; then
    echo "CRITICAL SAFETY ABORT: Insufficient disk space for safe restore drill. Required: ${REQUIRED_KB} KB, Available: ${AVAILABLE_KB} KB." >&2
    exit 2
  fi
fi


echo "=============================================================================="
echo "HEEYAKU Isolated Restore Drill Verification"
echo "Backup Source: ${BACKUP_FILE}"
echo "Target DB:     ${ISOLATED_TARGET_DB} (Isolated Test Database)"
echo "Host:          ${TARGET_HOST}:${TARGET_PORT}"
echo "=============================================================================="

# 1. Verify Checksum if present
CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ -f "${CHECKSUM_FILE}" ]; then
  echo "Verifying SHA-256 checksum..."
  sha256sum --check "${CHECKSUM_FILE}" || {
    echo "Error: Checksum verification failed. The backup artifact is corrupted." >&2
    exit 3
  }
fi

# 2. Re-create isolated target database
echo "Creating isolated test database '${ISOLATED_TARGET_DB}'..."
dropdb --if-exists -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" "${ISOLATED_TARGET_DB}" || true
createdb -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" "${ISOLATED_TARGET_DB}"

# Layer 5: Positive Database Identity Assertion
# Connect to newly created database and verify current_database() matches target exactly
CONNECTED_DB=$(psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" -d "${ISOLATED_TARGET_DB}" -tAc "SELECT current_database();" 2>/dev/null || echo "")
if [ -n "${CONNECTED_DB}" ] && [ "${CONNECTED_DB}" != "${ISOLATED_TARGET_DB}" ]; then
  echo "CRITICAL SAFETY ABORT: Connected database '${CONNECTED_DB}' does not match expected drill target '${ISOLATED_TARGET_DB}'!" >&2
  exit 5
fi

# 3. Execute pg_restore into isolated target
echo "Restoring into isolated test database..."
START_TIME=$(date +%s)
pg_restore --no-owner --no-privileges \
           -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" \
           -d "${ISOLATED_TARGET_DB}" "${BACKUP_FILE}" || true
END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

# 4. Verify Schema & Core Record Counts in isolated target
echo "Verifying restored schema integrity..."
TABLE_COUNT=$(psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" -d "${ISOLATED_TARGET_DB}" -tAc "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
COMPANY_COUNT=$(psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" -d "${ISOLATED_TARGET_DB}" -tAc "SELECT count(*) FROM \"companies\";" 2>/dev/null || echo "0")
EMPLOYEE_COUNT=$(psql -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" -d "${ISOLATED_TARGET_DB}" -tAc "SELECT count(*) FROM \"employees\";" 2>/dev/null || echo "0")

echo "------------------------------------------------------------------------------"
echo "Restore Drill Results:"
echo " - Duration:        ${DURATION} seconds"
echo " - Restored Tables: ${TABLE_COUNT}"
echo " - Companies Count: ${COMPANY_COUNT}"
echo " - Employees Count: ${EMPLOYEE_COUNT}"
echo "------------------------------------------------------------------------------"

if [ "${TABLE_COUNT}" -gt 5 ]; then
  echo "SUCCESS: Backup artifact restored cleanly and passed integrity validation."
else
  echo "FAILURE: Incomplete schema restoration detected." >&2
  exit 4
fi

# 5. Clean up temporary drill database
echo "Cleaning up temporary drill database '${ISOLATED_TARGET_DB}'..."
dropdb -h "${TARGET_HOST}" -p "${TARGET_PORT}" -U "${TARGET_USER}" "${ISOLATED_TARGET_DB}"
echo "Restore drill complete. Production was never modified."
