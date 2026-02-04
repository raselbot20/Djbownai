const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome",
    version: "2.0",
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
        imgUrl = `https://graph.facebook.com/${threadID}/picture?width=1024&height=1024&access_token=${token}`;
      }
      
      const gRes = await axios.get(imgUrl, { 
        responseType: "arraybuffer", 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
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
        const uUrl = `https://graph.facebook.com/${userId}/picture?width=1024&height=1024&access_token=${token}`;
        const uRes = await axios.get(uUrl, { responseType: "arraybuffer" });
        userAvatar = await loadImage(uRes.data);
      } catch (err) {
        console.error("User avatar load error:", err);
      }

      // ===== CANVAS SETUP =====
      const width = 1080;
      const height = 1350; // Increased height for better layout
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== BACKGROUND GRADIENT =====
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0c2b5e");
      gradient.addColorStop(0.5, "#1c3b6e");
      gradient.addColorStop(1, "#0a1a3a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ===== DECORATIVE ELEMENTS =====
      // Light circles
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      for (let i = 0; i < 8; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 80 + Math.random() * 120;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== CENTRAL GROUP IMAGE (MAIN FOCUS) =====
      const groupImgSize = 400; // Large group image
      const groupImgX = width / 2 - groupImgSize / 2;
      const groupImgY = 50;
      
      if (groupImg) {
        // Glow effect
        ctx.shadowColor = "#4a90e2";
        ctx.shadowBlur = 40;
        ctx.fillStyle = "#4a90e2";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2 + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // White border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Clip and draw group image
        ctx.save();
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(groupImg, groupImgX, groupImgY, groupImgSize, groupImgSize);
        ctx.restore();
      } else {
        // Placeholder
        ctx.fillStyle = "#4a90e2";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2, groupImgSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 150px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👥", groupImgX + groupImgSize / 2, groupImgY + groupImgSize / 2 + 50);
      }

      // ===== WELCOME TEXT AREA =====
      const textY = groupImgY + groupImgSize + 70;

      // Welcome heading
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 62px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Truncate long names
      let displayUserName = fullName;
      if (displayUserName.length > 22) {
        displayUserName = displayUserName.substring(0, 20) + "...";
      }
      ctx.fillText(`🎉 Welcome ${displayUserName} 🎉`, width / 2, textY);

      // Group name (large and prominent)
      ctx.fillStyle = "#4a90e2";
      ctx.font = "bold 48px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      
      let displayGroupName = groupName;
      if (displayGroupName.length > 28) {
        displayGroupName = displayGroupName.substring(0, 26) + "...";
      }
      ctx.fillText(`📌 ${displayGroupName}`, width / 2, textY + 70);

      // Decorative line
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 200, textY + 110);
      ctx.lineTo(width / 2 + 200, textY + 110);
      ctx.stroke();

      // Member count with ordinal
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
      ctx.font = "bold 36px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(`🏆 ${ordinalCount} Member of This Group`, width / 2, textY + 170);

      // Session-based message
      const sessionMessages = {
        morning: "🌅 Have a wonderful morning!",
        afternoon: "☀️ Enjoy your afternoon!",
        evening: "🌇 Have a pleasant evening!",
        night: "🌙 Good night & sweet dreams!"
      };
      
      ctx.fillStyle = "#a0e8ff";
      ctx.font = "italic 32px 'Segoe UI', Arial, sans-serif";
      ctx.fillText(sessionMessages[session], width / 2, textY + 230);

      // ===== BOTTOM SECTION: TWO PROFILE CARDS =====
      const profileY = textY + 320;
      const profileSize = 180;

      // LEFT SIDE: NEW MEMBER
      const leftProfileX = width / 4 - profileSize / 2;
      
      if (userAvatar) {
        // Background for profile card
        ctx.fillStyle = "rgba(74, 144, 226, 0.15)";
        ctx.beginPath();
        ctx.roundRect(leftProfileX - 20, profileY - 20, profileSize + 40, profileSize + 100, 25);
        ctx.fill();
        
        // Avatar circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(leftProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userAvatar, leftProfileX, profileY, profileSize, profileSize);
        ctx.restore();
        
        // Avatar border
        ctx.strokeStyle = "#4a90e2";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(leftProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Member name
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        
        let leftName = fullName;
        if (leftName.length > 15) {
          leftName = leftName.substring(0, 13) + "...";
        }
        ctx.fillText(`👤 ${leftName}`, leftProfileX + profileSize / 2, profileY + profileSize + 50);
        
        // "New Member" label
        ctx.fillStyle = "#4a90e2";
        ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("✨ New Member ✨", leftProfileX + profileSize / 2, profileY + profileSize + 90);
      }

      // RIGHT SIDE: ADDER
      const rightProfileX = (width * 3) / 4 - profileSize / 2;
      
      if (adderAvatar) {
        // Background for profile card
        ctx.fillStyle = "rgba(255, 204, 0, 0.15)";
        ctx.beginPath();
        ctx.roundRect(rightProfileX - 20, profileY - 20, profileSize + 40, profileSize + 100, 25);
        ctx.fill();
        
        // Avatar circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(rightProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(adderAvatar, rightProfileX, profileY, profileSize, profileSize);
        ctx.restore();
        
        // Avatar border
        ctx.strokeStyle = "#ffcc00";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(rightProfileX + profileSize / 2, profileY + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Adder name
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 28px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "center";
        
        let rightName = adderName;
        if (rightName.length > 15) {
          rightName = rightName.substring(0, 13) + "...";
        }
        ctx.fillText(`👤 ${rightName}`, rightProfileX + profileSize / 2, profileY + profileSize + 50);
        
        // "Added By" label
        ctx.fillStyle = "#ffcc00";
        ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
        ctx.fillText("🎯 Added By 🎯", rightProfileX + profileSize / 2, profileY + profileSize + 90);
      }

      // ===== CONNECTOR LINE BETWEEN PROFILES =====
      ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
      ctx.lineWidth = 2;
      ctx.setLineDash([10, 5]);
      ctx.beginPath();
      ctx.moveTo(leftProfileX + profileSize + 30, profileY + profileSize / 2);
      ctx.lineTo(rightProfileX - 30, profileY + profileSize / 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // ===== BOTTOM DECORATION =====
      const bottomY = height - 60;
      
      // Decorative line
      ctx.strokeStyle = "#4a90e2";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2 - 250, bottomY);
      ctx.lineTo(width / 2 + 250, bottomY);
      ctx.stroke();

      // Bot/Developer credit
      ctx.fillStyle = "#a0e8ff";
      ctx.font = "bold 26px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("💎 Heli•LUMO | ✨ Rasel Mahmud ✨", width / 2, bottomY + 40);

      // ===== ADD ROUNDRECT FUNCTION =====
      if (!ctx.roundRect) {
        ctx.roundRect = function (x, y, width, height, radius) {
          if (width < 2 * radius) radius = width / 2;
          if (height < 2 * radius) radius = height / 2;
          this.beginPath();
          this.moveTo(x + radius, y);
          this.arcTo(x + width, y, x + width, y + height, radius);
          this.arcTo(x + width, y + height, x, y + height, radius);
          this.arcTo(x, y + height, x, y, radius);
          this.arcTo(x, y, x + width, y, radius);
          this.closePath();
          return this;
        };
      }

      // ===== BORDER =====
      ctx.strokeStyle = "rgba(74, 144, 226, 0.3)";
      ctx.lineWidth = 8;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // ===== SAVE AND SEND =====
      const filePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      try {
        const messageBody = `╔══❰ 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ❱══╗
❖ 𝑾𝑬𝑳𝑪𝑶𝑴𝑴 ✨${fullName}✨
𝚃𝙾 ➤ ${groupName}
❖ 𝚈𝚘𝚞 𝚊𝚛𝚎 𝚘𝚞𝚛 ${ordinalCount} 𝚖𝚎𝚖𝚋𝚎𝚛!
❖ 𝐇𝐨𝐩𝐞 𝚢𝚘𝚞 𝚎𝚗𝚣𝚘𝚢 𝚢𝚘𝚞𝚛 𝚝𝚒𝚖𝚎 𝚑𝚎𝚛𝚎!
❖ ${sessionMessages[session]}
___𝙰ᴅᴅᴇᴅ ʙʏ: ${adderName}
💎.______❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱______.💎`;

        await api.sendMessage({
          body: messageBody,
          attachment: fs.createReadStream(filePath)
        }, threadID);
        
        console.log("✅ Welcome message sent successfully");
      } catch (sendError) {
        console.error("❌ Send message error:", sendError);
      }

      // Clean up after 10 seconds
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 10000);
    }
  }
};
