* cmd install song.js
const axios = require("axios");
const fs = require("fs");
const ytSearch = require("yt-search");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "song",
    version: "3.1",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Instant song downloader (Fallback, no list)" },
    longDescription: { en: "Downloads song using fallback system. If one works, stops immediately." },
    category: "media",
    guide: { en: "{pn} <song name>" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0]) return api.sendMessage("❌ Please provide a song name.", event.threadID);

    api.setMessageReaction("🎶", event.messageID, () => {}, true);

    const query = args.join(" ");

    try {
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      // 🔎 YouTube Search (Top 6)
      const search = await ytSearch(query);
      const videos = search.videos.slice(0, 6);
      if (!videos.length) return api.sendMessage("❌ Song unavailable right now.", event.threadID);

      // API fallback function for one video
      async function fetchAudio(video) {
        const apiList = [
          async () => {
            try {
              const config = await axios.get("https://raw.githubusercontent.com/arychauhann/APIs/refs/heads/main/api.json");
              const base = config.data.ary;
              return await axios.get(`${base}/api/ytmp3?url=${encodeURIComponent(video.url)}&format=mp3`);
            } catch { return null; }
          },
          async () => {
            try { return await axios.get(`https://api.shinobu.host/ytmp3?url=${encodeURIComponent(video.url)}`); } 
            catch { return null; }
          },
          async () => {
            try { return await axios.get(`https://widipe.com/download/ytmp3?url=${encodeURIComponent(video.url)}`); } 
            catch { return null; }
          }
        ];

        for (let apiCall of apiList) {
          const res = await apiCall();
          if (!res || !res.data) continue;

          const d = res.data;
          const link = d.directLink || d.url || d.download_url || d.result?.download_url;
          if (link) return { link, title: video.title, author: video.author.name, duration: video.timestamp };
        }

        return null; // this video fully failed
      }

      // 🔁 Try from video 1 → 6
      let selected = null;
      for (let vid of videos) {
        selected = await fetchAudio(vid);
        if (selected) break; // FOUND → STOP! no next video
      }

      if (!selected) return api.sendMessage("❌ Song unavailable right now.", event.threadID);

      // 📥 Download MP3
      const filePath = path.join(CACHE_DIR, `${Date.now()}.mp3`);
      const dl = await axios.get(selected.link, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      dl.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `🎵 *${selected.title}*\n👤 ${selected.author}\n⏳ ${selected.duration}`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => { try { fs.unlinkSync(filePath); } catch {} }
        );

        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

      writer.on("error", () => {});
    } catch {}
  }
};
