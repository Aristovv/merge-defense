'use strict';

function registerCasinoRanking(app, pool, requireAuth) {
  // Safe additive schema migration; never changes existing player scores.
  const avatarReady = pool ? pool.query(
    'ALTER TABLE public.casino_city_players ADD COLUMN IF NOT EXISTS avatar_url TEXT'
  ).catch(error => { console.error('Casino avatar schema:', error.code || error.message); throw error; }) : null;
  const safeAvatar = value => {
    if (typeof value !== 'string' || value.length > 650) return '';
    try {
      const u = new URL(value);
      if (u.protocol !== 'https:') return '';
      const host = u.hostname.toLowerCase();
      if (!/(^|\.)(userapi\.com|vkcdn\.ru|vk\.com|vk\.ru)$/.test(host)) return '';
      return u.href;
    } catch (_) { return ''; }
  };
  app.get('/api/casino/top', async (_req, res) => {
    if (!pool) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      await avatarReady;
      const { rows } = await pool.query(`
        SELECT vk_id::text AS vk_id, display_name, score::text AS score,
               level, plays::text AS plays, wins::text AS wins, avatar_url
        FROM public.casino_city_players
        ORDER BY score DESC, updated_at ASC, vk_id ASC
        LIMIT 100
      `);
      res.set('Cache-Control', 'no-store');
      return res.json({ top: rows });
    } catch (error) {
      console.error('Casino ranking read failed:', error.code || error.message);
      return res.status(503).json({ error: 'RANKING_UNAVAILABLE' });
    }
  });

  app.get('/api/casino/me', requireAuth, async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      await avatarReady;
      const vkId = String(req.playerId || '').replace(/^vk:/, '');
      if (!/^\d+$/.test(vkId)) return res.status(401).json({ error: 'INVALID_PLAYER' });
      const { rows } = await pool.query(
        'SELECT vk_id::text AS vk_id, display_name, score::text AS score, level, plays::text AS plays, wins::text AS wins, avatar_url FROM public.casino_city_players WHERE vk_id=$1',
        [vkId]
      );
      res.set('Cache-Control', 'no-store');
      return res.json({ player: rows[0] || null });
    } catch (error) {
      console.error('Casino player read failed:', error.code || error.message);
      return res.status(503).json({ error: 'PLAYER_UNAVAILABLE' });
    }
  });

  // This endpoint receives untrusted browser snapshots. Rate-cap all recorded
  // growth using database time and row locks; do not import arbitrary initial scores.
  // Full anti-cheat will require server-authoritative game rounds.
  app.post('/api/casino/sync', requireAuth, async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    const vkId = String(req.playerId || '').replace(/^vk:/, '');
    if (!/^\d+$/.test(vkId)) return res.status(401).json({ error: 'INVALID_PLAYER' });
    const body = req.body || {};
    const integer = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
    const { plays, wins, level, buildings } = body;
    const avatarUrl = safeAvatar(body.avatarUrl);
    if (!integer(plays, 0, 1000000000) || !integer(wins, 0, plays) ||
        !integer(level, 1, 10000) || !Array.isArray(buildings) ||
        buildings.length !== 14 || !buildings.every(v => integer(v, 0, 1000))) {
      return res.status(400).json({ error: 'INVALID_RANKING_STATS' });
    }
    const displayName = typeof body.displayName === 'string'
      ? body.displayName.replace(/[<>\u0000-\u001f]/g, '').trim().slice(0, 48) : '';
    const name = displayName || ('Игрок ' + vkId.slice(-4));
    const targetScore = plays * 15 + wins * 45 + level * 110 +
      buildings.reduce((a, b) => a + b, 0) * 30;
    try { await avatarReady; } catch (_) { return res.status(503).json({ error: 'RANKING_SCHEMA_UNAVAILABLE' }); }
    const client = await pool.connect().catch(() => null);
    if (!client) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      await client.query('BEGIN');
      // First registration is always a clean leaderboard baseline. The local
      // game save stays intact, but cannot grant an instant fabricated ranking.
      const inserted = await client.query(`
        INSERT INTO public.casino_city_players
          (vk_id, display_name, score, level, plays, wins, avatar_url, updated_at)
        VALUES ($1, $2, 110, 1, 0, 0, $3, NOW())
        ON CONFLICT (vk_id) DO NOTHING RETURNING vk_id
      `, [vkId, name, avatarUrl]);
      const snapshot = await client.query(`
        SELECT vk_id::text AS vk_id, display_name, score::text AS score,
               level, plays::text AS plays, wins::text AS wins, avatar_url,
               updated_at, EXTRACT(EPOCH FROM (NOW() - updated_at)) AS elapsed_seconds
        FROM public.casino_city_players WHERE vk_id=$1 FOR UPDATE
      `, [vkId]);
      const old = snapshot.rows[0];
      if (!old) throw new Error('MISSING_CASINO_PLAYER');
      let limited = inserted.rowCount > 0 && targetScore > 110;
      let row = old;
      if (!inserted.rowCount) {
        const elapsed = Math.max(0, Math.min(86400, Number(old.elapsed_seconds) || 0));
        // At most one credited round per 2 seconds, a level per minute,
        // and 900 score points per minute. No per-request bonus to exploit.
        const roundBudget = Math.floor(elapsed / 2);
        const levelBudget = Math.floor(elapsed / 60);
        const scoreBudget = Math.floor(elapsed * 15);
        const acceptedPlays = Math.max(Number(old.plays), Math.min(plays, Number(old.plays) + roundBudget));
        const acceptedWins = Math.max(Number(old.wins), Math.min(wins, Number(old.wins) + roundBudget, acceptedPlays));
        const acceptedLevel = Math.max(Number(old.level), Math.min(level, Number(old.level) + levelBudget));
        const maxScoreFromGrowth = (acceptedPlays - Number(old.plays)) * 15 +
          (acceptedWins - Number(old.wins)) * 45 +
          (acceptedLevel - Number(old.level)) * 110 +
          Math.floor(elapsed / 60) * 30;
        const acceptedScore = Math.max(Number(old.score),
          Math.min(targetScore, Number(old.score) + scoreBudget,
                   Number(old.score) + maxScoreFromGrowth));
        limited = acceptedScore < targetScore ||
          acceptedPlays < plays || acceptedWins < wins || acceptedLevel < level;
        // Do not refresh updated_at for no-op syncs: that would prevent legitimate
        // time allowance from accumulating.
        const nameChanged = !!displayName && displayName !== old.display_name;
        const avatarChanged = !!avatarUrl && avatarUrl !== (old.avatar_url || '');
        const advanced = nameChanged || avatarChanged || acceptedScore > Number(old.score) ||
          acceptedPlays > Number(old.plays) || acceptedWins > Number(old.wins) ||
          acceptedLevel > Number(old.level);
        if (advanced) {
          const changed = await client.query(`
            UPDATE public.casino_city_players
            SET display_name=CASE WHEN $2<>'' THEN $2 ELSE display_name END,
                avatar_url=CASE WHEN $7<>'' THEN $7 ELSE avatar_url END,
                score=$3, level=$4, plays=$5, wins=$6,
                updated_at=CASE WHEN score <> $3 OR level <> $4 OR plays <> $5 OR wins <> $6
                                THEN NOW() ELSE updated_at END
            WHERE vk_id=$1
            RETURNING vk_id::text AS vk_id, display_name, score::text AS score,
                      level, plays::text AS plays, wins::text AS wins, avatar_url
          `, [vkId, name, acceptedScore, acceptedLevel, acceptedPlays, acceptedWins, avatarUrl]);
          row = changed.rows[0];
        }
      }
      await client.query('COMMIT');
      res.set('Cache-Control', 'no-store');
      return res.json({ ok: true, limited, player: {
        vk_id: row.vk_id, display_name: row.display_name, score: String(row.score),
        level: row.level, plays: String(row.plays), wins: String(row.wins), avatar_url: row.avatar_url || ''
      } });
    } catch (error) {
      await client.query('ROLLBACK').catch(() => {});
      console.error('Casino ranking write failed:', error.code || error.message);
      return res.status(503).json({ error: 'RANKING_WRITE_FAILED' });
    } finally {
      client.release();
    }
  });
}
module.exports = { registerCasinoRanking };
