const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "animefy",
    version: "1.0",
    role: 0,
    author: "Aryan Chauhan",
    countDown: 10,
    longDescription: "Convert an image into anime style using Animefy AI.",
    category: "image",
    guide: {
      en: "{pn} reply to an image [prompt] [gender] [width height]"
    }
  },

  onStart: async function ({ message, event, args }) {
    if (
      !event.messageReply ||
      !event.messageReply.attachments ||
      !event.messageReply.attachments[0] ||
      event.messageReply.attachments[0].type !== "photo"
    ) {
      return message.reply("⚠ Please reply to an image to convert it into anime style.");
    }

    const originalUrl = event.messageReply.attachments[0].url;

    let prompt = args[0] || "A beautiful anime character";
    let gender = args[1] && ["men", "women"].includes(args[1].toLowerCase()) ? args[1].toLowerCase() : "men";
    let width = args[2] && !isNaN(args[2]) ? parseInt(args[2]) : 768;
    let height = args[3] && !isNaN(args[3]) ? parseInt(args[3]) : 768;

    const apiUrl = `https://arychauhann.onrender.com/api/animefy?imageUrl=${encodeURIComponent(originalUrl)}&prompt=${encodeURIComponent(prompt)}&gender=${gender}&width=${width}&height=${height}`;

    message.reply("🎨 Generating your anime-style image... Please wait, this may take some time.", async (err, info) => {
      try {
        const { data } = await axios.get(apiUrl);

        if (!data || !data.imageUrl) {
          return message.reply("❌ Failed to generate anime-style image. API returned no result.");
        }

        const filePath = path.join(__dirname, `animefy_${Date.now()}.png`);
        const imgRes = await axios.get(data.imageUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(filePath, Buffer.from(imgRes.data));

        await message.reply({
          body: `✅ Here is your anime-style image! 🌸\nPrompt: ${prompt}\nGender: ${gender}\nSize: ${width}x${height}`,
          attachment: fs.createReadStream(filePath)
        });

        fs.unlinkSync(filePath);

        message.unsend(info.messageID);
      } catch (error) {
        console.error("animefy.onStart error:", error?.response?.data || error.message);
        message.reply("❌ There was an error generating your anime-style image. Please try again later.");
      }
    });
  }
};
