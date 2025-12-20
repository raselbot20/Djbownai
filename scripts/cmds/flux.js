const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "flux",
    version: "1.0",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: "Generate AI images using Flux",
    longDescription: "Creates images from your prompt using the Flux.",
    category: "ai",
    guide: {
      en: "{pn} <prompt>\nExample: {pn} a cute cat sitting on a piano"
    }
  },

  onStart: async function ({ api, event, args }) {
    const prompt = args.join(" ");
    if (!prompt) {
      return api.sendMessage(
        "⚠️ Please provide a prompt!\nExample: flux a cute cat with sunglasses",
        event.threadID,
        event.messageID
      );
    }

    const tid = event.threadID;
    const filePath = path.join(__dirname, "flux.png");

    api.sendMessage(
      `⏳ Generating your Flux AI image...\n🎨 Prompt: ${prompt}`,
      tid,
      async (err, info) => {
        if (err) return;

        const genMsgID = info.messageID; 

        try {
          const response = await axios({
            method: "GET",
            url: `https://aryapio.onrender.com/ai-image/flux?prompt=${encodeURIComponent(prompt)}&apikey=aryan123`,
            responseType: "stream"
          });

          const writer = fs.createWriteStream(filePath);
          response.data.pipe(writer);

          writer.on("finish", () => {
            api.sendMessage(
              {
                body: `✅ Here is your Flux AI image!\n\n📝 Prompt: ${prompt}`,
                attachment: fs.createReadStream(filePath)
              },
              tid,
              () => {
                fs.unlinkSync(filePath);
                api.unsendMessage(genMsgID);
              },
              event.messageID
            );
          });

          writer.on("error", () => {
            api.sendMessage("❌ Failed to save image file.", tid, event.messageID);
            api.unsendMessage(genMsgID);
          });

        } catch (err) {
          console.error(err);
          api.sendMessage("❌ Error: Unable to generate image. Please try again later.", tid, event.messageID);
          api.unsendMessage(genMsgID);
        }
      }
    );
  }
};
