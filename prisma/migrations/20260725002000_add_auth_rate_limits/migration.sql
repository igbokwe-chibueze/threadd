-- Better Auth uses this table as a shared, atomic rate-limit store.
-- Keeping counters in PostgreSQL prevents each serverless/application instance
-- from granting a separate login or password-recovery allowance.
CREATE TABLE "RateLimit" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    -- Better Auth stores request time as Unix epoch milliseconds.
    "lastRequest" BIGINT NOT NULL,

    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("id")
);

-- The library consumes a bucket through conditional updates keyed by this
-- value. Uniqueness is required for concurrency-safe first-request insertion.
CREATE UNIQUE INDEX "RateLimit_key_key" ON "RateLimit"("key");

-- Expired-bucket cleanup filters by the last request time.
CREATE INDEX "RateLimit_lastRequest_idx" ON "RateLimit"("lastRequest");
