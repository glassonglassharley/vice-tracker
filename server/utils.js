const pool = require('./db');

async function getInternalUserId(clerkUserId) {
  const r = await pool.query('SELECT id FROM users WHERE clerk_user_id = $1', [clerkUserId]);
  return r.rows[0]?.id ?? null;
}

async function verifyViceOwnership(viceId, clerkUserId) {
  const r = await pool.query(
    `SELECT v.id FROM vices v JOIN users u ON v.user_id = u.id
     WHERE v.id = $1 AND u.clerk_user_id = $2`,
    [viceId, clerkUserId]
  );
  return r.rows.length > 0;
}

async function verifyEntryOwnership(entryId, clerkUserId) {
  const r = await pool.query(
    `SELECT e.id FROM entries e
     JOIN vices v ON e.vice_id = v.id
     JOIN users u ON v.user_id = u.id
     WHERE e.id = $1 AND u.clerk_user_id = $2`,
    [entryId, clerkUserId]
  );
  return r.rows.length > 0;
}

module.exports = { getInternalUserId, verifyViceOwnership, verifyEntryOwnership };
