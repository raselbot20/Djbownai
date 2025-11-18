const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "dustbin",
    version: "5.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Put someone in the dustbin",
    longDescription: "Funny dustbin meme generator without Jimp",
    category: "fun",
    guide: "{pn} @tag | reply"
  },

  onStart: async function ({ api, event }) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    try {
      // ------ Target user ------
      let uid, name;
      const mentions = Object.keys(event.mentions || {});

      if (mentions.length > 0) {
        uid = mentions[0];
        name = event.mentions[uid];
      } else if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
        const info = await api.getUserInfo(uid);
        name = info[uid].name;
      } else {
        uid = event.senderID;
        const info = await api.getUserInfo(uid);
        name = info[uid].name;
      }

      api.setMessageReaction("⏳", messageID, () => {}, true);

      // ------ Download avatar ------
      const avatarURL = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarPath = path.join(__dirname, "tmp", `avatar_${uid}.png`);
      const avatarData = (await axios.get(avatarURL, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(avatarPath, avatarData);

      // ------ Template check ------
      const templatePath = path.join(__dirname, "tmp", "dustbin.png");
      if (!fs.existsSync(templatePath)) {
        return api.sendMessage(
          "❌ Please put 'dustbin.png' in tmp folder!",
          threadID,
          messageID
        );
      }

      // ------ Canvas Load ------
      const template = await loadImage(templatePath);
      const avatar = await loadImage(avatarPath);

      const canvas = createCanvas(template.width, template.height);
      const ctx = canvas.getContext("2d");

      // Draw base template
      ctx.drawImage(template, 0, 0);

      // Draw circular avatar
      const size = 120;
      const x = 162;
      const y = 410;

      ctx.save();
      ctx.beginPath();
      ctx.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, x, y, size, size);
      ctx.restore();

      // Export
      const outputPath = path.join(__dirname, "tmp", `dustbin_${uid}_${Date.now()}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(outputPath, buffer);

      api.setMessageReaction("✅", messageID, () => {}, true);

      // Send Image
      api.sendMessage(
        {
          body: `😂 ${name} 🚮`,
          attachment: fs.createReadStream(outputPath)
        },
        threadID,
        () => {
          fs.unlinkSync(avatarPath);
          fs.unlinkSync(outputPath);
        },
        messageID
      );

    } catch (err) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("⚠️ Error:\n" + err, threadID, messageID);
      console.log(err);
    }
  }
};
