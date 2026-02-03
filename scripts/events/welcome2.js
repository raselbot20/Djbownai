const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome2",
    version: "4.0",
    author: "Rasel Mahmud",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName || "Unknown Group";
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      try {
        const cacheDir = path.join(__dirname, "..", "cache");
        await fs.ensureDir(cacheDir);
        const imagePath = path.join(cacheDir, `welcome_${Date.now()}.png`);

        const width = 1200;
        const height = 600;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext("2d");

        // ===== BACKGROUND =====
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, "#0f0c29");
        gradient.addColorStop(0.5, "#302b63");
        gradient.addColorStop(1, "#24243e");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // ===== PARTICLES =====
        ctx.fillStyle = "rgba(255,255,255,0.08)";
        for (let i = 0; i < 150; i++) {
          ctx.beginPath();
          ctx.arc(Math.random() * width, Math.random() * height, Math.random() * 3, 0, Math.PI * 2);
          ctx.fill();
        }

        // ===== CARD =====
        const cardX = 100;
        const cardY = 80;
        const cardW = 1000;
        const cardH = 420;
        const radius = 30;

        function roundRect(ctx, x, y, w, h, r) {
          ctx.beginPath();
          ctx.moveTo(x + r, y);
          ctx.arcTo(x + w, y, x + w, y + h, r);
          ctx.arcTo(x + w, y + h, x, y + h, r);
          ctx.arcTo(x, y + h, x, y, r);
          ctx.arcTo(x, y, x + w, y, r);
          ctx.closePath();
        }

        ctx.fillStyle = "rgba(255,255,255,0.12)";
        roundRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.fill();

        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.lineWidth = 2;
        roundRect(ctx, cardX, cardY, cardW, cardH, radius);
        ctx.stroke();

        // ===== TITLE =====
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 64px Arial";
        ctx.textAlign = "center";
        ctx.fillText("WELCOME", width / 2, cardY + 90);

        // ===== NAME =====
        const nameGradient = ctx.createLinearGradient(cardX, 0, cardX + cardW, 0);
        nameGradient.addColorStop(0, "#ff0080");
        nameGradient.addColorStop(0.5, "#00ffcc");
        nameGradient.addColorStop(1, "#ff0080");
        ctx.fillStyle = nameGradient;
        ctx.font = "bold 48px Arial";
        ctx.fillText(fullName, width / 2, cardY + 160);

        // ===== GROUP INFO =====
        ctx.fillStyle = "#00ffff";
        ctx.font = "28px Arial";
        ctx.fillText(`💬 ${groupName}`, width / 2, cardY + 230);

        ctx.fillStyle = "#ffcc00";
        ctx.font = "24px Arial";
        ctx.fillText(`👥 Members: ${memberCount}`, width / 2, cardY + 270);

        // ===== PROFILE PICTURE =====
        try {
          const profileUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512`;
          const res = await axios.get(profileUrl, { responseType: "arraybuffer" });
          const avatar = await loadImage(res.data);

          const size = 140;
          const x = cardX + cardW - size - 40;
          const y = cardY + 40;

          // glow border
          ctx.beginPath();
          ctx.arc(x + size/2, y + size/2, size/2 + 6, 0, Math.PI * 2);
          ctx.fillStyle = "#00ffff";
          ctx.fill();

          // clip circle
          ctx.save();
          ctx.beginPath();
          ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(avatar, x, y, size, size);
          ctx.restore();

          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(x + size/2, y + size/2, size/2, 0, Math.PI * 2);
          ctx.stroke();

        } catch (e) {
          console.log("Profile load failed");
        }

        // ===== TIME =====
        const time = new Date().toLocaleString("bn-BD", { timeZone: "Asia/Dhaka" });
        ctx.fillStyle = "#aaaaaa";
        ctx.font = "18px Arial";
        ctx.fillText(`📅 ${time}`, width / 2, height - 30);

        // ===== SAVE & SEND =====
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(imagePath, buffer);

        await api.sendMessage({
          attachment: fs.createReadStream(imagePath)
        }, threadID);

        setTimeout(() => {
          if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
        }, 5000);

      } catch (err) {
        console.error("Welcome error:", err);
      }
    }
  }
};
