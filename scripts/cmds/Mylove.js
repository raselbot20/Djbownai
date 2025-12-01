const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "mylove",
    version: "3.6.2",
    author: "Rasel Mahmud",
    countDown: 0,
    role: 0,
    shortDescription: "Create a couple pic with avatars (BF left, GF right) and love %",
    longDescription: "Generate a love-style couple image where the sender is always left (boy) and tagged/replied user is right, showing love %.",
    category: "love",
    guide: "{pn} @mention"
  },

  onStart: async function ({ api, event }) {
    const { threadID, senderID, messageReply, mentions } = event;

    let girlID = null;
    if (Object.keys(mentions).length > 0) girlID = Object.keys(mentions)[0];
    else if (messageReply) girlID = messageReply.senderID;

    if (!girlID)
      return api.sendMessage("⚠️ Please tag or reply to someone!", threadID);

    const boyID = senderID;

    const bgURL = "https://drive.google.com/uc?export=download&id=13llWo6g5ngnh3tgZXApnc47lcOQlMd86";

    try {
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);

      // Background
      const bgPath = path.join(cacheDir, `bg_${Date.now()}.jpg`);
      const bgData = (await axios.get(bgURL, { responseType: "arraybuffer" })).data;
      await fs.outputFile(bgPath, bgData);
      const bg = await jimp.read(bgPath);
      bg.resize(800, jimp.AUTO);

      // Girl avatar
      const girlAvatar = (await axios.get(
        `https://graph.facebook.com/${girlID}/picture?width=256&height=256&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;
      const girlPath = path.join(cacheDir, `girl_${Date.now()}.png`);
      await fs.outputFile(girlPath, girlAvatar);
      const girlImg = await jimp.read(girlPath);
      girlImg.circle().resize(210, 210); // আরও 20px smaller

      // Boy avatar
      const boyAvatar = (await axios.get(
        `https://graph.facebook.com/${boyID}/picture?width=256&height=256&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
        { responseType: "arraybuffer" }
      )).data;
      const boyPath = path.join(cacheDir, `boy_${Date.now()}.png`);
      await fs.outputFile(boyPath, boyAvatar);
      const boyImg = await jimp.read(boyPath);
      boyImg.circle().resize(210, 210); // আরও 20px smaller

      // Positioning
      const yOffset = (bg.getHeight() / 2) - 105 + 13; // 210/2 = 105
      const xOffsetBoy = 110 - 20; 
      const xOffsetGirl = bg.getWidth() - girlImg.getWidth() - (110 - 20);

      bg.composite(boyImg, xOffsetBoy, yOffset);
      bg.composite(girlImg, xOffsetGirl, yOffset);

      // Final image
      const finalPath = path.join(cacheDir, `mylove_${Date.now()}.png`);
      await bg.writeAsync(finalPath);

      // Names + %
      const boyName = (await api.getUserInfo(boyID))[boyID].name;
      const girlName = (await api.getUserInfo(girlID))[girlID].name;
      const boyInitial = boyName.charAt(0).toUpperCase();
      const girlInitial = girlName.charAt(0).toUpperCase();
      const lovePercent = Math.floor(Math.random() * 101);

      const loveText =
`╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
🔥${lovePercent}%💞 My Love 💞 💎 ${boyInitial} + ${girlInitial} 💎
╚═══════════════════╝`;

      api.sendMessage(
        { body: loveText, attachment: fs.createReadStream(finalPath) },
        threadID,
        () => {
          [bgPath, girlPath, boyPath, finalPath].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
        }
      );

    } catch (e) {
      console.log(e);
      api.sendMessage("❌ Error while creating My Love picture!", threadID);
    }
  },

  onLoad: async () => {
    const dir = path.join(__dirname, "cache");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir);
  }
};
