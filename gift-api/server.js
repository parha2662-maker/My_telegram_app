const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(cors());
app.use(express.json());
const PORT = 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const PRICES_FILE = path.join(__dirname, 'prices.json');
const ADMIN_PASSWORD = 'parham1234';
const REFERRAL_REWARD = 0.05;

const GIFT_PRICES = {
  'plush_pepe': { name: 'Plush Pepe', emoji: '🎁', value: 5300.0, tier: 'mythic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/plush_pepe.webp' },
  'intelligence_cup': { name: 'Intelligence Cup', emoji: '🎁', value: 1999.0, tier: 'mythic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/intelligence_cup.webp' },
  'algorithm_cup': { name: 'Algorithm Cup', emoji: '🎁', value: 1900.0, tier: 'mythic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/algorithm_cup.webp' },
  'heart_locket': { name: 'Heart Locket', emoji: '🎁', value: 1040.0, tier: 'legendary', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/heart_locket.webp' },
  'durovs_cap': { name: 'Durov’s Cap', emoji: '🎁', value: 369.99, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/durovs_cap.webp' },
  'precious_peach': { name: 'Precious Peach', emoji: '🎁', value: 234.45, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/precious_peach.webp' },
  'scared_cat': { name: 'Scared Cat', emoji: '🎁', value: 231.54, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/scared_cat.webp' },
  'heroic_helmet': { name: 'Heroic Helmet', emoji: '🎁', value: 175.4, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/heroic_helmet.webp' },
  'durovs_glasses': { name: 'Durov’s Glasses', emoji: '🎁', value: 133.34, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/durovs_glasses.webp' },
  'loot_bag': { name: 'Loot Bag', emoji: '🎁', value: 119.75, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/loot_bag.webp' },
  'mighty_arm': { name: 'Mighty Arm', emoji: '🎁', value: 116.8, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/mighty_arm.webp' },
  'astral_shard': { name: 'Astral Shard', emoji: '🎁', value: 109.99, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/astral_shard.webp' },
  'nail_bracelet': { name: 'Nail Bracelet', emoji: '🎁', value: 107.44, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/nail_bracelet.webp' },
  'westside_sign': { name: 'Westside Sign', emoji: '🎁', value: 96.62, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/westside_sign.webp' },
  'perfume_bottle': { name: 'Perfume Bottle', emoji: '🎁', value: 64.96, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/perfume_bottle.webp' },
  'ion_gem': { name: 'Ion Gem', emoji: '🎁', value: 61.25, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/ion_gem.webp' },
  'artisan_brick': { name: 'Artisan Brick', emoji: '🎁', value: 56.09, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/artisan_brick.webp' },
  'low_rider': { name: 'Low Rider', emoji: '🎁', value: 52.8, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/low_rider.webp' },
  'gem_signet': { name: 'Gem Signet', emoji: '🎁', value: 51.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/gem_signet.webp' },
  'mini_oscar': { name: 'Mini Oscar', emoji: '🎁', value: 51.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/mini_oscar.webp' },
  'swiss_watch': { name: 'Swiss Watch', emoji: '🎁', value: 50.57, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/swiss_watch.webp' },
  'magic_potion': { name: 'Magic Potion', emoji: '🎁', value: 50.04, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/magic_potion.webp' },
  'sharp_tongue': { name: 'Sharp Tongue', emoji: '🎁', value: 43.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/sharp_tongue.webp' },
  'kissed_frog': { name: 'Kissed Frog', emoji: '🎁', value: 41.66, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/kissed_frog.webp' },
  'bonded_ring': { name: 'Bonded Ring', emoji: '🎁', value: 38.31, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bonded_ring.webp' },
  'voodoo_doll': { name: 'Voodoo Doll', emoji: '🎁', value: 35.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/voodoo_doll.webp' },
  'vintage_cigar': { name: 'Vintage Cigar', emoji: '🎁', value: 34.96, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/vintage_cigar.webp' },
  'neko_helmet': { name: 'Neko Helmet', emoji: '🎁', value: 34.65, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/neko_helmet.webp' },
  'toy_bear': { name: 'Toy Bear', emoji: '🎁', value: 32.13, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/toy_bear.webp' },
  'genie_lamp': { name: 'Genie Lamp', emoji: '🎁', value: 30.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/genie_lamp.webp' },
  'signet_ring': { name: 'Signet Ring', emoji: '🎁', value: 30.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/signet_ring.webp' },
  'diamond_ring': { name: 'Diamond Ring', emoji: '🎁', value: 28.0, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/diamond_ring.webp' },
  'rare_bird': { name: 'Rare Bird', emoji: '🎁', value: 24.8, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/rare_bird.webp' },
  'bling_binky': { name: 'Bling Binky', emoji: '🎁', value: 24.03, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bling_binky.webp' },
  'electric_skull': { name: 'Electric Skull', emoji: '🎁', value: 23.28, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/electric_skull.webp' },
  'eternal_rose': { name: 'Eternal Rose', emoji: '🎁', value: 22.46, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/eternal_rose.webp' },
  'khabibs_papakha': { name: 'Khabib’s Papakha', emoji: '🎁', value: 22.43, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/khabibs_papakha.webp' },
  'cupid_charm': { name: 'Cupid Charm', emoji: '🎁', value: 19.68, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/cupid_charm.webp' },
  'sky_stilettos': { name: 'Sky Stilettos', emoji: '🎁', value: 17.03, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/sky_stilettos.webp' },
  'trapped_heart': { name: 'Trapped Heart', emoji: '🎁', value: 14.76, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/trapped_heart.webp' },
  'ufc_strike': { name: 'UFC Strike', emoji: '🎁', value: 13.99, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/ufc_strike.webp' },
  'ionic_dryer': { name: 'Ionic Dryer', emoji: '🎁', value: 13.92, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/ionic_dryer.webp' },
  'love_potion': { name: 'Love Potion', emoji: '🎁', value: 13.66, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/love_potion.webp' },
  'snoop_cigar': { name: 'Snoop Cigar', emoji: '🎁', value: 13.5, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snoop_cigar.webp' },
  'mad_pumpkin': { name: 'Mad Pumpkin', emoji: '🎁', value: 11.89, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/mad_pumpkin.webp' },
  'crystal_ball': { name: 'Crystal Ball', emoji: '🎁', value: 11.66, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/crystal_ball.webp' },
  'flying_broom': { name: 'Flying Broom', emoji: '🎁', value: 11.48, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/flying_broom.webp' },
  'record_player': { name: 'Record Player', emoji: '🎁', value: 11.21, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/record_player.webp' },
  'valentine_box': { name: 'Valentine Box', emoji: '🎁', value: 10.52, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/valentine_box.webp' },
  'skull_flower': { name: 'Skull Flower', emoji: '🎁', value: 10.25, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/skull_flower.webp' },
  'top_hat': { name: 'Top Hat', emoji: '🎁', value: 9.95, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/top_hat.webp' },
  'sakura_flower': { name: 'Sakura Flower', emoji: '🎁', value: 9.65, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/sakura_flower.webp' },
  'love_candle': { name: 'Love Candle', emoji: '🎁', value: 9.55, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/love_candle.webp' },
  'jingle_bells': { name: 'Jingle Bells', emoji: '🎁', value: 9.39, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jingle_bells.webp' },
  'hanging_star': { name: 'Hanging Star', emoji: '🎁', value: 8.9, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/hanging_star.webp' },
  'bunny_muffin': { name: 'Bunny Muffin', emoji: '🎁', value: 7.7, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bunny_muffin.webp' },
  'berry_box': { name: 'Berry Box', emoji: '🎁', value: 7.64, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/berry_box.webp' },
  'jelly_bunny': { name: 'Jelly Bunny', emoji: '🎁', value: 7.14, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jelly_bunny.webp' },
  'sleigh_bell': { name: 'Sleigh Bell', emoji: '🎁', value: 6.79, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/sleigh_bell.webp' },
  'evil_eye': { name: 'Evil Eye', emoji: '🎁', value: 6.73, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/evil_eye.webp' },
  'surge_board': { name: 'Surge Board', emoji: '🎁', value: 6.57, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/surge_board.webp' },
  'joyful_bundle': { name: 'Joyful Bundle', emoji: '🎁', value: 6.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/joyful_bundle.webp' },
  'jolly_chimp': { name: 'Jolly Chimp', emoji: '🎁', value: 6.4, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jolly_chimp.webp' },
  'light_sword': { name: 'Light Sword', emoji: '🎁', value: 6.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/light_sword.webp' },
  'input_key': { name: 'Input Key', emoji: '🎁', value: 5.89, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/input_key.webp' },
  'moon_pendant': { name: 'Moon Pendant', emoji: '🎁', value: 5.7, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/moon_pendant.webp' },
  'lush_bouquet': { name: 'Lush Bouquet', emoji: '🎁', value: 5.69, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lush_bouquet.webp' },
  'witch_hat': { name: 'Witch Hat', emoji: '🎁', value: 5.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/witch_hat.webp' },
  'spring_basket': { name: 'Spring Basket', emoji: '🎁', value: 5.48, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/spring_basket.webp' },
  'eternal_candle': { name: 'Eternal Candle', emoji: '🎁', value: 5.4, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/eternal_candle.webp' },
  'spy_agaric': { name: 'Spy Agaric', emoji: '🎁', value: 5.26, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/spy_agaric.webp' },
  'faith_amulet': { name: 'Faith Amulet', emoji: '🎁', value: 5.23, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/faith_amulet.webp' },
  'swag_bag': { name: 'Swag Bag', emoji: '🎁', value: 5.15, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/swag_bag.webp' },
  'restless_jar': { name: 'Restless Jar', emoji: '🎁', value: 5.1, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/restless_jar.webp' },
  'stellar_rocket': { name: 'Stellar Rocket', emoji: '🎁', value: 4.98, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/stellar_rocket.webp' },
  'pretty_posy': { name: 'Pretty Posy', emoji: '🎁', value: 4.88, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/pretty_posy.webp' },
  'snow_mittens': { name: 'Snow Mittens', emoji: '🎁', value: 4.85, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snow_mittens.webp' },
  'money_pot': { name: 'Money Pot', emoji: '🎁', value: 4.8, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/money_pot.webp' },
  'snoop_dogg': { name: 'Snoop Dogg', emoji: '🎁', value: 4.8, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snoop_dogg.webp' },
  'santa_hat': { name: 'Santa Hat', emoji: '🎁', value: 4.68, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/santa_hat.webp' },
  'jackinthebox': { name: 'Jack-in-the-Box', emoji: '🎁', value: 4.65, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jackinthebox.webp' },
  'bow_tie': { name: 'Bow Tie', emoji: '🎁', value: 4.63, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bow_tie.webp' },
  'bday_candle': { name: 'B-Day Candle', emoji: '🎁', value: 4.6, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bday_candle.webp' },
  'desk_calendar': { name: 'Desk Calendar', emoji: '🎁', value: 4.6, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/desk_calendar.webp' },
  'snow_globe': { name: 'Snow Globe', emoji: '🎁', value: 4.6, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snow_globe.webp' },
  'mousse_cake': { name: 'Mousse Cake', emoji: '🎁', value: 4.59, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/mousse_cake.webp' },
  'hex_pot': { name: 'Hex Pot', emoji: '🎁', value: 4.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/hex_pot.webp' },
  'homemade_cake': { name: 'Homemade Cake', emoji: '🎁', value: 4.47, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/homemade_cake.webp' },
  'liberty_figure': { name: 'Liberty Figure', emoji: '🎁', value: 4.39, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/liberty_figure.webp' },
  'fresh_socks': { name: 'Fresh Socks', emoji: '🎁', value: 4.32, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/fresh_socks.webp' },
  'cookie_heart': { name: 'Cookie Heart', emoji: '🎁', value: 4.3, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/cookie_heart.webp' },
  'star_notepad': { name: 'Star Notepad', emoji: '🎁', value: 4.3, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/star_notepad.webp' },
  'timeless_book': { name: 'Timeless Book', emoji: '🎁', value: 4.15, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/timeless_book.webp' },
  'spiced_wine': { name: 'Spiced Wine', emoji: '🎁', value: 4.06, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/spiced_wine.webp' },
  'clover_pin': { name: 'Clover Pin', emoji: '🎁', value: 4.01, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/clover_pin.webp' },
  'hypno_lollipop': { name: 'Hypno Lollipop', emoji: '🎁', value: 4.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/hypno_lollipop.webp' },
  'victory_medal': { name: 'Victory Medal', emoji: '🎁', value: 4.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/victory_medal.webp' },
  'mood_pack': { name: 'Mood Pack', emoji: '🎁', value: 4.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/mood_pack.webp' },
  'ginger_cookie': { name: 'Ginger Cookie', emoji: '🎁', value: 3.97, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/ginger_cookie.webp' },
  'happy_brownie': { name: 'Happy Brownie', emoji: '🎁', value: 3.95, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/happy_brownie.webp' },
  'party_sparkler': { name: 'Party Sparkler', emoji: '🎁', value: 3.93, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/party_sparkler.webp' },
  'easter_egg': { name: 'Easter Egg', emoji: '🎁', value: 3.87, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/easter_egg.webp' },
  'winter_wreath': { name: 'Winter Wreath', emoji: '🎁', value: 3.82, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/winter_wreath.webp' },
  'jester_hat': { name: 'Jester Hat', emoji: '🎁', value: 3.67, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jester_hat.webp' },
  'holiday_drink': { name: 'Holiday Drink', emoji: '🎁', value: 3.64, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/holiday_drink.webp' },
  'big_year': { name: 'Big Year', emoji: '🎁', value: 3.57, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/big_year.webp' },
  'lol_pop': { name: 'Lol Pop', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lol_pop.webp' },
  'pet_snake': { name: 'Pet Snake', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/pet_snake.webp' },
  'tama_gadget': { name: 'Tama Gadget', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/tama_gadget.webp' },
  'whip_cupcake': { name: 'Whip Cupcake', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/whip_cupcake.webp' },
  'lunar_snake': { name: 'Lunar Snake', emoji: '🎁', value: 3.47, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lunar_snake.webp' },
  'chill_flame': { name: 'Chill Flame', emoji: '🎁', value: 3.44, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/chill_flame.webp' },
  'snake_box': { name: 'Snake Box', emoji: '🎁', value: 3.42, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snake_box.webp' },
  'candy_cane': { name: 'Candy Cane', emoji: '🎁', value: 3.41, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/candy_cane.webp' },
  'instant_ramen': { name: 'Instant Ramen', emoji: '🎁', value: 3.39, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/instant_ramen.webp' },
  'vice_cream': { name: 'Vice Cream', emoji: '🎁', value: 3.38, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/vice_cream.webp' },
  'xmas_stocking': { name: 'Xmas Stocking', emoji: '🎁', value: 3.37, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/xmas_stocking.webp' },
  'pool_float': { name: 'Pool Float', emoji: '🎁', value: 3.37, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/pool_float.webp' },
  'ice_cream': { name: 'Ice Cream', emoji: '🎁', value: 3.35, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/ice_cream.webp' }
};

function loadFreshPrices() {
  try {
    if (fs.existsSync(PRICES_FILE)) {
      const fresh = JSON.parse(fs.readFileSync(PRICES_FILE, 'utf8'));
      for (const k in fresh) {
        if (GIFT_PRICES[k] && fresh[k].floor > 0) GIFT_PRICES[k].value = fresh[k].floor;
      }
      console.log('[prices] Loaded from prices.json');
    }
  } catch (e) {}
}
loadFreshPrices();

let data = { users: {}, referrals: {}, wins: {} };
function loadData() { try { if (fs.existsSync(DATA_FILE)) data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); } catch (e) {} }
function saveData() { try { fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); } catch (e) {} }
loadData();

app.get('/api/gifts', (req, res) => {
  const gifts = Object.keys(GIFT_PRICES).map(id => {
    const g = GIFT_PRICES[id];
    return { id, name: g.name, emoji: g.emoji, value: g.value, tier: g.tier, img: 'https://cdn.jsdelivr.net/gh/parha2662-maker/My_telegram_app@main/gifts/' + id + '-1.webp' };
  });
  res.json(gifts);
});

app.post('/api/user/register', (req, res) => {
  const { userId, name, username } = req.body;
  if (!userId) return res.status(400).json({ error: 'no userId' });
  if (!data.users[userId]) {
    data.users[userId] = { id: userId, name: name || 'User', username: username || '', balance: 0, createdAt: Date.now() };
    saveData();
  }
  res.json({ ok: true, user: data.users[userId] });
});

app.get('/api/user/:id/balance', (req, res) => {
  const u = data.users[req.params.id];
  res.json({ balance: u ? u.balance : 0 });
});

app.post('/api/user/:id/balance', (req, res) => {
  const { balance } = req.body;
  if (!data.users[req.params.id]) data.users[req.params.id] = { id: req.params.id, name: 'User', balance: 0 };
  data.users[req.params.id].balance = parseFloat(balance) || 0;
  saveData();
  res.json({ ok: true, balance: data.users[req.params.id].balance });
});

app.post('/api/user/:id/win', (req, res) => {
  const { amount } = req.body;
  if (!data.wins[req.params.id]) data.wins[req.params.id] = 0;
  data.wins[req.params.id] += parseFloat(amount) || 0;
  saveData();
  res.json({ ok: true });
});

app.get('/api/referrals/:id', (req, res) => {
  const userId = req.params.id;
  const refs = data.referrals[userId] || [];
  const u = data.users[userId];
  res.json({ referrals: refs, earned: refs.length * REFERRAL_REWARD, balance: u ? u.balance : 0 });
});

app.get('/api/leaderboard', (req, res) => {
  const users = Object.values(data.users).map(u => ({ id: u.id, name: u.name, score: data.wins[u.id] || 0 }));
  users.sort((a, b) => b.score - a.score);
  const now = new Date();
  const tomorrow = new Date(now); tomorrow.setHours(24, 0, 0, 0);
  res.json({ top: users.slice(0, 10), timeLeft: tomorrow - now });
});

app.get('/api/admin/users', (req, res) => {
  if (req.query.password !== ADMIN_PASSWORD) return res.status(403).json({ error: 'forbidden' });
  res.json({ users: data.users });
});

app.post('/api/admin/balance', (req, res) => {
  const { password, userId, amount, action } = req.body;
  if (password !== ADMIN_PASSWORD) return res.status(403).json({ error: 'forbidden' });
  if (!data.users[userId]) data.users[userId] = { id: userId, name: 'User', balance: 0 };
  const amt = parseFloat(amount) || 0;
  if (action === 'add') data.users[userId].balance += amt;
  else if (action === 'subtract') data.users[userId].balance -= amt;
  saveData();
  res.json({ ok: true, balance: data.users[userId].balance });
});

app.get('/', (req, res) => res.send('Game Rush API running'));
app.listen(PORT, '0.0.0.0', () => console.log('Server running on port ' + PORT));
