const express = require('express');
const https = require('https');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3001;
const DB_FILE = path.join(__dirname, 'referrals.json');
const META_FILE = path.join(__dirname, 'leaderboard_meta.json');

const ADMIN_PASSWORD = 'parham1234';
const ACTIVE_PLAYERS = {}; // ACTIVE_PLAYERS_CASHOUT
const WITHDRAW_BOT_TOKEN = '8990993364:AAGan9c_-YMhxKs-pzYn7DmVaqALGFzuif8';
const WITHDRAW_ADMIN_ID = '6151360205';
const BOT_TOKEN = '8990993364:AAGan9c_-YMhxKs-pzYn7DmVaqALGFzuif8';

async function sendTelegramMessage(chatId, text) {
    try {
        const url = 'https://api.telegram.org/bot' + BOT_TOKEN + '/sendMessage';
        const r = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: chatId, text: text, parse_mode: 'Markdown' })
        });
        const d = await r.json();
        console.log('TG result: ' + JSON.stringify(d));
    } catch(e) {
        console.log('TG error: ' + e.message);
    }
}

function loadDB() {
    if (!fs.existsSync(DB_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); } catch(e) { return {}; }
}
function saveDB(db) { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
function loadMeta() {
    let m;
    if (!fs.existsSync(META_FILE)) {
        m = { lastReset: Date.now() };
        try { fs.writeFileSync(META_FILE, JSON.stringify(m)); } catch(e) {}
        return m;
    }
    try {
        m = JSON.parse(fs.readFileSync(META_FILE, 'utf8'));
        if (!m || !m.lastReset) {
            m = { lastReset: Date.now() };
            fs.writeFileSync(META_FILE, JSON.stringify(m));
        }
        return m;
    } catch(e) {
        m = { lastReset: Date.now() };
        try { fs.writeFileSync(META_FILE, JSON.stringify(m)); } catch(e2) {}
        return m;
    }
}
function saveMeta(m) { fs.writeFileSync(META_FILE, JSON.stringify(m)); }

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', '*');
    res.header('Access-Control-Allow-Methods', '*');
    next();
});

app.post('/api/user/register', (req, res) => {
    const { userId, name, username, photo } = req.body;
    if (!userId) return res.json({ ok: false });
    const db = loadDB();
    if (!db[userId]) {
        db[userId] = { referrals: [], earned: 0, balance: 0, games: [], name: name || 'User', username: username || '' };
    } else {
        if (name) db[userId].name = name;
        if (username) db[userId].username = username;
    }
    saveDB(db);
    res.json({ ok: true });
});

app.post('/api/referral', (req, res) => {
    const { referrerId, newUserId, newUserName } = req.body;
    if (!referrerId || !newUserId) return res.json({ ok: false, error: 'missing params' });
    if (referrerId === newUserId) return res.json({ ok: false, error: 'self referral' });
    const db = loadDB();
    if (!db[referrerId]) db[referrerId] = { referrals: [], earned: 0, balance: 0, games: [], name: 'User' };
    if (!db[newUserId]) db[newUserId] = { referrals: [], earned: 0, balance: 0, games: [], name: newUserName || 'User' };
    if (db[referrerId].referrals.some(r => r.id === newUserId))
        return res.json({ ok: false, error: 'already registered' });
    db[referrerId].referrals.push({ id: newUserId, name: newUserName || 'User', date: Date.now(), reward: 0.04 });
    db[newUserId].referrer = referrerId;
    saveDB(db);
    res.json({ ok: true, earned: db[referrerId].earned, balance: db[referrerId].balance, count: (db[referrerId].referrals||[]).length });
});

app.get('/api/referrals/:userId', (req, res) => {
    const db = loadDB();
    const u = db[req.params.userId];
    res.json(u || { referrals: [], earned: 0, balance: 0, games: [] });
});

app.post('/api/user/:userId/game', (req, res) => {
    const { game, bet, result, win, multiplier } = req.body;
    const db = loadDB();
    const userId = req.params.userId;
    if (!db[userId]) db[userId] = { referrals: [], earned: 0, balance: 0, games: [], name: 'User' };
    if (!db[userId].games) db[userId].games = [];
    db[userId].games.unshift({ game, bet, result, win, multiplier, date: Date.now() });
    if (db[userId].games.length > 50) db[userId].games = db[userId].games.slice(0, 50);
    saveDB(db);
    res.json({ ok: true });
});

