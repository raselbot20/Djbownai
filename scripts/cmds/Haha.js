const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "haha",
    version: "1.2.0",
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

      // Background
      const bgPath = path.join(cacheDir, `haha_bg_${Date.now()}.jpg`);
      const bgData = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
      await fs.outputFile(bgPath, bgData);
      const bg = await jimp.read(bgPath);

      // User avatar
      const avatarData = (await axios.get(
        `https://graph.facebook.com/${userID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;
      const avatarPath = path.join(cacheDir, `user_${Date.now()}.png`);
      await fs.outputFile(avatarPath, avatarData);
      const userImg = await jimp.read(avatarPath);
      userImg.circle();

      // Composite: প্রোফাইল বড়, ডানদিকে 200px, উপরে ওঠা 100px, নামানো 50px + আরো 20px
      const userSize = 200;
      const xOffset = (bg.getWidth() / 2) + 200; // ডানদিকে 200px
      const yOffset = (bg.getHeight() / 2) - 360; // উপরে উঠানো -380 + 20 নিচে
      bg.composite(userImg.resize(userSize, userSize), xOffset, yOffset);

      // Add username on top
      const font = await jimp.loadFont(jimp.FONT_SANS_32_BLACK);
      const text = `😂 Haha ${userName}!`;
      const textX = 50;
      const textY = 10;
      bg.print(font, textX, textY, text);

      // Save final image
      const finalPath = path.join(cacheDir, `haha_${Date.now()}.png`);
      await bg.writeAsync(finalPath);

      // Send message with ✅ reaction
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
