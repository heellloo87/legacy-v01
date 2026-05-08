-- ============================================================
--  Migration: realtime_presence (fixed)
-- ============================================================

-- 1. Enable realtime on comments (skip if already a member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE comments;
  END IF;
END $$;

-- 2. Profiles: allow authenticated users to read all profiles
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

-- 3. Collaboration sessions table
CREATE TABLE IF NOT EXISTS collaboration_sessions (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  user_id        uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  session_status text DEFAULT 'active',
  joined_at      timestamptz DEFAULT now(),
  last_seen      timestamptz DEFAULT now(),
  UNIQUE(project_id, user_id)
);

ALTER TABLE collaboration_sessions ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_sessions' AND policyname = 'users manage own session') THEN
    CREATE POLICY "users manage own session" ON collaboration_sessions FOR ALL USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'collaboration_sessions' AND policyname = 'team can read sessions') THEN
    CREATE POLICY "team can read sessions" ON collaboration_sessions FOR SELECT USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

-- 4. Enable realtime on collaboration_sessions (skip if already member)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'collaboration_sessions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE collaboration_sessions;
  END IF;
END $$;
