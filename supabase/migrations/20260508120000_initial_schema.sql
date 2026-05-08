-- ============================================================
-- Migration: notifications system
-- ============================================================

-- ------------------------------------------------------------
-- 1. Notifications table
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS notifications (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  project_id   uuid REFERENCES projects(id)   ON DELETE CASCADE NOT NULL,
  type         text NOT NULL,          -- 'comment' | 'progress' | 'status'
  message      text NOT NULL,
  read         boolean DEFAULT false,
  created_at   timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_user_read_idx
  ON notifications (user_id, read, created_at DESC);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user owns notifications" ON notifications;
CREATE POLICY "user owns notifications"
  ON notifications
  FOR ALL
  USING (auth.uid() = user_id);

-- ------------------------------------------------------------
-- 2. Realtime for notifications
-- ------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;

-- ------------------------------------------------------------
-- 3. Helper: notify all project members except the actor
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION notify_project_members(
  p_project_id uuid,
  p_actor_id   uuid,
  p_type       text,
  p_message    text
) RETURNS void AS $$
DECLARE
  owner_id uuid;
BEGIN
  SELECT user_id INTO owner_id FROM projects WHERE id = p_project_id;

  -- Notify owner if they're not the actor
  IF owner_id IS NOT NULL AND owner_id <> p_actor_id THEN
    INSERT INTO notifications (user_id, project_id, type, message)
    VALUES (owner_id, p_project_id, p_type, p_message);
  END IF;

  -- Notify active collaborators (skip actor and owner to avoid duplicates)
  INSERT INTO notifications (user_id, project_id, type, message)
  SELECT DISTINCT cs.user_id, p_project_id, p_type, p_message
  FROM   collaboration_sessions cs
  WHERE  cs.project_id = p_project_id
    AND  cs.user_id   <> p_actor_id
    AND  cs.user_id   <> COALESCE(owner_id, p_actor_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ------------------------------------------------------------
-- 4. Trigger: new comment → notify project members
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
  proj_name  text;
  actor_name text;
BEGIN
  SELECT name      INTO proj_name  FROM projects WHERE id = NEW.project_id;
  SELECT full_name INTO actor_name FROM profiles  WHERE id = NEW.user_id;

  PERFORM notify_project_members(
    NEW.project_id,
    NEW.user_id,
    'comment',
    COALESCE(actor_name, 'Someone') || ' commented on "' || COALESCE(proj_name, 'a project') || '"'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_comment_insert ON comments;
CREATE TRIGGER after_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION trg_comment_notification();

-- ------------------------------------------------------------
-- 5. Trigger: project progress/status update → notify members
--    FIX: removed reference to non-existent "updated_by" column
--         actor is always the project owner (user_id)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION trg_project_update_notification()
RETURNS TRIGGER AS $$
DECLARE
  msg text;
BEGIN
  -- Only fire if progress or status actually changed
  IF NEW.progress = OLD.progress AND NEW.status = OLD.status THEN
    RETURN NEW;
  END IF;

  IF NEW.progress <> OLD.progress THEN
    msg := '"' || NEW.name || '" progress updated to ' || NEW.progress || '%';
  ELSE
    msg := '"' || NEW.name || '" status changed to ' || NEW.status;
  END IF;

  -- Actor is the project owner (user_id) — no updated_by column needed
  PERFORM notify_project_members(
    NEW.id,
    NEW.user_id,
    CASE WHEN NEW.progress <> OLD.progress THEN 'progress' ELSE 'status' END,
    msg
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS after_project_update ON projects;
CREATE TRIGGER after_project_update
  AFTER UPDATE ON projects
  FOR EACH ROW
  EXECUTE FUNCTION trg_project_update_notification();
