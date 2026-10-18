#!/usr/bin/env bash
# ==============================================================================
# HEEYAKU — Operational Database Backup Script (PostgreSQL)
# ==============================================================================
# Creates a consistent, custom-format binary dump (.dump) with SHA-256 checksum.
# Connects via direct port 5432 (DIRECT_URL) to bypass transaction poolers.
# NEVER prints passwords or sensitive credentials in terminal logs.
# ==============================================================================

set -euo pipefail

BACKUP_DIR="backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_heeyaku_${TIMESTAMP}.dump"
CHECKSUM_FILE="${BACKUP_FILE}.sha256"

mkdir -p "${BACKUP_DIR}"

TARGET_URL="${DIRECT_URL:-${DATABASE_URL:-}}"

if [ -z "${TARGET_URL}" ]; then
  echo "Error: DIRECT_URL or DATABASE_URL environment variable is required." >&2
  exit 1
fi

echo "[$(date +'%Y-%m-%d %H:%M:%S')] Starting HEEYAKU database backup..."

# Execute pg_dump using custom format, excluding privileges and owners
pg_dump --format=custom \
        --no-owner \
        --no-privileges \
        --dbname="${TARGET_URL}" \
        --file="${BACKUP_FILE}"

if [ ! -s "${BACKUP_FILE}" ]; then
  echo "Error: Backup file was created empty. Aborting." >&2
  rm -f "${BACKUP_FILE}"
  exit 1
fi

# Verify archive structure using pg_restore list
pg_restore --list "${BACKUP_FILE}" > /dev/null

# Generate SHA-256 checksum for integrity verification
sha256sum "${BACKUP_FILE}" > "${CHECKSUM_FILE}"

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
echo "[$(date +'%Y-%m-%d %H:%M:%S')] Backup completed successfully."
echo "Artifact: ${BACKUP_FILE} (${FILE_SIZE})"
echo "Checksum: ${CHECKSUM_FILE}"
echo "Recommendation: Offload ${BACKUP_FILE} to secure off-server cloud storage (S3/R2) with encryption."
