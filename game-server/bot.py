ADMIN_CHAT_ID = '6151360205'
import json
import os
import telebot
import requests
from telebot.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

BOT_TOKEN = '8990993364:AAHs1Lv5iPGWJrp8IbVtVvjpsnwhgphR-14'
API_URL = 'http://127.0.0.1:3001/api'
WEBAPP_URL = 'https://clanking-slang-undamaged.ngrok-free.dev/play'

bot = telebot.TeleBot(BOT_TOKEN)



CHANNEL_USERNAME = "@Gift_hub01"
CHANNEL_LINK = "https://t.me/Gift_hub01"

def is_user_joined(user_id):
    try:
        member = bot.get_chat_member(CHANNEL_USERNAME, user_id)
        return member.status in ['member', 'administrator', 'creator', 'restricted']
    except Exception as e:
        print('join check error:', e)
        return False

def send_force_join(chat_id):
    keyboard = InlineKeyboardMarkup([
        [InlineKeyboardButton("📢 Join Channel", url=CHANNEL_LINK)],
        [InlineKeyboardButton("✅ Check Again", callback_data="check_join")]
    ])
    bot.send_message(
        chat_id,
        "🔒 *Join our channel first!*\n\n"
        "To use Game Rush bot, you must join our channel first.\n\n"
        "👇 Join now and press 'Check Again'",
        reply_markup=keyboard,
        parse_mode='Markdown'
    )

@bot.callback_query_handler(func=lambda call: call.data == 'check_join')
def handle_check_join(call):
    user_id = call.from_user.id
    if is_user_joined(user_id):
        bot.answer_callback_query(call.id, "✅ Welcome!")
        try:
            bot.delete_message(call.message.chat.id, call.message.message_id)
        except: pass
        send_welcome_message(call.message.chat.id, call.from_user.id, call.from_user.first_name or 'User', call.from_user.username)
    else:
        bot.answer_callback_query(call.id, "❌ You haven't joined yet!", show_alert=True)


    pass  # welcome sent by caller
    me = bot.get_me()
    ref_link = 'https://t.me/' + me.username + '?start=ref_' + str(user_id)
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton('🎮 Play', web_app=WebAppInfo(url=WEBAPP_URL)))
    markup.add(InlineKeyboardButton('📤 Share with friends', url='https://t.me/share/url?url=' + ref_link))
    bot.send_message(
        chat_id,
        '🎁 Welcome to Game Rush!\n\n' +
        'Tap Play to start 👇\n\n' +
        '🔗 Your referral link:\n' + ref_link + '\n\n' +
        '💵 Get 0.04 TON for each friend!',
        reply_markup=markup
    )

@bot.message_handler(commands=['start'])
def handle_start(message):
    user_id = str(message.from_user.id)
    if not is_user_joined(message.from_user.id):
        send_force_join(message.chat.id)
        return

    name = message.from_user.first_name or 'User'
    username = message.from_user.username
    
    parts = message.text.split()
    if len(parts) > 1 and parts[1].startswith('ref_'):
        referrer_id = parts[1].replace('ref_', '')
        if referrer_id != user_id:
            try:
                res = requests.post(
                    API_URL + '/referral',
                    json={
                        'referrerId': referrer_id,
                        'newUserId': user_id,
                        'newUserName': name
                    },
                    timeout=5
                )
                data = res.json()
                if data.get('ok'):
                    try:
                        mention = '@' + username if username else name
                        bot.send_message(
                            int(referrer_id),
                            '000 (' + mention + ') joined!\n' +
                            '💵 Total referrals: ' + str(data.get('count', 1))
                        )
                    except Exception as e:
                        print('Notify error:', e)
            except Exception as e:
                print('API error:', e)
    
    me = bot.get_me()
    ref_link = 'https://t.me/' + me.username + '?start=ref_' + user_id
    
    markup = InlineKeyboardMarkup()
    markup.add(InlineKeyboardButton('▶️ Play', web_app=WebAppInfo(url=WEBAPP_URL)))
    markup.add(InlineKeyboardButton('📤 Share with friends', url='https://t.me/share/url?url=' + ref_link))
    
    bot.send_message(
        message.chat.id,
        '🎁 Welcome to Game Rush!\n\n' +
        'Tap Play to start 👇\n\n' +
        '🔗 Your referral link:\n' + ref_link + '\n\n' +
        '💵 Get 0.04 TON for each friend!',
        reply_markup=markup
    )

print('Bot started...')
	