app.post('/api/admin/balance', async (req, res) => {
    const { password, userId, amount, action } = req.body;
    if (password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'unauthorized' });
    const db = loadDB();
    if (!db[userId]) return res.json({ ok: false, error: 'user not found' });
    const current = db[userId].balance || 0;
    let nb = current;
    let change = 0;
    if (action === 'set') { nb = parseFloat(amount); change = nb - current; }
    else if (action === 'add') { nb = current + parseFloat(amount); change = parseFloat(amount); }
    else if (action === 'subtract') { nb = current - parseFloat(amount); change = -parseFloat(amount); }
    db[userId].balance = Math.max(0, nb);
    saveDB(db);
    let msg = '';
    if (change > 0) msg = '🎁 *Balance Charged!*\n\n💰 Amount: *+' + change.toFixed(2) + ' TON*\n👑 By: Admin\n💼 New Balance: *' + db[userId].balance.toFixed(2) + ' TON*\n\n✨ Enjoy and good luck! 🚀';
    else if (change < 0) msg = '⚠️ *Balance Deducted*\n\n💸 Amount: *' + change.toFixed(2) + ' TON*\n👑 By: Admin\n💼 New Balance: *' + db[userId].balance.toFixed(2) + ' TON*';
    else msg = '💼 *Balance Updated*\n\n🎯 New Balance: *' + db[userId].balance.toFixed(2) + ' TON*\n👑 By: Admin';
    sendTelegramMessage(userId, msg);
    res.json({ ok: true, balance: db[userId].balance });
});

