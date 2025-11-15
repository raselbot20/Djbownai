const axios = require("axios");
const fs = require("fs");
const ytSearch = require("yt-search");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");
const MAX_FILE_BYTES = 120 * 1024 * 1024;

function sanitizeFilename(name) {
  return name.replace(/[\\\/:*?"<>|]/g, '').trim() || `${Date.now()}`;
}

module.exports = {
  config: {
    name: "sing",
    version: "1.4",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Search & download YouTube songs" },
    longDescription: { en: "Search songs and download in MP3 format using Shizu SaveTube API." },
    category: "media",
    guide: { en: "{pn} <song name>\n\nExample:\n{pn} tum hi ho" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0])
      return api.sendMessage("❌ Please provide a song name.", event.threadID, event.messageID);

    api.setMessageReaction("🎶", event.messageID, () => {}, true);

    try {
      const query = args.join(" ");
      const searchResult = await ytSearch(query);
      const videos = (searchResult?.videos || []).slice(0, 6);

      if (!videos.length)
        return api.sendMessage("❌ No results found on YouTube.", event.threadID, event.messageID);

      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      const attachments = [];
      let msg = `🎵 Top results for: "${query}"\n\n`;
      for (let i = 0; i < videos.length; i++) {
        const v = videos[i];
        msg += `${i + 1}. ${v.title} (${v.timestamp})\n👤 ${v.author.name}\n\n`;

        try {
          const thumbRes = await axios.get(v.thumbnail, { responseType: "arraybuffer", timeout: 8000 });
          const thumbPath = path.join(CACHE_DIR, `thumb_${Date.now()}_${i}.jpg`);
          fs.writeFileSync(thumbPath, Buffer.from(thumbRes.data));
          attachments.push(fs.createReadStream(thumbPath));
        } catch (e) {}
      }

      msg += "👉 Reply with a number (1-6) to download that song.";

      api.sendMessage({ body: msg, attachment: attachments }, event.threadID, (err, info) => {
        if (err) return;

        global.GoatBot.onReply.set(info.messageID, {
          commandName: "sing",
          type: "chooseSong",
          messageID: info.messageID,
          videos,
          author: event.senderID
        });

        attachments.forEach(a => { try { if (a.path) fs.unlinkSync(a.path); } catch {} });
      }, event.messageID);
    } catch (err) {
      console.error("❌ Error in sing onStart:", err);
      api.sendMessage("❌ Error while searching songs.", event.threadID, event.messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (event.senderID !== Reply.author)
      return api.sendMessage("❌ You didn't request this search.", event.threadID, event.messageID);

    const choice = parseInt((event.body || "").trim());
    if (isNaN(choice) || choice < 1 || choice > Reply.videos.length)
      return api.sendMessage("❌ Please reply with a valid number between 1-6.", event.threadID, event.messageID);

    const video = Reply.videos[choice - 1];
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiUrl = `https://shizuapi.onrender.com/api/savetube?url=${encodeURIComponent(video.url)}&format=mp3`;
      const { data } = await axios.get(apiUrl, { timeout: 20000 });

      if (!data?.status || !data?.result?.download)
        return api.sendMessage("❌ Failed to get download link from API.", event.threadID, event.messageID);

      const dlUrl = data.result.download;
      const fileName = sanitizeFilename(data.result.title || video.title) + ".mp3";
      const filePath = path.join(CACHE_DIR, fileName);

      try {
        const head = await axios.head(dlUrl, { timeout: 10000 });
        const size = parseInt(head.headers["content-length"] || "0", 10);
        if (size > MAX_FILE_BYTES)
          return api.sendMessage(`❌ File too large (${(size / 1024 / 1024).toFixed(2)} MB).`, event.threadID, event.messageID);
      } catch (e) {}

      const dlStream = await axios.get(dlUrl, { responseType: "stream" });
      const writer = fs.createWriteStream(filePath);
      dlStream.data.pipe(writer);

      await new Promise((res, rej) => {
        writer.on("finish", res);
        writer.on("error", rej);
      });

      if (Reply.messageID) {
        try { api.unsendMessage(Reply.messageID); } catch (e) {}
      }

      await api.sendMessage({
        body: `🎶 Title: ${data.result.title}\n🕒 Duration: ${data.result.duration}s\n🎧 Quality: ${data.result.quality}kbps\n🔗 YouTube: ${video.url}`,
        attachment: fs.createReadStream(filePath)
      }, event.threadID, () => {
        try { fs.unlinkSync(filePath); } catch {}
      }, event.messageID);

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error("❌ Error in sing onReply:", err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage("❌ Failed to download the song. Please try another.", event.threadID, event.messageID);
    }
  }
};
