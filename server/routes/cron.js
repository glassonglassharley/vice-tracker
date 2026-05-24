const express = require('express');
const webpush = require('web-push');
const router = express.Router();
const pool = require('../db');

const REMINDER_HOUR = Number(process.env.NIGHTLY_REMINDER_HOUR || 21);

function authCron(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return next();
  const auth = req.get('authorization') || '';
  const headerSecret = req.get('x-cron-secret') || '';
  if (auth === `Bearer ${secret}` || headerSecret === secret) return next();
  return res.status(401).json({ error: 'Unauthorized cron request' });
}

function configureWebPush() {
  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  const subject = process.env.VAPID_SUBJECT || 'mailto:notifications@vice-tracker.local';
  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

function localDateParts(timezone, date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'UTC',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date).reduce((acc, part) => {
    if (part.type !== 'literal') acc[part.type] = part.value;
    return acc;
  }, {});

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    hour: Number(parts.hour),
  };
}

function previousDateString(dateString) {
  const date = new Date(`${dateString}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

async function zeroFillUserDay(userId, dateString) {
  const result = await pool.query(
    `INSERT INTO entries (vice_id, date, quantity, price_per_unit)
     SELECT v.id, $2::date, 0, v.default_price
     FROM vices v
     WHERE v.user_id = $1
       AND NOT EXISTS (
         SELECT 1 FROM entries e WHERE e.vice_id = v.id AND e.date = $2::date
       )`,
    [userId, dateString]
  );
  return result.rowCount || 0;
}

async function sendReminder(user, pushReady) {
  if (!pushReady || !user.nightly_reminders_enabled) return 0;

  const subscriptions = await pool.query(
    'SELECT id, endpoint, p256dh, auth FROM notification_subscriptions WHERE user_id = $1',
    [user.id]
  );
  if (subscriptions.rows.length === 0) return 0;

  const payload = JSON.stringify({
    title: 'Track tonight',
    body: 'Quick reminder: log your vices for today. If you skip it, Vice Spending will count the missed day as 0.',
    url: '/log',
  });

  let sent = 0;
  for (const sub of subscriptions.rows) {
    try {
      await webpush.sendNotification({
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }, payload);
      sent += 1;
    } catch (err) {
      if (err.statusCode === 404 || err.statusCode === 410) {
        await pool.query('DELETE FROM notification_subscriptions WHERE id = $1', [sub.id]);
      } else {
        console.error('Push reminder failed:', err.message);
      }
    }
  }
  return sent;
}

router.all('/nightly', authCron, async (req, res, next) => {
  try {
    const pushReady = configureWebPush();
    const users = await pool.query(
      `SELECT id, timezone, nightly_reminders_enabled, last_nightly_reminder_date, last_zero_fill_date
       FROM users`
    );

    let zeroEntriesCreated = 0;
    let remindersSent = 0;
    const touchedUsers = [];

    for (const user of users.rows) {
      const timezone = user.timezone || 'UTC';
      const local = localDateParts(timezone);
      const yesterday = previousDateString(local.date);

      if (String(user.last_zero_fill_date || '').slice(0, 10) !== yesterday) {
        zeroEntriesCreated += await zeroFillUserDay(user.id, yesterday);
        await pool.query('UPDATE users SET last_zero_fill_date = $1 WHERE id = $2', [yesterday, user.id]);
      }

      if (
        user.nightly_reminders_enabled &&
        local.hour === REMINDER_HOUR &&
        String(user.last_nightly_reminder_date || '').slice(0, 10) !== local.date
      ) {
        remindersSent += await sendReminder(user, pushReady);
        await pool.query('UPDATE users SET last_nightly_reminder_date = $1 WHERE id = $2', [local.date, user.id]);
      }

      touchedUsers.push(user.id);
    }

    res.json({
      ok: true,
      users_checked: touchedUsers.length,
      zero_entries_created: zeroEntriesCreated,
      reminders_sent: remindersSent,
      push_ready: pushReady,
      reminder_hour: REMINDER_HOUR,
    });
  } catch (err) { next(err); }
});

module.exports = router;
