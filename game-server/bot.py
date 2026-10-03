ADMIN_CHAT_ID = '6151360205'
import json
import os
import telebot
import requests
from telebot.types import WebAppInfo, InlineKeyboardMarkup, InlineKeyboardButton

BOT_TOKEN = '8990993364:AAGhwgjXSDUwnLS_9HFK7cJWVHiAYZ3nv14'
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




# ==================== NFT GIFT DEPOSIT ====================



# ==================== NFT GIFT DEPOSIT (with admin confirm) ====================
GIFT_PENDING = {}

@bot.message_handler(content_types=['unique_gift'])
def handle_nft_gift(message):
    user_id = str(message.from_user.id)
    name = message.from_user.first_name or 'User'
    username = message.from_user.username or ''
    try:
        gift = message.unique_gift
        gift_id = getattr(gift, 'gift_id', '') or getattr(gift, 'gift_id', 0)
        gift_name = getattr(gift, 'gift_name', '') or 'Unknown Gift'
        # First try to guess value from server
        res = requests.post(API_URL + '/gift-value', json={'giftName': gift_name}, timeout=10)
        try:
            guess_value = res.json().get('value', 5)
        except:
            guess_value = 5

        req_id = 'GFT' + str(int(__import__('time').time() * 1000))
        GIFT_PENDING[req_id] = {
            'userId': user_id, 'userName': name, 'username': username,
            'giftId': gift_id, 'giftName': gift_name, 'value': guess_value
        }

        # Notify admin with buttons
        keyboard = InlineKeyboardMarkup()
        keyboard.add(InlineKeyboardButton('✅ Confirm', callback_data='gift_ok_' + req_id))
        keyboard.row(
            InlineKeyboardButton('➖ -10%', callback_data='gift_m10_' + req_id),
            InlineKeyboardButton('➕ +10%', callback_data='gift_p10_' + req_id)
        )
        keyboard.add(InlineKeyboardButton('❌ Reject', callback_data='gift_no_' + req_id))

        admin_msg = (
            f"💎 *NFT Gift Deposit Request*\n\n"
            f"👤 Name: {name}\n"
            f"📛 Username: @{username if username else 'none'}\n"
            f"🆔 User ID: {user_id}\n\n"
            f"🎁 Gift: {gift_name}\n"
            f"💰 Estimated: {guess_value} TON\n"
            f"🔑 ID: {req_id}\n\n"
            f"Use buttons to adjust and confirm."
        )
        bot.send_message(int(ADMIN_CHAT_ID), admin_msg, parse_mode='Markdown', reply_markup=keyboard)
        bot.reply_to(message, "⏳ Your gift is being reviewed by admin. You'll be notified soon.")
        print(f'NFT deposit request: user={user_id} gift={gift_name} id={req_id}')
    except Exception as e:
        print('Gift handler error:', e)
        bot.reply_to(message, "❌ Error processing gift. Try again later.")


@bot.callback_query_handler(func=lambda call: call.data.startswith('gift_'))
def handle_gift_callback(call):
    admin_id = str(call.from_user.id)
    if admin_id != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "❌ Access denied")
        return
    parts = call.data.split('_', 2)
    action = parts[1]
    req_id = parts[2]
    req = GIFT_PENDING.get(req_id)
    if not req:
        bot.answer_callback_query(call.id, "❌ Request expired")
        return

    if action == 'm10':
        req['value'] = round(req['value'] * 0.9, 2)
        GIFT_PENDING[req_id] = req
        bot.answer_callback_query(call.id, f"➖ New: {req['value']} TON")
        return
    if action == 'p10':
        req['value'] = round(req['value'] * 1.1, 2)
        GIFT_PENDING[req_id] = req
        bot.answer_callback_query(call.id, f"➕ New: {req['value']} TON")
        return

    if action == 'no':
        del GIFT_PENDING[req_id]
        bot.answer_callback_query(call.id, "❌ Rejected")
        try:
            bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except: pass
        try:
            bot.send_message(int(req['userId']), "❌ Your NFT gift deposit was rejected.")
        except: pass
        return

    if action == 'ok':
        try:
            r = requests.post(API_URL + '/gift-deposit',
                json={'userId': req['userId'], 'userName': req['userName'],
                      'giftId': req['giftId'], 'giftName': req['giftName'],
                      'value': req['value']}, timeout=15)
            d = r.json()
            if d.get('ok'):
                bot.answer_callback_query(call.id, f"✅ Confirmed {req['value']} TON")
                try:
                    bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                except: pass
                bot.send_message(int(ADMIN_CHAT_ID),
                    f"✅ Confirmed for @{req['username']} — {req['value']} TON added.")
                try:
                    bot.send_message(int(req['userId']),
                        f"✅ Your NFT gift deposit confirmed!\n\n🎁 {req['giftName']}\n💰 +{req['value']} TON")
                except: pass
            else:
                bot.answer_callback_query(call.id, "❌ " + str(d.get('error', 'failed')))
        except Exception as e:
            bot.answer_callback_query(call.id, "❌ Server error")
            print('confirm error:', e)
        del GIFT_PENDING[req_id]





