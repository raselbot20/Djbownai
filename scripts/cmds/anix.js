const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "anix",
    version: "2.0",
    author: "RAFI7X",
    category: "ai-image",
    role: 0,
    shortDescription: "Generate Anime Image",
    longDescription: "Generate anime style images.",
    guide: "{pn} <prompt>",
    countDown: 5,
  },

  onStart: async function ({ api, event, args, message }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return message.reply("❌ Please provide a prompt.");
    }

    // 1. Add Loading Reaction
    api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

    try {
      // New API Endpoint
      const apiUrl = `https://fahim-api-demo.onrender.com/ai/text2image/gen/v2?prompt=${encodeURIComponent(prompt)}&ratio=&model=`;

      // 2. Call API to get the image URL (JSON Response)
      const response = await axios.get(apiUrl);
      const data = response.data;

      if (!data.success || !data.result) {
        throw new Error("API failed to generate image URL.");
      }

      // 3. Download the actual image from the URL provided in 'result'
      const imageResponse = await axios.get(data.result, { responseType: "arraybuffer" });

      // 4. Setup Cache
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

      const imgPath = path.join(cacheDir, `anix_${Date.now()}.png`);
      fs.writeFileSync(imgPath, Buffer.from(imageResponse.data));

      // 5. Success Reaction
      api.setMessageReaction("✅", event.messageID, event.threadID, () => {}, true);

      // 6. Send Image (No Text Body)
      await message.reply({
        attachment: fs.createReadStream(imgPath)
      });

      // 7. Cleanup
      fs.unlinkSync(imgPath);

    } catch (error) {
      console.error("Anix Error:", error);
      api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      message.reply("❌ Failed to generate image.");
    }
  },
};
