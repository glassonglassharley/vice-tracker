require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const express = require('express');
const cors = require('cors');
const { clerkMiddleware, requireAuth } = require('@clerk/express');
const { ensureUser } = require('./middleware/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use(clerkMiddleware());
app.use('/api', requireAuth(), ensureUser);

app.use('/api/users',   require('./routes/users'));
app.use('/api/vices',   require('./routes/vices'));
app.use('/api/entries', require('./routes/entries'));
app.use('/api/stats',   require('./routes/stats'));
app.use('/api/savings', require('./routes/savings'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

module.exports = app;
