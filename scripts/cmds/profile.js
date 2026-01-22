const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "profile",
    aliases: ["pp", "dp"],
    version: "8.0.1",
    author: "Rafi | Rasel",
    countDown: 5,
    role: 0,
    description: "Get cover photo (Self, Reply, Tag, Link) + Profile Picture",
    category: "tools",
    guide: { en: "{pn} [uid/link/tag] or empty for self" }
  },

  onStart: async function ({ api, event, args, usersData }) {
    const { threadID, messageID, mentions, type, messageReply, senderID } = event;

    let targetID = null;
    if (type === "message_reply") targetID = messageReply.senderID;
    else if (Object.keys(mentions || {}).length > 0) targetID = Object.keys(mentions)[0];
    else if (args[0]) {
      const input = args[0];
      if (input.startsWith("http")) {
        const idMatch = input.match(/[?&]id=(\d+)/);
        if (idMatch) targetID = idMatch[1];
        else {
          const userMatch = input.match(/facebook\.com\/(?!share)(?!profile\.php)([\w\.]+)/);
          if (userMatch) targetID = userMatch[1];
        }
      } else targetID = input;
    } else targetID = senderID;

    if (!targetID)
      return api.sendMessage("⚠️ Could not resolve User ID.", threadID, messageID);

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      const accountPath = path.join(process.cwd(), "account.dev.txt");
      if (!fs.existsSync(accountPath))
        return api.sendMessage("❌ 'account.dev.txt' not found.", threadID, messageID);

      const cookieContent = fs.readFileSync(accountPath, "utf8");
      let cookies;
      try { cookies = JSON.parse(cookieContent); } 
      catch { return api.sendMessage("❌ Invalid JSON in account.dev.txt", threadID, messageID); }

      const cookieString = cookies.map((c) => `${c.key}=${c.value}`).join("; ");
      let coverUrl = null;

      try {
        const mbasicUrl = `https://mbasic.facebook.com/profile.php?id=${targetID}`;
        const resMbasic = await axios.get(mbasicUrl, {
          headers: { "User-Agent": "Mozilla/5.0 (Linux; Android 10)", Cookie: cookieString }
        });
        const htmlM = resMbasic.data;
        const regexHeader = /id="header_cover_photo".*?src="([^"]+)"/;
        const matchHeader = htmlM.match(regexHeader);
        if (matchHeader && matchHeader[1]) coverUrl = matchHeader[1].replace(/&amp;/g, "&");
      } catch {}

      if (!coverUrl) {
        const desktopUrl = `https://www.facebook.com/${targetID}`;
        const resDesktop = await axios.get(desktopUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            Cookie: cookieString,
            Accept: "text/html,application/xhtml+xml"
          }
        });
        const htmlD = resDesktop.data;
        const regexJSON = /"cover_photo":\{.*?"uri":"(https:[^"]+)"/;
        const matchJSON = htmlD.match(regexJSON);
        const regexPhoto = /"profile_cover_photo":\{.*?"uri":"(https:[^"]+)"/;
        const matchPhoto = htmlD.match(regexPhoto);

        if (matchJSON && matchJSON[1]) coverUrl = JSON.parse(`"${matchJSON[1]}"`);
        else if (matchPhoto && matchPhoto[1]) coverUrl = JSON.parse(`"${matchPhoto[1]}"`);
      }

      if (!coverUrl) throw new Error("Cover photo not found.");

      const coverPath = path.join(__dirname, `scraped_cover_${Date.now()}.jpg`);
      const writer = fs.createWriteStream(coverPath);
      const imgResponse = await axios({ url: coverUrl, method: "GET", responseType: "stream" });
      imgResponse.data.pipe(writer);
      await new Promise((resolve, reject) => { writer.on("finish", resolve); writer.on("error", reject); });

      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const profilePath = path.join(cacheDir, `profile_${targetID}.png`);
      const profileUrl = `https://graph.facebook.com/${targetID}/picture?height=1500&width=1500&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;

      const profileWriter = fs.createWriteStream(profilePath);
      const profileResponse = await axios({ url: profileUrl, method: "GET", responseType: "stream" });
      profileResponse.data.pipe(profileWriter);
      await new Promise((resolve, reject) => { profileWriter.on("finish", resolve); profileWriter.on("error", reject); });

      let profileStatus = "✅";
      let coverStatus = "✅";

      const userData = await usersData.get(targetID);
      const name = userData?.name || "Unknown User";
      const link = `https://facebook.com/${targetID}`;
      const messageBody = `
╔═════❰ 𝗛𝗲𝗜𝗶•𝗟𝗨𝗠𝗢 ❱═════╗
	🌸✨ 𝐂𝐨𝐯𝐞𝐫 & 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 𝐕𝐢𝐞𝐰 ✨🌸

👤 𝙽𝚊𝚖𝚎 : ${name} ✰
🆔 𝚄𝚒𝚍  : ${targetID}
🌐 𝙻𝚒𝚗𝚔 : ${link}

📌 𝐏𝐫𝐨𝐟𝐢𝐥𝐞 : ${profileStatus}
📌 𝐂𝐨𝐯𝐞𝐫   : ${coverStatus}

🍓 𝗘𝗻𝗷𝗼𝘆 𝘁𝗵𝗲 𝗯𝗲𝗮𝘂𝘁𝘆 𝗼𝗳 𝘁𝗵𝗲 𝗺𝗼𝗺𝗲𝗻𝘁 💞
🖼 𝗔 𝘀𝗽𝗲𝗰𝗶𝗮𝗹 𝗳𝗿𝗮𝗺𝗲 𝗳𝗼𝗿 𝘆𝗼𝘂 🌄
╚════════════════════╝
`;

      await api.sendMessage(
        { body: messageBody, attachment: [fs.createReadStream(profilePath), fs.createReadStream(coverPath)] },
        threadID,
        () => { fs.unlinkSync(profilePath); fs.unlinkSync(coverPath); api.setMessageReaction("✅", messageID, () => {}, true); },
        messageID
      );

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
      console.error(e);
    }
  },
};
