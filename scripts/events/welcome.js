const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "welcome",
    version: "7.0",
    author: "Rasel Mahmud",
    category: "events",
    eventType: ["log:subscribe"]
  },

  onStart: async ({ event, api, usersData, threadsData }) => {
    try {
      // ✅ Check if it's a subscribe event
      if (event.logMessageType !== "log:subscribe") return;

      const { threadID } = event;
      
      // ✅ Get thread data
      const threadData = await threadsData.get(threadID);
      if (!threadData || !threadData.settings?.sendWelcomeMessage) return;

      const addedMembers = event.logMessageData.addedParticipants;
      const threadName = threadData.threadName || "our group";
      const inviterID = event.author;

      for (const user of addedMembers) {
        const userID = user.userFbId;
        const botID = api.getCurrentUserID();

        // ✅ Skip if bot is added
        if (userID == botID) return;

        // ✅ New member welcome
        const userName = user.fullName || "Member";
        const inviterName = await usersData.getName(inviterID) || "someone";
        const memberCount = (await api.getThreadInfo(threadID)).participantIDs.length;

        // ✅ Get current session
        const hour = new Date().getHours();
        let session = "evening";
        if (hour >= 5 && hour < 12) session = "morning";
        else if (hour >= 12 && hour < 17) session = "afternoon";
        else if (hour >= 17 && hour < 21) session = "evening";
        else session = "night";

        const sessionMessages = {
          morning: "🌅 Have a wonderful morning!",
          afternoon: "☀️ Enjoy your afternoon!",
          evening: "🌇 Have a pleasant evening!",
          night: "🌙 Good night & sweet dreams!"
        };

        // ✅ Create welcome card
        const welcomeImagePath = await createWelcomeCard({
          userName,
          threadName,
          memberCount,
          inviterName,
          newUserID: userID,
          inviterID: inviterID,
          threadID: threadID,
          api: api,
          sessionMessage: sessionMessages[session]
        });

        // ✅ Prepare message
        const welcomeMessage = `✨ Welcome ${userName} to ${threadName}! ✨\nYou are our ${memberCount}th member.`;

        const form = {
          body: welcomeMessage,
          mentions: [{ tag: userName, id: userID }]
        };

        if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
          form.attachment = fs.createReadStream(welcomeImagePath);
        }

        await api.sendMessage(form, threadID);

        // ✅ Clean up temp file
        if (welcomeImagePath && fs.existsSync(welcomeImagePath)) {
          setTimeout(() => fs.unlinkSync(welcomeImagePath), 5000);
        }
      }
    } catch (error) {
      console.error("Welcome Command Error:", error);
    }
  }
};

// ✅ Graph API Access Token
const ACCESS_TOKEN = "6628568379|c1e620fa708a1d5696fb991c1bde5662";

