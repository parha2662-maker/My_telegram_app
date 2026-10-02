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
const REFERRAL_REWARD = 0.04;

const GIFT_PRICES = {
  'plushpepe': { name: 'Plush Pepe', emoji: '🎁', value: 5300.0, tier: 'mythic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/plushpepe.webp' },
  'intelligencecup': { name: 'Intelligence Cup', emoji: '🎁', value: 1999.0, tier: 'mythic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/intelligencecup.webp' },
  'algorithmcup': { name: 'Algorithm Cup', emoji: '🎁', value: 1900.0, tier: 'mythic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/algorithmcup.webp' },
  'heartlocket': { name: 'Heart Locket', emoji: '🎁', value: 1040.0, tier: 'legendary', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/heartlocket.webp' },
  'durovscap': { name: 'Durov’s Cap', emoji: '🎁', value: 369.99, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/durovscap.webp' },
  'preciouspeach': { name: 'Precious Peach', emoji: '🎁', value: 234.45, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/preciouspeach.webp' },
  'scaredcat': { name: 'Scared Cat', emoji: '🎁', value: 231.54, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/scaredcat.webp' },
  'heroichelmet': { name: 'Heroic Helmet', emoji: '🎁', value: 175.4, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/heroichelmet.webp' },
  'durovsglasses': { name: 'Durov’s Glasses', emoji: '🎁', value: 133.34, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/durovsglasses.webp' },
  'lootbag': { name: 'Loot Bag', emoji: '🎁', value: 119.75, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lootbag.webp' },
  'mightyarm': { name: 'Mighty Arm', emoji: '🎁', value: 116.8, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/mightyarm.webp' },
  'astralshard': { name: 'Astral Shard', emoji: '🎁', value: 109.99, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/astralshard.webp' },
  'nailbracelet': { name: 'Nail Bracelet', emoji: '🎁', value: 107.44, tier: 'epic', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/nailbracelet.webp' },
  'westsidesign': { name: 'Westside Sign', emoji: '🎁', value: 96.62, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/westsidesign.webp' },
  'perfumebottle': { name: 'Perfume Bottle', emoji: '🎁', value: 64.96, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/perfumebottle.webp' },
  'iongem': { name: 'Ion Gem', emoji: '🎁', value: 61.25, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/iongem.webp' },
  'artisanbrick': { name: 'Artisan Brick', emoji: '🎁', value: 56.09, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/artisanbrick.webp' },
  'lowrider': { name: 'Low Rider', emoji: '🎁', value: 52.8, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lowrider.webp' },
  'gemsignet': { name: 'Gem Signet', emoji: '🎁', value: 51.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/gemsignet.webp' },
  'minioscar': { name: 'Mini Oscar', emoji: '🎁', value: 51.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/minioscar.webp' },
  'swisswatch': { name: 'Swiss Watch', emoji: '🎁', value: 50.57, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/swisswatch.webp' },
  'magicpotion': { name: 'Magic Potion', emoji: '🎁', value: 50.04, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/magicpotion.webp' },
  'sharptongue': { name: 'Sharp Tongue', emoji: '🎁', value: 43.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/sharptongue.webp' },
  'kissedfrog': { name: 'Kissed Frog', emoji: '🎁', value: 41.66, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/kissedfrog.webp' },
  'bondedring': { name: 'Bonded Ring', emoji: '🎁', value: 38.31, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bondedring.webp' },
  'voodoodoll': { name: 'Voodoo Doll', emoji: '🎁', value: 35.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/voodoodoll.webp' },
  'vintagecigar': { name: 'Vintage Cigar', emoji: '🎁', value: 34.96, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/vintagecigar.webp' },
  'nekohelmet': { name: 'Neko Helmet', emoji: '🎁', value: 34.65, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/nekohelmet.webp' },
  'toybear': { name: 'Toy Bear', emoji: '🎁', value: 32.13, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/toybear.webp' },
  'genielamp': { name: 'Genie Lamp', emoji: '🎁', value: 30.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/genielamp.webp' },
  'signetring': { name: 'Signet Ring', emoji: '🎁', value: 30.0, tier: 'rare', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/signetring.webp' },
  'diamondring': { name: 'Diamond Ring', emoji: '🎁', value: 28.0, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/diamondring.webp' },
  'rarebird': { name: 'Rare Bird', emoji: '🎁', value: 24.8, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/rarebird.webp' },
  'blingbinky': { name: 'Bling Binky', emoji: '🎁', value: 24.03, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/blingbinky.webp' },
  'electricskull': { name: 'Electric Skull', emoji: '🎁', value: 23.28, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/electricskull.webp' },
  'eternalrose': { name: 'Eternal Rose', emoji: '🎁', value: 22.46, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/eternalrose.webp' },
  'khabibspapakha': { name: 'Khabib’s Papakha', emoji: '🎁', value: 22.43, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/khabibspapakha.webp' },
  'cupidcharm': { name: 'Cupid Charm', emoji: '🎁', value: 19.68, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/cupidcharm.webp' },
  'skystilettos': { name: 'Sky Stilettos', emoji: '🎁', value: 17.03, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/skystilettos.webp' },
  'trappedheart': { name: 'Trapped Heart', emoji: '🎁', value: 14.76, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/trappedheart.webp' },
  'ufcstrike': { name: 'UFC Strike', emoji: '🎁', value: 13.99, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/ufcstrike.webp' },
  'ionicdryer': { name: 'Ionic Dryer', emoji: '🎁', value: 13.92, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/ionicdryer.webp' },
  'lovepotion': { name: 'Love Potion', emoji: '🎁', value: 13.66, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lovepotion.webp' },
  'snoopcigar': { name: 'Snoop Cigar', emoji: '🎁', value: 13.5, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snoopcigar.webp' },
  'madpumpkin': { name: 'Mad Pumpkin', emoji: '🎁', value: 11.89, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/madpumpkin.webp' },
  'crystalball': { name: 'Crystal Ball', emoji: '🎁', value: 11.66, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/crystalball.webp' },
  'flyingbroom': { name: 'Flying Broom', emoji: '🎁', value: 11.48, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/flyingbroom.webp' },
  'recordplayer': { name: 'Record Player', emoji: '🎁', value: 11.21, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/recordplayer.webp' },
  'valentinebox': { name: 'Valentine Box', emoji: '🎁', value: 10.52, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/valentinebox.webp' },
  'skullflower': { name: 'Skull Flower', emoji: '🎁', value: 10.25, tier: 'uncommon', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/skullflower.webp' },
  'tophat': { name: 'Top Hat', emoji: '🎁', value: 9.95, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/tophat.webp' },
  'sakuraflower': { name: 'Sakura Flower', emoji: '🎁', value: 9.65, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/sakuraflower.webp' },
  'lovecandle': { name: 'Love Candle', emoji: '🎁', value: 9.55, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lovecandle.webp' },
  'jinglebells': { name: 'Jingle Bells', emoji: '🎁', value: 9.39, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jinglebells.webp' },
  'hangingstar': { name: 'Hanging Star', emoji: '🎁', value: 8.9, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/hangingstar.webp' },
  'bunnymuffin': { name: 'Bunny Muffin', emoji: '🎁', value: 7.7, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bunnymuffin.webp' },
  'berrybox': { name: 'Berry Box', emoji: '🎁', value: 7.64, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/berrybox.webp' },
  'jellybunny': { name: 'Jelly Bunny', emoji: '🎁', value: 7.14, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jellybunny.webp' },
  'sleighbell': { name: 'Sleigh Bell', emoji: '🎁', value: 6.79, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/sleighbell.webp' },
  'evileye': { name: 'Evil Eye', emoji: '🎁', value: 6.73, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/evileye.webp' },
  'surgeboard': { name: 'Surge Board', emoji: '🎁', value: 6.57, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/surgeboard.webp' },
  'joyfulbundle': { name: 'Joyful Bundle', emoji: '🎁', value: 6.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/joyfulbundle.webp' },
  'jollychimp': { name: 'Jolly Chimp', emoji: '🎁', value: 6.4, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jollychimp.webp' },
  'lightsword': { name: 'Light Sword', emoji: '🎁', value: 6.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lightsword.webp' },
  'inputkey': { name: 'Input Key', emoji: '🎁', value: 5.89, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/inputkey.webp' },
  'moonpendant': { name: 'Moon Pendant', emoji: '🎁', value: 5.7, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/moonpendant.webp' },
  'lushbouquet': { name: 'Lush Bouquet', emoji: '🎁', value: 5.69, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lushbouquet.webp' },
  'witchhat': { name: 'Witch Hat', emoji: '🎁', value: 5.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/witchhat.webp' },
  'springbasket': { name: 'Spring Basket', emoji: '🎁', value: 5.48, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/springbasket.webp' },
  'eternalcandle': { name: 'Eternal Candle', emoji: '🎁', value: 5.4, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/eternalcandle.webp' },
  'spyagaric': { name: 'Spy Agaric', emoji: '🎁', value: 5.26, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/spyagaric.webp' },
  'faithamulet': { name: 'Faith Amulet', emoji: '🎁', value: 5.23, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/faithamulet.webp' },
  'swagbag': { name: 'Swag Bag', emoji: '🎁', value: 5.15, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/swagbag.webp' },
  'restlessjar': { name: 'Restless Jar', emoji: '🎁', value: 5.1, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/restlessjar.webp' },
  'stellarrocket': { name: 'Stellar Rocket', emoji: '🎁', value: 4.98, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/stellarrocket.webp' },
  'prettyposy': { name: 'Pretty Posy', emoji: '🎁', value: 4.88, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/prettyposy.webp' },
  'snowmittens': { name: 'Snow Mittens', emoji: '🎁', value: 4.85, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snowmittens.webp' },
  'moneypot': { name: 'Money Pot', emoji: '🎁', value: 4.8, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/moneypot.webp' },
  'snoopdogg': { name: 'Snoop Dogg', emoji: '🎁', value: 4.8, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snoopdogg.webp' },
  'santahat': { name: 'Santa Hat', emoji: '🎁', value: 4.68, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/santahat.webp' },
  'jackinthebox': { name: 'Jack-in-the-Box', emoji: '🎁', value: 4.65, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jackinthebox.webp' },
  'bowtie': { name: 'Bow Tie', emoji: '🎁', value: 4.63, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bowtie.webp' },
  'bdaycandle': { name: 'B-Day Candle', emoji: '🎁', value: 4.6, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bdaycandle.webp' },
  'deskcalendar': { name: 'Desk Calendar', emoji: '🎁', value: 4.6, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/deskcalendar.webp' },
  'snowglobe': { name: 'Snow Globe', emoji: '🎁', value: 4.6, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snowglobe.webp' },
  'moussecake': { name: 'Mousse Cake', emoji: '🎁', value: 4.59, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/moussecake.webp' },
  'hexpot': { name: 'Hex Pot', emoji: '🎁', value: 4.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/hexpot.webp' },
  'homemadecake': { name: 'Homemade Cake', emoji: '🎁', value: 4.47, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/homemadecake.webp' },
  'libertyfigure': { name: 'Liberty Figure', emoji: '🎁', value: 4.39, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/libertyfigure.webp' },
  'freshsocks': { name: 'Fresh Socks', emoji: '🎁', value: 4.32, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/freshsocks.webp' },
  'cookieheart': { name: 'Cookie Heart', emoji: '🎁', value: 4.3, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/cookieheart.webp' },
  'starnotepad': { name: 'Star Notepad', emoji: '🎁', value: 4.3, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/starnotepad.webp' },
  'timelessbook': { name: 'Timeless Book', emoji: '🎁', value: 4.15, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/timelessbook.webp' },
  'spicedwine': { name: 'Spiced Wine', emoji: '🎁', value: 4.06, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/spicedwine.webp' },
  'cloverpin': { name: 'Clover Pin', emoji: '🎁', value: 4.01, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/cloverpin.webp' },
  'hypnolollipop': { name: 'Hypno Lollipop', emoji: '🎁', value: 4.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/hypnolollipop.webp' },
  'victorymedal': { name: 'Victory Medal', emoji: '🎁', value: 4.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/victorymedal.webp' },
  'moodpack': { name: 'Mood Pack', emoji: '🎁', value: 4.0, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/moodpack.webp' },
  'gingercookie': { name: 'Ginger Cookie', emoji: '🎁', value: 3.97, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/gingercookie.webp' },
  'happybrownie': { name: 'Happy Brownie', emoji: '🎁', value: 3.95, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/happybrownie.webp' },
  'partysparkler': { name: 'Party Sparkler', emoji: '🎁', value: 3.93, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/partysparkler.webp' },
  'easteregg': { name: 'Easter Egg', emoji: '🎁', value: 3.87, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/easteregg.webp' },
  'winterwreath': { name: 'Winter Wreath', emoji: '🎁', value: 3.82, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/winterwreath.webp' },
  'jesterhat': { name: 'Jester Hat', emoji: '🎁', value: 3.67, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/jesterhat.webp' },
  'holidaydrink': { name: 'Holiday Drink', emoji: '🎁', value: 3.64, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/holidaydrink.webp' },
  'bigyear': { name: 'Big Year', emoji: '🎁', value: 3.57, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/bigyear.webp' },
  'lolpop': { name: 'Lol Pop', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lolpop.webp' },
  'petsnake': { name: 'Pet Snake', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/petsnake.webp' },
  'tamagadget': { name: 'Tama Gadget', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/tamagadget.webp' },
  'whipcupcake': { name: 'Whip Cupcake', emoji: '🎁', value: 3.5, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/whipcupcake.webp' },
  'lunarsnake': { name: 'Lunar Snake', emoji: '🎁', value: 3.47, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/lunarsnake.webp' },
  'chillflame': { name: 'Chill Flame', emoji: '🎁', value: 3.44, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/chillflame.webp' },
  'snakebox': { name: 'Snake Box', emoji: '🎁', value: 3.42, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/snakebox.webp' },
  'candycane': { name: 'Candy Cane', emoji: '🎁', value: 3.41, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/candycane.webp' },
  'instantramen': { name: 'Instant Ramen', emoji: '🎁', value: 3.39, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/instantramen.webp' },
  'vicecream': { name: 'Vice Cream', emoji: '🎁', value: 3.38, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/vicecream.webp' },
  'xmasstocking': { name: 'Xmas Stocking', emoji: '🎁', value: 3.37, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/xmasstocking.webp' },
  'poolfloat': { name: 'Pool Float', emoji: '🎁', value: 3.37, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/poolfloat.webp' },
  'icecream': { name: 'Ice Cream', emoji: '🎁', value: 3.35, tier: 'common', img: 'https://raw.githubusercontent.com/parha2662-maker/My_telegram_app/main/gifts/icecream.webp' }
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
    let mul = 1.03;
    if (g.value < 40) mul = 1.10;
    else if (g.value <= 120) mul = 1.05;
    const val = Math.round((g.value * mul + 0.6) * 100) / 100;
    return { id, name: g.name, emoji: g.emoji, value: val, tier: g.tier, img: g.img };
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
