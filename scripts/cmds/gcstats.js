const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "gcstats",
    aliases: ["groupstats", "groupinfo2"],
    version: "2.1",
    author: "Rasel Mahmud",
    countDown: 10,
    role: 0,
    shortDescription: "Show group logo & member collage",
    longDescription: "Show group name, logo, admin count and profile pics (fixed white image bug)",
    category: "group"
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Unnamed Group";
      const groupImage = threadInfo.imageSrc || null;
      const adminIDs = threadInfo.adminIDs || [];
      const members = threadInfo.participantIDs || [];
      const adminCount = adminIDs.length;
      const memberCount = members.length;

      const cols = 15;
      const thumbSize = 70;
      const margin = 10;
      const rows = Math.ceil(memberCount / cols);
      const canvasWidth = cols * (thumbSize + margin) + margin;
      const canvasHeight = rows * (thumbSize + margin) + 400;
      const canvas = createCanvas(canvasWidth, canvasHeight);
      const ctx = canvas.getContext("2d");

      // background
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvasWidth, canvasHeight);

      // group logo
      if (groupImage) {
        try {
          const res = await axios.get(groupImage, { responseType: "arraybuffer" });
          const logo = await loadImage(Buffer.from(res.data, "binary"));
          ctx.save();
          ctx.beginPath();
          ctx.arc(100, 100, 80, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(logo, 20, 20, 160, 160);
          ctx.restore();
        } catch (e) {
          console.log("⚠️ logo load fail");
        }
      }

      // text
      ctx.fillStyle = "#ff3333";
      ctx.font = "bold 40px Sans";
      ctx.fillText(groupName, 200, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "24px Sans";
      ctx.fillText(`Admins: ${adminCount}`, 200, 130);
      ctx.fillText(`Members: ${memberCount}`, 200, 170);

      // --- fixed member avatar loader ---
      let x = margin, y = 250;
      let count = 0;

      for (const id of members) {
        try {
          const avatarUrl = `https://graph.facebook.com/${id}/picture?width=200&height=200&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
          const res = await axios.get(avatarUrl, { responseType: "arraybuffer" });
          const avatar = await loadImage(Buffer.from(res.data, "binary"));

          ctx.save();
          ctx.beginPath();
          ctx.arc(x + thumbSize / 2, y + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(avatar, x, y, thumbSize, thumbSize);
          ctx.restore();
        } catch (err) {
          // fallback gray box
          ctx.fillStyle = "#333";
          ctx.beginPath();
          ctx.arc(x + thumbSize / 2, y + thumbSize / 2, thumbSize / 2, 0, Math.PI * 2);
          ctx.closePath();
          ctx.fill();
        }

        x += thumbSize + margin;
        count++;
        if (count % cols === 0) {
          x = margin;
          y += thumbSize + margin;
        }
      }

      // output
      const imgPath = path.join(__dirname, "gcstats.png");
      fs.writeFileSync(imgPath, canvas.toBuffer("image/png"));

      await api.sendMessage({
        body: `📸 Group: ${groupName}\n🛡️ Admins: ${adminCount}\n👥 Members: ${memberCount}`,
        attachment: fs.createReadStream(imgPath)
      }, threadID, () => fs.unlinkSync(imgPath), messageID);

    } catch (error) {
      console.error(error);
      api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  }
};
