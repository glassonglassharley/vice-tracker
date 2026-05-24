const express = require('express');
const router = express.Router();
const pool = require('../db');
const { verifyViceOwnership } = require('../utils');

router.get('/:vice_id', async (req, res, next) => {
  try {
    const { vice_id } = req.params;
    if (!await verifyViceOwnership(vice_id, req.auth.userId))
      return res.status(403).json({ error: 'Forbidden' });

    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);

    const fmt = d => d.toISOString().split('T')[0];

    const period = async (from, to) => {
      const r = await pool.query(
        `SELECT COALESCE(SUM(quantity),0)::float AS qty,
                COALESCE(SUM(quantity * price_per_unit),0)::float AS spend
         FROM entries WHERE vice_id = $1 AND date >= $2 AND date <= $3`,
        [vice_id, from, to]
      );
      return { quantity: r.rows[0].qty, spend: round2(r.rows[0].spend) };
    };

    const [todayS, weekS, monthS, yearS] = await Promise.all([
      period(today, today),
      period(fmt(weekAgo), today),
      period(fmt(monthStart), today),
      period(fmt(yearStart), today),
    ]);

    const all = await pool.query(
      'SELECT quantity::float, price_per_unit::float FROM entries WHERE vice_id = $1',
      [vice_id]
    );
    const rows = all.rows;
    const totalQty   = rows.reduce((s, r) => s + r.quantity, 0);
    const totalSpend = rows.reduce((s, r) => s + r.quantity * r.price_per_unit, 0);
    const totalDays  = rows.length;
    const cleanDays  = rows.filter(r => r.quantity === 0).length;
    const loggedDays = rows.filter(r => r.quantity > 0).length;

    const avgPPU   = totalQty > 0 ? totalSpend / totalQty : 0;
    const avgQPD   = totalDays > 0 ? totalQty / totalDays : 0;
    const avgDSpend = totalDays > 0 ? totalSpend / totalDays : 0;
    const savings  = cleanDays * avgDSpend;

    res.json({
      today: todayS, week: weekS, month: monthS, year: yearS,
      avg_price_per_unit:   round2(avgPPU),
      avg_quantity_per_day: round2(avgQPD),
      avg_daily_spend:      round2(avgDSpend),
      total_logged_days:    loggedDays,
      clean_days:           cleanDays,
      savings_from_clean_days: round2(savings),
    });
  } catch (err) { next(err); }
});

function round2(n) { return Math.round(n * 100) / 100; }

module.exports = router;
