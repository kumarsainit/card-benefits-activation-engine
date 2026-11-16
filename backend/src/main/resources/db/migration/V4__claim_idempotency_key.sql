-- Client-supplied Idempotency-Key for POST /api/v1/claims. A retried submission with the same key returns the
-- claim created by the first attempt instead of creating a duplicate. NULL allowed (key header is optional);
-- PostgreSQL unique indexes permit multiple NULLs.
ALTER TABLE claims ADD COLUMN IF NOT EXISTS idempotency_key VARCHAR(255);
CREATE UNIQUE INDEX IF NOT EXISTS uk_claims_idempotency_key ON claims (idempotency_key);
