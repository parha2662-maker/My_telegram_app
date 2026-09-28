require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Pool } = require('pg');
const TelegramBot = require('node-telegram-bot-api');

const PORT = 3000;
const BOT_TOKEN = '8990993364:AAHs1Lv5iPGWJrp8IbVtVvjpsnwhgphR-14';

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const db = new Pool({
  user: 'admin',
  host: 'localhost',
  database: 'gamerush',
  password: 'GameRush2025!',
  port: 5432,
});

app.use(express.json());
app.use(express.static('public'));

async function initDB() {
  await db.query(`CREATE TABLE IF NOT EXISTS users (
    tg_id BIGINT PRIMARY KEY,
    username TEXT,
    first_name TEXT,
    balance NUMERIC DEFAULT 0
  );`);
  console.log('DB ready');
}

bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  const webAppUrl = 'https://parha2662-maker.github.io/My_telegram_app/';
  await bot.sendMessage(chatId, 'Welcome to Game Rush!', {
    reply_markup: { inline_keyboard: [[{ text: 'Play', web_app: { url: webAppUrl } }]] }
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
    res.json({ ok: true, user });
  } catch (e) { res.json({ ok: false, error: e.message }); }
});

app.get('/api/health', (req, res) => res.json({ ok: true }));

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
});

server.listen(PORT, async () => {
  await initDB();
  console.log('Server on port ' + PORT);
});
