-- Casino City 14.1: run once as the database owner if the API role lacks CREATE privileges.
-- This table is separate from Merge Defense and all existing Casino City saves.
BEGIN;
CREATE TABLE IF NOT EXISTS public.casino_city_tournaments (
  week_start DATE NOT NULL,
  vk_id BIGINT NOT NULL,
  display_name TEXT NOT NULL DEFAULT '',
  points BIGINT NOT NULL DEFAULT 0,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  claimed_at TIMESTAMPTZ NULL,
  PRIMARY KEY(week_start,vk_id)
);
CREATE INDEX IF NOT EXISTS casino_city_tournaments_week_leaders
  ON public.casino_city_tournaments (week_start,points DESC,joined_at ASC,vk_id ASC);
-- If the API uses a different DB role, grant SELECT, INSERT and UPDATE on this table to that role.
COMMIT;
