const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "4k",
    aliases: ["upscale"],
    version: "1.6",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Upscale image to 4K" },
    longDescription: { en: "Send an image URL or reply to an image, bot will upscale it using Ary API from GitHub." },
    category: "media",
    guide: { en: "{pn} <image URL>\n\nOr reply to an image with {pn}" }
  },

  onStart: function ({ api, args, event }) {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

    let imageUrl = args[0];

    if (!imageUrl && event.messageReply && event.messageReply.attachments?.length > 0) {
      imageUrl = event.messageReply.attachments[0].url;
    }

    if (!imageUrl) {
      return api.sendMessage("❌ Reply to an image or send image URL.", event.threadID, event.messageID);
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

axios.get("https://raw.githubusercontent.com/arychauhann/APIs/refs/heads/main/api.json")
      .then(function (response) {
        const baseApi = response.data?.ary;
        if (!baseApi) throw new Error("ARY API not found in GitHub JSON");

        const apiUrl = `${baseApi}/api/videoconverter?url=${encodeURIComponent(imageUrl)}&scale=2`;
        return axios.get(apiUrl, { timeout: 30000 });
      })

      .then(function (res) {
        const upscaledUrl = res.data?.result;
        if (!upscaledUrl) throw new Error("No 'result' field from ARY API");

        return axios.get(upscaledUrl, { responseType: "stream" });
      })

      .then(function (fileRes) {
        const filename = `4k_${Date.now()}.jpg`;
        const filepath = path.join(CACHE_DIR, filename);
        const writer = fs.createWriteStream(filepath);

        fileRes.data.pipe(writer);

        writer.on("finish", function () {
          api.sendMessage({
            body: "✅ Here is your 4K upscaled image:",
            attachment: fs.createReadStream(filepath)
          }, event.threadID, function () {
            try { fs.unlinkSync(filepath); } catch {}
          }, event.messageID);

          api.setMessageReaction("✅", event.messageID, () => {}, true);
        });

        writer.on("error", function (err) {
          console.error("File error:", err.message);
          api.sendMessage("❌ Could not save image.", event.threadID, event.messageID);
          api.setMessageReaction("❌", event.messageID, () => {}, true);
        });
      })

      .catch(function (err) {
        console.error("Upscale error:", err.message);
        api.sendMessage("❌ Failed to upscale the image.\n" + err.message, event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      });
  }
};
