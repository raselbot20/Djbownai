const DIG = require("discord-image-generation");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "kiss",
    version: "1.1",
    author: "sandy",
    countDown: 5,
    role: 0,
    shortDescription: "kiss",
    longDescription: "kiss someone",
    category: "love",
    guide: {
      en: "{pn} @tag"
    }
  },

  onStart: async function ({ event, message, usersData, args, getLang }) {
    try {
      const uid1 = event.senderID;
      const uid2 = Object.keys(event.mentions)[0];

      if (!uid2) return message.reply("⚠️ Please tag someone to kiss!");

      const avatarURL1 = await usersData.getAvatarUrl(uid1);
      const avatarURL2 = await usersData.getAvatarUrl(uid2);

      const img = await new DIG.Kiss().getImage(avatarURL1, avatarURL2);

      const pathSave = `${__dirname}/tmp/${uid1}_${uid2}_kiss.png`;
      fs.writeFileSync(pathSave, Buffer.from(img));

      const content = args.join(" ").replace(Object.keys(event.mentions)[0], "");

      message.reply(
        {
          body: content || "💋 Mwuahh 😘",
          attachment: fs.createReadStream(pathSave)
        },
        () => fs.unlinkSync(pathSave)
      );

    } catch (err) {
      console.log("kiss command error:", err);
      message.reply("❌ Error generating kiss image.");
    }
  }
};
