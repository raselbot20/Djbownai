const axios = require("axios");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const f = new Set();

const a = (secret) => {
  const m = Math.floor(Date.now() / 60000).toString();
  const h = crypto.createHmac("sha256", secret);
  h.update(m);
  return h.digest("hex");
};

const b = (text) => {
  const r = /(https?:\/\/[^\s]+)/g;
  return text.match(r) || [];
};

const c = [
  "tiktok.com",
  "instagram.com",
  "facebook.com",
  "youtube.com",
  "youtu.be",
  "spotify.com",
  "soundcloud.com",
  "capcut.com",
];

const isFacebookVideoLink = (url) => {
  return /(facebook\.com\/(reel|watch|share|.*\/videos?\/))/i.test(url);
};

const isInstagramVideoLink = (url) => {
  return /(instagram\.com\/(reel|p|tv)\/)/i.test(url);
};

const d = (url) => c.some((p) => url.includes(p));

const e = (url) => {
  if (url.includes("tiktok.com")) return "TikTok";
  if (url.includes("instagram.com")) return "Instagram";
  if (url.includes("facebook.com")) return "Facebook";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "YouTube";
  if (url.includes("spotify.com")) return "Spotify";
  if (url.includes("soundcloud.com")) return "SoundCloud";
  if (url.includes("capcut.com")) return "CapCut";
  return "Unknown";
};

const g = (text, l) =>
  text && text.length > l ? text.slice(0, l) + "..." : text || "N/A";

const h = (s) =>
  !s ? "N/A" : (s / (1024 * 1024)).toFixed(2) + " MB";

const i = async (api, event, url) => {
  const tid = event.threadID;
  const mid = event.messageID;

  if (f.has(mid)) return;
  f.add(mid);

  try {
    api.setMessageReaction("⏳", mid, () => {}, true);
    const k = new Date().getUTCMinutes().toString();
    const key = a(k);

    const { data } = await axios.post(
      "http://arydl.vercel.app/api/uplink",
      { url },
      {
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        timeout: 30000,
      }
    );

    if (data.status !== "success" || !data.data) {
      api.setMessageReaction("❌", mid, () => {}, true);
      return api.sendMessage(
        "❌ Failed to download: " + (data.message || "Unknown error"),
        tid,
        mid
      );
    }

    const dl = data.data.data;
    let u,
      n,
      info = {};

    if (dl.nowm) {
      u = dl.nowm;
      n = `${dl.title || "video"}.mp4`;
      info = {
        type: "Video",
        title: dl.title,
        duration: dl.duration,
        views: dl.views,
        likes: dl.like || dl.likes,
        author: dl.author,
      };
    } else if (dl.audio) {
      u = dl.audio;
      n = `${dl.title || "audio"}.mp3`;
      info = {
        type: "Audio",
       	duration: dl.duration,
        artist: dl.artist || dl.author,
        plays: dl.plays || dl.views,
      };
    } else if (dl.download && dl.download.length > 0) {
      const fi = dl.download[0];
      u = fi.url;
      const ext = fi.ext || "jpg";
      n = `${dl.title || "media"}.${ext}`;
      info = {
        type: ext.includes("mp4") ? "Video" : "Image",
        title: dl.title,
        totalItems: dl.download.length,
        currentItem: 1,
      };
    } else if (dl.media && dl.media.length > 0) {
      const mi = dl.media.find((m) => m.ext === "mp4") || dl.media[0];
      u = mi.url;
      n = `${dl.title || "video"}.${mi.ext}`;
      info = {
        type: "Video",
        title: dl.title,
        duration: dl.duration,
        views: dl.views,
        quality: mi.quality,
        size: mi.filesize,
      };
    } else {
      api.setMessageReaction("❌", mid, () => {}, true);
      return api.sendMessage("⚠️ No downloadable content found.", tid, mid);
    }

    const p = path.join(
      __dirname,
      "cache",
      n.replace(/[^a-zA-Z0-9.-]/g, "_")
    );
    if (!fs.existsSync(path.join(__dirname, "cache")))
      fs.mkdirSync(path.join(__dirname, "cache"), { recursive: true });

    const res = await axios({
      method: "GET",
      url: u,
      responseType: "stream",
      timeout: 60000,
    });
    const w = fs.createWriteStream(p);
    res.data.pipe(w);

    w.on("finish", () => {
      api.setMessageReaction("✅", mid, () => {}, true);
      const s = fs.statSync(p);
      const size = s.size;
      let txt = `✅ Download Complete!\n\n📱 Platform: ${e(
        url
      )}\n📄 Type: ${info.type}`;
      if (info.duration) txt += `⏱️ Duration: ${info.duration}\n`;
      if (info.views) txt += `👀 Views: ${info.views}\n`;
      if (info.likes) txt += `❤️ Likes: ${info.likes}\n`;
      if (info.author) txt += `👤 Author: ${g(info.author, 30)}\n`;
      if (info.artist) txt += `🎵 Artist: ${g(info.artist, 30)}\n`;
      if (info.plays) txt += `▶️ Plays: ${info.plays}\n`;
      if (info.quality) txt += `🎬 Quality: ${info.quality}\n`;
      if (info.totalItems > 1)
        txt += `📊 Items: ${info.currentItem}/${info.totalItems}\n`;
      txt += `📦 File Size: ${h(size)}\n`;

      api.sendMessage(
        { body: txt, attachment: fs.createReadStream(p) },
        tid,
        () => {
          try {
            fs.unlinkSync(p);
          } catch (e) {}
        },
        mid
      );
    });

    w.on("error", () => {
      api.setMessageReaction("❌", mid, () => {}, true);
      api.sendMessage("❌ Failed to save file.", tid, mid);
      try {
        fs.unlinkSync(p);
      } catch (e) {}
    });
  } catch (err) {
    api.setMessageReaction("❌", event.messageID, () => {}, true);
    let msg = "❌ Download failed: ";
    if (err.response)
      msg += err.response.data?.message || `HTTP ${err.response.status}`;
    else if (err.code === "ECONNREFUSED")
      msg += "Cannot connect to server.";
    else if (err.code === "ETIMEDOUT") msg += "Request timed out.";
    else msg += err.message;
    api.sendMessage(msg, event.threadID, event.messageID);
  }
};

module.exports = {
  config: {
    name: "dl",
    version: "3.0",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: "Download media from supported platforms",
    longDescription:
      "Download video/audio from TikTok, Instagram (reel/post/tv), Facebook (reels/videos/watch/share), YouTube, Spotify, SoundCloud, and CapCut with detailed info.",
    category: "media",
    guide: { en: "{pn} <url> or reply to a message containing a URL." },
  },

  onStart: async function ({ api, event, args }) {
    let u = args[0];
    if (!u && event.messageReply?.body)
      u = b(event.messageReply.body).find((x) => d(x));
    if (!u) return;

    if (u.includes("facebook.com") && !isFacebookVideoLink(u)) return;
    if (u.includes("instagram.com") && !isInstagramVideoLink(u)) return;

    await i(api, event, u);
  },

  onChat: async function ({ api, event }) {
    const botID = api.getCurrentUserID();
    if (event.senderID === botID) return;
    if (event.body?.startsWith("dl ")) return;

    let u = b(event.body || "").find((x) => d(x));
    if (!u && event.messageReply?.body)
      u = b(event.messageReply.body).find((x) => d(x));
    if (!u) return;

    if (u.includes("facebook.com") && !isFacebookVideoLink(u)) return;
    if (u.includes("instagram.com") && !isInstagramVideoLink(u)) return;

    await i(api, event, u);
  },
};
