module.exports = {
  config: {
    name: "autoreact",
    version: "4.0.0",
    author: "Rasel Mahmud",
    role: 0,
    category: "events",
    description: "Ultra Advanced Auto Reaction with Multiple Categories",
    countDown: 0,
    guide: {
      en: "Auto reacts to messages based on keywords"
    }
  },

  onStart: async function () {
    console.log("✅ AutoReact Loaded Successfully!");
  },

  onChat: async function ({ api, event }) {
    const { messageID, body, senderID } = event;
    if (!body || !messageID || senderID === api.getCurrentUserID()) return;

    const msg = body.toLowerCase().trim();

    // Expanded Categories
    const loveWords = ["love", "ilove", "labyu", "baby", "babe", "kiss", "hug", "romantic", "mahal", "💖", "💕", "💘", "😘", "😍", "🥰", "💙"];
    const badWords = ["sex", "fuck", "porn", "horny", "nude", "xxx", "nsfw", "bastard", "asshole", "shit"];
    const sadWords = ["sad", "pain", "cry", "depressed", "lonely", "alone", "broken", "heartbroken", "unhappy", "😭", "😢", "🥺", "💔"];
    const greetWords = ["good morning", "gm", "good night", "gn", "morning", "night", "hello", "hi", "hey", "assalamu alaikum", "salam", "bye", "goodbye"];
    const wowWords = ["wow", "amazing", "great", "nice", "awesome", "legend", "fantastic", "excellent", "mind blowing", "incredible"];
    const angryWords = ["angry", "mad", "fuck you", "bitch", "shut up", "hate", "stupid", "idiot", "🤬", "😠", "😤"];
    const laughWords = ["lol", "lmao", "haha", "😂", "🤣", "😆", "funny", "hahaha", "rofl"];
    const questionWords = ["?", "why", "what", "how", "when", "where", "who", "ki", "keno", "kivabe", "kemon", "koto"];
    const foodWords = ["food", "pizza", "burger", "rice", "hungry", "khida", "khana", "eating", "lunch", "dinner", "breakfast", "🍕", "🍔", "🍟", "🍗", "🍜"];
    const musicWords = ["song", "music", "gan", "rap", "audio", "playlist", "melody", "tune", "🎵", "🎶", "🎧", "🎤"];
    const fireWords = ["fire", "hot", "lit", "dope", "king", "queen", "power", "strong", "🔥", "💪", "👑"];
    const thinkWords = ["think", "hmm", "maybe", "idea", "thought", "wonder", "🤔", "💭"];
    const yesWords = ["yes", "ok", "right", "true", "agree", "yep", "sure", "absolutely", "✅", "👍", "✔️"];
    const noWords = ["no", "wrong", "false", "never", "nope", "nah", "not", "❌", "👎", "🚫"];
    const thanksWords = ["thank", "thanks", "tysm", "grateful", "appreciate", "dhanyabad", "🙏", "🫂"];
    const sleepyWords = ["sleep", "sleepy", "tired", "bed", "ghum", "fatigue", "😴", "💤"];
    const surpriseWords = ["omg", "oh my god", "unbelievable", "shocked", "surprise", "😱", "😲", "🤯"];
    const coolWords = ["cool", "awesome", "sick", "rad", "😎", "🆒"];
    const partyWords = ["party", "celebration", "dance", "celebrate", "🥳", "🎉", "🎊", "💃"];
    const gameWords = ["game", "gaming", "play", "player", "pubg", "cod", "fortnite", "🎮", "🕹️"];
    const studyWords = ["study", "read", "exam", "test", "book", "📚", "📖", "✏️"];
    const workWords = ["work", "job", "office", "busy", "working", "💼", "👔", "💻"];
    const moneyWords = ["money", "cash", "rich", "poor", "dollar", "taka", "💰", "💵", "💸", "🤑"];
    const timeWords = ["time", "clock", "hour", "minute", "second", "late", "early", "⏰", "⌚", "🕐"];
    const phoneWords = ["phone", "call", "mobile", "iphone", "android", "smartphone", "📱", "☎️"];
    const weatherWords = ["weather", "rain", "sun", "hot", "cold", "temperature", "🌧️", "☀️", "🌤️", "❄️"];
    const travelWords = ["travel", "trip", "journey", "vacation", "tour", "✈️", "🚗", "🚄", "🌍"];
    const familyWords = ["family", "mom", "dad", "parents", "sister", "brother", "👨‍👩‍👧‍👦", "👪", "💑"];
    const friendWords = ["friend", "buddy", "bestie", "bro", "sis", "🤝", "👫", "👬"];
    const healthWords = ["sick", "ill", "fever", "headache", "pain", "hospital", "doctor", "🏥", "💊", "🩺"];
    const animalWords = ["dog", "cat", "pet", "animal", "🐕", "🐈", "🐶", "🐱"];
    const plantWords = ["tree", "plant", "flower", "nature", "🌳", "🌷", "🌸", "🌺"];
    const sportWords = ["sport", "football", "cricket", "basketball", "game", "⚽", "🏀", "🎾"];
    const techWords = ["tech", "computer", "laptop", "code", "programming", "💻", "🖥️", "⌨️"];
    const artWords = ["art", "draw", "paint", "creative", "design", "🎨", "🖌️", "📐"];
    const movieWords = ["movie", "film", "cinema", "netflix", "youtube", "📽️", "🎬", "🍿"];
    const shopWords = ["shop", "buy", "sell", "market", "price", "🛒", "🛍️", "💰"];
    const schoolWords = ["school", "college", "university", "class", "teacher", "student", "🏫", "📓", "🎒"];

    // Helper function for matching
    const match = (list) => list.some(word => {
      if (word.length > 2) {
        return msg.includes(word);
      } else {
        return msg === word || msg.includes(` ${word} `) || msg.startsWith(`${word} `) || msg.endsWith(` ${word}`);
      }
    });

    // Reaction logic with priority
    if (match(badWords)) return api.setMessageReaction("😏", messageID, () => {}, true);
    if (match(sadWords)) return api.setMessageReaction("😢", messageID, () => {}, true);
    if (match(angryWords)) return api.setMessageReaction("😡", messageID, () => {}, true);
    if (match(loveWords)) return api.setMessageReaction("💙", messageID, () => {}, true);
    if (match(greetWords)) return api.setMessageReaction("👋", messageID, () => {}, true);
    if (match(thanksWords)) return api.setMessageReaction("🙏", messageID, () => {}, true);
    if (match(wowWords)) return api.setMessageReaction("😮", messageID, () => {}, true);
    if (match(surpriseWords)) return api.setMessageReaction("😱", messageID, () => {}, true);
    if (match(laughWords)) return api.setMessageReaction("😂", messageID, () => {}, true);
    if (match(coolWords)) return api.setMessageReaction("😎", messageID, () => {}, true);
    if (match(questionWords)) return api.setMessageReaction("❓", messageID, () => {}, true);
    if (match(foodWords)) return api.setMessageReaction("🍔", messageID, () => {}, true);
    if (match(musicWords)) return api.setMessageReaction("🎶", messageID, () => {}, true);
    if (match(fireWords)) return api.setMessageReaction("🔥", messageID, () => {}, true);
    if (match(thinkWords)) return api.setMessageReaction("🤔", messageID, () => {}, true);
    if (match(yesWords)) return api.setMessageReaction("✅", messageID, () => {}, true);
    if (match(noWords)) return api.setMessageReaction("❌", messageID, () => {}, true);
    if (match(sleepyWords)) return api.setMessageReaction("😴", messageID, () => {}, true);
    if (match(partyWords)) return api.setMessageReaction("🎉", messageID, () => {}, true);
    if (match(gameWords)) return api.setMessageReaction("🎮", messageID, () => {}, true);
    if (match(studyWords)) return api.setMessageReaction("📚", messageID, () => {}, true);
    if (match(workWords)) return api.setMessageReaction("💼", messageID, () => {}, true);
    if (match(moneyWords)) return api.setMessageReaction("💰", messageID, () => {}, true);
    if (match(timeWords)) return api.setMessageReaction("⏰", messageID, () => {}, true);
    if (match(phoneWords)) return api.setMessageReaction("📱", messageID, () => {}, true);
    if (match(weatherWords)) return api.setMessageReaction("🌤️", messageID, () => {}, true);
    if (match(travelWords)) return api.setMessageReaction("✈️", messageID, () => {}, true);
    if (match(familyWords)) return api.setMessageReaction("👨‍👩‍👧‍👦", messageID, () => {}, true);
    if (match(friendWords)) return api.setMessageReaction("🤝", messageID, () => {}, true);
    if (match(healthWords)) return api.setMessageReaction("🏥", messageID, () => {}, true);
    if (match(animalWords)) return api.setMessageReaction("🐕", messageID, () => {}, true);
    if (match(plantWords)) return api.setMessageReaction("🌸", messageID, () => {}, true);
    if (match(sportWords)) return api.setMessageReaction("⚽", messageID, () => {}, true);
    if (match(techWords)) return api.setMessageReaction("💻", messageID, () => {}, true);
    if (match(artWords)) return api.setMessageReaction("🎨", messageID, () => {}, true);
    if (match(movieWords)) return api.setMessageReaction("🎬", messageID, () => {}, true);
    if (match(shopWords)) return api.setMessageReaction("🛒", messageID, () => {}, true);
    if (match(schoolWords)) return api.setMessageReaction("🏫", messageID, () => {}, true);
  }
};
