crush.js const axios = require('axios');
const jimp = require("jimp");
const fs = require("fs");

module.exports = {
  config: {
    name: "crush",
    aliases: ["ক্রাশ"],
    version: "1.0",
    author: "Abdul Alim",
    countDown: 0,
    role: 0,
    shortDescription: "we together",
    longDescription: "",
    category: "love",
    guide: {
      vi: "{pn} [@tag]",
      en: "{pn} [@tag]"
    }
  },

  onStart: async function ({ message, event }) {
    const mention = Object.keys(event.mentions);
    if (mention.length == 0) return message.reply("Please mention someone");

    let one, two;
    if (mention.length === 1) {
      one = event.senderID;
      two = mention[0];
    } else {
      one = mention[1];
      two = mention[0];
    }

    bal(one, two).then(ptth => {
      message.reply({
        body: `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
✨ You are my crush, always on my mind 💗
╚═══════════════════╝`,
        attachment: fs.createReadStream(ptth)
      });
    });
  }
};

async function bal(one, two) {
  let avone = await jimp.read(`https://graph.facebook.com/${one}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  avone.circle();

  let avtwo = await jimp.read(`https://graph.facebook.com/${two}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);
  avtwo.circle();

  let pth = "abcd.png";

  // Background image resized to 960x540
  let img = await jimp.read("https://i.postimg.cc/HnpThvp1/Picsart-25-11-15-21-52-48-239.png");
  img.resize(960, 540);

  // Composite avatars
  img.composite(avone.resize(275, 275), 110, 125)
     .composite(avtwo.resize(270, 270), 560, 120);

  await img.writeAsync(pth);
  return pth;
}
