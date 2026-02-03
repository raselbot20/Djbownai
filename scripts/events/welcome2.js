const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome2",
    version: "99.2",
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

    // Get current session (morning, afternoon, evening, night)
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
      // Try to get group image from threadInfo first
      let imgUrl;
      if (threadInfo.imageSrc) {
        imgUrl = threadInfo.imageSrc;
        console.log("Using threadInfo.imageSrc:", imgUrl);
      } else {
        // Fallback to Graph API
        imgUrl = `https://graph.facebook.com/${threadID}/picture?width=1024&height=1024&access_token=${token}`;
        console.log("Using Graph API:", imgUrl);
      }
      
      const gRes = await axios.get(imgUrl, { 
        responseType: "arraybuffer", 
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      groupImg = await loadImage(gRes.data);
      console.log("✅ Group image loaded successfully");
    } catch (err) {
      console.error("❌ Group image load error:", err.message);
      // Will use placeholder later
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
      const height = 680;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== BACKGROUND WITH DEEP GRADIENT =====
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(0.5, "#151530");
      gradient.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ===== DECORATIVE BACKGROUND ELEMENTS =====
      // Subtle grid pattern
      ctx.strokeStyle = "rgba(0, 255, 136, 0.05)";
      ctx.lineWidth = 1;
      
      // Vertical lines
      for (let x = 50; x < width; x += 50) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      
      // Horizontal lines
      for (let y = 50; y < height; y += 50) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Floating circles
      ctx.fillStyle = "rgba(0, 255, 136, 0.1)";
      for (let i = 0; i < 15; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 20 + Math.random() * 40;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // ===== GROUP IMAGE SECTION (TOP CENTER) =====
      const groupImgSize = 140;
      const groupImgX = width/2 - groupImgSize/2;
      const groupImgY = 40;
      
      if (groupImg) {
        // Outer glow
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 30;
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2 + 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // White border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Clip and draw image
        ctx.save();
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(groupImg, groupImgX, groupImgY, groupImgSize, groupImgSize);
        ctx.restore();
        
        // Inner decorative ring
        ctx.strokeStyle = "rgba(0, 255, 136, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2 - 2, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Placeholder if no group image
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 50px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🏠", groupImgX + groupImgSize/2, groupImgY + groupImgSize/2 + 15);
      }

      // ===== WELCOME CONTENT AREA =====
      const contentY = groupImgY + groupImgSize + 50;

      // Decorative header line
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(width/2 - 200, contentY - 10);
      ctx.lineTo(width/2 + 200, contentY - 10);
      ctx.stroke();

      // User name (main welcome text)
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Truncate long names
      let displayUserName = fullName;
      if (displayUserName.length > 20) {
        displayUserName = displayUserName.substring(0, 18) + "...";
      }
      ctx.fillText(`✨ ${displayUserName} ✨`, width/2, contentY + 40);
      ctx.shadowBlur = 0;

      // Group name
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 36px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      
      let displayGroupName = groupName;
      if (displayGroupName.length > 30) {
        displayGroupName = displayGroupName.substring(0, 28) + "...";
      }
      ctx.fillText(`𝚃𝙾 ➤ ${displayGroupName}`, width/2, contentY + 90);

      // Member count
      ctx.fillStyle = "#a0e8c0";
      ctx.font = "bold 28px 'Arial', sans-serif";
      ctx.textAlign = "center";
      
      // Function to get ordinal suffix
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
      ctx.fillText(`❖ You are our ${ordinalCount} member!`, width/2, contentY + 140);

      // Enjoy time message
      ctx.fillStyle = "#ccccff";
      ctx.font = "italic 24px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("❖ Hope you enjoy your time here!", width/2, contentY + 180);

      // Session message
      const sessionMessages = {
        morning: "🌅 Have a great & positive morning!",
        afternoon: "☀️ Have a great & positive afternoon!",
        evening: "🌇 Have a great & positive evening!",
        night: "🌙 Have a great & positive night!"
      };
      
      ctx.fillStyle = "#ffcc66";
      ctx.font = "bold 26px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`❖ ${sessionMessages[session]}`, width/2, contentY + 220);

      // ===== NEW MEMBER AVATAR (Left side) =====
      const newMemberY = contentY + 260;
      
      if (userAvatar) {
        const userSize = 80;
        const userX = width/2 - 200;
        
        // Avatar with glow
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(userX + userSize/2, newMemberY + userSize/2, userSize/2 + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(userX + userSize/2, newMemberY + userSize/2, userSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userAvatar, userX, newMemberY, userSize, userSize);
        ctx.restore();
        
        // Avatar border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(userX + userSize/2, newMemberY + userSize/2, userSize/2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ===== ADDER INFO (Right side) =====
      if (adderAvatar) {
        const adderSize = 80;
        const adderX = width/2 + 120;
        const adderY = newMemberY;
        
        // Adder avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(adderX + adderSize/2, adderY + adderSize/2, adderSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(adderAvatar, adderX, adderY, adderSize, adderSize);
        ctx.restore();
        
        // Adder border
        ctx.strokeStyle = "#ff9966";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(adderX + adderSize/2, adderY + adderSize/2, adderSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Adder text
        ctx.fillStyle = "#ff9966";
        ctx.font = "bold 18px 'Arial', sans-serif";
        ctx.textAlign = "center";
        
        let displayAdderName = adderName;
        if (displayAdderName.length > 15) {
          displayAdderName = displayAdderName.substring(0, 13) + "...";
        }
        ctx.fillText(`Added by: ${displayAdderName}`, adderX + adderSize/2, adderY + adderSize + 25);
      }

      // ===== BOT NAME SECTION (Bottom Center - Stylish) =====
      const botNameY = height - 40;
      
      // Decorative background for bot name
      ctx.fillStyle = "rgba(0, 255, 136, 0.15)";
      ctx.beginPath();
      ctx.roundRect(width/2 - 180, botNameY - 25, 360, 35, 20);
      ctx.fill();
      
      // Stylish bot name with symbols
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 255, 136, 0.3)";
      ctx.shadowBlur = 8;
      
      ctx.fillText("💎 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 💎 | ✨ Rasel Mahmud ✨", width/2, botNameY);
      ctx.shadowBlur = 0;

      // ===== DECORATIVE BORDER =====
      ctx.strokeStyle = "rgba(0, 255, 136, 0.2)";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(20, 20, width - 40, height - 40, 15);
      ctx.stroke();

      // Corner decorations
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      
      // Top-left
      ctx.beginPath();
      ctx.moveTo(30, 30);
      ctx.lineTo(60, 30);
      ctx.moveTo(30, 30);
      ctx.lineTo(30, 60);
      ctx.stroke();
      
      // Top-right
      ctx.beginPath();
      ctx.moveTo(width - 30, 30);
      ctx.lineTo(width - 60, 30);
      ctx.moveTo(width - 30, 30);
      ctx.lineTo(width - 30, 60);
      ctx.stroke();
      
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(30, height - 30);
      ctx.lineTo(60, height - 30);
      ctx.moveTo(30, height - 30);
      ctx.lineTo(30, height - 60);
      ctx.stroke();
      
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(width - 30, height - 30);
      ctx.lineTo(width - 60, height - 30);
      ctx.moveTo(width - 30, height - 30);
      ctx.lineTo(width - 30, height - 60);
      ctx.stroke();

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

      // ===== SAVE AND SEND IMAGE =====
      const filePath = path.join(cacheDir, `welcome_${Date.now()}.png`);
      await fs.writeFile(filePath, canvas.toBuffer("image/png"));

      try {
        // Prepare message body with your template
        const messageBody = `╔══❰ 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ❱══╗
❖ 𝑾𝑬𝑳𝑪𝑶𝑴𝑴 ✨${fullName}✨
𝚃𝙾 ➤ ${groupName}
❖ 𝚈𝚘𝚞 𝚊𝚛𝚎 𝚘𝚞𝚛 ${ordinalCount} 𝚖𝚎𝚖𝚋𝚎𝚛!
❖ 𝐇𝐨𝐩𝐞 𝚢𝚘𝚞 𝚎𝚗𝚓𝚘𝚢 𝚢𝚘𝚞𝚛 𝚝𝚒𝚖𝚎 𝚑𝚎𝚛𝚎!
❖ 𝐇𝐚𝐯𝐞 𝐚 𝐠𝐫𝐞𝐚𝐭 & 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 ${session}!
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
