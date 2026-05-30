const express = require('express');
const router = express.Router();
const pool = require('../db');
const { getInternalUserId, getLevelInfo, awardXP } = require('../utils');

router.get('/', async (req, res, next) => {
  try {
    const uid = await getInternalUserId(req.auth.userId);
    if (!uid) return res.json({ total_xp: 0, ...getLevelInfo(0) });
    const r = await pool.query('SELECT total_xp FROM user_xp WHERE user_id = $1', [uid]);
    const totalXp = r.rows[0]?.total_xp ?? 0;
    res.json({ total_xp: totalXp, ...getLevelInfo(totalXp) });
  } catch (err) { next(err); }
});

// POST /api/xp/award — internal endpoint for awarding XP server-side
// Called after entry log, badge earn, or goal complete
router.post('/award', async (req, res, next) => {
  try {
    const uid = await getInternalUserId(req.auth.userId);
    if (!uid) return res.status(404).json({ error: 'User not found' });
    const amount = Number(req.body?.amount);
    if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be a positive number' });
    const result = await awardXP(uid, Math.round(amount));
    res.json(result);
  } catch (err) { next(err); }
});

module.exports = router;
