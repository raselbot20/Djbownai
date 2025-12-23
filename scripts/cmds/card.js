const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp-compact");

const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "card",
    version: "10.1",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Create love photo with a single Facebook profile picture",
    category: "love"
  },

  onStart: async function ({ api, event, args }) {
    try {
      const mentions = event.mentions || {};
      const mentionIds = Object.keys(mentions);

      // 🔥 NEW: mention না থাকলে UID নেবে
      let girlID;
      if (mentionIds.length) {
        girlID = mentionIds[0];
      } else if (args[0] && /^\d+$/.test(args[0])) {
        girlID = args[0];
      } else {
        return api.sendMessage(
          "⚠️ Please tag someone or provide a UID!",
          event.threadID
        );
      }

      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const girlPath = path.join(tmpDir, `girl_${girlID}.png`);
      const bgPath = path.join(tmpDir, "mylove_bg.jpg");
      const finalPath = path.join(tmpDir, `mylove_final_${Date.now()}.png`);

      async function downloadAvatar(uid, savePath) {
        try {
          const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
          const res = await axios.get(url, { responseType: "arraybuffer" });
          fs.writeFileSync(savePath, res.data);
        } catch (e) {
          const blank = await Jimp.create(500, 670, 0xffffffff);
          await blank.writeAsync(savePath);
        }
      }

      await downloadAvatar(girlID, girlPath);

      let bg;
      if (fs.existsSync(bgPath))
        bg = await Jimp.read(bgPath);
      else
        bg = await Jimp.read(
          "https://drive.google.com/uc?export=download&id=1jnltRDZlNqcO5RSFdKRZK6aZRvSpMGbV"
        );

      let girl = await Jimp.read(girlPath);

      // ---------- Avatar size and position ----------
      const avatarSize = 240;
      const posX = 239;
      const posY = 63;

      girl.resize(avatarSize, avatarSize); // no circle

      bg.composite(girl, posX, posY);

      // ---------- Final message ----------
      const loveText = `═════ Hope you like it ═════`;

      await bg.quality(100).writeAsync(finalPath);

      api.sendMessage(
        { body: loveText, attachment: fs.createReadStream(finalPath) },
        event.threadID,
        () => {
          [girlPath, finalPath].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
        }
      );
    } catch (err) {
      console.log(err);
      api.sendMessage("❌ Error while creating Card picture!", event.threadID);
    }
  }
};