# ==================== NFT CALLBACK HANDLER ====================
@bot.callback_query_handler(func=lambda call: call.data.startswith('nft'))
def handle_nft_callback(call):
    print(f'DEBUG NFT CALLBACK: data={call.data} from={call.from_user.id}')
    admin_id = str(call.from_user.id)
    if admin_id != ADMIN_CHAT_ID:
        bot.answer_callback_query(call.id, "Access denied")
        return

    data = call.data
    if data.startswith('nftok_'):
        action, req_id = 'ok', data[6:]
    elif data.startswith('nftno_'):
        action, req_id = 'no', data[6:]
    elif data.startswith('nftm10_'):
        action, req_id = 'm10', data[7:]
    elif data.startswith('nftp10_'):
        action, req_id = 'p10', data[7:]
    elif data.startswith('nftset_'):
        action, req_id = 'set', data[7:]
    else:
        bot.answer_callback_query(call.id, "Invalid")
        return

    pf = '/game-server/nft_pending.json'
    pend = {}
    try:
        if os.path.exists(pf):
            with open(pf, 'r') as f: pend = json.load(f)
    except: pass

    p = pend.get(req_id)
    if not p:
        bot.answer_callback_query(call.id, "Not found")
        return

    if action == 'm10':
        p['value'] = round(p['value'] * 0.9, 2)
        pend[req_id] = p
        with open(pf, 'w') as f: json.dump(pend, f, indent=2)
        bot.answer_callback_query(call.id, f"New: {p['value']} TON")
        try:
            new_text = call.message.text.replace("Estimated: " + str(p['value']/0.9) + " TON", "Estimated: " + str(p['value']) + " TON")
        except: pass
        return

    if action == 'p10':
        p['value'] = round(p['value'] * 1.1, 2)
        pend[req_id] = p
        with open(pf, 'w') as f: json.dump(pend, f, indent=2)
        bot.answer_callback_query(call.id, f"New: {p['value']} TON")
        return

    if action == 'set':
        # Ask admin to type the value
        msg = bot.send_message(call.message.chat.id,
            f"✏️ Send the new value for {p.get('giftName','?')} (in TON):\n\nReply to this message with a number (e.g. 10.5)")
        bot.register_next_step_handler(msg, process_nft_set_value, req_id)
        bot.answer_callback_query(call.id, "Type the value")
        return

    if action == 'no':
        try:
            requests.post(API_URL + '/nft-reject', json={'reqId': req_id}, timeout=10)
        except: pass
        bot.answer_callback_query(call.id, "Rejected")
        try: bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
        except: pass
        try: bot.send_message(int(p['userId']), "Your NFT deposit was rejected.")
        except: pass
        return

    if action == 'ok':
        try:
            r = requests.post(API_URL + '/nft-confirm', json={'reqId': req_id}, timeout=15)
            d = r.json()
            if d.get('ok'):
                bot.answer_callback_query(call.id, f"Added {d['added']} TON")
                try: bot.edit_message_reply_markup(call.message.chat.id, call.message.message_id, reply_markup=None)
                except: pass
                try:
                    bot.send_message(int(p['userId']),
                        f"✅ Your NFT deposit confirmed!\n\n🎁 {p['giftName']}\n💰 +{p['value']} TON added to your balance.")
                except: pass
            else:
                bot.answer_callback_query(call.id, "Failed")
        except Exception as e:
            bot.answer_callback_query(call.id, "Server error")
            print('nft confirm err:', e)


def process_nft_set_value(message, req_id):
    try:
        val = float(message.text.strip().replace(',', '.'))
        if val <= 0 or val > 1000000:
            bot.reply_to(message, "Invalid value")
            return
        pf = '/game-server/nft_pending.json'
        pend = {}
        if os.path.exists(pf):
            with open(pf, 'r') as f: pend = json.load(f)
        if req_id in pend:
            pend[req_id]['value'] = round(val, 2)
            with open(pf, 'w') as f: json.dump(pend, f, indent=2)
            bot.reply_to(message, f"✅ New value: {round(val, 2)} TON\n\nNow press Confirm.")
    except Exception as e:
        bot.reply_to(message, "Error: " + str(e))


bot.polling(none_stop=True)
