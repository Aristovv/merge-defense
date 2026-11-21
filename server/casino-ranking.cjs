'use strict';

function registerCasinoRanking(app, pool, requireAuth) {
  app.get('/api/casino/top', async (_req, res) => {
    if (!pool) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      const { rows } = await pool.query(`
        SELECT vk_id::text AS vk_id, display_name, score::text AS score,
               level, plays::text AS plays, wins::text AS wins
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
      const vkId = String(req.playerId || '').replace(/^vk:/, '');
      if (!/^\d+$/.test(vkId)) return res.status(401).json({ error: 'INVALID_PLAYER' });
      const { rows } = await pool.query(
        'SELECT vk_id::text AS vk_id, display_name, score::text AS score, level, plays::text AS plays, wins::text AS wins FROM public.casino_city_players WHERE vk_id=$1',
        [vkId]
      );
      res.set('Cache-Control', 'no-store');
      return res.json({ player: rows[0] || null });
    } catch (error) {
      console.error('Casino player read failed:', error.code || error.message);
      return res.status(503).json({ error: 'PLAYER_UNAVAILABLE' });
    }
  });

  app.post('/api/casino/sync', requireAuth, async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      const vkId = String(req.playerId || '').replace(/^vk:/, '');
      if (!/^\d+$/.test(vkId)) return res.status(401).json({ error: 'INVALID_PLAYER' });
      const body = req.body || {};
      const integer = (v, min, max) => Number.isSafeInteger(v) && v >= min && v <= max;
      const { plays, wins, level, buildings } = body;
      if (!integer(plays, 0, 1000000000) || !integer(wins, 0, plays) ||
          !integer(level, 1, 10000) || !Array.isArray(buildings) ||
          buildings.length !== 14 || !buildings.every(v => integer(v, 0, 1000))) {
        return res.status(400).json({ error: 'INVALID_RANKING_STATS' });
      }
      const score = plays * 15 + wins * 45 + level * 110 + buildings.reduce((a,b) => a+b, 0) * 30;
      const displayName = typeof body.displayName === 'string'
        ? body.displayName.replace(/[<>\\u0000-\\u001f]/g, '').trim().slice(0, 48) : '';
      const name = displayName || ('Игрок ' + vkId.slice(-4));
      const { rows } = await pool.query(`
        INSERT INTO public.casino_city_players
          (vk_id, display_name, score, level, plays, wins, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW())
        ON CONFLICT (vk_id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          score = GREATEST(public.casino_city_players.score, EXCLUDED.score),
          level = GREATEST(public.casino_city_players.level, EXCLUDED.level),
          plays = GREATEST(public.casino_city_players.plays, EXCLUDED.plays),
          wins = GREATEST(public.casino_city_players.wins, EXCLUDED.wins),
          updated_at = NOW()
        RETURNING vk_id::text AS vk_id, display_name, score::text AS score,
                  level, plays::text AS plays, wins::text AS wins
      `, [vkId, name, score, level, plays, wins]);
      res.set('Cache-Control', 'no-store');
      return res.json({ ok: true, player: rows[0] });
    } catch (error) {
      console.error('Casino ranking write failed:', error.code || error.message);
      return res.status(503).json({ error: 'RANKING_WRITE_FAILED' });
    }
  });
}
module.exports = { registerCasinoRanking };
