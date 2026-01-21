const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "coverpicture",
    aliases: ["cr", "cp"],
    version: "8.0.0",
    author: "Rafi | Rasel",
    countDown: 5,
    role: 0,
    description: "Get cover photo (Self, Reply, Tag, Link)",
    category: "tools",
    guide: { en: "{pn} [uid/link/tag] or empty for self" }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, mentions, type, messageReply, senderID } = event;
    
    // Target Resolver
    let targetID = null;

    if (type === "message_reply") {
        targetID = messageReply.senderID;
    } else if (Object.keys(mentions).length > 0) {
        targetID = Object.keys(mentions)[0];
    } else if (args[0]) {
        const input = args[0];
        if (input.startsWith("http")) {
            const idMatch = input.match(/[?&]id=(\d+)/);
            if (idMatch) {
                targetID = idMatch[1];
            } else {
                const userMatch = input.match(/facebook\.com\/(?!share)(?!profile\.php)([\w\.]+)/);
                if (userMatch) targetID = userMatch[1];
            }
        } else {
            targetID = input;
        }
    } else {
        targetID = senderID;
    }

    if (!targetID) {
      return api.sendMessage("⚠️ Could not resolve User ID.", threadID, messageID);
    }

    try {
      api.setMessageReaction("⏳", messageID, () => {}, true);

      // Load Cookies from account.dev.txt
      const accountPath = path.join(process.cwd(), "account.dev.txt");
      
      if (!fs.existsSync(accountPath)) {
        return api.sendMessage("❌ 'account.dev.txt' not found.", threadID, messageID);
      }

      const cookieContent = fs.readFileSync(accountPath, "utf8");
      let cookies;
      try {
        cookies = JSON.parse(cookieContent);
      } catch (err) {
        return api.sendMessage("❌ Invalid JSON in account.dev.txt", threadID, messageID);
      }

      const cookieString = cookies.map(c => `${c.key}=${c.value}`).join("; ");
      let coverUrl = null;

      // Attempt 1: mBasic (Fastest)
      try {
          const mbasicUrl = `https://mbasic.facebook.com/profile.php?id=${targetID}`;
          const resMbasic = await axios.get(mbasicUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
              "Cookie": cookieString
            }
          });
          
          const htmlM = resMbasic.data;
          const regexHeader = /id="header_cover_photo".*?src="([^"]+)"/;
          const matchHeader = htmlM.match(regexHeader);
          
          if (matchHeader && matchHeader[1]) {
              coverUrl = matchHeader[1].replace(/&amp;/g, "&");
          }
      } catch (ignored) {}

      // Attempt 2: Desktop WWW (Fallback)
      if (!coverUrl) {
          const desktopUrl = `https://www.facebook.com/${targetID}`;
          
          const resDesktop = await axios.get(desktopUrl, {
            headers: {
              "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
              "Cookie": cookieString,
              "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
              "Sec-Fetch-Site": "same-origin"
            }
          });

          const htmlD = resDesktop.data;
          const regexJSON = /"cover_photo":\{.*?"uri":"(https:[^"]+)"/;
          const matchJSON = htmlD.match(regexJSON);
          const regexPhoto = /"profile_cover_photo":\{.*?"uri":"(https:[^"]+)"/;
          const matchPhoto = htmlD.match(regexPhoto);

          if (matchJSON && matchJSON[1]) {
             coverUrl = JSON.parse(`"${matchJSON[1]}"`);
          } else if (matchPhoto && matchPhoto[1]) {
             coverUrl = JSON.parse(`"${matchPhoto[1]}"`);
          }
      }

      if (!coverUrl) {
          throw new Error("Cover photo not found.");
      }

      // Download & Send
      const filePath = path.join(__dirname, `scraped_cover_${Date.now()}.jpg`);
      const writer = fs.createWriteStream(filePath);

      const imgResponse = await axios({
        url: coverUrl,
        method: "GET",
        responseType: "stream",
        headers: {
             "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
      });

      imgResponse.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      await api.sendMessage({
        body: "", 
        attachment: fs.createReadStream(filePath)
      }, threadID, () => {
        fs.unlinkSync(filePath);
        api.setMessageReaction("✅", messageID, () => {}, true);
      }, messageID);

    } catch (e) {
      api.setMessageReaction("❌", messageID, () => {}, true);
    }
  }
};
