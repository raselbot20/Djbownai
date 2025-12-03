const axios = require("axios");
const fs = require("fs");
const ytSearch = require("yt-search");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "sing",
    version: "1.2",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search & download songs (choose 1-6)" },
    longDescription: { en: "Search and download audio from YouTube in MP3 format using ShizuAPI (via Ary config)." },
    category: "media",
    guide: { en: "{pn} <song name>\n\nExample:\n{pn} sahiba" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0])
      return api.sendMessage("❌ Please provide a song name.", event.threadID, event.messageID);

    api.setMessageReaction("🎶", event.messageID, () => {}, true);

    try {
      const query = args.join(" ");
      const searchResult = await ytSearch(query);
      const videos = searchResult.videos.slice(0, 6);

      if (videos.length === 0) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ No results found on YouTube.", event.threadID, event.messageID);
      }

      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      let attachments = [];
      let msg = `🎶 Top results for: "${query}"\n\n`;
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        msg += `${i + 1}. ${v.title} (${v.timestamp})\n👤 ${v.author.name}\n\n`;

        try {
          const thumbRes = await axios.get(v.thumbnail, { responseType: "arraybuffer" });
          const thumbPath = path.join(CACHE_DIR, `thumb_${i}.jpg`);
          fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
          attachments.push(fs.createReadStream(thumbPath));
        } catch (e) {
          console.error("Thumbnail download error:", e.message);
        }
      }

      msg += "👉 Reply with a number (1-6) to download that song.";

      api.sendMessage({ body: msg, attachment: attachments }, event.threadID, (err, info) => {
        if (err) return;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          type: "chooseSong",
          messageID: info.messageID,
          videos
        });

        attachments.forEach(att => { 
          try { fs.unlinkSync(att.path); } catch {} 
        });
      }, event.messageID);

    } catch (err) {
      console.error("❌ Error in sing command:", err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("❌ An unexpected error occurred.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const choice = parseInt(event.body.trim());
    if (isNaN(choice) || choice < 1 || choice > Reply.videos.length) {
      return api.sendMessage("❌ Please reply with a valid number between 1-6.", event.threadID, event.messageID);
    }

    const video = Reply.videos[choice - 1];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiConfig = await axios.get(
        "https://raw.githubusercontent.com/arychauhann/APIs/refs/heads/main/api.json"
      );

      const baseApi = apiConfig.data && apiConfig.data.ary;
      if (!baseApi) {
        throw new Error("ARY API base URL not found in GitHub api.json");
      }

      const apiUrl = `${baseApi}/api/ytmp3?url=${encodeURIComponent(video.url)}&format=mp3`;
      const res = await axios.get(apiUrl, { timeout: 20000 });
      const data = res.data;

      if (!data || !data.success || !data.directLink) {
        return api.sendMessage("❌ Failed to get download link from ShizuAPI.", event.threadID, event.messageID);
      }

      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      const filename = `${data.videoId || Date.now()}.mp3`;
      const filepath = path.join(CACHE_DIR, filename);

      const dlRes = await axios.get(data.directLink, { responseType: "stream", timeout: 0 });
      const writer = fs.createWriteStream(filepath);
      dlRes.data.pipe(writer);

      writer.on("finish", async () => {
        api.sendMessage({
          body: `🎵 Title: ${data.title}\n📦 Size: ${data.fileSize}\n🎶 Format: ${data.format}\n🔗 YouTube: ${video.url}`,
          attachment: fs.createReadStream(filepath)
        }, event.threadID, () => {
          try { fs.unlinkSync(filepath); } catch {}
        }, event.messageID);

        api.setMessageReaction("✅", event.messageID, () => {}, true);

        if (Reply.messageID) {
          try { api.unsendMessage(Reply.messageID); } catch (err) { console.error("Failed to unsend top list:", err.message); }
        }
      });

      writer.on("error", (err) => {
        console.error("❌ File write error:", err.message);
        api.sendMessage("❌ Error saving the audio file.", event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("❌ Error while downloading:", err.message);
      api.sendMessage("❌ Failed while downloading the audio.", event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
