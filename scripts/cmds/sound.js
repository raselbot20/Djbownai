const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const sounds = {
  // ADULT/HOT (25 categories)
  hot: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3"],
  sexy: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3"],
  kiss: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3"],
  moan: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3"],
  wet: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3"],
  squirt: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3"],
  whisper: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3"],
  seductive: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3"],
  bed: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3"],
  mattress: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3"],
  heavy: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3"],
  breath: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-12.mp3"],
  gasp: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3"],
  pant: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-14.mp3"],
  orgasm: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-15.mp3"],
  climax: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-16.mp3"],
  sensual: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-17.mp3"],
  intimate: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-18.mp3"],
  pleasure: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-19.mp3"],
  ecstasy: ["https://www.soundhelix.com/examples/mp3/SoundHelix-Song-20.mp3"],
  passion: ["https://www.myinstants.com/media/sounds/kiss-sound-effect.mp3"],
  desire: ["https://www.myinstants.com/media/sounds/moan-1.mp3"],
  arousal: ["https://www.myinstants.com/media/sounds/sexy-moan.mp3"],
  erotic: ["https://www.myinstants.com/media/sounds/fart.mp3"],
  naughty: ["https://www.myinstants.com/media/sounds/tiktok-laugh.mp3"],

  // FUNNY/COMEDY (20 categories)
  laugh: ["https://www.myinstants.com/media/sounds/tiktok-laugh.mp3"],
  haha: ["https://www.myinstants.com/media/sounds/vine-boom.mp3"],
  funny: ["https://www.myinstants.com/media/sounds/fart.mp3"],
  tiktok: ["https://www.myinstants.com/media/sounds/oh-my-god-sound-effect.mp3"],
  comedy: ["https://www.myinstants.com/media/sounds/canned-laughter.mp3"],
  joke: ["https://www.myinstants.com/media/sounds/ba-dum-tss.mp3"],
  prank: ["https://www.myinstants.com/media/sounds/airhorn.mp3"],
  silly: ["https://www.myinstants.com/media/sounds/silly-laugh.mp3"],
  giggle: ["https://www.myinstants.com/media/sounds/giggle.mp3"],
  chuckle: ["https://www.myinstants.com/media/sounds/chuckle.mp3"],
  snort: ["https://www.myinstants.com/media/sounds/pig-snort.mp3"],
  rofl: ["https://www.myinstants.com/media/sounds/rofl.mp3"],
  wheeze: ["https://www.myinstants.com/media/sounds/wheeze.mp3"],
  cackle: ["https://www.myinstants.com/media/sounds/witch-cackle.mp3"],
  snicker: ["https://www.myinstants.com/media/sounds/snicker.mp3"],
  guffaw: ["https://www.myinstants.com/media/sounds/guffaw.mp3"],
  belly: ["https://www.myinstants.com/media/sounds/belly-laugh.mp3"],
  hysterical: ["https://www.myinstants.com/media/sounds/hysterical-laugh.mp3"],
  amused: ["https://www.myinstants.com/media/sounds/amused-laugh.mp3"],
  entertained: ["https://www.myinstants.com/media/sounds/applause.mp3"],

  // HORROR/SCARY (15 categories)
  horror: ["https://www.myinstants.com/media/sounds/scary-sound.mp3"],
  scary: ["https://www.myinstants.com/media/sounds/jumpscare-scream.mp3"],
  ghost: ["https://www.myinstants.com/media/sounds/ghost-sound.mp3"],
  scream: ["https://www.myinstants.com/media/sounds/wilhelm-scream.mp3"],
  monster: ["https://www.myinstants.com/media/sounds/monster-roar.mp3"],
  zombie: ["https://www.myinstants.com/media/sounds/zombie-groan.mp3"],
  vampire: ["https://www.myinstants.com/media/sounds/vampire-hiss.mp3"],
  werewolf: ["https://www.myinstants.com/media/sounds/werewolf-howl.mp3"],
  creepy: ["https://www.myinstants.com/media/sounds/creepy-laugh.mp3"],
  sinister: ["https://www.myinstants.com/media/sounds/sinister-laugh.mp3"],
  evil: ["https://www.myinstants.com/media/sounds/evil-laugh.mp3"],
  demon: ["https://www.myinstants.com/media/sounds/demon-growl.mp3"],
  witch: ["https://www.myinstants.com/media/sounds/witch-cackle.mp3"],
  chainsaw: ["https://www.myinstants.com/media/sounds/chainsaw.mp3"],
  knife: ["https://www.myinstants.com/media/sounds/knife-slash.mp3"],

  // EMOTIONAL (10 categories)
  cry: ["https://www.myinstants.com/media/sounds/crying-sound.mp3"],
  sad: ["https://www.myinstants.com/media/sounds/sad-violin.mp3"],
  sob: ["https://www.myinstants.com/media/sounds/sobbing.mp3"],
  weep: ["https://www.myinstants.com/media/sounds/weeping.mp3"],
  tear: ["https://www.myinstants.com/media/sounds/tear-drop.mp3"],
  depressed: ["https://www.myinstants.com/media/sounds/depressed-sigh.mp3"],
  heartbreak: ["https://www.myinstants.com/media/sounds/heartbreak.mp3"],
  lonely: ["https://www.myinstants.com/media/sounds/lonely-cry.mp3"],
  miserable: ["https://www.myinstants.com/media/sounds/miserable-sob.mp3"],
  emotional: ["https://www.myinstants.com/media/sounds/emotional-cry.mp3"],

  // ALARM/ALERT (10 categories)
  alarm: ["https://www.myinstants.com/media/sounds/alarm-clock.mp3"],
  siren: ["https://www.myinstants.com/media/sounds/police-siren.mp3"],
  alert: ["https://www.myinstants.com/media/sounds/warning-alarm.mp3"],
  warning: ["https://www.myinstants.com/media/sounds/warning-alarm.mp3"],
  emergency: ["https://www.myinstants.com/media/sounds/emergency-alarm.mp3"],
  beep: ["https://www.myinstants.com/media/sounds/beep.mp3"],
  buzzer: ["https://www.myinstants.com/media/sounds/buzzer.mp3"],
  horn: ["https://www.myinstants.com/media/sounds/car-horn.mp3"],
  whistle: ["https://www.myinstants.com/media/sounds/whistle.mp3"],
  bell: ["https://www.myinstants.com/media/sounds/bell-ring.mp3"],

  // GAME/MOVIE (15 categories)
  mario: ["https://www.myinstants.com/media/sounds/mario-coin-sound.mp3"],
  gun: ["https://www.myinstants.com/media/sounds/gun-shot.mp3"],
  bomb: ["https://www.myinstants.com/media/sounds/bomb-explosion.mp3"],
  laser: ["https://www.myinstants.com/media/sounds/laser-gun.mp3"],
  sword: ["https://www.myinstants.com/media/sounds/sword-slash.mp3"],
  shield: ["https://www.myinstants.com/media/sounds/shield-block.mp3"],
  magic: ["https://www.myinstants.com/media/sounds/magic-spell.mp3"],
  levelup: ["https://www.myinstants.com/media/sounds/level-up.mp3"],
  gameover: ["https://www.myinstants.com/media/sounds/game-over.mp3"],
  victory: ["https://www.myinstants.com/media/sounds/victory-fanfare.mp3"],
  defeat: ["https://www.myinstants.com/media/sounds/defeat-sound.mp3"],
  powerup: ["https://www.myinstants.com/media/sounds/power-up.mp3"],
  collect: ["https://www.myinstants.com/media/sounds/collect-coin.mp3"],
  hit: ["https://www.myinstants.com/media/sounds/hit-sound.mp3"],
  damage: ["https://www.myinstants.com/media/sounds/damage-sound.mp3"],

  // ANIMALS (10 categories)
  dog: ["https://www.myinstants.com/media/sounds/dog-bark.mp3"],
  cat: ["https://www.myinstants.com/media/sounds/cat-meow.mp3"],
  bird: ["https://www.myinstants.com/media/sounds/bird-chirp.mp3"],
  cow: ["https://www.myinstants.com/media/sounds/cow-moo.mp3"],
  lion: ["https://www.myinstants.com/media/sounds/lion-roar.mp3"],
  wolf: ["https://www.myinstants.com/media/sounds/wolf-howl.mp3"],
  elephant: ["https://www.myinstants.com/media/sounds/elephant-trumpet.mp3"],
  monkey: ["https://www.myinstants.com/media/sounds/monkey-chatter.mp3"],
  snake: ["https://www.myinstants.com/media/sounds/snake-hiss.mp3"],
  frog: ["https://www.myinstants.com/media/sounds/frog-croak.mp3"],

  // EVERYDAY (10 categories)
  door: ["https://www.myinstants.com/media/sounds/door-knock.mp3"],
  phone: ["https://www.myinstants.com/media/sounds/phone-ring.mp3"],
  notification: ["https://www.myinstants.com/media/sounds/notification.mp3"],
  knock: ["https://www.myinstants.com/media/sounds/knock-on-door.mp3"],
  clap: ["https://www.myinstants.com/media/sounds/hand-clap.mp3"],
  snap: ["https://www.myinstants.com/media/sounds/finger-snap.mp3"],
  cough: ["https://www.myinstants.com/media/sounds/cough.mp3"],
  sneeze: ["https://www.myinstants.com/media/sounds/sneeze.mp3"],
  yawn: ["https://www.myinstants.com/media/sounds/yawn.mp3"],
  snore: ["https://www.myinstants.com/media/sounds/snore.mp3"],

  // MUSICAL (10 categories)
  drum: ["https://www.myinstants.com/media/sounds/drum-roll.mp3"],
  violin: ["https://www.myinstants.com/media/sounds/violin.mp3"],
  guitar: ["https://www.myinstants.com/media/sounds/guitar-strum.mp3"],
  piano: ["https://www.myinstants.com/media/sounds/piano-key.mp3"],
  trumpet: ["https://www.myinstants.com/media/sounds/trumpet-fanfare.mp3"],
  flute: ["https://www.myinstants.com/media/sounds/flute-note.mp3"],
  harp: ["https://www.myinstants.com/media/sounds/harp-pluck.mp3"],
  saxophone: ["https://www.myinstants.com/media/sounds/saxophone.mp3"],
  drumbeat: ["https://www.myinstants.com/media/sounds/drum-beat.mp3"],
  bass: ["https://www.myinstants.com/media/sounds/bass-guitar.mp3"],

  // SPECIAL EFFECTS (10 categories)
  sparkle: ["https://www.myinstants.com/media/sounds/sparkle-sound.mp3"],
  woosh: ["https://www.myinstants.com/media/sounds/whoosh.mp3"],
  splash: ["https://www.myinstants.com/media/sounds/water-splash.mp3"],
  explosion: ["https://www.myinstants.com/media/sounds/explosion.mp3"],
  fire: ["https://www.myinstants.com/media/sounds/fire-burning.mp3"],
  wind: ["https://www.myinstants.com/media/sounds/wind.mp3"],
  rain: ["https://www.myinstants.com/media/sounds/rain-loop.mp3"],
  thunder: ["https://www.myinstants.com/media/sounds/thunder.mp3"],
  earthquake: ["https://www.myinstants.com/media/sounds/earthquake.mp3"],
  tornado: ["https://www.myinstants.com/media/sounds/tornado.mp3"],

  // KISSING (5 categories)
  smooch: ["https://www.myinstants.com/media/sounds/kiss-lip-sound.mp3"],
  lip: ["https://www.myinstants.com/media/sounds/kiss-sound-effect.mp3"],
  peck: ["https://www.myinstants.com/media/sounds/peck-kiss.mp3"],
  french: ["https://www.myinstants.com/media/sounds/french-kiss.mp3"],
  romantic: ["https://www.myinstants.com/media/sounds/romantic-kiss.mp3"],

  // WATER (5 categories)
  water: ["https://www.myinstants.com/media/sounds/water-drop.mp3"],
  drop: ["https://www.myinstants.com/media/sounds/water-drip.mp3"],
  stream: ["https://www.myinstants.com/media/sounds/water-stream.mp3"],
  ocean: ["https://www.myinstants.com/media/sounds/ocean-waves.mp3"],
  river: ["https://www.myinstants.com/media/sounds/river-flow.mp3"],

  // VEHICLE (5 categories)
  car: ["https://www.myinstants.com/media/sounds/car-engine.mp3"],
  engine: ["https://www.myinstants.com/media/sounds/engine-starting.mp3"],
  tire: ["https://www.myinstants.com/media/sounds/tire-squeal.mp3"],
  brake: ["https://www.myinstants.com/media/sounds/brake-squeak.mp3"],
  crash: ["https://www.myinstants.com/media/sounds/car-crash.mp3"],

  // TECH (5 categories)
  click: ["https://www.myinstants.com/media/sounds/mouse-click.mp3"],
  type: ["https://www.myinstants.com/media/sounds/keyboard-typing.mp3"],
  camera: ["https://www.myinstants.com/media/sounds/camera-shutter.mp3"],
  scanner: ["https://www.myinstants.com/media/sounds/scanner-beep.mp3"],
  robot: ["https://www.myinstants.com/media/sounds/robot-voice.mp3"],

  // CELEBRATION (5 categories)
  cheer: ["https://www.myinstants.com/media/sounds/crowd-cheer.mp3"],
  applause: ["https://www.myinstants.com/media/sounds/applause.mp3"],
  fireworks: ["https://www.myinstants.com/media/sounds/fireworks.mp3"],
  party: ["https://www.myinstants.com/media/sounds/party-horn.mp3"],
  celebration: ["https://www.myinstants.com/media/sounds/celebration-fanfare.mp3"],

  // SPORTS (5 categories)
  basketball: ["https://www.myinstants.com/media/sounds/basketball-bounce.mp3"],
  football: ["https://www.myinstants.com/media/sounds/football-kick.mp3"],
  tennis: ["https://www.myinstants.com/media/sounds/tennis-hit.mp3"],
  golf: ["https://www.myinstants.com/media/sounds/golf-swing.mp3"],
  boxing: ["https://www.myinstants.com/media/sounds/boxing-punch.mp3"],

  // FOOD (5 categories)
  eat: ["https://www.myinstants.com/media/sounds/eating-crunchy.mp3"],
  drink: ["https://www.myinstants.com/media/sounds/drinking.mp3"],
  chew: ["https://www.myinstants.com/media/sounds/chewing.mp3"],
  swallow: ["https://www.myinstants.com/media/sounds/swallow.mp3"],
  burp: ["https://www.myinstants.com/media/sounds/burp.mp3"]
};

