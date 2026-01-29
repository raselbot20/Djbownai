const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "haha",
    version: "5.2",
    hasPermssion: 0,
    author: "Rasel Mahmud",
    description: "Funny pic with mentioned/replied user's profile, name on top, bigger and moved",
    commandCategory: "fun",
    usages: "[mention/reply]",
    cooldowns: 5
  },

  onLoad: async () => {
    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
  },

  onStart: async ({ api, event }) => {
    const { threadID, messageReply, mentions, messageID, senderID } = event;
    let userID = null;
    let userName = "";

    // Determine target user
    if (Object.keys(mentions).length > 0) {
      userID = Object.keys(mentions)[0];
      userName = mentions[userID].replace("@", "");
    } else if (messageReply) {
      userID = messageReply.senderID;
      try {
        const info = await api.getUserInfo(userID);
        userName = info[userID]?.name || "User";
      } catch (e) {
        userName = "User";
      }
    } else {
      userID = senderID;
      try {
        const info = await api.getUserInfo(userID);
        userName = info[userID]?.name || "User";
      } catch (e) {
        userName = "You";
      }
    }

    // YOUR ORIGINAL BACKGROUND IMAGE URL
    const bgURL = "https://drive.google.com/uc?export=download&id=1lClvnrDgsfpo5whgt0AiJL3iu-yDVIlJ";

    // Backup images in case Google Drive fails
    const backupImages = [
      "https://i.imgur.com/DwY9Y9r.jpg",
      "https://i.imgur.com/3qK7Z9J.jpg",
      "https://i.imgur.com/9fL7X2p.jpg"
    ];

    try {
      // Send initial reaction
      try {
        await api.setMessageReaction("⏳", messageID, () => {}, true);
      } catch (reactionError) {
        console.log("Reaction error:", reactionError);
      }

      const cacheDir = path.join(__dirname, "cache");
      
      let backgroundImage = null;
      let usedBackup = false;

      // TRY 1: Your original Google Drive image
      try {
        console.log("🔄 Trying original Google Drive image...");
        const bgResponse = await axios.get(bgURL, {
          responseType: 'arraybuffer',
          timeout: 20000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const bgBuffer = Buffer.from(bgResponse.data);
        backgroundImage = await loadImage(bgBuffer);
        console.log("✅ Original image loaded successfully");
        
      } catch (originalError) {
        console.log("❌ Original image failed, trying backup...");
        
        // TRY 2: Backup images
        for (let i = 0; i < backupImages.length; i++) {
          try {
            console.log(`🔄 Trying backup image ${i + 1}...`);
            const backupResponse = await axios.get(backupImages[i], {
              responseType: 'arraybuffer',
              timeout: 15000
            });
            
            const backupBuffer = Buffer.from(backupResponse.data);
            backgroundImage = await loadImage(backupBuffer);
            usedBackup = true;
            console.log(`✅ Backup image ${i + 1} loaded successfully`);
            break;
            
          } catch (backupError) {
            console.log(`❌ Backup image ${i + 1} failed`);
            continue;
          }
        }
      }

      // If all images fail, create canvas with default size
      const canvasWidth = 1024;
      const canvasHeight = 768;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // Draw background
      if (backgroundImage) {
        ctx.drawImage(backgroundImage, 0, 0, canvasWidth, canvasHeight);
        if (usedBackup) {
          console.log("⚠️ Using backup image instead of original");
        }
      } else {
        // Fallback: Create colorful background
        console.log("⚠️ Using fallback background");
        const gradient = ctx.createLinearGradient(0, 0, canvasWidth, canvasHeight);
        gradient.addColorStop(0, "#FFD700");
        gradient.addColorStop(1, "#FF4500");
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Add pattern
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 40px Arial";
        ctx.textAlign = "center";
        ctx.fillText("😂 HAHAAHHA FUNNY BACKGROUND 😂", canvasWidth/2, 100);
        ctx.fillText("😂 HAHAAHHA FUNNY BACKGROUND 😂", canvasWidth/2, canvasHeight - 100);
      }

      // Load and draw user avatar
      try {
        const avatarURL = `https://graph.facebook.com/${userID}/picture?width=500&height=500`;
        
        const avatarResponse = await axios.get(avatarURL, {
          responseType: 'arraybuffer',
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          }
        });
        
        const avatarBuffer = Buffer.from(avatarResponse.data);
        const avatar = await loadImage(avatarBuffer);
        
        // Draw circular avatar - BIGGER SIZE
        const avatarSize = 280; // Increased from 250
        const avatarX = (canvasWidth - avatarSize) / 2;
        const avatarY = 120; // Moved up a bit
        
        ctx.save();
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
        ctx.restore();
        
        // Add glowing border to avatar
        ctx.strokeStyle = "#FF0000";
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.stroke();

      } catch (avatarError) {
        console.log("Avatar error, using placeholder:", avatarError);
        // Draw placeholder avatar
        const avatarSize = 280;
        const avatarX = (canvasWidth - avatarSize) / 2;
        const avatarY = 120;
        
        // Gradient circle
        const gradient = ctx.createRadialGradient(
          avatarX + avatarSize/2, avatarY + avatarSize/2, 0,
          avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2
        );
        gradient.addColorStop(0, "#1E90FF");
        gradient.addColorStop(1, "#00008B");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(avatarX + avatarSize/2, avatarY + avatarSize/2, avatarSize/2, 0, Math.PI * 2);
        ctx.fill();
        
        // User initial
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 100px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(userName.charAt(0).toUpperCase(), avatarX + avatarSize/2, avatarY + avatarSize/2);
      }

      // Add username text - BIGGER and BETTER VISIBLE
      ctx.fillStyle = "#000000";
      ctx.font = "bold 52px 'Arial', sans-serif"; // Increased from 48px
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      
      // Text shadow for better visibility
      ctx.shadowColor = "rgba(255, 255, 255, 0.8)";
      ctx.shadowBlur = 15;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 3;
      
      // Main funny text
      const funnyText = `😂 HAHAAHHA ${userName.toUpperCase()}! 😂`;
      ctx.fillText(funnyText, canvasWidth/2, 450);
      
      // Remove shadow for second text
      ctx.shadowColor = "transparent";
      
      // Add second text - MOVED DOWN
      ctx.fillStyle = "#FF0000";
      ctx.font = "bold 38px 'Arial', sans-serif"; // Increased from 36px
      ctx.fillText("YOU ARE SO FUNNY! 🤣", canvasWidth/2, 520);
      
      // Add third text - EVEN BIGGER
      ctx.fillStyle = "#0000FF";
      ctx.font = "bold 32px 'Arial', sans-serif"; // Increased from 28px
      ctx.fillText("LAUGHING SO HARD RIGHT NOW!", canvasWidth/2, 590);
      
      // Add bot signature
      ctx.fillStyle = "#333333";
      ctx.font = "bold 22px 'Arial', sans-serif"; // Increased from 20px
      ctx.textAlign = "right";
      ctx.fillText("Made by 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢", canvasWidth - 20, canvasHeight - 20);

      // Save image to cache
      const finalPath = path.join(cacheDir, `haha_${Date.now()}.png`);
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(finalPath, buffer);

      // Send the image with success message
      const successMessage = usedBackup 
        ? `😂 ${userName.toUpperCase()}! YOU'RE HILARIOUS! 🤣\n\n⚠️ Note: Used backup background image\n👑 Bot by: 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢\n🔗 Owner: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝`
        : `😂 ${userName.toUpperCase()}! YOU MADE ME LAUGH SO HARD! 🤣\n\n👑 Bot by: 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢\n🔗 Owner: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝`;

      await api.sendMessage({
        body: successMessage,
        attachment: fs.createReadStream(finalPath)
      }, threadID, (err) => {
        // Cleanup files
        try {
          if (fs.existsSync(finalPath)) {
            fs.unlinkSync(finalPath);
          }
        } catch (cleanupError) {
          console.log("Cleanup error:", cleanupError);
        }
        
        // Update reaction to success
        try {
          api.setMessageReaction("✅", messageID, () => {}, true);
        } catch (reactionError2) {
          console.log("Final reaction error:", reactionError2);
        }
        
        if (err) {
          console.log("Send message error:", err);
          api.sendMessage(`😂 ${userName}! You're funny! (Image might not display)`, threadID);
        }
      });

    } catch (error) {
      console.error("MAIN ERROR in haha command:", error);
      
      try {
        await api.setMessageReaction("❌", messageID, () => {}, true);
      } catch (reactionError3) {
        console.log("Error reaction failed:", reactionError3);
      }
      
      // Send simple fallback message
      await api.sendMessage({
        body: `😂 ${userName}! You're so funny!\n\n(Sorry, couldn't generate the image this time 😅)\n\n👑 Bot by: 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢`
      }, threadID, messageID);
    }
  }
};
