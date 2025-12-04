const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp-compact");

const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "birthday",
		aliases: ["brd"],
    version: "10.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    description: "🎂 Make a birthday wish card with round profile",
    category: "birthday"
  },

  guide: { en: "{pn} <@tag>" },

  onStart: async function ({ api, event }) {
    try {
      const mentions = event.mentions || {};
      const mentionIds = Object.keys(mentions);

      if (!mentionIds.length)
        return api.sendMessage("⚠️ Please tag someone!", event.threadID);

      // ⭐ Only one profile → The mentioned person
      const targetID = mentionIds[0];

      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const avatarPath = path.join(tmpDir, `birthday_${targetID}.png`);
      const bgPath = path.join(tmpDir, "birthday_bg.jpg");
      const finalPath = path.join(tmpDir, `birthday_final_${Date.now()}.png`);

      // ⭐ Download Avatar
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

      await downloadAvatar(targetID, avatarPath);

      // ⭐ Background load
      let bg;
      if (fs.existsSync(bgPath)) {
        bg = await Jimp.read(bgPath);
      } else {
        bg = await Jimp.read("https://drive.google.com/uc?export=download&id=1etAD7ZzbXuLHsvljmL3-y83TVeKKxm4b");
      }

      let avatar = await Jimp.read(avatarPath);

      // ⭐ Round profile
      const size = 328;
      avatar.resize(size, size).circle();

      // ⭐ Center Position
      const posX = (bg.bitmap.width - size) / 9;
      const posY = 237;

      bg.composite(avatar, posX, posY);

      // ⭐ Final Wish Text
      const wishText = `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱══════╗
			🎉${mentions[targetID]}🎉
				  	🎂 𝐇𝐚𝐩𝐩𝐲 𝐁𝐢𝐫𝐭𝐡𝐝𝐚𝐲 🎂
	🎀 Many Many Happy 
													Returns Of The Day!
╚════════════════════╝`;

      await bg.quality(100).writeAsync(finalPath);

      api.sendMessage(
        {
          body: wishText,
          attachment: fs.createReadStream(finalPath)
        },
        event.threadID,
        () => {
          [bgPath, avatarPath, finalPath].forEach(file => {
            if (fs.existsSync(file)) fs.unlinkSync(file);
          });
        }
      );

    } catch (err) {
      console.log(err);
      api.sendMessage("❌ Error while creating birthday picture!", event.threadID);
    }
  }
};
