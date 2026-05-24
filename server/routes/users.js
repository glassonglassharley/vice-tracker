const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/me', async (req, res, next) => {
  try {
    const r = await pool.query('SELECT * FROM users WHERE clerk_user_id = $1', [req.auth.userId]);
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

router.put('/me', async (req, res, next) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'name required' });
    const r = await pool.query(
      'UPDATE users SET name = $1 WHERE clerk_user_id = $2 RETURNING *',
      [name, req.auth.userId]
    );
    res.json(r.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/me', async (req, res, next) => {
  try {
    await pool.query('DELETE FROM users WHERE clerk_user_id = $1', [req.auth.userId]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
