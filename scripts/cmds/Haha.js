const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage, registerFont } = require("canvas");

module.exports = {
  config: {
    name: "haha",
    version: "5.0",
    hasPermssion: 0,
    credits: "Rasel Mahmud",
    description: "Funny pic with mentioned/replied user's profile, name on top, bigger and moved",
    commandCategory: "fun",
    usages: "[mention/reply]",
    cooldowns: 5
  },

  onLoad: async () => {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageReply, mentions, messageID } = event;
    let userID = null;
    let userName = "";

    if (Object.keys(mentions).length > 0) {
      userID = Object.keys(mentions)[0];
      userName = mentions[userID];
    } else if (messageReply) {
      userID = messageReply.senderID;
      const info = await api.getUserInfo(userID);
      userName = info[userID].name;
    }

    if (!userID) return api.sendMessage("⚠️ Please tag or reply to someone!", threadID);

    const bgURL = "https://drive.google.com/uc?export=download&id=1lClvnrDgsfpo5whgt0AiJL3iu-yDVIlJ";

    try {
      // React ⏳
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      // Load Background
      const bgPath = path.join(cacheDir, `haha_bg_${Date.now()}.jpg`);
      const bgData = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
      await fs.outputFile(bgPath, bgData);
      const bg = await loadImage(bgPath);

      // Load Avatar
      const avatarData = (await axios.get(
        `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;
      const avatarPath = path.join(cacheDir, `user_${Date.now()}.png`);
      await fs.outputFile(avatarPath, avatarData);
      const avatar = await loadImage(avatarPath);

      // Create canvas
      const canvas = createCanvas(bg.width, bg.height);
      const ctx = canvas.getContext("2d");

      // Draw background
      ctx.drawImage(bg, 0, 0);

      // Draw circular avatar
      const userSize = 200;
      const xOffset = (bg.width / 2) + 200;
      const yOffset = (bg.height / 2) - 360;

      ctx.save();
      ctx.beginPath();
      ctx.arc(xOffset + userSize / 2, yOffset + userSize / 2, userSize / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(avatar, xOffset, yOffset, userSize, userSize);
      ctx.restore();

      // Add username text
      ctx.fillStyle = "black";
      ctx.font = "32px Sans";
      ctx.fillText(`😂 Haha ${userName}!`, 50, 50);

      // Save final image
      const finalPath = path.join(cacheDir, `haha_${Date.now()}.png`);
      const buffer = canvas.toBuffer("image/png");
      await fs.outputFile(finalPath, buffer);

      // Send message
      api.sendMessage(
        { body: `😂 ${userName}!`, attachment: fs.createReadStream(finalPath) },
        threadID,
        () => {
          [bgPath, avatarPath, finalPath].forEach(file => { if (fs.existsSync(file)) fs.unlinkSync(file); });
          api.setMessageReaction("✅", messageID, () => {}, true);
        }
      );

    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", messageID, () => {}, true);
      api.sendMessage("❌ Error while generating the pic!", threadID);
    }
  }
};
