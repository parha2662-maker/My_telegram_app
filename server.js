require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');

const PORT = 3000;
const BOT_TOKEN = '8990993364:AAHs1Lv5iPGWJrp8IbVtVvjpsnwhgphR-14';
const PROXY_URL = 'https://gamerush-proxy2.parha2662.workers.dev';
const ADMIN_ID = '6151360205';
const REFERRAL_REWARD = 0.05;
const WEBAPP_URL = 'https://parha2662-maker.github.io/My_telegram_app/';
const BOT_USERNAME = 'Gift08epqbot';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const bot = new TelegramBot(BOT_TOKEN, { polling: true, baseApiUrl: PROXY_URL });

const db = new Pool({
  user: 'admin', host: 'localhost', database: 'gamerush',
  password: 'GameRush2025!', port: 5432,
});

app.use(express.json());

async function initDB() {
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    tg_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    balance NUMERIC DEFAULT 0,
    referrer_id BIGINT,
    ref_count INT DEFAULT 0,
    ref_earned NUMERIC DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
  );`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS referrer_id BIGINT;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_count INT DEFAULT 0;`);
  await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS ref_earned NUMERIC DEFAULT 0;`);
  console.log('DB ready');
}

function isAdmin(msg) { return String(msg.from.id) === ADMIN_ID; }

bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const firstName = msg.from.first_name || '';
  const username = msg.from.username || '';
  const startParam = match[1] || '';

  try {
    const existing = await db.query('SELECT tg_id FROM users WHERE tg_id=$1', [userId]);
    const isNewUser = existing.rows.length === 0;

    await db.query(
      `INSERT INTO users (tg_id, username, first_name) VALUES ($1, $2, $3)
       ON CONFLICT (tg_id) DO UPDATE SET username=$2, first_name=$3`,
      [userId, username, firstName]
    );

    if (isNewUser && String(userId) !== ADMIN_ID) {
      try {
        const total = (await db.query('SELECT COUNT(*) c FROM users')).rows[0].c;
        await bot.sendMessage(ADMIN_ID,
          `🆕 *New User Joined!*\n\n👤 ${firstName}\n📛 @${username || 'none'}\n🆔 \`${userId}\`\n\n👥 Total users: *${total}*`,
          { parse_mode: 'Markdown' }
        );
      } catch(e) {}
    }

    if (startParam && startParam.startsWith('ref_')) {
      const referrerId = startParam.slice(4);
      if (String(referrerId) !== String(userId)) {
        const uRow = await db.query('SELECT referrer_id FROM users WHERE tg_id=$1', [userId]);
        if (!uRow.rows[0]?.referrer_id) {
          const rRow = await db.query('SELECT tg_id FROM users WHERE tg_id=$1', [referrerId]);
          if (rRow.rows.length > 0) {
            await db.query('UPDATE users SET referrer_id=$1 WHERE tg_id=$2', [referrerId, userId]);
            await db.query(
              `UPDATE users SET balance = balance + $1, ref_count = ref_count + 1, ref_earned = ref_earned + $1 WHERE tg_id = $2`,
              [REFERRAL_REWARD, referrerId]
            );
            try {
              await bot.sendMessage(referrerId,
                `🎉 *New Referral!*\n\n👤 ${firstName} (@${username || 'no-username'}) joined!\n💰 *+${REFERRAL_REWARD} TON* added to your balance`,
                { parse_mode: 'Markdown' }
              );
            } catch(e) {}
          }
        }
      }
    }

    const refLink = `https://t.me/${BOT_USERNAME}?start=ref_${userId}`;
    await bot.sendMessage(chatId,
      `🎁 *Welcome to Game Rush!*\n\nTap Play to start 👇\n\n🔗 *Your referral link:*\n\`${refLink}\`\n\n💰 Get *${REFERRAL_REWARD} TON* for each friend!`,
      {
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '▶️ Play', web_app: { url: WEBAPP_URL } }],
            [{ text: '📤 Share with friends', url: `https://t.me/share/url?url=${encodeURIComponent(refLink)}&text=${encodeURIComponent('Join Game Rush and win TON!')}` }]
          ]
        }
      }
    );
  } catch(e) { console.error('Error /start:', e.message); }
});

