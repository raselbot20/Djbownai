const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports.config = {
  name: "sauce",
  version: "1.0.2",
  role: 0,
  author: "Rasel Mahmud",
  description: "Find anime source from image (trace.moe + AniList)",
  category: "anime",
  usages: "[reply to image | image URL]",
  cooldowns: 5
};

async function tryGetStreamFromUrl(url) {
  try {
    if (global.utils && typeof global.utils.getStreamFromURL === "function") {
      return await global.utils.getStreamFromURL(url);
    }
  } catch (_) {}
  return null;
}

module.exports.onStart = async function ({ api, event, args }) {
  const { threadID, messageID } = event;

  try {
    let imageUrl = null;

    // reply image
    if (event.type === "message_reply" && event.messageReply?.attachments?.length) {
      imageUrl = event.messageReply.attachments[0].url;
    }
    // direct image
    else if (event.attachments?.length) {
      imageUrl = event.attachments[0].url;
    }
    // url argument
    else if (args[0]?.startsWith("http")) {
      imageUrl = args[0];
    }

    if (!imageUrl) {
      return api.sendMessage(
        "❌ Reply to an anime image or give image URL",
        threadID,
        messageID
      );
    }

    // trace.moe search
    let res;
    try {
      res = await axios.get(
        `https://api.trace.moe/search?anilistInfo&url=${encodeURIComponent(imageUrl)}`,
        { timeout: 20000 }
      );
    } catch {
      const img = await axios.get(imageUrl, { responseType: "arraybuffer" });
      res = await axios.post(
        "https://api.trace.moe/search?anilistInfo",
        img.data,
        { headers: { "Content-Type": "image/jpeg" } }
      );
    }

    if (!res.data?.result?.length) {
      return api.sendMessage("❌ No anime found!", threadID, messageID);
    }

    const r = res.data.result[0];
    const a = r.anilist;

    const time = `${Math.floor(r.from / 60)}:${String(
      Math.floor(r.from % 60)
    ).padStart(2, "0")}`;

    const msg =
`🎬 Anime Info

📛 Romaji: ${a.title.romaji || "N/A"}
📛 English: ${a.title.english || "N/A"}
📛 Native: ${a.title.native || "N/A"}

📺 Episode: ${r.episode || "N/A"}
⏱️ Time: ${time}
🎯 Similarity: ${(r.similarity * 100).toFixed(2)}%

📊 Episodes: ${a.episodes || "N/A"}
📅 Season: ${a.season || "N/A"} ${a.seasonYear || ""}
⭐ Score: ${a.averageScore || "N/A"}/100
🎭 Genres: ${(a.genres || []).join(", ")}`;

    const cover =
      a.coverImage?.extraLarge ||
      a.coverImage?.large ||
      a.coverImage?.medium;

    if (cover) {
      const stream = await tryGetStreamFromUrl(cover);
      if (stream) {
        return api.sendMessage(
          { body: msg, attachment: stream },
          threadID,
          messageID
        );
      }
    }

    return api.sendMessage(msg, threadID, messageID);

  } catch (e) {
    console.error(e);
    return api.sendMessage("⚠️ Error occurred!", threadID, messageID);
  }
};
