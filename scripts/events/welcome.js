const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome",
    version: "4.0",
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

      // ===== CANVAS SETUP (1280x720 LANDSCAPE) =====
      const width = 1280;
      const height = 720;
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

      // ===== PREMIUM BACKGROUND WITH DEPTH =====
      // Base gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0a1a3a");
      gradient.addColorStop(0.3, "#1e3a8a");
      gradient.addColorStop(0.7, "#2d4b9e");
      gradient.addColorStop(1, "#0c2b5e");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ===== GLOWING ORBS (ভাসমান আলো) =====
      const orbColors = [
        "rgba(74, 144, 226, 0.15)",
        "rgba(255, 204, 0, 0.1)",
        "rgba(160, 232, 255, 0.12)",
        "rgba(212, 175, 55, 0.1)"
      ];
      
      for (let i = 0; i < 12; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 60 + Math.random() * 120;
        const blur = 30 + Math.random() * 40;
        
        ctx.shadowColor = orbColors[i % orbColors.length].replace("0.1", "0.3");
        ctx.shadowBlur = blur;
        ctx.fillStyle = orbColors[i % orbColors.length];
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }
      
      // ===== LIGHT RAYS (রশ্মি) =====
      ctx.shadowBlur = 50;
      ctx.shadowColor = "rgba(255, 255, 255, 0.1)";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.03)";
      ctx.lineWidth = 2;
      for (let i = 0; i < 15; i++) {
        const angle = (i * 24) * Math.PI / 180;
        const startX = width / 2;
        const startY = height / 2;
        const endX = startX + Math.cos(angle) * 800;
        const endY = startY + Math.sin(angle) * 800;
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
      }

      // ===== SPARKLES (চিকচিকে তারা) =====
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffd700";
      for (let i = 0; i < 30; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = 2 + Math.random() * 4;
        
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + Math.random() * 0.5})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
        
        // Cross sparkle
        if (i % 3 === 0) {
          ctx.fillStyle = `rgba(255, 215, 0, ${0.2 + Math.random() * 0.3})`;
          ctx.beginPath();
          ctx.arc(x - 10, y - 5, size * 0.7, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // ===== DECORATIVE BORDERS =====
      // Top border pattern
      ctx.strokeStyle = "rgba(74, 144, 226, 0.3)";
      ctx.lineWidth = 2;
      for (let i = 0; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + 15, 15);
        ctx.stroke();
      }

      // Bottom border pattern
      for (let i = 0; i < width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, height);
        ctx.lineTo(i + 15, height - 15);
        ctx.stroke();
      }

      // ===== LEFT SIDE DECORATION =====
      ctx.fillStyle = "rgba(74, 144, 226, 0.1)";
      for (let i = 0; i < 5; i++) {
        const y = 100 + i * 120;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(50, y + 30);
        ctx.lineTo(0, y + 60);
        ctx.closePath();
        ctx.fill();
      }

      // ===== RIGHT SIDE DECORATION =====
      ctx.fillStyle = "rgba(255, 204, 0, 0.1)";
      for (let i = 0; i < 5; i++) {
        const y = 150 + i * 100;
        ctx.beginPath();
        ctx.moveTo(width, y);
        ctx.lineTo(width - 50, y + 30);
        ctx.lineTo(width, y + 60);
        ctx.closePath();
        ctx.fill();
      }

      // ===== CENTRAL GROUP IMAGE =====
      const groupImgSize = 150;
      const groupImgX = width / 2 - groupImgSize / 2;
      const groupImgY = 30;
      
      if (groupImg) {
        // Multi-layer glow effect
        ctx.shadowColor = "#4a90e2";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "#4a90e2";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2 + 12, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 60;
        ctx.shadowColor = "#ffd700";
        ctx.fillStyle = "rgba(255, 215, 0, 0.3)";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2 + 18, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // White border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Inner gold ring
        ctx.strokeStyle = "#ffd700";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2 - 5, 0, Math.PI * 2);
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
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👥", groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2 + 20);
      }

      // ===== WELCOME TEXT AREA =====
      const textY = groupImgY + groupImgSize + 25;

      // Welcome heading with glow
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      
      let displayUserName = fullName;
      if (displayUserName.length > 18) {
        displayUserName = displayUserName.substring(0, 16) + "...";
      }
      ctx.fillText(`🎉 Welcome ${displayUserName} 🎉`, width / 2, textY);

      ctx.shadowBlur = 0;

      // Group name
      ctx.shadowColor = "#4a90e2";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#4a90e2";
      ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
      
      let displayGroupName = groupName;
      if (displayGroupName.length > 22) {
        displayGroupName = displayGroupName.substring(0, 20) + "...";
      }
      ctx.fillText(`📌 ${displayGroupName}`, width / 2, textY + 35);

      // Decorative line with glow
      ctx.shadowBlur = 10;
      ctx.shadowColor = "#4a90e2";
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 150, textY + 50);
      ctx.lineTo(width / 2 + 150, textY + 50);
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
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ffcc00";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`🏆 ${ordinalCount} Member of This Group`, width / 2, textY + 80);

      // Session message
      const sessionMessages = {
        morning: "🌅 Have a wonderful morning!",
        afternoon: "☀️ Enjoy your afternoon!",
        evening: "🌇 Have a pleasant evening!",
        night: "🌙 Good night & sweet dreams!"
      };
      
      ctx.shadowColor = "#a0e8ff";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#a0e8ff";
      ctx.font = "italic 20px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(sessionMessages[session], width / 2, textY + 110);

      ctx.shadowBlur = 0;

      // ===== PROFILE CARDS SECTION =====
      const profileY = textY + 130;
      const profileSize = 100;

      // LEFT SIDE: NEW MEMBER
      const leftProfileX = width / 4 - profileSize / 2 + 50;
      
      if (userAvatar) {
        // Background card with glow
        ctx.shadowColor = "#4a90e2";
        ctx.shadowBlur = 25;
        ctx.fillStyle = "rgba(74, 144, 226, 0.2)";
        ctx.roundRect(leftProfileX - 15, profileY - 15, profileSize + 30, profileSize + 70, 15);
        ctx.fill();
        
        // Avatar with multi-glow
        ctx.shadowBlur = 20;
        ctx.shadowColor = "#4a90e2";
        ctx.save();
        ctx.beginPath();
        ctx.arc(leftProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userAvatar, leftProfileX, profileY, profileSize, profileSize);
        ctx.restore();
        
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "#4a90e2";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(leftProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Name
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        
        let leftName = fullName;
        if (leftName.length > 12) {
          leftName = leftName.substring(0, 10) + "...";
        }
        ctx.fillText(`👤 ${leftName}`, leftProfileX + profileSize / 2, profileY + profileSize + 20);
        
        ctx.fillStyle = "#4a90e2";
        ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("✨ New Member ✨", leftProfileX + profileSize / 2, profileY + profileSize + 40);
      }

      // RIGHT SIDE: ADDER
      const rightProfileX = (width * 3) / 4 - profileSize / 2 - 50;
      
      if (adderAvatar) {
        ctx.shadowColor = "#ffcc00";
        ctx.shadowBlur = 25;
        ctx.fillStyle = "rgba(255, 204, 0, 0.2)";
        ctx.roundRect(rightProfileX - 15, profileY - 15, profileSize + 30, profileSize + 70, 15);
        ctx.fill();
        
        ctx.shadowBlur = 20;
        ctx.save();
        ctx.beginPath();
        ctx.arc(rightProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(adderAvatar, rightProfileX, profileY, profileSize, profileSize);
        ctx.restore();
        
        ctx.shadowBlur = 10;
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(rightProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        
        let rightName = adderName;
        if (rightName.length > 12) {
          rightName = rightName.substring(0, 10) + "...";
        }
        ctx.fillText(`👤 ${rightName}`, rightProfileX + profileSize / 2, profileY + profileSize + 20);
        
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 14px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("🎯 Added By 🎯", rightProfileX + profileSize / 2, profileY + profileSize + 40);
      }

      // ===== CONNECTOR LINE WITH GLOW =====
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#ffffff";
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(leftProfileX + profileSize + 20, profileY + profileSize / 2);
      ctx.lineTo(rightProfileX - 20, profileY + profileSize / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ===== BOTTOM DECORATION WITH GLOW =====
      const bottomY = height - 35;
      
      ctx.shadowBlur = 15;
      ctx.shadowColor = "#4a90e2";
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, bottomY);
      ctx.lineTo(width / 2 + 200, bottomY);
      ctx.stroke();

      // Credit with gold glow
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💎 Heli•LUMO | ✨ Rasel Mahmud ✨", width / 2, bottomY + 20);

      // ===== MAIN BORDER WITH GLOW =====
      ctx.shadowBlur = 30;
      ctx.shadowColor = "#4a90e2";
      ctx.strokeStyle = "rgba(74, 144, 226, 0.6)";
      ctx.lineWidth = 6;
      ctx.strokeRect(15, 15, width - 30, height - 30);

      // Inner border
      ctx.shadowBlur = 20;
      ctx.shadowColor = "#ffd700";
      ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.strokeRect(25, 25, width - 50, height - 50);

      ctx.shadowBlur = 0;
      ctx.shadowColor = "transparent";

      // ===== SAVE AND SEND =====
      const filePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      try {
        const messageBody = `╔══❰ 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ❱══╗
❖ 𝑾𝑬𝑳𝑪𝑶𝑴𝑴 ✨${fullName}✨
💎.______❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱______.💎`;

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
