const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome",
    version: "3.0",
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

    // Token for Facebook Graph API
    const token = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

    // Get current session
    function getSession() {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) return "morning";
      if (hour >= 12 && hour < 17) return "afternoon";
      if (hour >= 17 && hour < 21) return "evening";
      return "night";
    }

    const session = getSession();

    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);

    // ===== GROUP IMAGE =====
    let groupImg = null;
    try {
      let imgUrl;
      if (threadInfo.imageSrc) {
        imgUrl = threadInfo.imageSrc;
      } else {
        imgUrl = `https://graph.facebook.com/${threadID}/picture?width=512&height=512&access_token=${token}`;
      }
      
      const gRes = await axios.get(imgUrl, { 
        responseType: "arraybuffer", 
        timeout: 15000
      });
      groupImg = await loadImage(gRes.data);
    } catch (err) {
      console.error("Group image load error:", err.message);
    }

    // ===== ADDER INFO =====
    let adderName = "Unknown";
    let adderAvatar = null;
    try {
      const info = await api.getUserInfo(author);
      adderName = info[author]?.name || "Unknown";
      const aUrl = `https://graph.facebook.com/${author}/picture?width=512&height=512&access_token=${token}`;
      const aRes = await axios.get(aUrl, { responseType: "arraybuffer" });
      adderAvatar = await loadImage(aRes.data);
    } catch (err) {
      console.error("Adder info error:", err);
    }

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      // ===== NEW USER AVATAR =====
      let userAvatar = null;
      try {
        const uUrl = `https://graph.facebook.com/${userId}/picture?width=512&height=512&access_token=${token}`;
        const uRes = await axios.get(uUrl, { responseType: "arraybuffer" });
        userAvatar = await loadImage(uRes.data);
      } catch (err) {
        console.error("User avatar load error:", err);
      }

      // ===== CANVAS SETUP (COMPACT SIZE) =====
      const width = 1000;
      const height = 900;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== ADD ROUNDRECT FUNCTION =====
      ctx.roundRect = function (x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        this.beginPath();
        this.moveTo(x + r, y);
        this.lineTo(x + w - r, y);
        this.quadraticCurveTo(x + w, y, x + w, y + r);
        this.lineTo(x + w, y + h - r);
        this.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        this.lineTo(x + r, y + h);
        this.quadraticCurveTo(x, y + h, x, y + h - r);
        this.lineTo(x, y + r);
        this.quadraticCurveTo(x, y, x + r, y);
        this.closePath();
        return this;
      };

      // ===== BACKGROUND GRADIENT =====
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0c2b5e");
      gradient.addColorStop(0.5, "#1c3b6e");
      gradient.addColorStop(1, "#0a1a3a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ===== DECORATIVE ELEMENTS =====
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      for (let i = 0; i < 5; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 50 + Math.random() * 80;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== CENTRAL GROUP IMAGE =====
      const groupImgSize = 180;
      const groupImgX = width / 2 - groupImgSize / 2;
      const groupImgY = 30;
      
      if (groupImg) {
        ctx.shadowColor = "#4a90e2";
        ctx.shadowBlur = 25;
        ctx.fillStyle = "#4a90e2";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2 + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(groupImg, groupImgX, groupImgY, groupImgSize, groupImgSize);
        ctx.restore();
      } else {
        ctx.fillStyle = "#4a90e2";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 70px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👥", groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2 + 25);
      }

      // ===== WELCOME TEXT AREA =====
      const textY = groupImgY + groupImgSize + 30;

      // Welcome heading
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      
      let displayUserName = fullName;
      if (displayUserName.length > 18) {
        displayUserName = displayUserName.substring(0, 16) + "...";
      }
      ctx.fillText(`🎉 Welcome ${displayUserName} 🎉`, width / 2, textY);

      // Group name
      ctx.fillStyle = "#4a90e2";
      ctx.font = "bold 30px 'Segoe UI', Arial, sans-serif";
      
      let displayGroupName = groupName;
      if (displayGroupName.length > 22) {
        displayGroupName = displayGroupName.substring(0, 20) + "...";
      }
      ctx.fillText(`📌 ${displayGroupName}`, width / 2, textY + 40);

      // Decorative line
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 150, textY + 55);
      ctx.lineTo(width / 2 + 150, textY + 55);
      ctx.stroke();

      // Member count
      function getOrdinalSuffix(n) {
        if (n % 100 >= 11 && n % 100 <= 13) return n + "th";
        switch (n % 10) {
          case 1: return n + "st";
          case 2: return n + "nd";
          case 3: return n + "rd";
          default: return n + "th";
        }
      }
      
      const ordinalCount = getOrdinalSuffix(memberCount);
      ctx.fillStyle = "#ffcc00";
      ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`🏆 ${ordinalCount} Member of This Group`, width / 2, textY + 90);

      // Session message
      const sessionMessages = {
        morning: "🌅 Have a wonderful morning!",
        afternoon: "☀️ Enjoy your afternoon!",
        evening: "🌇 Have a pleasant evening!",
        night: "🌙 Good night & sweet dreams!"
      };
      
      ctx.fillStyle = "#a0e8ff";
      ctx.font = "italic 22px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(sessionMessages[session], width / 2, textY + 120);

      // ===== BOTTOM SECTION: TWO PROFILE CARDS =====
      const profileY = textY + 150;
      const profileSize = 120;

      // LEFT SIDE: NEW MEMBER
      const leftProfileX = width / 4 - profileSize / 2;
      
      if (userAvatar) {
        ctx.fillStyle = "rgba(74, 144, 226, 0.15)";
        ctx.roundRect(leftProfileX - 15, profileY - 15, profileSize + 30, profileSize + 70, 20);
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(leftProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userAvatar, leftProfileX, profileY, profileSize, profileSize);
        ctx.restore();
        
        ctx.strokeStyle = "#4a90e2";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(leftProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        
        let leftName = fullName;
        if (leftName.length > 12) {
          leftName = leftName.substring(0, 10) + "...";
        }
        ctx.fillText(`👤 ${leftName}`, leftProfileX + profileSize / 2, profileY + profileSize + 25);
        
        ctx.fillStyle = "#4a90e2";
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("✨ New Member ✨", leftProfileX + profileSize / 2, profileY + profileSize + 50);
      }

      // RIGHT SIDE: ADDER
      const rightProfileX = (width * 3) / 4 - profileSize / 2;
      
      if (adderAvatar) {
        ctx.fillStyle = "rgba(255, 204, 0, 0.15)";
        ctx.roundRect(rightProfileX - 15, profileY - 15, profileSize + 30, profileSize + 70, 20);
        ctx.fill();
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(rightProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(adderAvatar, rightProfileX, profileY, profileSize, profileSize);
        ctx.restore();
        
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rightProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
        
        let rightName = adderName;
        if (rightName.length > 12) {
          rightName = rightName.substring(0, 10) + "...";
        }
        ctx.fillText(`👤 ${rightName}`, rightProfileX + profileSize / 2, profileY + profileSize + 25);
        
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("🎯 Added By 🎯", rightProfileX + profileSize / 2, profileY + profileSize + 50);
      }

      // ===== CONNECTOR LINE =====
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 4]);
      ctx.beginPath();
      ctx.moveTo(leftProfileX + profileSize + 20, profileY + profileSize / 2);
      ctx.lineTo(rightProfileX - 20, profileY + profileSize / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ===== BOTTOM DECORATION =====
      const bottomY = height - 45;
      
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, bottomY);
      ctx.lineTo(width / 2 + 200, bottomY);
      ctx.stroke();

      ctx.fillStyle = "#a0e8ff";
      ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💎 Heli•LUMO | ✨ Rasel Mahmud ✨", width / 2, bottomY + 25);

      // ===== BORDER =====
      ctx.strokeStyle = "rgba(74, 144, 226, 0.4)";
      ctx.lineWidth = 5;
      ctx.strokeRect(15, 15, width - 30, height - 30);

      // ===== SAVE AND SEND =====
      const filePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      try {
        const messageBody = `╔══❰ 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ❱══╗
❖ 𝑾𝑬𝑳𝑪𝑶𝑴𝑴 ✨${fullName}✨
╚═══════════════════╝`;

        await api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(filePath)
        }, threadID);
        
        console.log("✅ Welcome message sent successfully");
      } catch (sendError) {
        console.error("❌ Send message error:", sendError);
      }

      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 10000);
    }
  }
};
