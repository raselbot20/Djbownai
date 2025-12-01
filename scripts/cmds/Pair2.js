const axios = require("axios");
const fs = require("fs-extra");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "pair2",
    countDown: 10,
    role: 0,
    shortDescription: { en: "Get to know your partner" },
    longDescription: { en: "Know your destiny and know who you will complete your life with" },
    category: "love",
    guide: { en: "{pn}" }
  },

  onStart: async function ({ api, event, usersData }) {
    let pathImg = __dirname + "/assets/background.png";
    let pathAvt1 = __dirname + "/assets/any.png";
    let pathAvt2 = __dirname + "/assets/avatar.png";

    let id1 = event.senderID;
    let name1 = await usersData.getName(id1);

    let ThreadInfo = await api.getThreadInfo(event.threadID);
    let all = ThreadInfo.userInfo;

    let gender1 = all.find(u => u.id == id1)?.gender || null;
    const botID = api.getCurrentUserID();

    let ungvien = [];

    if (gender1 === "FEMALE") {
      ungvien = all.filter(u => u.gender === "MALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else if (gender1 === "MALE") {
      ungvien = all.filter(u => u.gender === "FEMALE" && u.id !== id1 && u.id !== botID).map(u => u.id);
    } else {
      ungvien = all.filter(u => u.id !== id1 && u.id !== botID).map(u => u.id);
    }

    if (!ungvien.length) return api.sendMessage("⚠️ No partner found!", event.threadID);

    let id2 = ungvien[Math.floor(Math.random() * ungvien.length)];
    let name2 = await usersData.getName(id2);

    // Random link percentage
    let rd1 = Math.floor(Math.random() * 100) + 1;
    let cc = ["0", "-1", "99,99", "-99", "-100", "101", "0,01"];
    let rd2 = cc[Math.floor(Math.random() * cc.length)];
    let djtme = [rd1, rd1, rd1, rd1, rd1, rd2, rd1, rd1, rd1, rd1];
    let tile = djtme[Math.floor(Math.random() * djtme.length)];

    // Background
    const backgroundURL = "https://i.ibb.co/RBRLmRt/Pics-Art-05-14-10-47-00.jpg";
    let getBackground = (await axios.get(backgroundURL, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathImg, Buffer.from(getBackground, "utf-8"));

    // Avatars
    let getAvt1 = (await axios.get(`https://graph.facebook.com/${id1}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt1, Buffer.from(getAvt1, "utf-8"));

    let getAvt2 = (await axios.get(`https://graph.facebook.com/${id2}/picture?width=720&height=720&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(pathAvt2, Buffer.from(getAvt2, "utf-8"));

    // Canvas
    let baseImage = await loadImage(pathImg);
    let baseAvt1 = await loadImage(pathAvt1);
    let baseAvt2 = await loadImage(pathAvt2);
    let canvas = createCanvas(baseImage.width, baseImage.height);
    let ctx = canvas.getContext("2d");

    ctx.drawImage(baseImage, 0, 0, canvas.width, canvas.height);
    ctx.drawImage(baseAvt1, 111, 175, 330, 330);
    ctx.drawImage(baseAvt2, 1018, 173, 330, 330);

    const imageBuffer = canvas.toBuffer();
    fs.writeFileSync(pathImg, imageBuffer);

    fs.removeSync(pathAvt1);
    fs.removeSync(pathAvt2);

    return api.sendMessage({
      body: `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
『💗』Congratulations ${name1}『💗』
『❤️』Looks like your destiny brought you together with ${name2}『❤️』
『🔗』Your link percentage is ${tile}%『🔗』
╚════════════════════╝`,
      mentions: [
        { tag: `${name2}`, id: id2 },
        { tag: `${name1}`, id: id1 }
      ],
      attachment: fs.createReadStream(pathImg)
    }, event.threadID, () => fs.unlinkSync(pathImg));
  }
};
