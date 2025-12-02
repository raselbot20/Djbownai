const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp-compact");

const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "mylove",
    version: "9.8",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Create couple love photo with circular Facebook profile pictures",
    category: "love"
  },

  onStart: async function ({ api, event }) {
    try {
      const mentions = event.mentions || {};
      const mentionIds = Object.keys(mentions);

      if (!mentionIds.length && !event.messageReply)
        return api.sendMessage("⚠️ Please tag someone or reply to a message!", event.threadID);

      const boyID = event.senderID;
      const girlID = mentionIds.length ? mentionIds[0] : event.messageReply.senderID;
      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const boyPath = path.join(tmpDir, `boy_${boyID}.png`);
      const girlPath = path.join(tmpDir, `girl_${girlID}.png`);
      const bgPath = path.join(tmpDir, "mylove_bg.jpg");
      const finalPath = path.join(tmpDir, `mylove_final_${Date.now()}.png`);

      async function downloadAvatar(uid, savePath) {
        try {
          const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
          const res = await axios.get(url, { responseType: "arraybuffer" });
          fs.writeFileSync(savePath, res.data);
        } catch (e) {
          const blank = await Jimp.create(512, 512, 0xffffffff);
          await blank.writeAsync(savePath);
        }
      }

      await downloadAvatar(boyID, boyPath);
      await downloadAvatar(girlID, girlPath);

      let bg;
      if (fs.existsSync(bgPath)) bg = await Jimp.read(bgPath);
      else bg = await Jimp.read("https://drive.google.com/uc?export=download&id=13llWo6g5ngnh3tgZXApnc47lcOQlMd86");

      let boy = await Jimp.read(boyPath);
      let girl = await Jimp.read(girlPath);

      const profileSize = 875;
      boy.resize(profileSize, profileSize).circle();
      girl.resize(profileSize, profileSize).circle();

      const boyX = 355;
      const girlX = bg.bitmap.width - profileSize - 355;
      const finalY = 530;

      bg.composite(boy, boyX, finalY);
      bg.composite(girl, girlX, finalY);

      // ---------- Random love percent ----------
      const lovePercent = Math.floor(Math.random() * 101);

      // ---------- Final message ----------
      const loveText = `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
🔥${lovePercent}%💞[🄼🅈 🄻🄾🅅🄴]💞${lovePercent}%🔥
╚═══════════════════╝`;

      await bg.quality(100).writeAsync(finalPath);

      api.sendMessage(
        { body: loveText, attachment: fs.createReadStream(finalPath) },
        event.threadID,
        () => {
          [bgPath, girlPath, boyPath, finalPath].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
        }
      );

    } catch (err) {
      console.log(err);
      api.sendMessage("❌ Error while creating My Love picture!", event.threadID);
    }
  }
};
