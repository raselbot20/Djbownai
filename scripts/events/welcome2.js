const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome2",
    version: "99.0",
    author: "Rasel Mahmud",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData, author } = event;
    const newUsers = logMessageData.addedParticipants;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "Unknown Group";
    const memberCount = threadInfo.participantIDs.length;

    const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);

    // ===== GROUP IMAGE =====
    let groupImg = null;
    try {
      const gUrl = `https://graph.facebook.com/${threadID}/picture?width=1024&height=1024&access_token=${token}`;
      const gRes = await axios.get(gUrl, { responseType: "arraybuffer" });
      groupImg = await loadImage(gRes.data);
    } catch {}

    // ===== ADDER INFO =====
    let adderName = "Unknown";
    let adderAvatar = null;
    try {
      const info = await api.getUserInfo(author);
      adderName = info[author].name;
      const aUrl = `https://graph.facebook.com/${author}/picture?width=512&height=512&access_token=${token}`;
      const aRes = await axios.get(aUrl, { responseType: "arraybuffer" });
      adderAvatar = await loadImage(aRes.data);
    } catch {}

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      // ===== NEW USER AVATAR =====
      let userAvatar = null;
      try {
        const uUrl = `https://graph.facebook.com/${userId}/picture?width=1024&height=1024&access_token=${token}`;
        const uRes = await axios.get(uUrl, { responseType: "arraybuffer" });
        userAvatar = await loadImage(uRes.data);
      } catch {}

      const width = 1280;
      const height = 720;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== BACKGROUND =====
      ctx.fillStyle = "#050505";
      ctx.fillRect(0, 0, width, height);

      // floating shapes
      ctx.strokeStyle = "rgba(0,255,120,0.3)";
      for (let i = 0; i < 40; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const s = 30 + Math.random() * 40;
        ctx.strokeRect(x, y, s, s);
      }

      // ===== DRAW AVATAR FUNCTION =====
      function drawAvatar(img, x, y, size, color) {
        if (!img) return;
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2 + 10, 0, Math.PI * 2);
        ctx.strokeStyle = color;
        ctx.lineWidth = 8;
        ctx.stroke();

        ctx.save();
        ctx.beginPath();
        ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
        ctx.clip();
        ctx.drawImage(img, x, y, size, size);
        ctx.restore();
      }

      // ===== GROUP IMAGE (TOP CENTER) =====
      if (groupImg) {
        drawAvatar(groupImg, width/2 - 80, 40, 160, "#00ff88");
      }

      // ===== GROUP NAME =====
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px Arial";
      ctx.textAlign = "center";
      ctx.fillText(groupName, width/2, 250);

      // ===== WELCOME TEXT =====
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 60px Arial";
      ctx.fillText("WELCOME", width/2, 330);

      // ===== MEMBER COUNT =====
      ctx.fillStyle = "#cccccc";
      ctx.font = "28px Arial";
      ctx.fillText(`You are the ${memberCount}th member`, width/2, 380);

      // ===== ADDER (TOP RIGHT) =====
      drawAvatar(adderAvatar, width - 160, 40, 90, "#00ff88");
      ctx.textAlign = "right";
      ctx.fillStyle = "#00ff88";
      ctx.font = "22px Arial";
      ctx.fillText(`Added by ${adderName}`, width - 50, 160);

      // ===== NEW MEMBER (BOTTOM LEFT BIG) =====
      drawAvatar(userAvatar, 120, 420, 160, "#00ff88");
      ctx.textAlign = "left";
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px Arial";
      ctx.fillText(fullName, 120, 610);

      const filePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
      fs.writeFileSync(filePath, canvas.toBuffer("image/png"));

      await api.sendMessage({
        attachment: fs.createReadStream(filePath)
      }, threadID);

      setTimeout(() => fs.unlinkSync(filePath), 5000);
    }
  }
};
