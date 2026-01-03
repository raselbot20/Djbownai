const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const Jimp = require("jimp-compact");

const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

module.exports = {
  config: {
    name: "birthday",
    aliases: ["brd"],
    version: "10.2",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    description: "Make a birthday wish card with round profile",
    category: "birthday"
  },

  guide: { en: "{pn} <@tag | uid>" },

  onStart: async function ({ api, event, args }) {
    try {
      const mentions = event.mentions || {};
      const mentionIds = Object.keys(mentions);

      let targetID;
      let displayName;

      // ✅ Tag support
      if (mentionIds.length > 0) {
        targetID = mentionIds[0];
        displayName = mentions[targetID];
      }
      // ✅ UID support
      else if (args[0] && /^\d+$/.test(args[0])) {
        targetID = args[0];
        const userInfo = await api.getUserInfo(targetID);
        displayName = userInfo[targetID]?.name || "Happy Birthday";
      }
      else {
        return api.sendMessage(
          "⚠️ Please tag someone or provide a valid UID!",
          event.threadID,
          event.messageID
        );
      }

      const tmpDir = path.join(__dirname, "tmp");
      fs.ensureDirSync(tmpDir);

      const avatarPath = path.join(tmpDir, `birthday_${targetID}.png`);
      const finalPath = path.join(tmpDir, `birthday_final_${Date.now()}.png`);

      // 📥 Download avatar
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

      await downloadAvatar(targetID, avatarPath);

      // 🖼️ Background
      const bg = await Jimp.read(
        "https://drive.google.com/uc?export=download&id=1etAD7ZzbXuLHsvljmL3-y83TVeKKxm4b"
      );

      const avatar = await Jimp.read(avatarPath);

      // 🔵 Round avatar
      const size = 328;
      avatar.resize(size, size).circle();

      // 📐 Position
      const posX = (bg.bitmap.width - size) / 9;
      const posY = 237;

      bg.composite(avatar, posX, posY);

      // 🎂 Text
      const wishText =
        "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱══════╗\n" +
        `🎉 ${displayName} 🎉\n` +
        "________🎂 Happy Birthday 🎂\n" +
        "🎀 Many Many Happy\n" +
        "_____________Returns Of The Day!\n" +
        "╚════════════════════╝";

      await bg.quality(100).writeAsync(finalPath);

      api.sendMessage(
        {
          body: wishText,
          attachment: fs.createReadStream(finalPath)
        },
        event.threadID,
        () => {
          if (fs.existsSync(avatarPath)) fs.unlinkSync(avatarPath);
          if (fs.existsSync(finalPath)) fs.unlinkSync(finalPath);
        }
      );

    } catch (err) {
      console.error(err);
      api.sendMessage(
        "❌ Error while creating birthday picture!",
        event.threadID,
        event.messageID
      );
    }
  }
};
