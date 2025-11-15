const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CACHE_DIR = path.join(__dirname, "cache");

module.exports = {
  config: {
    name: "neural",
    version: "1.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Generate AI images using Shizu NeuralBlender API" },
    longDescription: {
      en: "Generate high-quality AI images based on your text prompt using the NeuralBlender model from ShizuAPI."
    },
    category: "ai",
    guide: { en: "{pn} <prompt>\n\nExample:\n{pn} a beautiful anime girl standing in the rain" }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0])
      return api.sendMessage("❌ Please provide a prompt for image generation.", event.threadID, event.messageID);

    const prompt = args.join(" ");
    api.setMessageReaction("🎨", event.messageID, () => {}, true);

    try {
      if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

      const url = `https://shizuapi.onrender.com/api/neuralblender?prompt=${encodeURIComponent(prompt)}`;
      const tempPath = path.join(CACHE_DIR, `neural_${Date.now()}.png`);

      const response = await axios({
        url,
        method: "GET",
        responseType: "stream",
        timeout: 120000
      });

      const writer = fs.createWriteStream(tempPath);
      response.data.pipe(writer);

      writer.on("finish", () => {
        api.sendMessage(
          {
            body: ``,
            attachment: fs.createReadStream(tempPath)
          },
          event.threadID,
          () => {
            try { fs.unlinkSync(tempPath); } catch {}
          },
          event.messageID
        );

        api.setMessageReaction("✅", event.messageID, () => {}, true);
      });

      writer.on("error", err => {
        console.error("❌ File write error:", err.message);
        api.sendMessage("❌ Error saving the image file.", event.threadID, event.messageID);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      });

    } catch (err) {
      console.error("❌ Error in neural command:", err.message);
      api.sendMessage("❌ Failed to generate image. Please try again later.", event.threadID, event.messageID);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