# ===== پنل ادمین =====
@bot.message_handler(commands=['admin'])
def admin_panel_handler(message):
    user_id = str(message.from_user.id)
    if user_id != ADMIN_CHAT_ID:
        bot.reply_to(message, '❌ شما دسترسی ادمین ندارید')
        return
    markup = InlineKeyboardMarkup()
    admin_url = 'https://clanking-slang-undamaged.ngrok-free.dev/admin?password=parham1234'
    markup.add(InlineKeyboardButton('👑 باز کردن پنل ادمین', web_app=WebAppInfo(url=admin_url)))
    bot.send_message(message.chat.id, '🎮 *پنل مدیریت*\n\nبرای دیدن کاربران و تغییر موجودی، دکمه زیر رو بزن:', reply_markup=markup, parse_mode='Markdown')


# ==================== WITHDRAW CALLBACKS ====================
@bot.callback_query_handler(func=lambda call: call.data.startswith('wd_'))
def handle_withdraw_callback(call):
    data = call.data
    admin_id = str(call.from_user.id)
    if admin_id != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "❌ Access denied")
        return
    try:
        action, req_id = data.rsplit('_', 1)[0].split('_')[1], data.rsplit('_', 1)[1]
    except:
        bot.answer_callback_query(call.id, "❌ Invalid")
        return

    # Load requests
    reqs_file = '/game-server/withdraw_requests.json'
    reqs = {}
    try:
        if os.path.exists(reqs_file):
            with open(reqs_file, 'r') as f: reqs = json.load(f)
    except: pass

    import os as _os
    _exists = _os.path.exists(reqs_file)
    _size = _os.path.getsize(reqs_file) if _exists else 0
    _cwd = _os.getcwd()
    _raw = ''
    try:
        with open(reqs_file, 'r') as _fh: _raw = _fh.read()
    except Exception as _e:
        _raw = 'ERROR: ' + str(_e)
    print(f'DBG cwd={_cwd} exists={_exists} size={_size} rawlen={len(_raw)} rawhead={_raw[:50]}')
    print(f'DBG req_id=[{req_id}] keys={list(reqs.keys())} has={req_id in reqs}')
    print(f'DEBUG: req_id=[{req_id}] total_keys={list(reqs.keys())[:5]} has_key={req_id in reqs}')
    req = reqs.get(req_id)
    if not req:
        bot.answer_callback_query(call.id, "❌ Request not found")
        return

    if action == 'confirm':
        reqs[req_id]['status'] = 'confirmed'
        with open(reqs_file, 'w') as f: json.dump(reqs, f, indent=2)
        bot.answer_callback_query(call.id, "✅ Confirmed")
        # Edit message: remove buttons, show confirmed
        try:
            bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            bot.send_message(call.message.chat.id,
                "✅ *CONFIRMED - Now send it:*\n\n" +
                "🎀 Gift: " + req.get('giftName','?') + "\n" +
                "📛 To: @" + req.get('username','?').replace('@','') + "\n" +
                "💡 Buy from Fragment and send to @" + req.get('username','?').replace('@',''),
                parse_mode='Markdown')
        except: pass
        # Notify user
        try:
            bot.send_message(int(req['userId']),
                "✅ Your withdraw request is confirmed!\n\n🎀 " + req.get('giftName','?') + "\n\n⏳ It will be sent soon..........")
        except: pass

    elif action == 'cancel':
        reqs[req_id]['status'] = 'cancelled'
        with open(reqs_file, 'w') as f: json.dump(reqs, f, indent=2)
        bot.answer_callback_query(call.id, "❌ Cancelled")
        try:
            bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            bot.send_message(call.message.chat.id, "❌ *CANCELLED* - Gift was removed from user, not returned.", parse_mode='Markdown')
        except: pass
        try:
            bot.send_message(int(req['userId']),
                "❌ Your withdraw request was cancelled.\n\n🎀 " + req.get('giftName','?') + "\n(Gift removed from your backpack)")
        except: pass

    elif action == 'return':
        reqs[req_id]['status'] = 'returned'
        with open(reqs_file, 'w') as f: json.dump(reqs, f, indent=2)
        bot.answer_callback_query(call.id, "↩️ Returned")
        try:
            bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
            bot.send_message(call.message.chat.id, "↩️ *RETURNED* - Gift was returned to user.", parse_mode='Markdown')
        except: pass
        try:
            bot.send_message(int(req['userId']),
                "↩️ Your withdraw request was cancelled and the gift was returned to your backpack.\n\n🎀 " + req.get('giftName','?'))
        except: pass


bot.polling(none_stop=True)
