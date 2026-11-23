-- Lucky City: immutable revision snapshots before every cloud-save update/delete.
-- Execute once as the PostgreSQL OWNER/DBA (not the restricted application role).
-- Existing players' balances and current saved JSON are not modified.
BEGIN;

CREATE TABLE IF NOT EXISTS public.casino_city_save_history (
  vk_id BIGINT NOT NULL,
  revision BIGINT NOT NULL,
  save JSONB NOT NULL,
  saved_at TIMESTAMPTZ NOT NULL,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (vk_id,revision)
);

-- Seed a restore point for every existing account before enabling the trigger.
INSERT INTO public.casino_city_save_history (vk_id,revision,save,saved_at)
SELECT vk_id,revision,save,updated_at FROM public.casino_city_saves
ON CONFLICT (vk_id,revision) DO NOTHING;

CREATE OR REPLACE FUNCTION public.lucky_city_archive_old_save()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  INSERT INTO public.casino_city_save_history (vk_id,revision,save,saved_at)
  VALUES (OLD.vk_id,OLD.revision,OLD.save,OLD.updated_at)
  ON CONFLICT (vk_id,revision) DO NOTHING;
  IF TG_OP = 'UPDATE' THEN
    RETURN NEW;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS lucky_city_before_save_change ON public.casino_city_saves;
CREATE TRIGGER lucky_city_before_save_change
BEFORE UPDATE OR DELETE ON public.casino_city_saves
FOR EACH ROW EXECUTE FUNCTION public.lucky_city_archive_old_save();

COMMIT;
-- Verify (read-only):
-- SELECT COUNT(*) AS backed_up_players FROM public.casino_city_save_history;
-- SELECT COUNT(*) AS live_players FROM public.casino_city_saves;
-- Run periodic encrypted off-host pg_dump backups as well: DB history alone
-- cannot withstand deleting the database, storage failure or compromised DB admins.
