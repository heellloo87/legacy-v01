-- ============================================================
--  Migration: realtime_presence
--  - Enable realtime on comments (was missing, only projects had it)
--  - Allow authenticated users to read all profiles (for comment names)
--  - Create collaboration_sessions table for presence metadata
-- ============================================================

-- 1. Enable realtime on comments table
ALTER PUBLICATION supabase_realtime ADD TABLE comments;

-- 2. Profiles: anyone authenticated can read (needed for comment author names)
--    Policy "anyone can read profiles" already exists from initial migration.
--    This is a no-op if already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'anyone can read profiles'
  ) THEN
    CREATE POLICY "anyone can read profiles"
      ON profiles FOR SELECT
      USING (true);
  END IF;
END $$;

-- 3. Collaboration sessions table (tracks who is viewing what project)
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_status text DEFAULT 'active',  -- 'active' | 'idle' | 'offline'
  joined_at    timestamptz DEFAULT now(),
  last_seen    timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- RLS on collaboration_sessions
ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own session"
  ON collaboration_sessions FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "team can read sessions"
  ON collaboration_sessions FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Enable realtime for live presence fallback
ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
