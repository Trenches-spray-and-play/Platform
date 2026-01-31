-- Performance Optimization Indexes
-- Run this SQL directly on the database to add the indexes

-- Index for participant count queries (fixes the slow /api/trenches endpoint)
CREATE INDEX IF NOT EXISTS "Participant_trenchId_idx" ON "Participant"("trenchId");

-- Index for user position queries
CREATE INDEX IF NOT EXISTS "Participant_userId_status_idx" ON "Participant"("userId", "status");

-- Verify indexes were created
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'Participant';
