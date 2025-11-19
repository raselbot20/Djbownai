const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "anime",
    version: "1.0.0",
    author: "XaviaTeam (Modified by Rasel Mahmud)",
    countDown: 3,
    role: 0,
    shortDescription: "Send random anime images",
    longDescription: "Send anime images from different categories like hug, kiss, smile, neko, etc.",
    category: "fun",
    guide: {
      en: "{pn} [category]\n\nAvailable categories: waifu, neko, hug, kiss, smile, pat, slap, wink, dance, cry, cuddle, blush"
    }
  },

  onStart: async function ({ api, event, args }) {
    const endpoints = [
      "waifu", "neko", "shinobu", "megumin", "bully", "cuddle", "cry", "hug", "awoo",
      "kiss", "lick", "pat", "smug", "bonk", "yeet", "blush", "smile", "wave",
      "highfive", "handhold", "nom", "bite", "glomp", "slap", "kill", "kick",
      "happy", "wink", "poke", "dance", "cringe"
    ];

    try {
      const input = args[0]?.toLowerCase();

      if (!input || !endpoints.includes(input)) {
        return api.sendMessage(
          `❌ Invalid category!\nAvailable categories:\n${endpoints.join(", ")}`,
          event.threadID,
          event.messageID
        );
      }

      // ✅ Replace this with your actual API link or use the waifu.pics API
      const url = `https://api.waifu.pics/sfw/${input}`;

      const res = await axios.get(url);
      const imgUrl = res.data.url;

      if (!imgUrl) {
        return api.sendMessage("⚠️ Error fetching image, try again later.", event.threadID, event.messageID);
      }

      const imgPath = __dirname + `/cache/anime_${Date.now()}.jpg`;
      const img = await axios.get(imgUrl, { responseType: "arraybuffer" });
      fs.writeFileSync(imgPath, Buffer.from(img.data, "binary"));

      api.sendMessage(
        { body: `✨ Anime Category: ${input}`, attachment: fs.createReadStream(imgPath) },
        event.threadID,
        () => fs.unlinkSync(imgPath),
        event.messageID
      );

    } catch (error) {
      console.error(error);
      api.sendMessage("❌ Something went wrong, please try again later.", event.threadID, event.messageID);
    }
  }
};
