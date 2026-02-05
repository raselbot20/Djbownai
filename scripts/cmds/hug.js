const fs = require("fs-extra");
const { createCanvas, loadImage } = require("canvas");
const axios = require("axios");

const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "hug",
    version: "1.3",
    author: "Rasel Mahhum",
    countDown: 5,
    role: 0,
    longDescription: "{p}hug @mention someone you want to hug 🫂",
    category: "LOVE",
    guide: "{p}hug @mention",
    usePrefix: true,
    premium: false,
    notes: "Keep the author unchanged for command to work"
  },

  onStart: async function ({ api, message, event }) {
    const senderID = event.senderID;
    let targetID;

    const mention = Object.keys(event.mentions);
    if (mention.length > 0) {
      targetID = mention[0];
    } else if (event.type === "message_reply") {
      targetID = event.messageReply.senderID;
    } else {
      return message.reply("⚠️ Please mention or reply to someone to hug.");
    }

    try {
      // Get Facebook profile pictures via Graph API
      const avatarURL1 = `https://graph.facebook.com/${senderID}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
      const avatarURL2 = `https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;

      // Create canvas
      const canvas = createCanvas(800, 750);
      const ctx = canvas.getContext("2d");

      // Background
      const background = await loadImage("https://files.catbox.moe/qxovn9.jpg");
      ctx.drawImage(background, 0, 0, canvas.width, canvas.height);

      // Draw sender avatar
      const avatar1 = await loadImage(avatarURL1);
      ctx.save();
      ctx.beginPath();
      ctx.arc(610, 340, 85, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar1, 525, 255, 170, 170);
      ctx.restore();

      // Draw target avatar
      const avatar2 = await loadImage(avatarURL2);
      ctx.save();
      ctx.beginPath();
      ctx.arc(230, 350, 85, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar2, 145, 265, 170, 170);
      ctx.restore();

      // Save image
      const outputPath = `${__dirname}/tmp/hug_image.png`;
      fs.ensureDirSync(`${__dirname}/tmp`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outputPath, buffer);

      // Send image
      message.reply(
        {
          body: "🫂 A warm hug 💞",
          attachment: fs.createReadStream(outputPath)
        },
        () => fs.unlinkSync(outputPath)
      );

    } catch (error) {
      console.error(error);
      api.sendMessage("⚠️ Error occurred, please try again later.", event.threadID);
    }
  }
};
