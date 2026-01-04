const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp-compact");

const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

const position = {
  boy: {
    right: 200,
    left: 0,
    down: 45,
    up: 0
  },
  girl: {
    right: 2,
    left: 5,
    down: 240,
    up: 5
  }
};

module.exports = {
  config: {
    name: "slap",
    version: "10.1",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "slap someone",
    category: "fun"
  },

  onStart: async function ({ api, event }) {
    try {
      const boyID = event.senderID;
      let girlID = null;

      if (event.mentions && Object.keys(event.mentions).length > 0) {
        girlID = Object.keys(event.mentions)[0];
      } else if (event.messageReply) {
        girlID = event.messageReply.senderID;
      } else {
        const uidMatch = event.body.match(/\b\d{6,20}\b/);
        if (uidMatch) girlID = uidMatch[0];
      }

      if (!girlID) {
        return api.sendMessage(
          "Use: tag | reply | uid\nExample:\n• slap @user\n• reply + slap\n• slap 1000xxxx",
          event.threadID
        );
      }

      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const boyPath = path.join(tmpDir, `boy_${boyID}.png`);
      const girlPath = path.join(tmpDir, `girl_${girlID}.png`);
      const finalPath = path.join(tmpDir, `slap_${Date.now()}.png`);

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

      const bg = await Jimp.read(
        "https://drive.google.com/uc?export=download&id=12TjttPlyc48cxmlMqa6eFHxYBTHQ1DH6"
      );

      const boy = await Jimp.read(boyPath);
      const girl = await Jimp.read(girlPath);

      // 🔥 DIFFERENT SIZES
      const boySize = 220;   // boy is 100 bigger
      const girlSize = 200;  // girl normal

      boy.resize(boySize, boySize).circle();
      girl.resize(girlSize, girlSize).circle();

      // BASE POSITION
      const baseBoy = { x: 150, y: 26 };
      const baseGirl = { x: bg.bitmap.width - girlSize - 217, y: 26 };

      // FINAL POSITION
      const boyX = baseBoy.x + position.boy.right - position.boy.left;
      const boyY = baseBoy.y + position.boy.down - position.boy.up;

      const girlX = baseGirl.x + position.girl.right - position.girl.left;
      const girlY = baseGirl.y + position.girl.down - position.girl.up;

      bg.composite(boy, boyX, boyY);
      bg.composite(girl, girlX, girlY);

      const slapText = `❰😡 SLAP !! 😡❱`;

      await bg.quality(100).writeAsync(finalPath);

      api.sendMessage(
        {
          body: slapText,
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
      api.sendMessage("❌ Error while creating slap image!", event.threadID);
    }
  }
};
