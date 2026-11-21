-- Casino City avatar persistence: run under DB owner if server DB role cannot ALTER/CREATE.
-- This does not change scores, players, saved balances or Merge Defense data.
BEGIN;
ALTER TABLE public.casino_city_players ADD COLUMN IF NOT EXISTS avatar_url TEXT;
-- Fallback used if the server DB user cannot ALTER the ranking table:
CREATE TABLE IF NOT EXISTS public.casino_city_avatars (
  vk_id BIGINT PRIMARY KEY,
  avatar_url TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMIT;
-- If app DB role differs from owner, grant SELECT, INSERT, UPDATE
-- on public.casino_city_avatars and UPDATE(avatar_url) on public.casino_city_players.