module.exports = {
  config: {
    name: "sound",
    aliases: ["sfx", "audio"],
    version: "4.0",
    author: "Rasel Mahmud",
    role: 0,
    countDown: 2,
    shortDescription: "Play 2-10 sec sound effects (150+ sounds)",
    longDescription: "Play short sound effects by category",
    category: "Fun",
  },

  onStart: async function({ event, api, args }) {
    try {
      if (!args[0]) {
        const categories = Object.keys(sounds);
        let message = "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n";
        message += "📋 SOUND CATEGORIES\n";
        message += `TOTAL: ${categories.length}\n\n`;
        
        // Show first 30 categories
        message += categories.slice(0, 30).join(", ") + "\n\n";
        message += "USE: sound [category]\n";
        message += "EX: sound horror\n";
        message += "EX: sound hot\n";
        message += "EX: sound list (for full list)\n";
        message += "╚═══════════════╝";
        
        return api.sendMessage(message, event.threadID, event.messageID);
      }

      const soundName = args[0].toLowerCase();

      if (soundName === "list") {
        const categories = Object.keys(sounds);
        const page = parseInt(args[1]) || 1;
        const perPage = 30;
        const totalPages = Math.ceil(categories.length / perPage);
        const start = (page - 1) * perPage;
        const end = start + perPage;
        const pageCategories = categories.slice(start, end);
        
        let message = "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n";
        message += `📋 PAGE ${page}/${totalPages}\n`;
        message += `TOTAL: ${categories.length}\n\n`;
        message += pageCategories.join(", ") + "\n\n";
        message += `USE: sound list ${page < totalPages ? page + 1 : 1}\n`;
        message += "EX: sound list 2\n";
        message += "╚═══════════════╝";
        
        return api.sendMessage(message, event.threadID, event.messageID);
      }

      if (!sounds[soundName]) {
        const available = Object.keys(sounds);
        const suggestions = available.filter(cat => 
          cat.includes(soundName) || 
          cat.startsWith(soundName.substring(0, 3))
        ).slice(0, 5);
        
        let message = "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n";
        message += `❌ SOUND NOT FOUND\n`;
        message += `CATEGORY: ${soundName}\n\n`;
        
        if (suggestions.length > 0) {
          message += `TRY THESE:\n`;
          message += suggestions.join(", ") + "\n\n";
        }
        
        message += `USE: sound list\n`;
        message += `TOTAL: ${available.length}\n`;
        message += "╚═══════════════╝";
        
        return api.sendMessage(message, event.threadID, event.messageID);
      }

      await fs.ensureDir(path.join(__dirname, "../cache"));
      const tmpPath = path.join(__dirname, `../cache/${soundName}_${Date.now()}.mp3`);
      let loaded = false;

      const loadingMsg = await api.sendMessage(
        "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n" +
        "⏳ LOADING SOUND...\n" +
        `CATEGORY: ${soundName}\n` +
        "╚═══════════════╝",
        event.threadID
      );

      // Use SoundHelix as fallback for all sounds
      const soundHelixURL = `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${Math.floor(Math.random() * 20) + 1}.mp3`;
      const myInstantsURL = `https://www.myinstants.com/media/sounds/${soundName}.mp3`;
      
      const urlsToTry = [
        ...(sounds[soundName] || []),
        soundHelixURL,
        myInstantsURL
      ];

      for (const url of urlsToTry) {
        try {
          console.log(`Trying: ${url}`);
          const response = await axios({
            method: 'GET',
            url: url,
            responseType: 'arraybuffer',
            timeout: 15000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });
          
          if (response.data && response.data.length > 5000) { // At least 5KB
            await fs.writeFile(tmpPath, Buffer.from(response.data));
            loaded = true;
            console.log(`Success: ${soundName} loaded from ${url}`);
            break;
          }
        } catch (err) {
          console.log(`Failed: ${url} - ${err.message}`);
          continue;
        }
      }

      if (!loaded) {
        await api.unsendMessage(loadingMsg.messageID);
        return api.sendMessage(
          "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n" +
          "❌ LOAD FAILED\n" +
          `CATEGORY: ${soundName}\n` +
          "REASON: All URLs failed\n" +
          "╚═══════════════╝",
          event.threadID,
          event.messageID
        );
      }

      // Get file info
      let fileSizeKB = 50;
      let durationEstimate = "2-3";
      
      try {
        const stats = await fs.stat(tmpPath);
        fileSizeKB = Math.round(stats.size / 1024);
        
        if (fileSizeKB > 100) durationEstimate = "3-5";
        if (fileSizeKB > 200) durationEstimate = "5-7";
        if (fileSizeKB > 300) durationEstimate = "7-10";
      } catch (e) {
        // Use default values
      }

      await api.unsendMessage(loadingMsg.messageID);
      
      await api.sendMessage(
        { 
          body: "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n" +
                `🔊 PLAYING SOUND\n` +
                `CATEGORY: ${soundName}\n` +
                `DURATION: ${durationEstimate}s\n` +
                `SIZE: ${fileSizeKB} KB\n` +
                "╚═══════════════╝", 
          attachment: fs.createReadStream(tmpPath) 
        },
        event.threadID,
        (err) => {
          if (err) {
            console.error("Error sending:", err);
            api.sendMessage(
              "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n" +
              "❌ SEND FAILED\n" +
              "CHECK CONSOLE\n" +
              "╚═══════════════╝",
              event.threadID,
              event.messageID
            );
          }
          // Clean up file
          fs.unlink(tmpPath).catch(() => {});
        }
      );

    } catch (error) {
      console.error("SOUND COMMAND ERROR:", error);
      await api.sendMessage(
        "╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗\n" +
        "❌ SYSTEM ERROR\n" +
        `${error.message.substring(0, 50)}\n` +
        "╚═══════════════╝",
        event.threadID,
        event.messageID
      );
    }
  }
};
