-- ============================================================
-- Migration: fix_schema + realtime_presence (combined + safe)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Fix projects table columns
-- ------------------------------------------------------------

-- Rename image_url -> cover_url only if needed
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'projects'
      AND column_name = 'image_url'
  ) THEN
    ALTER TABLE projects
      RENAME COLUMN image_url TO cover_url;
  END IF;
END $$;

-- Add missing columns
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS design_url   text,
  ADD COLUMN IF NOT EXISTS design_ext   text,
  ADD COLUMN IF NOT EXISTS creator_name text;

-- ------------------------------------------------------------
-- 2. Backfill creator_name from profiles
-- ------------------------------------------------------------

UPDATE projects p
SET creator_name = pr.full_name
FROM profiles pr
WHERE pr.id = p.user_id
  AND (p.creator_name IS NULL OR p.creator_name = '');

-- ------------------------------------------------------------
-- 3. Trigger to auto-set creator_name
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION set_project_creator_name()
RETURNS TRIGGER AS $$
BEGIN
  SELECT full_name
  INTO NEW.creator_name
  FROM public.profiles
  WHERE id = NEW.user_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS projects_set_creator_name ON projects;

CREATE TRIGGER projects_set_creator_name
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION set_project_creator_name();

-- ------------------------------------------------------------
-- 4. Projects RLS Policies
-- ------------------------------------------------------------

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Remove old conflicting policy
DROP POLICY IF EXISTS "owner full access" ON projects;

-- Owner full access
CREATE POLICY "owner full access"
ON projects
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Team/public readable by authenticated users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'projects'
      AND policyname = 'team projects readable by authenticated'
  ) THEN
    CREATE POLICY "team projects readable by authenticated"
    ON projects
    FOR SELECT
    USING (
      auth.uid() IS NOT NULL
      AND visibility IN ('team', 'public')
    );
  END IF;
END $$;

-- ------------------------------------------------------------
-- 5. Profiles read policy
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'anyone can read profiles'
  ) THEN
    CREATE POLICY "anyone can read profiles"
      ON profiles
      FOR SELECT
      USING (true);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 6. Realtime: comments table
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE comments;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 7. Collaboration Sessions Table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_status text DEFAULT 'active', -- active | idle | offline
  joined_at      timestamptz DEFAULT now(),
  last_seen      timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'collaboration_sessions'
      AND policyname = 'users manage own session'
  ) THEN
    CREATE POLICY "users manage own session"
      ON collaboration_sessions
      FOR ALL
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE tablename = 'collaboration_sessions'
      AND policyname = 'team can read sessions'
  ) THEN
    CREATE POLICY "team can read sessions"
      ON collaboration_sessions
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- ------------------------------------------------------------
-- 8. Realtime: collaboration_sessions table
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND tablename = 'collaboration_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime
      ADD TABLE collaboration_sessions;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 9. Storage bucket: project-assets
-- ------------------------------------------------------------

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Authenticated upload policy
DROP POLICY IF EXISTS "authenticated upload" ON storage.objects;

CREATE POLICY "authenticated upload"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'project-assets'
);

-- Owner manage files policy
DROP POLICY IF EXISTS "owner manage files" ON storage.objects;

CREATE POLICY "owner manage files"
ON storage.objects
FOR ALL
TO authenticated
USING (
  bucket_id = 'project-assets'
  AND (storage.foldername(name))[1] IN ('covers', 'designs')
  AND auth.uid()::text = (storage.foldername(name))[2]
);

-- Public read policy
DROP POLICY IF EXISTS "public read project-assets" ON storage.objects;

CREATE POLICY "public read project-assets"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'project-assets'
);
