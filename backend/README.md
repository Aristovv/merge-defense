# Casino City API for Timeweb Cloud

Independent Express/PostgreSQL backend; it does not modify any other game.

1. Create a separate PostgreSQL database or schema on Timeweb Cloud.
2. Run `backend/schema.sql` against that database.
3. In `backend/`, run `npm install`.
4. Configure `DATABASE_URL`, `VK_APP_SECRET`, `PORT` using environment variables (never commit secrets).
5. Start with `npm start`; proxy `/api/` and `/health` through HTTPS.

Routes: GET /health, GET /api/top, GET /api/me (signed VK launch), POST /api/register (signed VK launch).

**Important:** This is the secure API foundation, not a completed online leaderboard integration. The frontend is not yet connected. There is intentionally no client-supplied score update endpoint: game results and progression need authoritative server-side validation before the public leaderboard can be populated safely.