async function downloadHighQualityProfile(userID) {
  try {
    const highResUrl = `https://graph.facebook.com/${userID}/picture?width=500&height=500&access_token=${ACCESS_TOKEN}`;
    const response = await axios({
      method: 'GET',
      url: highResUrl,
      responseType: 'arraybuffer',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.log(`Graph API failed for user ${userID}:`, error.message);
    return null;
  }
}

async function getGroupImage(threadID, api) {
  try {
    const threadInfo = await api.getThreadInfo(threadID);
    if (threadInfo.imageSrc) {
      const response = await axios({
        method: 'GET',
        url: threadInfo.imageSrc,
        responseType: 'arraybuffer',
        timeout: 10000
      });
      return Buffer.from(response.data, 'binary');
    }
  } catch (error) {
    console.log("Group image download failed:", error.message);
  }
  return null;
}

async function createWelcomeCard({ userName, threadName, memberCount, inviterName, newUserID, inviterID, threadID, api, sessionMessage }) {
  const width = 1280;
  const height = 720;
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d');

  // ===== PREMIUM BACKGROUND WITH DEPTH =====
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0a0a1a");
  gradient.addColorStop(0.3, "#1a1a3a");
  gradient.addColorStop(0.6, "#2a1a4a");
  gradient.addColorStop(1, "#0a0a2a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // ===== STAR FIELD EFFECT =====
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  for (let i = 0; i < 150; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // ===== GLOWING ORBS =====
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
    
    ctx.shadowColor = orbColors[i % orbColors.length].replace("0.1", "0.3");
    ctx.shadowBlur = 40;
    ctx.fillStyle = orbColors[i % orbColors.length];
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.shadowBlur = 0;
  ctx.shadowColor = "transparent";

  // ===== MAIN CARD WITH BORDER =====
  const cardWidth = width - 80;
  const cardHeight = height - 80;
  const cardX = 40;
  const cardY = 40;

  ctx.shadowColor = "rgba(0, 150, 255, 0.4)";
  ctx.shadowBlur = 25;
  
  ctx.fillStyle = "rgba(15, 25, 45, 0.85)";
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 25);
  ctx.fill();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#00aaff";
  ctx.lineWidth = 3;
  ctx.beginPath();
  roundRect(ctx, cardX, cardY, cardWidth, cardHeight, 25);
  ctx.stroke();

  // ===== TITLE SECTION =====
  ctx.fillStyle = "#00ddff";
  ctx.font = "bold 48px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(0, 200, 255, 0.5)";
  ctx.shadowBlur = 15;
  ctx.fillText("🎉 WELCOME TO THE FAMILY 🎉", width / 2, cardY + 60);
  ctx.shadowBlur = 0;

  // Title divider
  ctx.strokeStyle = "#ff55aa";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 150, cardY + 75);
  ctx.lineTo(cardX + cardWidth - 150, cardY + 75);
  ctx.stroke();

  // ===== LEFT SIDE - NEW USER =====
  const leftX = cardX + 180;
  const profileY = cardY + 150;
  const profileSize = 120;

  // New User Profile Frame
  ctx.shadowColor = "#2ecc71";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(leftX, profileY, profileSize + 10, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(46, 204, 113, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "#2ecc71";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Load new user profile
  let newUserImage = null;
  if (newUserID) {
    try {
      const imageBuffer = await downloadHighQualityProfile(newUserID);
      if (imageBuffer) {
        newUserImage = await loadImage(imageBuffer);
      }
    } catch (err) {}
  }

  if (newUserImage) {
    ctx.shadowBlur = 15;
    ctx.save();
    ctx.beginPath();
    ctx.arc(leftX, profileY, profileSize, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(newUserImage, leftX - profileSize, profileY - profileSize, profileSize * 2, profileSize * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#333344";
    ctx.beginPath();
    ctx.arc(leftX, profileY, profileSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Arial";
    ctx.textAlign = "center";
    ctx.fillText("👤", leftX, profileY + 20);
  }

  ctx.shadowBlur = 0;

  // "NEW MEMBER" Label
  ctx.fillStyle = "#2ecc71";
  ctx.font = "bold 22px 'Segoe UI', Arial";
  ctx.fillText("✨ NEW MEMBER ✨", leftX, profileY + profileSize + 35);

  // New User Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px 'Segoe UI', Arial";
  let displayName = userName;
  if (userName.length > 16) {
    displayName = userName.substring(0, 14) + "...";
  }
  ctx.fillText(displayName, leftX, profileY + profileSize + 70);

  // ===== RIGHT SIDE - ADDED BY =====
  const rightX = cardX + cardWidth - 180;

  ctx.shadowColor = "#3498db";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(rightX, profileY, profileSize + 10, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(52, 152, 219, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "#3498db";
  ctx.lineWidth = 4;
  ctx.stroke();

  // Load inviter profile
  let inviterImage = null;
  if (inviterID) {
    try {
      const imageBuffer = await downloadHighQualityProfile(inviterID);
      if (imageBuffer) {
        inviterImage = await loadImage(imageBuffer);
      }
    } catch (err) {}
  }

  if (inviterImage) {
    ctx.shadowBlur = 15;
    ctx.save();
    ctx.beginPath();
    ctx.arc(rightX, profileY, profileSize, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(inviterImage, rightX - profileSize, profileY - profileSize, profileSize * 2, profileSize * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#333344";
    ctx.beginPath();
    ctx.arc(rightX, profileY, profileSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 60px Arial";
    ctx.fillText("👤", rightX, profileY + 20);
  }

  ctx.shadowBlur = 0;

  // "ADDED BY" Label
  ctx.fillStyle = "#3498db";
  ctx.font = "bold 22px 'Segoe UI', Arial";
  ctx.fillText("🎯 ADDED BY 🎯", rightX, profileY + profileSize + 35);

  // Inviter Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px 'Segoe UI', Arial";
  let displayInviter = inviterName;
  if (inviterName.length > 16) {
    displayInviter = inviterName.substring(0, 14) + "...";
  }
  ctx.fillText(displayInviter, rightX, profileY + profileSize + 70);

  // ===== CONNECTOR LINE WITH ARROW =====
  ctx.shadowColor = "#ffffff";
  ctx.shadowBlur = 10;
  ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath();
  ctx.moveTo(leftX + profileSize + 20, profileY);
  ctx.lineTo(rightX - profileSize - 20, profileY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Arrow
  ctx.fillStyle = "#3498db";
  ctx.beginPath();
  ctx.moveTo(rightX - profileSize - 25, profileY);
  ctx.lineTo(rightX - profileSize - 40, profileY - 10);
  ctx.lineTo(rightX - profileSize - 40, profileY + 10);
  ctx.closePath();
  ctx.fill();
  ctx.shadowBlur = 0;

  // ===== CENTER SECTION - GROUP INFO =====
  const centerX = width / 2;
  const groupY = profileY + profileSize + 110;
  const groupImageSize = 70;

  // Group Image Frame
  ctx.shadowColor = "#00c8ff";
  ctx.shadowBlur = 20;
  ctx.beginPath();
  ctx.arc(centerX, groupY, groupImageSize + 8, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0, 200, 255, 0.15)";
  ctx.fill();
  ctx.strokeStyle = "#00c8ff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Load group image
  let groupImage = null;
  if (threadID) {
    try {
      const imageBuffer = await getGroupImage(threadID, api);
      if (imageBuffer) {
        groupImage = await loadImage(imageBuffer);
      }
    } catch (err) {}
  }

  if (groupImage) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, groupY, groupImageSize, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(groupImage, centerX - groupImageSize, groupY - groupImageSize, groupImageSize * 2, groupImageSize * 2);
    ctx.restore();
  } else {
    ctx.fillStyle = "#2d3436";
    ctx.beginPath();
    ctx.arc(centerX, groupY, groupImageSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 50px Arial";
    ctx.fillText("👥", centerX, groupY + 15);
  }

  ctx.shadowBlur = 0;

  // Group Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 30px 'Segoe UI', Arial";
  let displayGroup = threadName;
  if (threadName.length > 30) {
    displayGroup = threadName.substring(0, 28) + "...";
  }
  ctx.fillText(`📌 ${displayGroup}`, centerX, groupY + groupImageSize + 40);

  // ===== MEMBER COUNT SECTION =====
  const memberY = groupY + 85;
  
  ctx.fillStyle = "rgba(155, 89, 182, 0.2)";
  ctx.beginPath();
  roundRect(ctx, centerX - 250, memberY, 500, 50, 12);
  ctx.fill();
  
  ctx.strokeStyle = "#9b59b6";
  ctx.lineWidth = 2;
  ctx.beginPath();
  roundRect(ctx, centerX - 250, memberY, 500, 50, 12);
  ctx.stroke();
  
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 28px 'Segoe UI', Arial";
  
  let suffix = "th";
  if (memberCount % 10 === 1 && memberCount % 100 !== 11) suffix = "st";
  else if (memberCount % 10 === 2 && memberCount % 100 !== 12) suffix = "nd";
  else if (memberCount % 10 === 3 && memberCount % 100 !== 13) suffix = "rd";
  
  const memberText = `You are the ${memberCount}${suffix} Member`;
  ctx.fillText(memberText, centerX, memberY + 35);

  // ===== SESSION MESSAGE =====
  const sessionY = memberY + 70;
  
  ctx.fillStyle = "rgba(0, 170, 255, 0.15)";
  ctx.beginPath();
  roundRect(ctx, centerX - 300, sessionY, 600, 45, 10);
  ctx.fill();
  
  ctx.fillStyle = "#a0e8ff";
  ctx.font = "italic 24px 'Segoe UI', Arial";
  ctx.fillText(sessionMessage, centerX, sessionY + 30);

  // ===== FOOTER SECTION =====
  const footerY = cardY + cardHeight - 50;
  
  ctx.fillStyle = "rgba(0, 50, 100, 0.3)";
  ctx.beginPath();
  roundRect(ctx, cardX + 50, footerY, cardWidth - 100, 40, 10);
  ctx.fill();

  // Bot & Author credit
  ctx.fillStyle = "#ff55aa";
  ctx.font = "bold 18px 'Segoe UI', Arial";
  ctx.textAlign = "right";
  ctx.fillText("💎 Heli•LUMO | Rasel Mahmud 💎", cardX + cardWidth - 70, footerY + 25);

  // ===== CORNER ACCENTS =====
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

  // ===== BORDER =====
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.strokeRect(10, 10, width - 20, height - 20);

  // ===== SAVE IMAGE =====
  const tempPath = path.join(__dirname, `temp_welcome_${Date.now()}.png`);
  const buffer = canvas.toBuffer('image/png');
  await fs.writeFile(tempPath, buffer);
  
  return tempPath;
}

// ===== ROUNDRECT FUNCTION (Fixed) =====
function roundRect(ctx, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
  return ctx;
}
