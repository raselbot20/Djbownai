const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "spy",
    version: "3.1",
    author: "Rasel Mahmud",
    role: 0,
    countDown: 5,
    shortDescription: "Stylish full profile spy card",
    category: "utility",
  },

  onStart: async function ({ event, message, api, usersData, args }) {
    try {
      const requesterID = event.senderID;
      let targetID;
      
      // Improved mention detection
      if (Object.keys(event.mentions).length > 0) {
        targetID = Object.keys(event.mentions)[0];
      } else if (args[0]) {
        const numeric = /^\d+$/.test(args[0]) ? args[0] : null;
        const linkMatch = args[0].match(/(?:facebook\.com|fb\.me|m\.me).*?(?:\?id=|\/)(\d+)/);
        targetID = numeric || (linkMatch ? linkMatch[1] : null);
      }
      
      if (!targetID) {
        targetID = event.type === "message_reply" 
          ? event.messageReply.senderID 
          : requesterID;
      }

      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      // Fetch both target and requester info
      const getUserInfo = async (uid) => {
        return new Promise((resolve, reject) => {
          api.getUserInfo(uid, (err, result) => {
            if (err) {
              console.error(`Error fetching info for ${uid}:`, err);
              resolve({
                name: "Unknown",
                gender: 0,
                isFriend: false,
                isBirthday: false,
                relationship_status: "Unknown",
                vanity: uid,
                profileUrl: `https://facebook.com/${uid}`
              });
            } else {
              resolve(result[uid] || {
                name: "Unknown",
                gender: 0,
                isFriend: false,
                isBirthday: false,
                relationship_status: "Unknown",
                vanity: uid,
                profileUrl: `https://facebook.com/${uid}`
              });
            }
          });
        });
      };

      // Fetch target and requester info separately
      let fbDataTarget, fbDataRequester;
      try {
        const [targetInfo, requesterInfo] = await Promise.all([
          getUserInfo(targetID),
          getUserInfo(requesterID)
        ]);
        
        fbDataTarget = targetInfo;
        fbDataRequester = requesterInfo;
      } catch (error) {
        console.error("Error fetching user info:", error);
        // Fallback data
        fbDataTarget = {
          name: "User",
          gender: 0,
          isFriend: false,
          isBirthday: false,
          relationship_status: "Unknown",
          vanity: targetID,
          profileUrl: `https://facebook.com/${targetID}`
        };
        fbDataRequester = {
          name: "Friend",
          gender: 0
        };
      }

      const userRecord = await usersData.get(targetID);
      const allUsers = await usersData.getAll();

      const fullName = fbDataTarget.name || "Unknown";
      const nickname = fbDataTarget.nickname || "—";
      
      // Gender detection with fallback
      let genderStr = "Unknown";
      if (fbDataTarget.gender === 1) {
        genderStr = "Female";
      } else if (fbDataTarget.gender === 2) {
        genderStr = "Male";
      } else if (fbDataTarget.gender === 3) {
        genderStr = "Custom";
      }
      
      const isFriend = fbDataTarget.isFriend ? "✅ Yes" : "❌ No";
      const birthday = fbDataTarget.isBirthday ? "🎉 Today!" : "🔒 Hidden";
      
      // Relationship status with fallback
      let relationship = "Single";
      if (fbDataTarget.relationship_status) {
        relationship = fbDataTarget.relationship_status;
      } else if (fbDataTarget.love && fbDataTarget.love.name) {
        relationship = `In relationship with ${fbDataTarget.love.name}`;
      }

      const balance = userRecord?.money || 0;
      const xp = userRecord?.exp || 0;
      const lvl = Math.floor(Math.sqrt(xp) * 0.1);

      // Rank calculation with fallback
      let rank = "—";
      try {
        const rankIdx = allUsers
          .filter((u) => u && typeof u.money === "number")
          .sort((a, b) => b.money - a.money)
          .findIndex((u) => u.userID === targetID);
        
        if (rankIdx !== -1) {
          rank = `#${rankIdx + 1}`;
        }
      } catch (error) {
        console.error("Rank calculation error:", error);
      }

      // Location with multiple fallbacks
      let location = "Unknown";
      if (fbDataTarget.hometown && fbDataTarget.hometown.name) {
        location = fbDataTarget.hometown.name;
      } else if (fbDataTarget.hometown_name) {
        location = fbDataTarget.hometown_name;
      } else if (fbDataTarget.location && fbDataTarget.location.name) {
        location = fbDataTarget.location.name;
      } else if (fbDataTarget.location_name) {
        location = fbDataTarget.location_name;
      }

      // Profile picture (HD)
      const avatarUrl = `https://graph.facebook.com/${targetID}/picture?height=512&width=512&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;

      // Canvas setup with adjusted size for better fit
      const width = 1300;
      const height = 800;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Background gradient with cosmic effect
      const gradient = ctx.createLinearGradient(0, 0, width, height);
      gradient.addColorStop(0, "#0a0a1a");
      gradient.addColorStop(0.5, "#1a1a3a");
      gradient.addColorStop(1, "#0a0a2a");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Star field effect
      ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
      for (let i = 0; i < 150; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const radius = Math.random() * 1.5;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Main card with border
      const cardWidth = width - 80;
      const cardHeight = height - 80;
      const cardX = 40;
      const cardY = 40;

      // Card shadow
      ctx.shadowColor = "rgba(0, 150, 255, 0.4)";
      ctx.shadowBlur = 25;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;

      // Card background with glass effect
      ctx.fillStyle = "rgba(15, 25, 45, 0.85)";
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 25);
      ctx.fill();

      // Card border
      ctx.shadowBlur = 0;
      ctx.strokeStyle = "#00aaff";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 25);
      ctx.stroke();

      // Title section
      ctx.fillStyle = "#00ddff";
      ctx.font = "bold 42px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("🔍 SPY INTEL REPORT", width / 2, cardY + 60);

      // Title divider
      ctx.strokeStyle = "#ff55aa";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cardX + 150, cardY + 75);
      ctx.lineTo(cardX + cardWidth - 150, cardY + 75);
      ctx.stroke();

      // Load avatar
      let avatar;
      try {
        const response = await axios.get(avatarUrl, { 
          responseType: 'arraybuffer',
          timeout: 10000 
        });
        const buffer = Buffer.from(response.data, 'binary');
        avatar = await loadImage(buffer);
      } catch (error) {
        console.error("Failed to load avatar:", error);
        avatar = null;
      }
      
      // Avatar section
      const avatarX = cardX + 70;
      const avatarY = cardY + 120;
      const avatarSize = 220;
      
      if (avatar) {
        // Glow effect
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 25;
        ctx.fillStyle = "#00ffff";
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2 + 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        
        // Clip circle
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
      } else {
        // Placeholder
        ctx.fillStyle = "#0055aa";
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 80px Arial";
        ctx.textAlign = "center";
        ctx.fillText("?", avatarX + avatarSize/2, avatarY + avatarSize/2 + 25);
      }
      
      // Avatar border
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
      ctx.stroke();

      // User info sections - Now with better layout
      const leftColumnX = cardX + 350;
      const rightColumnX = cardX + 750;
      const startY = cardY + 130;
      const lineHeight = 40;
      const boxHeight = 35;

      // Function to draw info field with icon
      function drawField(x, y, icon, label, value, color = "#ffffff") {
        // Field background
        ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
        ctx.beginPath();
        ctx.roundRect(x, y, 380, boxHeight, 8);
        ctx.fill();
        
        // Icon
        ctx.fillStyle = "#00ffff";
        ctx.font = "22px Arial";
        ctx.fillText(icon, x + 12, y + 25);
        
        // Label
        ctx.fillStyle = "#aaaaaa";
        ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
        ctx.fillText(label, x + 45, y + 23);
        
        // Value
        const maxWidth = 200;
        let displayValue = value;
        if (ctx.measureText(value).width > maxWidth) {
          // Truncate long values
          for (let i = value.length; i > 0; i--) {
            const truncated = value.substring(0, i) + "...";
            if (ctx.measureText(truncated).width <= maxWidth) {
              displayValue = truncated;
              break;
            }
          }
        }
        
        ctx.fillStyle = color;
        ctx.font = "bold 17px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(displayValue, x + 370, y + 23);
        ctx.textAlign = "left";
      }

      // Left column fields
      let currentY = startY;
      drawField(leftColumnX, currentY, "👤", "Name", fullName, "#ffffff");
      currentY += lineHeight;
      drawField(leftColumnX, currentY, "💬", "Nickname", nickname, "#ffcc66");
      currentY += lineHeight;
      drawField(leftColumnX, currentY, "🆔", "UID", targetID, "#66ccff");
      currentY += lineHeight;
      drawField(leftColumnX, currentY, "🎭", "Gender", genderStr, "#ff66aa");
      currentY += lineHeight;
      drawField(leftColumnX, currentY, "💰", "Balance", `$${balance.toLocaleString()}`, "#66ff99");
      currentY += lineHeight;
      drawField(leftColumnX, currentY, "⚡", "XP", xp.toLocaleString(), "#ffaa66");

      // Right column fields
      currentY = startY;
      drawField(rightColumnX, currentY, "📊", "Level", lvl.toString(), "#aa66ff");
      currentY += lineHeight;
      drawField(rightColumnX, currentY, "🏆", "Rank", rank, "#ff6666");
      currentY += lineHeight;
      drawField(rightColumnX, currentY, "📍", "Location", location, "#66aaff");
      currentY += lineHeight;
      drawField(rightColumnX, currentY, "💞", "Relationship", relationship, "#ff99cc");
      currentY += lineHeight;
      drawField(rightColumnX, currentY, "🎂", "Birthday", birthday, "#ff9966");
      currentY += lineHeight;
      drawField(rightColumnX, currentY, "👥", "Friend", isFriend, isFriend.includes("✅") ? "#66ff66" : "#ff6666");

      // Stats section at bottom
      const statsY = cardY + 420;
      const statsHeight = 120;
      
      // Stats background
      ctx.fillStyle = "rgba(0, 100, 200, 0.15)";
      ctx.beginPath();
      ctx.roundRect(cardX + 70, statsY, cardWidth - 140, statsHeight, 15);
      ctx.fill();
      
      // Stats title
      ctx.fillStyle = "#00ddff";
      ctx.font = "bold 26px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("📈 USER STATISTICS", width / 2, statsY + 30);
      
      // UPDATED PROGRESS BARS FUNCTION (NO OVERLAP)
      function drawProgressBar(label, value, max, x, y, width, color) {
        const barHeight = 18;
        const barY = y;
        const labelY = y - 8; // Label position above bar
        
        // 1. Draw the bar background
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();
        ctx.roundRect(x, barY, width, barHeight, 9);
        ctx.fill();
        
        // 2. Draw the progress fill
        const progress = Math.min(value / max, 1);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x, barY, width * progress, barHeight, 9);
        ctx.fill();
        
        // 3. Draw the label (LEFT aligned)
        ctx.fillStyle = "#dddddd";
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "left";
        ctx.fillText(label, x, labelY);
        
        // 4. Draw the value (RIGHT aligned) - ensures no overlap
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px 'Segoe UI', Arial, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(`${Math.round(value)}/${max}`, x + width, labelY);
      }
      
      // Calculate stats
      const levelProgress = lvl % 10;
      const xpProgress = Math.min(xp % 1000, 100);
      const friendScore = isFriend.includes("✅") ? 100 : 0;
      const completeScore = 85; // Profile completeness

      // Draw progress bars with VERTICAL SPACING (prevents overlap)
      drawProgressBar("📊 Level", levelProgress, 10, cardX + 100, statsY + 50, 350, "#00ffff");
      drawProgressBar("⚡ Activity", xpProgress, 100, cardX + 100, statsY + 85, 350, "#ff55ff");
      drawProgressBar("👥 Friend", friendScore, 100, cardX + 480, statsY + 50, 350, "#ffff55");
      drawProgressBar("✅ Complete", completeScore, 100, cardX + 480, statsY + 85, 350, "#55ff55");

      // Footer section
      const footerY = cardY + cardHeight - 50;
      
      // Footer background
      ctx.fillStyle = "rgba(0, 50, 100, 0.3)";
      ctx.beginPath();
      ctx.roundRect(cardX + 50, footerY, cardWidth - 100, 40, 10);
      ctx.fill();
      
      // Requester info (left side)
      ctx.fillStyle = "#00aaff";
      ctx.font = "italic 16px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "left";
      const requesterName = fbDataRequester.name || "Friend";
      ctx.fillText(`Requested by: ${requesterName}`, cardX + 70, footerY + 25);

      // Bot & Author credit (right side) - STYLISH VERSION
      ctx.fillStyle = "#ff55aa";
      ctx.font = "bold 18px 'Segoe UI', Arial, sans-serif";
      ctx.textAlign = "right";

      // Main bot name with symbols
      const botName = "💎 Heli•LUMO 💎";
      const authorCredit = "Rasel Mahmud";
      ctx.fillText(`${botName} | ${authorCredit}`, cardX + cardWidth - 70, footerY + 25);

      // Optional: Small decorative line above footer
      ctx.strokeStyle = "rgba(0, 200, 255, 0.2)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cardX + 50, footerY - 10);
      ctx.lineTo(cardX + cardWidth - 50, footerY - 10);
      ctx.stroke();

      // Corner accents
      ctx.strokeStyle = "#ff55aa";
      ctx.lineWidth = 2;
      const cornerLength = 30;
      
      // Top-left
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + 20);
      ctx.lineTo(cardX + 20 + cornerLength, cardY + 20);
      ctx.moveTo(cardX + 20, cardY + 20);
      ctx.lineTo(cardX + 20, cardY + 20 + cornerLength);
      ctx.stroke();
      
      // Top-right
      ctx.beginPath();
      ctx.moveTo(cardX + cardWidth - 20, cardY + 20);
      ctx.lineTo(cardX + cardWidth - 20 - cornerLength, cardY + 20);
      ctx.moveTo(cardX + cardWidth - 20, cardY + 20);
      ctx.lineTo(cardX + cardWidth - 20, cardY + 20 + cornerLength);
      ctx.stroke();
      
      // Bottom-left
      ctx.beginPath();
      ctx.moveTo(cardX + 20, cardY + cardHeight - 20);
      ctx.lineTo(cardX + 20 + cornerLength, cardY + cardHeight - 20);
      ctx.moveTo(cardX + 20, cardY + cardHeight - 20);
      ctx.lineTo(cardX + 20, cardY + cardHeight - 20 - cornerLength);
      ctx.stroke();
      
      // Bottom-right
      ctx.beginPath();
      ctx.moveTo(cardX + cardWidth - 20, cardY + cardHeight - 20);
      ctx.lineTo(cardX + cardWidth - 20 - cornerLength, cardY + cardHeight - 20);
      ctx.moveTo(cardX + cardWidth - 20, cardY + cardHeight - 20);
      ctx.lineTo(cardX + cardWidth - 20, cardY + cardHeight - 20 - cornerLength);
      ctx.stroke();

      // Save image
      const cachePath = path.join(__dirname, "cache_spy.png");
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(cachePath, buffer);

      await message.reply({
        body: `🕵️ *SPY REPORT: ${fullName}*\n━━━━━━━━━━━━━━━━━\n🎯 UID: ${targetID}\n💰 Balance: $${balance.toLocaleString()}\n🏆 Rank: ${rank}\n🎭 Gender: ${genderStr}\n━━━━━━━━━━━━━━━━━\n📅 ${new Date().toLocaleString()}`,
        attachment: fs.createReadStream(cachePath),
      });

      await fs.unlink(cachePath);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error("Spy command error:", err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply(`❌ Spy command failed! Error: ${err.message || "Unknown error"}`);
    }
  },
};

// Add roundRect to CanvasRenderingContext2D prototype
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
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
