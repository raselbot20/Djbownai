const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "toilet",
    version: "2.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Put someone in toilet",
    longDescription: "Generate a funny toilet meme with avatars",
    category: "fun",
    guide: {
      en: "{pn} @tag"
    }
  },

  onLoad: async function () {
    const cacheDir = path.join(__dirname, "cache");
    const toiletPath = path.join(cacheDir, "toilet.png");

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

    if (!fs.existsSync(toiletPath)) {
      await axios({
        url: "https://drive.google.com/uc?id=13ZqFryD-YY-JTs34lcy6b_w36UCCk0EI&export=download",
        responseType: "arraybuffer"
      }).then(res => fs.writeFileSync(toiletPath, res.data));
    }
  },

  onStart: async function ({ api, event, args }) {
    const senderID = event.senderID;
    const mention = Object.keys(event.mentions)[0];

    if (!mention)
      return api.sendMessage("⚠️ Please tag someone!", event.threadID, event.messageID);

    const output = await generateImage(senderID, mention);

    return api.sendMessage(
      {
        body: "তোকে টয়লেটে ফেলে দিলাম 🤣🚽",
        attachment: fs.createReadStream(output)
      },
      event.threadID,
      () => fs.unlinkSync(output),
      event.messageID
    );
  }
};

// ====== Helper Functions ======

async function generateImage(senderID, mentionedID) {
  const cache = path.join(__dirname, "cache");
  const templatePath = path.join(cache, "toilet.png");

  const outputPath = path.join(cache, `toilet_${senderID}_${mentionedID}.png`);
  const avt1 = path.join(cache, `avt_${senderID}.png`);
  const avt2 = path.join(cache, `avt_${mentionedID}.png`);

  // Download avatars
  await avatarDownload(senderID, avt1);
  await avatarDownload(mentionedID, avt2);

  const base = await jimp.read(templatePath);
  const a1 = await jimp.read(await makeCircle(avt1));
  const a2 = await jimp.read(await makeCircle(avt2));

  base
    .composite(a1.resize(70, 70), 100, 200)
    .composite(a2.resize(70, 70), 100, 200);

  await base.writeAsync(outputPath);

  fs.unlinkSync(avt1);
  fs.unlinkSync(avt2);

  return outputPath;
}

async function avatarDownload(uid, savePath) {
  const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

  const data = (
    await axios.get(url, { responseType: "arraybuffer" })
  ).data;

  fs.writeFileSync(savePath, Buffer.from(data));
}

async function makeCircle(imgPath) {
  const img = await jimp.read(imgPath);
  img.circle();
  return await img.getBufferAsync("image/png");
}
