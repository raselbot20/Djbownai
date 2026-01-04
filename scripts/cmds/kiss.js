const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp-compact");

const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "kiss",
    version: "9.8",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "kiss someone",
    category: "love"
  },

  onStart: async function ({ api, event }) {
    try {
      const boyID = event.senderID;
      let girlID = null;

      // ---------- TAG ----------
      if (event.mentions && Object.keys(event.mentions).length > 0) {
        girlID = Object.keys(event.mentions)[0];
      }

      // ---------- REPLY ----------
      else if (event.messageReply) {
        girlID = event.messageReply.senderID;
      }

      // ---------- UID ----------
      else {
        const uidMatch = event.body.match(/\b\d{6,20}\b/);
        if (uidMatch) girlID = uidMatch[0];
      }

      if (!girlID) {
        return api.sendMessage(
          "Use: tag | reply | uid\nExample:\n• kiss @user\n• reply + kiss\n• kiss 1000xxxx",
          event.threadID
        );
      }

      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const boyPath = path.join(tmpDir, `boy_${boyID}.png`);
      const girlPath = path.join(tmpDir, `girl_${girlID}.png`);
      const finalPath = path.join(tmpDir, `kiss_${Date.now()}.png`);

      // ---------- Avatar Download ----------
      async function downloadAvatar(uid, savePath) {
        try {
          const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=${ACCESS_TOKEN}`;
          const res = await axios.get(url, { responseType: "arraybuffer" });
          fs.writeFileSync(savePath, res.data);
        } catch {
          const blank = await Jimp.create(512, 512, 0xffffffff);
          await blank.writeAsync(savePath);
        }
      }

      await downloadAvatar(boyID, boyPath);
      await downloadAvatar(girlID, girlPath);

      // ---------- Background ----------
      const bg = await Jimp.read(
        "https://drive.google.com/uc?export=download&id=1lEfftfbhs0dYcfeJewwjaDvV0Y1VheOf"
      );

      const boy = await Jimp.read(boyPath);
      const girl = await Jimp.read(girlPath);

      const profileSize = 200;
      boy.resize(profileSize, profileSize).circle();
      girl.resize(profileSize, profileSize).circle();

      const boyX = 150;
      const girlX = bg.bitmap.width - profileSize - 217;
      const finalY = 26;

      bg.composite(boy, boyX, finalY);
      bg.composite(girl, girlX, finalY);

      const lovePercent = Math.floor(Math.random() * 101);

      const loveText =
`╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
🔥${lovePercent}%😘[💋Ⓤ︎Ⓜ︎Ⓜ︎Ⓐ︎💋]😘${lovePercent}%🔥
╚═══════════════════╝`;

      await bg.quality(100).writeAsync(finalPath);

      api.sendMessage(
        {
          body: loveText,
          attachment: fs.createReadStream(finalPath)
        },
        event.threadID,
        () => {
          [boyPath, girlPath, finalPath].forEach(f => {
            if (fs.existsSync(f)) fs.unlinkSync(f);
          });
        }
      );

    } catch (err) {
      console.log(err);
      api.sendMessage("❌ Error while creating kiss image!", event.threadID);
    }
  }
};
