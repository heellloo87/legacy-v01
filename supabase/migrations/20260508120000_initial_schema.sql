-- ============================================================
--  Migration: fix_schema
--  - Fix projects table columns (image_url → cover_url + design_url + design_ext)
--  - Add creator_name to projects (denormalised for fast reads)
--  - Update RLS: team projects visible to all authenticated users on dashboard
--                private projects only visible to owner
--                workspace shows owner's private + all team projects
--  - Storage bucket: project-assets (public reads, authenticated writes)
-- ============================================================

-- 1. Fix projects table columns --------------------------------
ALTER TABLE projects
  RENAME COLUMN image_url TO cover_url;

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS design_url  text,
  ADD COLUMN IF NOT EXISTS design_ext  text,
  ADD COLUMN IF NOT EXISTS creator_name text;

-- 2. Back-fill creator_name from profiles ----------------------
UPDATE projects p
SET creator_name = pr.full_name
FROM profiles pr
WHERE pr.id = p.user_id;

-- 3. Keep creator_name in sync on new inserts via trigger ------
CREATE OR REPLACE FUNCTION set_project_creator_name()
RETURNS TRIGGER AS $$
BEGIN
  SELECT full_name INTO NEW.creator_name
  FROM public.profiles
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS projects_set_creator_name ON projects;
CREATE TRIGGER projects_set_creator_name
  BEFORE INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION set_project_creator_name();

-- 4. Drop old RLS policies on projects ------------------------
DROP POLICY IF EXISTS "owner full access" ON projects;

-- 5. New RLS policies -----------------------------------------

-- Owner can do anything with their own projects
CREATE POLICY "owner full access"
  ON projects FOR ALL
  USING (auth.uid() = user_id);

-- Any logged-in user can READ team (and public) projects
CREATE POLICY "team projects readable by authenticated"
  ON projects FOR SELECT
  USING (
    auth.uid() IS NOT NULL
    AND visibility IN ('team', 'public')
  );

-- 6. Storage bucket: project-assets ---------------------------
-- Run via Supabase dashboard or supabase CLI if not already created.
-- The INSERT below is idempotent thanks to ON CONFLICT DO NOTHING.
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Allow any authenticated user to upload into project-assets
DROP POLICY IF EXISTS "authenticated upload" ON storage.objects;
CREATE POLICY "authenticated upload"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-assets');

-- Allow the owning user to update / delete their own files
DROP POLICY IF EXISTS "owner manage files" ON storage.objects;
CREATE POLICY "owner manage files"
  ON storage.objects FOR ALL
  TO authenticated
  USING (
    bucket_id = 'project-assets'
    AND (storage.foldername(name))[1] IN ('covers', 'designs')
    AND auth.uid()::text = (storage.foldername(name))[2]
  );

-- Public read (bucket is already public=true but belt-and-suspenders)
DROP POLICY IF EXISTS "public read project-assets" ON storage.objects;
CREATE POLICY "public read project-assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-assets');