app.get('/admin', (req, res) => {
    res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin</title>
<style>
body{font-family:system-ui;background:#0a0d14;color:#fff;padding:16px;margin:0}
h1{font-size:18px;margin:8px 0}
.search{width:100%;padding:12px;border-radius:10px;border:1px solid #333;background:#1a1d2e;color:#fff;font-size:14px;margin:8px 0;box-sizing:border-box}
.total{background:#232735;padding:12px;border-radius:10px;margin-bottom:12px;font-weight:800}
.user{background:#161926;border:1px solid #232735;border-radius:12px;padding:12px;margin:8px 0}
.row{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px}
.name{font-weight:800;font-size:15px}
.id{font-size:11px;color:#7a8299;margin-top:2px}
.bal{color:#2ff068;font-weight:900;font-size:18px}
.actions{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap}
input[type=number]{padding:8px;border-radius:6px;border:1px solid #333;background:#0a0d14;color:#fff;width:80px;font-family:inherit}
button{padding:8px 12px;border-radius:6px;border:none;cursor:pointer;font-weight:700;font-size:12px;font-family:inherit}
.add{background:#2ff068;color:#0a0d14}
.sub{background:#ff4444;color:#fff}
.set{background:#0098ea;color:#fff}
.games{font-size:11px;color:#8a90a6;margin-top:8px;max-height:150px;overflow-y:auto}
.games div{padding:4px 0;border-bottom:1px solid #232735}
</style></head><body>
<h1>🎮 Admin Panel</h1>
<div class="total" id="total">👥 Total Users: 0</div>
<input type="text" class="search" id="search" placeholder="🔍 Search by name or ID..." oninput="render()">
<div id="users"></div>
<script>
let ALL_USERS = {};
function load(){
  fetch('/api/admin/users?password=parham1234',{headers:{'ngrok-skip-browser-warning':'true'}})
    .then(r=>r.json()).then(d=>{ALL_USERS=d.users||{};render();});
}
function render(){
  const q=document.getElementById('search').value.toLowerCase().trim();
  const c=document.getElementById('users');
  c.innerHTML='';
  const keys=Object.keys(ALL_USERS).filter(id=>{
    if(!q) return true;
    const u=ALL_USERS[id];
    return id.toLowerCase().includes(q) || (u.name||'').toLowerCase().includes(q) || (u.username||'').toLowerCase().includes(q);
  });
  document.getElementById('total').textContent='👥 Total Users: '+Object.keys(ALL_USERS).length+' (showing: '+keys.length+')';
  if(keys.length===0){c.innerHTML='<p style="color:#7a8299">No users found</p>';return;}
  keys.sort((a,b)=>(ALL_USERS[b].balance||0)-(ALL_USERS[a].balance||0));
  keys.forEach(id=>{
    const u=ALL_USERS[id];
    const refs=(u.referrals||[]).length;
    const games=(u.games||[]);
    let gh='';
    if(games.length>0){
      gh='<div class="games"><b>Last 5 games:</b>'+games.slice(0,5).map(g=>'<div>'+g.game+' · bet '+g.bet+' · '+g.result+' '+(g.win>0?'+'+g.win:'')+' · x'+(g.multiplier||1)+' · '+new Date(g.date).toLocaleString()+'</div>').join('')+'</div>';
    }
    const el=document.createElement('div');
    el.className='user';
    el.innerHTML='<div class="row"><div><div class="name">'+(u.name||'User')+'</div><div class="id">ID: '+id+' · Referrals: '+refs+' · RefBy: '+(u.referrer||'—')+'</div></div><div class="bal">'+(u.balance||0).toFixed(2)+' TON</div></div>'+
      '<div class="actions"><input type="number" id="amt_'+id+'" value="10" step="0.1">'+
      '<button class="add" onclick="mod(\''+id+'\',\'add\')">+ Add</button>'+
      '<button class="sub" onclick="mod(\''+id+'\',\'subtract\')">− Sub</button>'+
      '<button class="set" onclick="mod(\''+id+'\',\'set\')">Set</button></div>'+gh;
    c.appendChild(el);
  });
}
function mod(userId,action){
  const amt=document.getElementById('amt_'+userId).value;
  fetch('/api/admin/balance',{method:'POST',headers:{'Content-Type':'application/json','ngrok-skip-browser-warning':'true'},body:JSON.stringify({password:'parham1234',userId,amount:amt,action})})
    .then(r=>r.json()).then(d=>{if(d.ok){load();}else alert('Error: '+d.error);});
}
load();
</script></body></html>`);
});

app.get('/api/admin/users', (req, res) => {
    if (req.query.password !== ADMIN_PASSWORD) return res.status(401).json({ error: 'unauthorized' });
    res.json({ users: loadDB() });
});


const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

async function distributeRewards() {
    const db = loadDB();
    const meta = loadMeta();
    const now = Date.now();
    if (now - meta.lastReset < WEEK_MS) return;
    const users = Object.entries(db);
        users.sort((a,b) => (b[1].score || 0) - (a[1].score || 0));
        const filteredUsers = users.filter(([uid,u]) => (u.score || 0) > 0);
    const wc = meta.winnersCount || 10;
        const prize = meta.prize || 1;
        const winners = users.slice(0, wc).filter(w => (w[1].score || 0) > 0);
    for (const [uid, u] of winners) {
        u.balance = (u.balance || 0) + prize;
        await sendTelegramMessage(uid, '🏆 *Leaderboard Reward!*\n\n🎉 You finished Top 10!\n💰 *+1.00 TON* added to your balance!\n\n🚀 Keep playing to stay on top!');
    }
    users.forEach(([uid, u]) => { u.score = 0; });
    meta.lastReset = now;
    saveDB(db);
    saveMeta(meta);
    console.log('Leaderboard reset. Winners: ' + winners.length);
}

app.get('/api/leaderboard', async (req, res) => {
    await distributeRewards();
    const db = loadDB();
    const meta = loadMeta();
    const users = Object.entries(db);
    users.sort((a,b) => {
        const sA = ((a[1].score || 0) * 1) + ((a[1].wagered || 0) * 1) + ((a[1].deposited || 0) * 5);
        const sB = ((b[1].score || 0) * 1) + ((b[1].wagered || 0) * 1) + ((b[1].deposited || 0) * 5);
        return sB - sA;
    });
    const top = users.map(([uid, u]) => ({
            uid, u,
            fs: ((u.score || 0) * 1) + ((u.wagered || 0) * 1) + ((u.deposited || 0) * 5)
        })).filter(x => x.fs > 0).sort((a,b) => b.fs - a.fs).slice(0, 10).map((x, i) => ({
            rank: i+1,
            id: x.uid,
            name: x.u.name || 'User',
            photo: x.u.photo || '',
            score: +x.fs.toFixed(2)
        }));
    res.json({ top, timeLeft: Math.max(0, WEEK_MS - (Date.now() - meta.lastReset)), prize: meta.prize || 1, winnersCount: meta.winnersCount || 10 });
});


app.post('/api/user/:userId/deposit', (req, res) => {
    try {
        const amount = parseFloat(req.body.amount) || 0;
        if (amount <= 0) return res.json({ ok: false });
        const db = loadDB();
        const userId = req.params.userId;
        if (!db[userId]) db[userId] = { referrals: [], earned: 0, balance: 0, games: [], name: 'User', score: 0 };
        db[userId].deposited = (db[userId].deposited || 0) + amount;
        saveDB(db);
        res.json({ ok: true, deposited: db[userId].deposited });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/user/:userId/bet', (req, res) => {
    try {
        const amount = parseFloat(req.body.amount) || 0;
        if (amount <= 0) return res.json({ ok: false });
        const db = loadDB();
        const userId = req.params.userId;
        if (!db[userId]) db[userId] = { referrals: [], earned: 0, balance: 0, games: [], name: 'User', score: 0 };
        db[userId].wagered = (db[userId].wagered || 0) + amount;
        saveDB(db);
        res.json({ ok: true, wagered: db[userId].wagered });
    } catch(e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.post('/api/user/:userId/win', (req, res) => {
    const { amount } = req.body;
    const db = loadDB();
    const userId = req.params.userId;
    if (!db[userId]) db[userId] = { referrals: [], earned: 0, balance: 0, games: [], name: 'User', score: 0 };
    db[userId].score = (db[userId].score || 0) + (parseFloat(amount) || 0);
    saveDB(db);
    res.json({ ok: true, score: db[userId].score });
});

setInterval(distributeRewards, 3600000);


app.get('/api/user/:id/balance', (req, res) => {
    const db = loadDB();
    const u = db[req.params.id];
    res.json({ balance: u ? (u.balance || 0) : 0 });
});

app.post('/api/user/:id/balance', (req, res) => {
    const db = loadDB();
    const userId = req.params.id;
    const newBal = parseFloat(req.body.balance) || 0;
    if (!db[userId]) db[userId] = { referrals: [], earned: 0, balance: 0, games: [], name: 'User' };
    db[userId].balance = newBal;
    saveDB(db);
    res.json({ ok: true, balance: newBal });
});


app.post('/api/withdraw', (req, res) => {
    try {
        const { userId, userName, wallet, amount, giftName, type } = req.body;
        if (!userId || !amount) return res.json({ ok: false, error: 'missing fields' });
        const username = req.body.username || '';
        const profile = username ? ('https://t.me/' + username.replace('@','')) : '';
        const reqId = req.body.reqId || ('WD' + Date.now());
        const now = new Date();
        const dateStr = now.toLocaleString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
        let text = '🎁 GIFT WITHDRAW REQUEST\n';
        text += '━━━━━━━━━━━━━━━━━━\n';
        text += '👤 Name: ' + (userName || 'User') + '\n';
        if (username) {
            text += '📛 Username: ' + username + '\n';
        }
        text += '🆔 User ID: ' + userId + '\n';
        if (profile) {
            text += '🔗 Profile: ' + profile + '\n';
        }
        text += '\n';
        text += '🎀 Gift: ' + (giftName || '-') + '\n';
        text += '💰 Value: ' + amount + ' TON\n';
        text += '🔑 Request ID: ' + reqId + '\n';
        text += '📅 Date: ' + dateStr + '\n';
        text += '\n';
        text += '━━━━━━━━━━━━━━━━━━\n';
        text += '✅ Please send this gift to the user.';
        try {
            const rf = '/game-server/withdraw_requests.json';
            let reqs = {};
            if (fs.existsSync(rf)) reqs = JSON.parse(fs.readFileSync(rf, 'utf8'));
            reqs[reqId] = { reqId, userId, userName: userName||'User', username: username||'', wallet: wallet||'', amount, giftName: giftName||'', gift: req.body.gift||null, type: type||'gift', status: 'pending', createdAt: Date.now() };
            fs.writeFileSync(rf, JSON.stringify(reqs, null, 2));
        } catch(e) { console.log('save err:', e); }
        const keyboard = { inline_keyboard: [
            [{ text: '✅ Confirm', callback_data: 'wd_confirm_' + reqId }],
            [{ text: '❌ Cancel', callback_data: 'wd_cancel_' + reqId }, { text: '↩️ Return Gift', callback_data: 'wd_return_' + reqId }]
        ]};
        const postData = JSON.stringify({ chat_id: WITHDRAW_ADMIN_ID, text, reply_markup: keyboard });
        const opts = { hostname: 'api.telegram.org', path: '/bot' + WITHDRAW_BOT_TOKEN + '/sendMessage', method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData) } };
        const tgReq = https.request(opts, (tgRes) => {
            let data = '';
            tgRes.on('data', d => data += d);
            tgRes.on('end', () => { try { const j = JSON.parse(data); res.json({ ok: j.ok === true }); } catch(e) { res.json({ ok: false }); } });
        });
        tgReq.on('error', () => res.json({ ok: false }));
        tgReq.write(postData);
        tgReq.end();
    } catch (e) { res.json({ ok: false }); }
});


app.post('/api/crash/join', (req, res) => {
    const { userId, name, bet, auto } = req.body;
    if (!userId) return res.json({ ok: false });
    ACTIVE_PLAYERS[userId] = { id: userId, name: name || 'Player', bet: parseFloat(bet) || 0, auto: parseFloat(auto) || 0, ts: Date.now() };
    res.json({ ok: true });
});

app.post('/api/crash/cashout', (req, res) => {
    const { userId, multiplier } = req.body;
    if (!userId || !ACTIVE_PLAYERS[userId]) return res.json({ ok: false });
    ACTIVE_PLAYERS[userId].cashed = true;
    ACTIVE_PLAYERS[userId].cashoutMult = parseFloat(multiplier) || 0;
    ACTIVE_PLAYERS[userId].ts = Date.now();
    res.json({ ok: true });
});

app.post('/api/crash/leave', (req, res) => {
    const { userId } = req.body;
    if (userId) delete ACTIVE_PLAYERS[userId];
    res.json({ ok: true });
});
app.get('/api/crash/players', (req, res) => {
    const now = Date.now();
    const list = [];
    for (const id in ACTIVE_PLAYERS) {
        const p = ACTIVE_PLAYERS[id];
        if (now - p.ts < 8000) list.push({ id: p.id, name: p.name, bet: p.bet, auto: p.auto, cashed: p.cashed || false, cashoutMult: p.cashoutMult || 0, lost: p.lost || false });
        else delete ACTIVE_PLAYERS[id];
    }
    res.json({ players: list });
});
// === CRASH GAME LOOP ===
const CRASH_SPEED = 1.00007;
const CRASH_WAIT = 5;
const CRASH_DELAY = 1500;
let crashState = { phase: 'waiting', countdown: CRASH_WAIT, multiplier: 1.00, crashPoint: 0, lastCrash: 0, roundId: 0, phaseStartedAt: Date.now() };
let crashHistory = [];
function crashGen() {
  const r = Math.random() * 100;
  if (r < 2) return Math.round((8 + Math.random()*22) * 100) / 100;
  if (r < 8) return Math.round((4 + Math.random()*3.99) * 100) / 100;
  if (r < 28) return Math.round((1.7 + Math.random()*2.29) * 100) / 100;
  if (r < 80) return Math.round((1.15 + Math.random()*0.64) * 100) / 100;
  return Math.round((1.01 + Math.random()*0.13) * 100) / 100;
}
function crashStartWait() {
  crashState.phase = 'waiting';
  crashState.countdown = CRASH_WAIT;
  crashState.multiplier = 1.00;
  crashState.crashPoint = crashGen();
  crashState.roundId++;
  crashState.phaseStartedAt = Date.now();
  console.log('[crash] Round ' + crashState.roundId + ' waiting. Point: ' + crashState.crashPoint);
  let n = CRASH_WAIT;
  const iv = setInterval(() => {
    n--;
    crashState.countdown = n;
    if (n <= 0) { clearInterval(iv); crashStartPlay(); }
  }, 1000);
}
function crashStartPlay() {
  crashState.phase = 'playing';
  crashState.phaseStartedAt = Date.now();
  const startedAt = Date.now();
  console.log('[crash] Playing!');
  const iv = setInterval(() => {
    const el = Date.now() - startedAt;
    crashState.multiplier = Math.pow(CRASH_SPEED, el);
    if (crashState.multiplier >= crashState.crashPoint) {
      clearInterval(iv);
      crashState.multiplier = crashState.crashPoint;
      crashState.phase = 'crashed';
      crashState.lastCrash = crashState.crashPoint;
      // Mark all active players as lost
      for (const _id in ACTIVE_PLAYERS) {
        if (!ACTIVE_PLAYERS[_id].cashed) { ACTIVE_PLAYERS[_id].lost = true; }
        ACTIVE_PLAYERS[_id].ts = Date.now();
      }
      crashHistory.unshift({ m: crashState.crashPoint, id: crashState.roundId });
      if (crashHistory.length > 30) crashHistory.pop();
      console.log('[crash] Crashed at ' + crashState.crashPoint);
      setTimeout(crashStartWait, CRASH_DELAY);
    }
  }, 80);
}
crashStartWait();

app.get('/api/crash/state', (req, res) => {
  res.json({
    phase: crashState.phase,
    countdown: crashState.countdown,
    multiplier: crashState.multiplier,
    crashPoint: crashState.phase === 'crashed' ? crashState.crashPoint : 0,
    lastCrash: crashState.lastCrash,
    roundId: crashState.roundId,
    history: crashHistory,
    serverTime: Date.now(),
    phaseStartedAt: crashState.phaseStartedAt
  });
});
// === END CRASH GAME LOOP ===

// === PVP GAME LOOP ===
const PVP_WAIT = 20;
const PVP_BOTS = [
  { id: 'pvp_bot_alex', name: 'Alex', bet: 0.5 },
  { id: 'pvp_bot_sara', name: 'Sara', bet: 1.0 }
];
let pvpRoundCounter = 0;
const PVP_SPIN = 5;
const PVP_DELAY = 3;
let pvpState = { phase: 'waiting', countdown: PVP_WAIT, players: [], winnerId: null, roundId: 0, phaseStartedAt: Date.now() };
function pvpGenRoundId() { return Math.floor(10000 + Math.random() * 90000); }
function pvpStartWait() {
    pvpState.phase = 'waiting';
    pvpState.countdown = PVP_WAIT;
    pvpState.players = [];
    pvpState.winnerId = null;
    pvpState.roundId = pvpGenRoundId();
    pvpState.phaseStartedAt = Date.now();
    pvpState.timerRunning = false;
    // Add bots based on pattern (2 both, 5 single = 7-round cycle)
    pvpRoundCounter++;
    let botsToJoin = [];
    // 30% both bots, 70% single bot
    if (Math.random() < 0.3) {
        botsToJoin = [PVP_BOTS[0], PVP_BOTS[1]];
    } else {
        // Alternate between bots randomly
        const idx = Math.random() < 0.5 ? 0 : 1;
        botsToJoin = [PVP_BOTS[idx]];
    }
    botsToJoin.forEach(bot => {
        pvpState.players.push({
            id: bot.id,
            name: bot.name,
            bet: Math.round((bot.bet + Math.random() * 1.5) * 100) / 100
        });
    });
    console.log('[pvp] Round ' + pvpState.roundId + ' waiting with ' + botsToJoin.length + ' bots');
    let n = PVP_WAIT;
    const iv = setInterval(() => {
        // If 2+ players, start timer. Otherwise, keep locked.
        if (pvpState.players.length >= 2) {
            pvpState.timerRunning = true;
        }
        if (!pvpState.timerRunning) {
            pvpState.countdown = PVP_WAIT;
            return;
        }
        n--;
        pvpState.countdown = n;
        if (n <= 0) { clearInterval(iv); pvpStartSpin(); }
    }, 1000);
}
function pvpStartSpin() {
    pvpState.phase = 'spinning';
    pvpState.phaseStartedAt = Date.now();
    // Determine winner by weighted random on bet amount
    const total = pvpState.players.reduce((s,p) => s + (p.bet||0), 0);
    if (total > 0) {
        let r = Math.random() * total;
        for (const p of pvpState.players) {
            r -= (p.bet||0);
            if (r <= 0) { pvpState.winnerId = p.id; break; }
        }
    }
    console.log('[pvp] Round ' + pvpState.roundId + ' spinning. Winner: ' + pvpState.winnerId);
    setTimeout(() => pvpFinish(), PVP_SPIN * 1000);
}
function pvpFinish() {
    pvpState.phase = 'done';
    pvpState.phaseStartedAt = Date.now();
    console.log('[pvp] Round ' + pvpState.roundId + ' done');
    setTimeout(pvpStartWait, PVP_DELAY * 1000);
}
pvpStartWait();

app.post('/api/pvp/join', (req, res) => {
    const { userId, name, bet } = req.body;
    if (!userId || pvpState.phase !== 'waiting') return res.json({ ok: false, error: 'Round locked' });
    const existing = pvpState.players.find(p => p.id === String(userId));
    if (existing) {
        existing.bet += parseFloat(bet) || 0;
    } else {
        pvpState.players.push({ id: String(userId), name: name || 'Player', bet: parseFloat(bet) || 0 });
    }
    res.json({ ok: true });
});

app.get('/api/pvp/state', (req, res) => {
    res.json({
        phase: pvpState.phase,
        countdown: pvpState.countdown,
        players: pvpState.players,
        winnerId: pvpState.winnerId,
        roundId: pvpState.roundId,
        serverTime: Date.now(),
        phaseStartedAt: pvpState.phaseStartedAt,
        timerRunning: pvpState.timerRunning || false
    });
});
// === END PVP GAME LOOP ===


app.get('/api/withdraw/restore/:userId', (req, res) => {
    const rf = '/game-server/withdraw_requests.json';
    if (!fs.existsSync(rf)) return res.json({ gifts: [] });
    let reqs = {};
    try { reqs = JSON.parse(fs.readFileSync(rf, 'utf8')); } catch(e) { return res.json({ gifts: [] }); }
    const uid = String(req.params.userId);
    const gifts = [];
    for (const id in reqs) {
        const r = reqs[id];
        if (String(r.userId) === uid && r.status === 'returned' && r.gift) {
            gifts.push(r.gift);
            r.status = 'restored';
        }
    }
    try { fs.writeFileSync(rf, JSON.stringify(reqs, null, 2)); } catch(e) {}
    res.json({ gifts });
});

app.post('/api/withdraw/status', (req, res) => {
    const { reqId, status } = req.body;
    const rf = '/game-server/withdraw_requests.json';
    if (!fs.existsSync(rf)) return res.json({ ok: false });
    try {
        const reqs = JSON.parse(fs.readFileSync(rf, 'utf8'));
        if (reqs[reqId]) {
            reqs[reqId].status = status;
            fs.writeFileSync(rf, JSON.stringify(reqs, null, 2));
            return res.json({ ok: true });
        }
    } catch(e) {}
    res.json({ ok: false });
});


app.post('/api/gift-deposit', (req, res) => {
    try {
        const { userId, userName, giftId, giftName, senderUserId } = req.body;
        if (!userId || !giftName) return res.json({ ok: false, error: 'missing fields' });
        const value = (typeof req.body.value === 'number' && req.body.value > 0) ? req.body.value : getGiftValue(giftName);
        const db = loadDB();
        if (!db[userId]) db[userId] = { referrals: [], earned: 0, balance: 0, games: [], name: userName || 'User' };
        db[userId].balance = (db[userId].balance || 0) + value;
        db[userId].giftDeposits = db[userId].giftDeposits || [];
        db[userId].giftDeposits.push({ giftId, giftName, value, at: Date.now() });
        saveDB(db);
        console.log('[gift-deposit] user=' + userId + ' gift=' + giftName + ' value=' + value);
        res.json({ ok: true, value: value, balance: db[userId].balance });
    } catch (e) {
        console.log('gift-deposit error:', e);
        res.json({ ok: false, error: 'server error' });
    }
});


const GIFT_VALUE_MAP = {
    'Plush Pepe': 5300, 'Durovs Cap': 4222, 'Scared Cat': 3600,
    'Heart Locket': 1089, 'Bonded Ring': 38.67, 'Diamond Ring': 27.31,
    'Perfume Bottle': 64.21, 'Precious Peach': 238,
    'Lol Pop': 4.12, 'Spring Basket': 6.51, 'Eternal Candle': 6.64,
    'Spy Agaric': 6.55, 'Fresh Socks': 5.36, 'Santa Hat': 5.80,
    'Timeless Book': 5.20, 'Cupid Charm': 21.01
};
function getGiftValue(name) {
    if (!name) return 5;
    for (const k in GIFT_VALUE_MAP) {
        if (name.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(name.toLowerCase())) {
            return GIFT_VALUE_MAP[k];
        }
    }
    return 5;
}


app.post('/api/gift-value', (req, res) => {
    const { giftName } = req.body;
    res.json({ ok: true, value: getGiftValue(giftName) });
});



app.post('/api/nft-notify', (req, res) => {
    try {
        const { userId, userName, username, giftName } = req.body;
        if (!userId || !giftName) return res.json({ ok: false, error: 'missing fields' });
        const value = getGiftValue(giftName);
        const reqId = 'GFT' + Date.now();

        // Save pending
        const pf = '/game-server/nft_pending.json';
        let pend = {};
        if (fs.existsSync(pf)) { try { pend = JSON.parse(fs.readFileSync(pf, 'utf8')); } catch(e) {} }
        pend[reqId] = { userId, userName, username, giftName, value, status: 'pending', createdAt: Date.now() };
        fs.writeFileSync(pf, JSON.stringify(pend, null, 2));

        // Build message
        let text = '💎 *NFT GIFT DEPOSIT REQUEST*\n';
        text += '━━━━━━━━━━━━━━━━━━\n';
        text += '👤 Name: ' + (userName || 'User') + '\n';
        if (username) text += '📛 Username: @' + String(username).replace('@','') + '\n';
        text += '🆔 User ID: ' + userId + '\n\n';
        text += '🎁 Gift: ' + giftName + '\n';
        text += '💰 Estimated: ' + value + ' TON\n';
        text += '🔑 ID: ' + reqId + '\n\n';
        text += 'Use buttons below to adjust and confirm.';

        const keyboard = {
            inline_keyboard: [
                [{ text: '✅ Confirm', callback_data: 'nftok_' + reqId }],
                [
                    { text: '➖ -10%', callback_data: 'nftm10_' + reqId },
                    { text: '➕ +10%', callback_data: 'nftp10_' + reqId }
                ],
                [{ text: '✏️ Set Value', callback_data: 'nftset_' + reqId }],
                [{ text: '❌ Reject', callback_data: 'nftno_' + reqId }]
            ]
        };

        const postData = JSON.stringify({
            chat_id: WITHDRAW_ADMIN_ID, text: text, parse_mode: 'Markdown',
            reply_markup: keyboard
        });
        const opts = {
            hostname: 'api.telegram.org',
            path: '/bot' + WITHDRAW_BOT_TOKEN + '/sendMessage',
            method: 'POST',
            headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(postData)}
        };
        const tgReq = https.request(opts, (tgRes) => {
            let data = '';
            tgRes.on('data', d => data += d);
            tgRes.on('end', () => { try { const j = JSON.parse(data); res.json({ ok: j.ok === true }); } catch(e) { res.json({ ok: false }); } });
        });
        tgReq.on('error', () => res.json({ ok: false }));
        tgReq.write(postData);
        tgReq.end();
    } catch(e) { console.log('nft-notify err:', e); res.json({ ok: false }); }
});

app.post('/api/nft-confirm', (req, res) => {
    try {
        const { reqId } = req.body;
        const pf = '/game-server/nft_pending.json';
        if (!fs.existsSync(pf)) return res.json({ ok: false, error: 'no pending' });
        const pend = JSON.parse(fs.readFileSync(pf, 'utf8'));
        const p = pend[reqId];
        if (!p) return res.json({ ok: false, error: 'not found' });
        const db = loadDB();
        if (!db[p.userId]) db[p.userId] = { referrals: [], earned: 0, balance: 0, games: [], name: p.userName || 'User' };
        db[p.userId].balance = (db[p.userId].balance || 0) + p.value;
        saveDB(db);
        p.status = 'confirmed';
        fs.writeFileSync(pf, JSON.stringify(pend, null, 2));
        res.json({ ok: true, added: p.value, userId: p.userId, newBalance: db[p.userId].balance });
    } catch(e) { res.json({ ok: false, error: 'server error' }); }
});

app.post('/api/nft-reject', (req, res) => {
    try {
        const { reqId } = req.body;
        const pf = '/game-server/nft_pending.json';
        if (!fs.existsSync(pf)) return res.json({ ok: false });
        const pend = JSON.parse(fs.readFileSync(pf, 'utf8'));
        if (pend[reqId]) { pend[reqId].status = 'rejected'; fs.writeFileSync(pf, JSON.stringify(pend, null, 2)); }
        res.json({ ok: true });
    } catch(e) { res.json({ ok: false }); }
});


app.post('/api/user/:id/history', (req, res) => {
    try {
        const { type, amount, note } = req.body;
        const uid = req.params.id;
        if (!type || typeof amount === 'undefined') return res.json({ ok: false, error: 'missing fields' });
        const db = loadDB();
        if (!db[uid]) db[uid] = { referrals: [], earned: 0, balance: 0, games: [], name: 'User' };
        if (!db[uid].history) db[uid].history = [];
        db[uid].history.push({
            type: type,
            amount: parseFloat(amount) || 0,
            note: note || '',
            balance: db[uid].balance || 0,
            at: Date.now()
        });
        if (db[uid].history.length > 200) db[uid].history = db[uid].history.slice(-200);
        saveDB(db);
        res.json({ ok: true });
    } catch(e) { console.log('history err:', e); res.json({ ok: false }); }
});

app.get('/api/user/:id/history', (req, res) => {
    try {
        const db = loadDB();
        const u = db[req.params.id];
        res.json({ history: (u && u.history) ? u.history.slice(-50).reverse() : [] });
    } catch(e) { res.json({ history: [] }); }
});

app.listen(PORT, '0.0.0.0', () => { console.log('Referral API + Admin on port ' + PORT); });
