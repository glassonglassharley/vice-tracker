require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const { ensureUser } = require('./middleware/auth');
const pool = require('./db');
const {
  router: usernameAuthRouter,
  sanitizeUsername,
  hashToken,
  validToken,
  safeEqual,
} = require('./routes/usernameAuth');

const app = express();

async function usernameOrClerkAuth(req, res, next) {
  const username = sanitizeUsername(req.get('X-Username-Auth'));
  const token = String(req.get('X-Username-Token') || '').trim();
  if (username || token) {
    if (!username || !validToken(token)) {
      return res.status(401).json({ error: 'Username access token required.' });
    }
    try {
      const result = await pool.query(
        'SELECT username_token_hash FROM users WHERE auth_username = $1 AND clerk_user_id = $2 LIMIT 1',
        [username, `username:${username}`]
      );
      const tokenHash = result.rows[0]?.username_token_hash;
      if (!tokenHash || !safeEqual(hashToken(token), tokenHash)) {
        return res.status(401).json({ error: 'Invalid username access token.' });
      }
      req.auth = { userId: `username:${username}` };
      req.usernameAuth = { username };
      return next();
    } catch (err) {
      return next(err);
    }
  }

  return requireAuth()(req, res, next);
}

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use('/api/cron', require('./routes/cron'));
app.use('/api/auth/username', usernameAuthRouter);
app.use('/api', usernameOrClerkAuth, ensureUser);

app.use('/api/users',   require('./routes/users'));
app.use('/api/vices',   require('./routes/vices'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/stats',   require('./routes/stats'));
app.use('/api/savings',  require('./routes/savings'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/partners', require('./routes/partners'));
app.use('/api/goals',   require('./routes/goals'));
app.use('/api/wrapped', require('./routes/wrapped'));
app.use('/api/companion', require('./routes/companion'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
