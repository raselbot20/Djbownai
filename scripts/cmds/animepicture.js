const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "animepicture",
    aliases: ["animepic", "ap"],
    version: "1.0",
    author: "Rasel Mahmud",
    countDown: 3,
    role: 0,
    description: "Send a random anime picture with bot information",
    category: "media",
    guide: "{pn} - Get a random anime image"
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID } = event;

    // ============= ALL IMAGE LINKS =============
    const images = [
      "https://files.catbox.moe/wfngzy.jpg",
      "https://files.catbox.moe/1xdv8z.jpg",
      "https://files.catbox.moe/fmn527.jpg",
      "https://files.catbox.moe/et8m45.jpg",
      "https://files.catbox.moe/pjxmue.jpg",
      "https://files.catbox.moe/7kndmf.jpg",
      "https://files.catbox.moe/o8cgcm.jpg", // FIXED: Added https://
      "https://files.catbox.moe/2nd2gq.jpg",
      "https://files.catbox.moe/ohqfdz.jpg",
      "https://files.catbox.moe/z129vp.jpg",
      "https://files.catbox.moe/qwtstf.jpg",
      "https://files.catbox.moe/6l8g10.jpg",
      "https://files.catbox.moe/pwj189.jpg",
      "https://files.catbox.moe/fnrdcx.jpg",
      "https://files.catbox.moe/xgtccm.jpg",
      "https://files.catbox.moe/7d5liz.jpg",
      "https://files.catbox.moe/14vljp.jpg",
      "https://files.catbox.moe/9l0u7j.jpg",
      "https://files.catbox.moe/3qz0ze.jpg",
      "https://files.catbox.moe/wq9879.jpg",
      "https://files.catbox.moe/jkivl3.jpg",
      "https://files.catbox.moe/ffsge2.jpg",
      "https://files.catbox.moe/7a4nsg.jpg",
      "https://files.catbox.moe/d34419.jpg",
      "https://files.catbox.moe/de4mz6.jpg",
      "https://files.catbox.moe/pq0tan.jpg",
      "https://files.catbox.moe/t50bm5.jpg",
      "https://files.catbox.moe/0i359f.jpg",
      "https://files.catbox.moe/u7t2tc.jpg",
      "https://files.catbox.moe/bx70ne.jpg",
      "https://files.catbox.moe/8ve59b.jpg",
      "https://files.catbox.moe/q2gtad.jpg",
      "https://files.catbox.moe/1s7ctu.jpg",
      "https://files.catbox.moe/f4kdt2.jpg",
      "https://files.catbox.moe/axh9be.jpg",
      "https://files.catbox.moe/qkpqy8.jpg",
      "https://files.catbox.moe/qbdyrr.jpg",
      "https://files.catbox.moe/rvmbip.jpg",
    ];

    try {
      // ==== RANDOM IMAGE SELECTION ====
      const randomImage = images[Math.floor(Math.random() * images.length)];
      const filePath = path.join(__dirname, `ap_image_${Date.now()}.jpg`);
      
      // Get Bangladesh time (UTC+6)
      const bangladeshTime = new Date();
      bangladeshTime.setHours(bangladeshTime.getHours() + 6); // UTC+6
      const timeString = bangladeshTime.toLocaleTimeString('en-BD', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
      
      // Get date in Bangladesh format
      const dateString = bangladeshTime.toLocaleDateString('en-BD', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create message body with Bangladesh time
      const messageBody = 
        `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
        `✅ Anime Picture Request\n\n` +
        `📦 Total Images: ${images.length}\n` +
        `📊 Status: ✅ Successfully Sent\n\n` +
        `🌏 Location: Bangladesh (UTC+6)\n` +
        `📅 Date: ${dateString}\n` +
        `⏰ Time: ${timeString}\n` +
        `🔗 Image: ${randomImage.split('/').pop()}\n\n` +
        `🎨 Category: Anime Art\n` +
        `👑 Owner: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
        `🔗 Profile: https://www.facebook.com/share/1AcArr1zGL/\n` +
        `╚═══════════════════╝`;

      // ==== DOWNLOAD IMAGE ====
      const response = await axios({
        url: randomImage,
        method: "GET",
        responseType: "stream",
        timeout: 15000, // 15 seconds timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      await new Promise((resolve, reject) => {
        writer.on("finish", resolve);
        writer.on("error", reject);
      });

      // ==== SEND MESSAGE ====
      await api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(filePath)
      }, threadID, (err) => {
        // Clean up file after sending
        try {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
        
        if (err) {
          console.error("Send message error:", err);
        }
      }, messageID);

    } catch (error) {
      console.error("❌ Error:", error);
      
      // Get Bangladesh time for error message
      const bangladeshTime = new Date();
      bangladeshTime.setHours(bangladeshTime.getHours() + 6);
      const errorTimeString = bangladeshTime.toLocaleTimeString('en-BD', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      // Error message with box design and Bangladesh time
      const errorMessage = 
        `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
        `❌ Error: Failed to send image\n\n` +
        `⚠️ Issue: ${error.message || "Unknown error"}\n` +
        `🌏 Location: Bangladesh (UTC+6)\n` +
        `⏰ Time: ${errorTimeString}\n\n` +
        `🔄 Status: ❌ Failed\n` +
        `📊 Solution: Try again later\n\n` +
        `👑 Owner: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
        `🔗 Profile: https://www.facebook.com/share/1AcArr1zGL/\n` +
        `╚═══════════════════╝`;
      
      return api.sendMessage(errorMessage, threadID, messageID);
    }
  }
};