bot.onText(/\/admin/, async (msg) => {
  if (!isAdmin(msg)) return bot.sendMessage(msg.chat.id, '❌ You are not admin');
  try {
    const s = (await db.query(`SELECT COUNT(*) c, SUM(balance) b, SUM(ref_count) r FROM users`)).rows[0];
    const today = (await db.query(`SELECT COUNT(*) c FROM users WHERE created_at > NOW() - INTERVAL '24 hours'`)).rows[0].c;
    await bot.sendMessage(msg.chat.id,
      `👑 *ADMIN PANEL*\n\n👥 Total users: *${s.c}*\n🆕 Today: *${today}*\n💰 Total balance: *${parseFloat(s.b || 0).toFixed(2)} TON*\n🎯 Referrals: *${s.r || 0}*`,
      { parse_mode: 'Markdown',
        reply_markup: { inline_keyboard: [
          [{ text: '📋 Last 10 Users', callback_data: 'admin_users' }],
          [{ text: '🏆 Top Earners', callback_data: 'admin_top' }],
          [{ text: '🎁 Recent Referrals', callback_data: 'admin_refs' }],
          [{ text: '📊 Full Stats', callback_data: 'admin_stats' }]
        ]}
      }
    );
  } catch(e) { await bot.sendMessage(msg.chat.id, '❌ Error: ' + e.message); }
});

bot.on('callback_query', async (query) => {
  if (!isAdmin(query)) return;
  const chatId = query.message.chat.id;
  try {
    let title = '', text = '';
    if (query.data === 'admin_users') {
      title = '📋 *Last 10 Users*';
      const r = await db.query(`SELECT tg_id, first_name, username, balance, ref_count, created_at FROM users ORDER BY created_at DESC LIMIT 10`);
      text = r.rows.map((u, i) => `${i+1}. *${u.first_name}* (@${u.username || 'none'})\n   💰 ${parseFloat(u.balance).toFixed(2)} TON | 👥 ${u.ref_count || 0} refs`).join('\n\n');
    }
    if (query.data === 'admin_top') {
      title = '🏆 *Top Earners*';
      const r = await db.query(`SELECT first_name, username, balance FROM users ORDER BY balance DESC LIMIT 10`);
      text = r.rows.map((u, i) => `${i+1}. *${u.first_name}* — ${parseFloat(u.balance).toFixed(2)} TON`).join('\n');
    }
    if (query.data === 'admin_refs') {
      title = '🎁 *Recent Referrals*';
      const r = await db.query(`SELECT u.first_name un, r.first_name rn FROM users u JOIN users r ON u.referrer_id = r.tg_id ORDER BY u.created_at DESC LIMIT 10`);
      text = r.rows.length === 0 ? 'No referrals yet' : r.rows.map((u, i) => `${i+1}. *${u.rn}* invited *${u.un}*`).join('\n');
    }
    if (query.data === 'admin_stats') {
      title = '📊 *Full Statistics*';
      const total = (await db.query('SELECT COUNT(*) c FROM users')).rows[0].c;
      const today = (await db.query(`SELECT COUNT(*) c FROM users WHERE created_at > NOW() - INTERVAL '24 hours'`)).rows[0].c;
      const week = (await db.query(`SELECT COUNT(*) c FROM users WHERE created_at > NOW() - INTERVAL '7 days'`)).rows[0].c;
      const bal = (await db.query('SELECT SUM(balance) b FROM users')).rows[0].b || 0;
      const refs = (await db.query('SELECT SUM(ref_count) r FROM users')).rows[0].r || 0;
      text = `👥 Total: *${total}*\n🆕 Today: *${today}*\n📅 This week: *${week}*\n💰 Total balance: *${parseFloat(bal).toFixed(2)} TON*\n🎯 Total referrals: *${refs}*`;
    }
    await bot.sendMessage(chatId, `${title}\n\n${text}`, { parse_mode: 'Markdown' });
    await bot.answerCallbackQuery(query.id);
  } catch(e) { await bot.answerCallbackQuery(query.id, { text: 'Error' }); }
});

bot.on('message', async (msg) => {
  if (!msg.text || msg.text.startsWith('/')) return;
  await bot.sendMessage(msg.chat.id, '👇 Tap Play to open the game:', {
    reply_markup: { inline_keyboard: [[{ text: '▶️ Play Game Rush', web_app: { url: WEBAPP_URL } }]] }
  });
});

app.post('/api/auth', async (req, res) => {
  try {
    const { initData } = req.body;
    const params = new URLSearchParams(initData);
    const user = JSON.parse(params.get('user'));
    await db.query(
      `INSERT INTO users (tg_id, username, first_name) VALUES ($1, $2, $3)
       ON CONFLICT (tg_id) DO UPDATE SET username=$2, first_name=$3`,
      [user.id, user.username || '', user.first_name || '']
    );
    const r = await db.query('SELECT balance, ref_count, ref_earned FROM users WHERE tg_id=$1', [user.id]);
    res.json({ ok: true, ...r.rows[0] });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

io.on('connection', (socket) => console.log('Connected:', socket.id));

server.listen(PORT, async () => {
  await initDB();
  console.log('Server on port ' + PORT);
});
