CREATE TABLE IF NOT EXISTS casino_city_players (
 vk_id BIGINT PRIMARY KEY,
 display_name TEXT NOT NULL DEFAULT 'Игрок',
 score BIGINT NOT NULL DEFAULT 0 CHECK (score >= 0),
 level INTEGER NOT NULL DEFAULT 1,
 plays BIGINT NOT NULL DEFAULT 0,
 wins BIGINT NOT NULL DEFAULT 0,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS casino_city_score_idx ON casino_city_players(score DESC, updated_at ASC);
