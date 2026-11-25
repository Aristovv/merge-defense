'use strict';

function registerCasinoRanking(app, pool, requireAuth, onScoreAdvanced = null) {
  // Prefer the existing players.avatar_url column. If ALTER is denied, use an
  // independent table; do not disable avatar persistence for the whole ranking.
  const avatarReady = pool ? (async () => {
    // Do not attempt ALTER on every restart. The ranking table may belong
    // to postgres while the application role has ordinary read/write access.
    try {
      const column = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='casino_city_players' AND column_name='avatar_url'");
      if (column.rowCount > 0) return 'column';
    } catch (error) {
      console.warn('Casino avatar column lookup failed:', error.code || error.message);
    }
    try {
      await pool.query('ALTER TABLE public.casino_city_players ADD COLUMN IF NOT EXISTS avatar_url TEXT');
      return 'column';
    } catch (error) {
      // If another administrator added the column concurrently, use it.
      try {
        const column = await pool.query("SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='casino_city_players' AND column_name='avatar_url'");
        if (column.rowCount > 0) return 'column';
      } catch (_) {}
      if (error.code !== '42501') console.warn('Casino avatar column migration unavailable:', error.code || error.message);
    }
    // The fallback requires only permissions on the application-owned table.
    try {
      await pool.query(`CREATE TABLE IF NOT EXISTS public.casino_city_avatars(
        vk_id BIGINT PRIMARY KEY,
        avatar_url TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )`);
      await pool.query('SELECT 1 FROM public.casino_city_avatars LIMIT 1');
      return 'table';
    } catch (error) {
      console.warn('Casino avatar table unavailable. Apply the avatar migration:', error.code || error.message);
      return 'none';
    }
  })() : Promise.resolve('none');
  const avatarColumn = mode => mode === 'column'
    ? 'avatar_url'
    : "''::text AS avatar_url";
  const avatarJoin = mode => mode === 'table'
    ? "COALESCE((SELECT a.avatar_url FROM public.casino_city_avatars a WHERE a.vk_id=casino_city_players.vk_id), '') AS avatar_url"
    : avatarColumn(mode);
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
  // Public identity cosmetics come from the authoritative cloud save.
  // Never expose balances, inventory, purchases, or unrelated save fields.
  async function withIdentity(rows) {
    if (!rows.length) return rows;
    const ids = rows.map(row => String(row.vk_id));
    try {
      const result = await pool.query(
        'SELECT vk_id::text AS vk_id, save FROM public.casino_city_saves WHERE vk_id = ANY($1::bigint[])',
        [ids]
      );
      const byId = new Map(result.rows.map(row => [row.vk_id, row.save || {}]));
      const safe = value => typeof value === 'string' ? value.slice(0, 80) : '';
      return rows.map(row => {
        const save = byId.get(String(row.vk_id)) || {};
        const eq = save.donationEquipped && typeof save.donationEquipped === 'object'
          ? save.donationEquipped : {};
        const inv = save.donationInventory && typeof save.donationInventory === 'object'
          ? save.donationInventory : {};
        const owned = (key, value) => !value || (Array.isArray(inv[key]) && inv[key].includes(value));
        const pick = (key, invKey) => owned(invKey, eq[key]) ? safe(eq[key]) : '';
        return {...row,
          donationEquipped: {
            nick: pick('nick', 'nicks'), frame: pick('frame', 'frames'),
            title: pick('title', 'titles'), badge: pick('badge', 'badges')
          },
          prestige: prestigeIdentity(save),
          vip: Number.isSafeInteger(save.vip) && save.vip > 0 ? save.vip : 0
        };
      });
    } catch (error) {
      // Ranking remains available if the optional cosmetics table is unavailable.
      console.warn('Casino ranking cosmetics unavailable:', error.code || error.message);
      return rows.map(row => ({...row, donationEquipped: {}, vip: 0}));
    }
  }
  // WORLD 40.7: derive prestige exclusively from server-owned save inventory.
  const prestigePoints = [10,25,50,100,200,400,750,1250,2215];
  function prestigeIdentity(save) {
    const items = [...new Set(Array.isArray(save?.prestige40) ? save.prestige40.filter(i => Number.isInteger(i) && i >= 0 && i < prestigePoints.length) : [])].sort((a,b)=>a-b);
    const titles = [[9,'Легенда Lucky City'],[7,'Магнат престижа'],[5,'Хранитель сокровищ'],[3,'Ценитель роскоши'],[1,'Коллекционер']];
    return {items, points:items.reduce((sum,i)=>sum+prestigePoints[i],0), title:titles.find(([n])=>items.length>=n)?.[1] || ''};
  }
  app.get('/api/casino/prestige/top', async (_req,res) => {
    if (!pool) return res.status(503).json({error:'DATABASE_UNAVAILABLE'});
    try {
      const mode = await avatarReady;
      const {rows} = await pool.query(`
        SELECT p.vk_id::text AS vk_id,p.display_name,
          ${mode==='column'?'p.avatar_url':mode==='table'?"COALESCE((SELECT a.avatar_url FROM public.casino_city_avatars a WHERE a.vk_id=p.vk_id),'') AS avatar_url":"''::text AS avatar_url"},
          s.save->'prestige40' AS items
        FROM public.casino_city_players p JOIN public.casino_city_saves s ON s.vk_id=p.vk_id
        WHERE jsonb_typeof(s.save->'prestige40')='array'
      `);
      const top=rows.map(({items,...row})=>({...row,avatar_url:safeAvatar(row.avatar_url),prestige:prestigeIdentity({prestige40:items})}))
        .filter(row=>row.prestige.points>0)
        .sort((a,b)=>b.prestige.points-a.prestige.points || a.vk_id.localeCompare(b.vk_id)).slice(0,100);
      res.set('Cache-Control','no-store');
      return res.json({top});
    } catch(error) {
      console.warn('Prestige ranking unavailable:',error.code||error.message);
      return res.status(503).json({error:'PRESTIGE_RANKING_UNAVAILABLE'});
    }
  });
  app.get('/api/casino/top', async (_req, res) => {
    if (!pool) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      const avatarMode = await avatarReady;
      const avatarEnabled = avatarMode === 'column';
      const { rows } = await pool.query(`
        SELECT vk_id::text AS vk_id, display_name, score::text AS score,
               level, plays::text AS plays, wins::text AS wins, ${avatarJoin(avatarMode)}
        FROM public.casino_city_players
        ORDER BY score DESC, updated_at ASC, vk_id ASC
        LIMIT 100
      `);
      res.set('Cache-Control', 'no-store');
      return res.json({ top: await withIdentity(rows) });
    } catch (error) {
      console.error('Casino ranking read failed:', error.code || error.message);
      return res.status(503).json({ error: 'RANKING_UNAVAILABLE' });
    }
  });

  app.get('/api/casino/me', requireAuth, async (req, res) => {
    if (!pool) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      const avatarMode = await avatarReady;
      const avatarEnabled = avatarMode === 'column';
      const vkId = String(req.playerId || '').replace(/^vk:/, '');
      if (!/^\d+$/.test(vkId)) return res.status(401).json({ error: 'INVALID_PLAYER' });
      const { rows } = await pool.query(
        `SELECT vk_id::text AS vk_id, display_name, score::text AS score, level, plays::text AS plays, wins::text AS wins, ${avatarJoin(avatarMode)} FROM public.casino_city_players WHERE vk_id=$1`,
        [vkId]
      );
      res.set('Cache-Control', 'no-store');
      return res.json({ player: (await withIdentity(rows))[0] || null });
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
    const isFreshPlayer = plays===0 && wins===0 && level===1 && buildings[0]===1 && buildings.slice(1).every(v=>v===0);
    const targetScore = isFreshPlayer ? 0 : plays * 15 + wins * 45 + level * 110 +
      buildings.reduce((a, b) => a + b, 0) * 30;
    const avatarMode = await avatarReady;
      const avatarEnabled = avatarMode === 'column';
    const client = await pool.connect().catch(() => null);
    if (!client) return res.status(503).json({ error: 'DATABASE_UNAVAILABLE' });
    try {
      await client.query('BEGIN');
      // First registration is always a clean leaderboard baseline. The local
      // game save stays intact, but cannot grant an instant fabricated ranking.
      const inserted = await client.query(`
        INSERT INTO public.casino_city_players
          (vk_id, display_name, score, level, plays, wins, ${avatarEnabled ? 'avatar_url, ' : ''}updated_at)
        VALUES ($1, $2, 0, 1, 0, 0, ${avatarEnabled ? '$3, ' : ''}NOW())
        ON CONFLICT (vk_id) DO NOTHING RETURNING vk_id
      `, avatarEnabled ? [vkId, name, avatarUrl] : [vkId, name]);
      const snapshot = await client.query(`
        SELECT vk_id::text AS vk_id, display_name, score::text AS score,
               level, plays::text AS plays, wins::text AS wins, ${avatarEnabled ? 'avatar_url' : "''::text AS avatar_url"},
               updated_at, EXTRACT(EPOCH FROM (NOW() - updated_at)) AS elapsed_seconds
        FROM public.casino_city_players WHERE vk_id=$1 FOR UPDATE
      `, [vkId]);
      const old = snapshot.rows[0];
      if (!old) throw new Error('MISSING_CASINO_PLAYER');
      let limited = inserted.rowCount > 0 && targetScore > 0;
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
        const avatarChanged = avatarEnabled && !!avatarUrl && avatarUrl !== (old.avatar_url || '');
        const advanced = nameChanged || avatarChanged || acceptedScore > Number(old.score) ||
          acceptedPlays > Number(old.plays) || acceptedWins > Number(old.wins) ||
          acceptedLevel > Number(old.level);
        if (advanced) {
          const changed = await client.query(`
            UPDATE public.casino_city_players
            SET display_name=CASE WHEN $2<>'' THEN $2 ELSE display_name END,
                ${avatarEnabled ? "avatar_url=CASE WHEN $7<>'' THEN $7 ELSE avatar_url END," : ''}
                score=$3, level=$4, plays=$5, wins=$6,
                updated_at=CASE WHEN score <> $3 OR level <> $4 OR plays <> $5 OR wins <> $6
                                THEN NOW() ELSE updated_at END
            WHERE vk_id=$1
            RETURNING vk_id::text AS vk_id, display_name, score::text AS score,
                      level, plays::text AS plays, wins::text AS wins, ${avatarEnabled ? 'avatar_url' : "''::text AS avatar_url"}
          `, avatarEnabled ? [vkId, name, acceptedScore, acceptedLevel, acceptedPlays, acceptedWins, avatarUrl] : [vkId, name, acceptedScore, acceptedLevel, acceptedPlays, acceptedWins]);
          row = changed.rows[0];
        }
      }
      if (avatarMode === 'table' && avatarUrl) {
        await client.query('SAVEPOINT casino_avatar_part');
        try {
          await client.query(`
            INSERT INTO public.casino_city_avatars(vk_id,avatar_url,updated_at)
            VALUES($1,$2,NOW())
            ON CONFLICT(vk_id) DO UPDATE
            SET avatar_url=EXCLUDED.avatar_url,updated_at=NOW()
          `,[vkId,avatarUrl]);
          await client.query('RELEASE SAVEPOINT casino_avatar_part');
          row.avatar_url=avatarUrl;
        } catch(error){
          await client.query('ROLLBACK TO SAVEPOINT casino_avatar_part');
          await client.query('RELEASE SAVEPOINT casino_avatar_part');
          console.warn('Casino avatar update failed:',error.code||error.message);
        }
      }
      if (typeof onScoreAdvanced === 'function' && !inserted.rowCount && Number(row.score)>Number(old.score)) {
        // Do not credit fabricated initial snapshots. Score growth is constrained
        // by the existing rate limits and committed alongside the ranking row.
        await onScoreAdvanced(client,vkId,row.display_name,Number(row.score)-Number(old.score));
      }
      await client.query('COMMIT');
      const identity = (await withIdentity([row]))[0];
      res.set('Cache-Control', 'no-store');
      return res.json({ ok: true, limited, player: {
        vk_id: row.vk_id, display_name: row.display_name, score: String(row.score),
        level: row.level, plays: String(row.plays), wins: String(row.wins), avatar_url: row.avatar_url || '',
        donationEquipped: identity.donationEquipped, vip: identity.vip
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
