-- CreateTable: consumed_nonces
-- Purpose: Shared, atomic, persistent single-use nonce storage for onboarding tokens to prevent replay attacks
CREATE TABLE IF NOT EXISTS "consumed_nonces" (
    "id" TEXT NOT NULL,
    "nonce" TEXT NOT NULL,
    "purpose" TEXT NOT NULL DEFAULT 'onboarding',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consumed_nonces_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "consumed_nonces_nonce_key" ON "consumed_nonces"("nonce");
CREATE INDEX IF NOT EXISTS "consumed_nonces_nonce_idx" ON "consumed_nonces"("nonce");
CREATE INDEX IF NOT EXISTS "consumed_nonces_expiresAt_idx" ON "consumed_nonces"("expiresAt");

-- CreateTable: company_api_keys
-- Purpose: Per-tenant external API key registry supporting individual revocation, rotation, and audit
CREATE TABLE IF NOT EXISTS "company_api_keys" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "name" TEXT,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "company_api_keys_keyHash_key" ON "company_api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "company_api_keys_companyId_idx" ON "company_api_keys"("companyId");
CREATE INDEX IF NOT EXISTS "company_api_keys_keyHash_idx" ON "company_api_keys"("keyHash");
CREATE INDEX IF NOT EXISTS "company_api_keys_revokedAt_idx" ON "company_api_keys"("revokedAt");

-- AddForeignKey
ALTER TABLE "company_api_keys" DROP CONSTRAINT IF EXISTS "company_api_keys_companyId_fkey";
ALTER TABLE "company_api_keys" ADD CONSTRAINT "company_api_keys_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
