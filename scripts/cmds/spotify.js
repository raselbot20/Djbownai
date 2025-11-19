const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "spotify",
    version: "1.0",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: "Play audio from Spotify",
    longDescription: "Search Spotify for a song and play it in chat",
    category: "media",
    guide: {
      en: "{pn} <query>\nExample: {pn} apt"
    }
  },

  onStart: async function ({ api, event, args }) {
    if (!args[0]) {
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return api.sendMessage(
        "❌ Please provide a search query!\nExample: spotify apt",
   ,
        event.messageID
      );
    }

    const query = args.join(" ").trim();
    const audioPath = path.join(__dirname, `spotify_${Date.now()}.mp3`);

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const url = `https://arychauhann.onrender.com/api/spotifyplay?query=${encodeURIComponent(query)}`;
      const response = await axios({
        method: "GET",
        url,
        responseType: "arraybuffer", 
        headers: { "User-Agent": "Mozilla/5.0" },
        maxBodyLength: Infinity,
        maxContentLength: Infinity
      });

      fs.writeFileSync(audioPath, Buffer.from(response.data));

      api.sendMessage(
        {
          body: `🎵 Spotify result for "${query}":`,
          attachment: fs.createReadStream(audioPath)
        },
        event.threadID,
        (err) => {
          if (err) console.error("sendMessage error:", err);
          api.setMessageReaction("✅", event.messageID, () => {}, true);
          if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        },
        event.messageID
      );

    } catch (e) {
      console.error("spotify.onStart error:", e?.response?.data || e.message);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        `❌ Error while fetching Spotify audio.\n${e.message}`,
        event.threadID,
        event.messageID
      );
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
    }
  }
};
