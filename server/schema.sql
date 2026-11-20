-- MERGE DEFENSE 1.0: dedicated schema for verified VK users.
CREATE TABLE IF NOT EXISTS players (
  player_id TEXT PRIMARY KEY,
  coins BIGINT NOT NULL DEFAULT 450 CHECK (coins >= 0),
  gems BIGINT NOT NULL DEFAULT 60 CHECK (gems >= 0),
  hp INT NOT NULL DEFAULT 20 CHECK (hp BETWEEN 0 AND 20),
  wave INT NOT NULL DEFAULT 1 CHECK (wave BETWEEN 1 AND 10),
  summons INT NOT NULL DEFAULT 0 CHECK (summons >= 0),
  pity INT NOT NULL DEFAULT 0 CHECK (pity >= 0),
  kills BIGINT NOT NULL DEFAULT 0 CHECK (kills >= 0),
  wins BIGINT NOT NULL DEFAULT 0 CHECK (wins >= 0),
  power INT NOT NULL DEFAULT 0 CHECK (power BETWEEN 0 AND 100),
  income INT NOT NULL DEFAULT 0 CHECK (income BETWEEN 0 AND 100),
  towers JSONB NOT NULL DEFAULT '[]'::jsonb,
  achievements JSONB NOT NULL DEFAULT '[]'::jsonb,
  discovered JSONB NOT NULL DEFAULT '[]'::jsonb,
  revision BIGINT NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS purchases (
  id BIGSERIAL PRIMARY KEY,
  provider TEXT NOT NULL,
  provider_transaction_id TEXT NOT NULL,
  player_id TEXT NOT NULL REFERENCES players(player_id),
  product_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(provider,provider_transaction_id)
);
CREATE INDEX IF NOT EXISTS purchases_player_id_idx ON purchases(player_id);

-- Single-player save snapshots are separate from the authoritative payment ledger.
-- The API also creates this table automatically on first cloud-save request.
CREATE TABLE IF NOT EXISTS game_saves (
  player_id TEXT PRIMARY KEY REFERENCES players(player_id) ON DELETE CASCADE,
  save JSONB NOT NULL,
  revision BIGINT NOT NULL DEFAULT 1 CHECK (revision > 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
