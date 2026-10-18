#!/usr/bin/env bash
# ==============================================================================
# HEEYAKU — Off-Server Encrypted Backup Replication Script (Bash)
# ==============================================================================
# Encrypts and replicates local database dumps to off-server S3/R2 storage.
# Ensures zero-knowledge client-side encryption (AES-256-CBC) before transmission.
# Requires: AWS CLI or rclone, and OPENSSL or GPG.
# NEVER exposes credentials, keys, or endpoints in logs.
# ==============================================================================

set -euo pipefail

BACKUP_FILE="${1:-}"
BUCKET_NAME="${S3_BACKUP_BUCKET:-${R2_BACKUP_BUCKET:-}}"
ENDPOINT_URL="${S3_ENDPOINT_URL:-${R2_ENDPOINT_URL:-}}"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-}"

if [ -z "${BACKUP_FILE}" ]; then
  echo "Usage: $0 <path_to_backup_dump>" >&2
  exit 1
fi

if [ ! -f "${BACKUP_FILE}" ]; then
  echo "Error: Local backup file '${BACKUP_FILE}' does not exist." >&2
  exit 1
fi

CHECKSUM_FILE="${BACKUP_FILE}.sha256"
if [ ! -f "${CHECKSUM_FILE}" ]; then
  echo "Error: Checksum file '${CHECKSUM_FILE}' is missing. Cannot verify integrity." >&2
  exit 1
fi

# 1. Verify local checksum prior to upload
echo "Verifying local backup checksum before replication..."
sha256sum --check "${CHECKSUM_FILE}" || {
  echo "Error: Local backup failed checksum verification. Aborting replication." >&2
  exit 2
}

# 2. Check storage destination configuration
if [ -z "${BUCKET_NAME}" ]; then
  echo "Error: Off-server destination bucket (S3_BACKUP_BUCKET or R2_BACKUP_BUCKET) is not configured." >&2
  echo "Operator action required: Configure S3/R2 bucket environment variables." >&2
  exit 3
fi

if [ -z "${ENCRYPTION_KEY}" ]; then
  echo "Error: BACKUP_ENCRYPTION_KEY environment variable is missing. Unencrypted remote upload is forbidden." >&2
  echo "Operator action required: Provide a secure symmetric key via BACKUP_ENCRYPTION_KEY." >&2
  exit 4
fi

ENCRYPTED_FILE="${BACKUP_FILE}.enc"
ENCRYPTED_CHECKSUM="${CHECKSUM_FILE}.enc"

# 3. Encrypt backup artifact with AES-256-CBC (salted)
echo "Encrypting backup artifact with AES-256-CBC..."
openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
  -in "${BACKUP_FILE}" \
  -out "${ENCRYPTED_FILE}" \
  -pass "pass:${ENCRYPTION_KEY}"

openssl enc -aes-256-cbc -salt -pbkdf2 -iter 100000 \
  -in "${CHECKSUM_FILE}" \
  -out "${ENCRYPTED_CHECKSUM}" \
  -pass "pass:${ENCRYPTION_KEY}"

# 4. Upload to S3-compatible remote storage (AWS S3 or Cloudflare R2)
echo "Uploading encrypted backup to off-server storage..."
S3_ARGS=()
if [ -n "${ENDPOINT_URL}" ]; then
  S3_ARGS+=(--endpoint-url "${ENDPOINT_URL}")
fi

REMOTE_PREFIX="backups/$(date +%Y/%m)"
aws s3 cp "${ENCRYPTED_FILE}" "s3://${BUCKET_NAME}/${REMOTE_PREFIX}/$(basename "${ENCRYPTED_FILE}")" "${S3_ARGS[@]}"
aws s3 cp "${ENCRYPTED_CHECKSUM}" "s3://${BUCKET_NAME}/${REMOTE_PREFIX}/$(basename "${ENCRYPTED_CHECKSUM}")" "${S3_ARGS[@]}"

# 5. Verify remote artifact existence
echo "Verifying remote artifact existence..."
aws s3 ls "s3://${BUCKET_NAME}/${REMOTE_PREFIX}/$(basename "${ENCRYPTED_FILE}")" "${S3_ARGS[@]}" > /dev/null

# Clean up local temporary encrypted files (preserve local unencrypted backup)
rm -f "${ENCRYPTED_FILE}" "${ENCRYPTED_CHECKSUM}"

echo "SUCCESS: Encrypted backup safely replicated to off-server storage: s3://${BUCKET_NAME}/${REMOTE_PREFIX}/"
