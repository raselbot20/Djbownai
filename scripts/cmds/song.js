const axios = require("axios");
const fs = require("fs");
const ytSearch = require("yt-search");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "song",
    version: "2.0",
    author: "Modified by ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Download any song instantly" },
    longDescription: { en: "Search & download song directly without list. Includes fallback APIs." },
    category: "media",
    guide: { en: "{pn} <song name>" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0])
      return api.sendMessage("❌ Please provide a song name.", event.threadID, event.messageID);

    const query = args.join(" ");
    api.setMessageReaction("🎶", event.messageID, () => {}, true);

    try {
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      // 🔎 FIRST: Search YouTube
      const search = await ytSearch(query);
      if (!search.videos || search.videos.length === 0) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ No song found on YouTube.", event.threadID);
      }

      const video = search.videos[0]; // pick first result

      // API Fallback list
      const APIs = [
        async () => {
          // Ary / Shizu API
          try {
            const apiConfig = await axios.get(
              "https://raw.githubusercontent.com/arychauhann/APIs/refs/heads/main/api.json"
            );
            const base = apiConfig.data.ary;
            const url = `${base}/api/ytmp3?url=${encodeURIComponent(video.url)}&format=mp3`;
            return await axios.get(url);
          } catch {
            return null;
          }
        },
        async () => {
          // Second API (Backup)
          try {
            const url = `https://api.shinobu.host/ytmp3?url=${encodeURIComponent(video.url)}`;
            return await axios.get(url);
          } catch {
            return null;
          }
        },
        async () => {
          // Third API (Backup)
          try {
            const url = `https://widipe.com/download/ytmp3?url=${encodeURIComponent(video.url)}`;
            return await axios.get(url);
          } catch {
            return null;
          }
        }
      ];

      let data = null;

      // 🔄 Try all APIs until one works
      for (let apiCall of APIs) {
        let res = await apiCall();
        if (res && res.data && (res.data.directLink || res.data.result?.download_url)) {
          data = res.data;
          break;
        }
      }

      if (!data) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage("❌ All servers failed to fetch the song.", event.threadID);
      }

      // Find download link
      const link =
        data.directLink ||
        data.result?.download_url ||
        data.download_url ||
        data.url;

      if (!link) {
        return api.sendMessage("❌ Failed to fetch MP3 link.", event.threadID);
      }

      // 📥 Download MP3
      const filePath = path.join(CACHE_DIR, `${Date.now()}.mp3`);
      const dl = await axios.get(link, { responseType: "stream" });

      const writer = fs.createWriteStream(filePath);
      dl.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `🎵 *${video.title}*\n🎤 ${video.author.name}\n⏳ ${video.timestamp}`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => {
            try { fs.unlinkSync(filePath); } catch {}
          }
        );

        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

      writer.on("error", () => {
        api.sendMessage("❌ Download error.", event.threadID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.log("Song command error:", err);
      api.sendMessage("❌ Something went wrong.", event.threadID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
