const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyViceOwnership, verifyEntryOwnership } = require('../utils');

router.get('/', async (req, res, next) => {
  try {
    const { vice_id, from, to } = req.query;
    if (!vice_id) return res.status(400).json({ error: 'vice_id required' });
    if (!await verifyViceOwnership(vice_id, req.auth.userId))
      return res.status(403).json({ error: 'Forbidden' });

    let q = 'SELECT * FROM entries WHERE vice_id = $1';
    const params = [vice_id];
    if (from) { q += ` AND date >= $${params.length + 1}`; params.push(from); }
    if (to)   { q += ` AND date <= $${params.length + 1}`; params.push(to); }
    q += ' ORDER BY date DESC';

    const r = await pool.query(q, params);
    res.json(r.rows);
  } catch (err) { next(err); }
});

router.post('/', async (req, res, next) => {
  try {
    const { vice_id, date, quantity, price_per_unit } = req.body;
    if (!vice_id || !date) return res.status(400).json({ error: 'vice_id and date required' });
    if (!await verifyViceOwnership(vice_id, req.auth.userId))
      return res.status(403).json({ error: 'Forbidden' });

    const r = await pool.query(
      `INSERT INTO entries (vice_id, date, quantity, price_per_unit)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (vice_id, date) DO UPDATE
         SET quantity = EXCLUDED.quantity, price_per_unit = EXCLUDED.price_per_unit
       RETURNING *`,
      [vice_id, date, quantity ?? 0, price_per_unit]
    );
    res.status(200).json(r.rows[0]);
  } catch (err) { next(err); }
});

router.delete('/:id', async (req, res, next) => {
  try {
    if (!await verifyEntryOwnership(req.params.id, req.auth.userId))
      return res.status(403).json({ error: 'Forbidden' });
    await pool.query('DELETE FROM entries WHERE id = $1', [req.params.id]);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

module.exports = router;
