const axios = require("axios");
const fs = require("fs");
const ytSearch = require("yt-search");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "song",
    version: "3.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Instant song downloader (no error mode)" },
    longDescription: { en: "Downloads song using fallback system, tries 1-6 videos. Never shows error." },
    category: "media",
    guide: { en: "{pn} <song name>" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0]) return;

    api.setMessageReaction("🎶", event.messageID, () => {}, true);

    const query = args.join(" ");

    try {
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      // 🔎 YouTube search
      const search = await ytSearch(query);
      const vids = search.videos.slice(0, 6);
      if (!vids.length) return;

      // API fallback list
      async function tryAPIs(video) {
        const APIs = [
          async () => {
            try {
              const a = await axios.get(
                "https://raw.githubusercontent.com/arychauhann/APIs/refs/heads/main/api.json"
              );
              const base = a.data.ary;
              return await axios.get(`${base}/api/ytmp3?url=${encodeURIComponent(video.url)}&format=mp3`);
            } catch { return null; }
          },
          async () => {
            try {
              return await axios.get(`https://api.shinobu.host/ytmp3?url=${encodeURIComponent(video.url)}`);
            } catch { return null; }
          },
          async () => {
            try {
              return await axios.get(`https://widipe.com/download/ytmp3?url=${encodeURIComponent(video.url)}`);
            } catch { return null; }
          }
        ];

        // Try all APIs for one video
        for (let apiCall of APIs) {
          const res = await apiCall();
          if (!res || !res.data) continue;

          const d = res.data;

          const link =
            d.directLink ||
            d.url ||
            d.download_url ||
            d.result?.download_url;

          if (link) return { link, title: video.title, author: video.author.name, duration: video.timestamp };
        }

        return null;
      }

      // Try each of the 1–6 videos
      let finalSong = null;

      for (let vid of vids) {
        finalSong = await tryAPIs(vid);
        if (finalSong) break; // found working one
      }

      // Nothing worked → but NO ERROR should show
      if (!finalSong) {
        return api.sendMessage("❌ Song unavailable right now.", event.threadID);
      }

      // Download MP3
      const filePath = path.join(CACHE_DIR, `${Date.now()}.mp3`);

      const dl = await axios.get(finalSong.link, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      dl.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: `🎵 *${finalSong.title}*\n👤 ${finalSong.author}\n⏳ ${finalSong.duration}`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => {
            try { fs.unlinkSync(filePath); } catch {}
          }
        );

        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

      writer.on("error", () => {});

    } catch (e) {
      // NO ERROR MESSAGE — Silent fail
    }
  }
};
