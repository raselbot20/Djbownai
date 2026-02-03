const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome2",
    version: "99.1",
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

    const cacheDir = path.join(__dirname, "..", "cache");
    await fs.ensureDir(cacheDir);

    // ===== GROUP IMAGE =====
    let groupImg = null;
    try {
      // Try multiple methods to get group image
      let imgUrl;
      if (threadInfo.imageSrc) {
        imgUrl = threadInfo.imageSrc;
      } else {
        // Fallback to Graph API
        imgUrl = `https://graph.facebook.com/${threadID}/picture?width=1024&height=1024&access_token=${token}`;
      }
      
      const gRes = await axios.get(imgUrl, { responseType: "arraybuffer", timeout: 10000 });
      groupImg = await loadImage(gRes.data);
      console.log("✅ Group image loaded successfully");
    } catch (err) {
      console.error("❌ Group image load error:", err.message);
      // Use default group image or create placeholder
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

      // ===== CANVAS SETUP (Smaller size) =====
      const width = 1080;
      const height = 680; // Reduced height
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // ===== BACKGROUND WITH DARK GRADIENT =====
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(0.5, "#151530");
      gradient.addColorStop(1, "#0a0a1a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ===== DECORATIVE BACKGROUND ELEMENTS =====
      // Floating particles
      ctx.fillStyle = "rgba(0, 255, 136, 0.15)";
      for (let i = 0; i < 60; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = 1 + Math.random() * 3;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Geometric lines
      ctx.strokeStyle = "rgba(0, 255, 136, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 8; i++) {
        ctx.beginPath();
        ctx.arc(width/2, height/2, 50 + i * 40, 0, Math.PI * 2);
        ctx.stroke();
      }

      // ===== MAIN CONTENT AREA =====
      const contentStartY = 100;
      
      // ===== GROUP IMAGE SECTION (CENTRAL) =====
      const groupImgSize = 180;
      const groupImgX = width/2 - groupImgSize/2;
      const groupImgY = contentStartY;
      
      if (groupImg) {
        // Outer glow effect
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 25;
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2 + 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Inner white border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Clip and draw group image
        ctx.save();
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(groupImg, groupImgX, groupImgY, groupImgSize, groupImgSize);
        ctx.restore();
        
        // Inner decorative ring
        ctx.strokeStyle = "rgba(0, 255, 136, 0.5)";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2 - 3, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        // Placeholder if no group image
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(groupImgX + groupImgSize/2, groupImgY + groupImgSize/2, groupImgSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 60px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🏠", groupImgX + groupImgSize/2, groupImgY + groupImgSize/2 + 20);
      }

      // ===== GROUP NAME (Below group image) =====
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 40px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = 8;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      // Truncate long group names
      let displayGroupName = groupName;
      if (displayGroupName.length > 25) {
        displayGroupName = displayGroupName.substring(0, 22) + "...";
      }
      ctx.fillText(displayGroupName, width/2, contentStartY + groupImgSize + 60);
      ctx.shadowBlur = 0;

      // ===== WELCOME TEXT =====
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 68px 'Impact', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 255, 136, 0.4)";
      ctx.shadowBlur = 15;
      ctx.fillText("WELCOME", width/2, contentStartY + groupImgSize + 130);
      ctx.shadowBlur = 0;

      // ===== MEMBER COUNT =====
      // Function to get ordinal suffix
      function getOrdinalSuffix(n) {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
      }
      
      const ordinalCount = getOrdinalSuffix(memberCount);
      ctx.fillStyle = "#a0e8c0";
      ctx.font = "bold 28px 'Arial', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`🎯 You are the ${ordinalCount} member`, width/2, contentStartY + groupImgSize + 180);

      // Decorative line under member count
      ctx.strokeStyle = "rgba(0, 255, 136, 0.25)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width/2 - 150, contentStartY + groupImgSize + 200);
      ctx.lineTo(width/2 + 150, contentStartY + groupImgSize + 200);
      ctx.stroke();

      // ===== NEW MEMBER SECTION =====
      const newMemberY = contentStartY + groupImgSize + 230;
      
      if (userAvatar) {
        const userSize = 100;
        const userX = width/2 - userSize - 20;
        
        // User avatar with glow
        ctx.shadowColor = "#00ff88";
        ctx.shadowBlur = 15;
        ctx.fillStyle = "#00ff88";
        ctx.beginPath();
        ctx.arc(userX + userSize/2, newMemberY + userSize/2, userSize/2 + 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Draw user avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(userX + userSize/2, newMemberY + userSize/2, userSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(userAvatar, userX, newMemberY, userSize, userSize);
        ctx.restore();
        
        // Avatar border
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(userX + userSize/2, newMemberY + userSize/2, userSize/2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // New member name
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      
      // Truncate long names
      let displayName = fullName;
      if (displayName.length > 20) {
        displayName = displayName.substring(0, 17) + "...";
      }
      ctx.fillText(displayName, width/2, newMemberY + 60);

      // ===== ADDER INFO (Top Right - Stylish) =====
      const adderBoxY = 30;
      const adderBoxX = width - 200;
      
      // Adder box background
      ctx.fillStyle = "rgba(0, 255, 136, 0.1)";
      ctx.beginPath();
      ctx.roundRect(adderBoxX, adderBoxY, 170, 70, 10);
      ctx.fill();
      
      if (adderAvatar) {
        const adderSize = 50;
        const adderX = adderBoxX + 15;
        const adderY = adderBoxY + 10;
        
        // Adder avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(adderX + adderSize/2, adderY + adderSize/2, adderSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(adderAvatar, adderX, adderY, adderSize, adderSize);
        ctx.restore();
        
        // Adder border
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(adderX + adderSize/2, adderY + adderSize/2, adderSize/2, 0, Math.PI * 2);
        ctx.stroke();
      }
      
      // Adder text (stylish)
      ctx.fillStyle = "#a0e8c0";
      ctx.font = "14px 'Arial', sans-serif";
      ctx.textAlign = "left";
      ctx.fillText("ADDED BY", adderBoxX + 75, adderBoxY + 25);
      
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
      
      // Truncate adder name if too long
      let displayAdderName = adderName;
      if (displayAdderName.length > 12) {
        displayAdderName = displayAdderName.substring(0, 10) + "..";
      }
      ctx.fillText(displayAdderName, adderBoxX + 75, adderBoxY + 45);

      // ===== BOT & CREATOR CREDIT (Bottom Center - Very Stylish) =====
      const creditY = height - 25;
      
      // Background for credit
      ctx.fillStyle = "rgba(0, 40, 80, 0.3)";
      ctx.beginPath();
      ctx.roundRect(width/2 - 180, creditY - 20, 360, 25, 12);
      ctx.fill();
      
      // Stylish credit text with symbols
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0, 255, 136, 0.3)";
      ctx.shadowBlur = 10;
      
      const botName = "Heli•LUMO";
      const creatorName = "Rasel Mahmud";
      ctx.fillText(`✨ ${botName} ✨ | 🎨 ${creatorName} 🎨`, width/2, creditY);
      ctx.shadowBlur = 0;

      // ===== DECORATIVE ELEMENTS =====
      // Corner accents
      ctx.strokeStyle = "rgba(0, 255, 136, 0.2)";
      ctx.lineWidth = 2;
      const cornerSize = 25;
      
      // Top-left corner
      ctx.beginPath();
      ctx.moveTo(20, 20);
      ctx.lineTo(20 + cornerSize, 20);
      ctx.moveTo(20, 20);
      ctx.lineTo(20, 20 + cornerSize);
      ctx.stroke();
      
      // Top-right corner
      ctx.beginPath();
      ctx.moveTo(width - 20, 20);
      ctx.lineTo(width - 20 - cornerSize, 20);
      ctx.moveTo(width - 20, 20);
      ctx.lineTo(width - 20, 20 + cornerSize);
      ctx.stroke();
      
      // Bottom-left corner
      ctx.beginPath();
      ctx.moveTo(20, height - 20);
      ctx.lineTo(20 + cornerSize, height - 20);
      ctx.moveTo(20, height - 20);
      ctx.lineTo(20, height - 20 - cornerSize);
      ctx.stroke();
      
      // Bottom-right corner
      ctx.beginPath();
      ctx.moveTo(width - 20, height - 20);
      ctx.lineTo(width - 20 - cornerSize, height - 20);
      ctx.moveTo(width - 20, height - 20);
      ctx.lineTo(width - 20, height - 20 - cornerSize);
      ctx.stroke();

      // ===== ADD ROUNDRECT FUNCTION IF NOT EXISTS =====
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
        await api.sendMessage({
          body: `╔══❰ 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ❱══╗
❖ 𝑾𝑬𝑳𝑪𝑶𝑴𝑬 ✨{userName}✨
𝚃𝙾 ➤ {boxName}
❖𝚈𝚘𝚞 𝚊𝚛𝚎 𝚘𝚞𝚛 {memberCount}ᵗʰ 𝚖𝚎𝚖𝚋𝚎𝚛!
❖𝐇𝐨𝐩𝐞 𝚢𝚘𝚞 𝚎𝚗𝚓𝚘𝚢 𝚢𝚘𝚞𝚛 𝚝𝚒𝚖𝚎 𝚑𝚎𝚛𝚎!
❖𝐇𝐚𝐯𝐞 𝐚 𝐠𝐫𝐞𝐚𝐭 & 𝐩𝐨𝐬𝐢𝐭𝐢𝐯𝐞 {session}!
___𝙰ᴅᴅᴇᴅ ʙʏ: {authorName}
💎.______❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱______.💎,
          attachment: fs.createReadStream(filePath)
        }, threadID);
        console.log("✅ Welcome image sent successfully");
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
