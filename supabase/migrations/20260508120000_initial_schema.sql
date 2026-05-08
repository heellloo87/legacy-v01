-- ============================================================
-- Migration: add version column to comments
-- ============================================================
-- The comments table was created without a `version` column,
-- but the app scopes comments to a specific project version.
-- This migration adds the column, backfills existing rows with
-- a sensible default, and enables per-version filtering.
-- ============================================================

-- 1. Add the column (nullable first so existing rows don't fail)
ALTER TABLE comments
  ADD COLUMN IF NOT EXISTS version text;

-- 2. Backfill existing rows: use the project's current version
UPDATE comments c
SET version = p.version
FROM projects p
WHERE p.id = c.project_id
  AND c.version IS NULL;

-- 3. Fall back to 'v1' for any orphaned rows (project deleted etc.)
UPDATE comments
SET version = 'v1'
WHERE version IS NULL;

-- 4. Now enforce NOT NULL so future inserts always carry a version
ALTER TABLE comments
  ALTER COLUMN version SET NOT NULL,
  ALTER COLUMN version SET DEFAULT 'v1';

-- 5. Index for fast per-project-per-version queries
CREATE INDEX IF NOT EXISTS comments_project_version_idx
  ON comments (project_id, version);
