const fs = require("fs");
const axios = require("axios");
const path = require("path");

module.exports = {
  config: {
    name: "animepicture",
    aliases: ["animepic", "ap"],
    version: "1.1",
    author: "Rasel Mahmud",
    countDown: 3,
    role: 0,
    description: "Send a random anime picture with bot information",
    category: "media",
    guide: "{pn} - Get a random anime image"
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID } = event;

    // ✅ ALL IMAGE LINKS (FIXED & CLEAN)
    const images = [
      "https://files.catbox.moe/wfngzy.jpg",
      "https://files.catbox.moe/1xdv8z.jpg",
      "https://files.catbox.moe/fmn527.jpg",
      "https://files.catbox.moe/et8m45.jpg",
      "https://files.catbox.moe/pjxmue.jpg",
      "https://files.catbox.moe/7kndmf.jpg",
      "https://files.catbox.moe/o8cgcm.jpg",
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
      "https://files.catbox.moe/37gypi.jpg",
      "https://files.catbox.moe/ohs60q.jpg",
      "https://files.catbox.moe/2czm0r.jpg",
      "https://files.catbox.moe/xj5mmk.jpg",
      "https://files.catbox.moe/mpo552.jpg",
      "https://files.catbox.moe/szmfk6.jpg",
      "https://files.catbox.moe/o7sa1g.jpg",
      "https://files.catbox.moe/7iie36.jpg",
      "https://files.catbox.moe/o3xqgu.jpg",
      "https://files.catbox.moe/8kqkv3.jpg",
      "https://files.catbox.moe/jcuyc9.jpg",
      "https://files.catbox.moe/isx1e1.jpg",
      "https://files.catbox.moe/m2gxmx.jpg",
      "https://files.catbox.moe/t5u0bb.jpg",
      "https://files.catbox.moe/ona5lr.jpg",
      "https://files.catbox.moe/7pyujd.jpg",
      "https://files.catbox.moe/8qs8jo.jpg",
      "https://files.catbox.moe/ow5c73.jpg",
			"https://files.catbox.moe/coc4vt.jpg",
      "https://files.catbox.moe/tzckhc.jpg"
    ];

    try {
      const randomImage = images[Math.floor(Math.random() * images.length)];
      const filePath = path.join(__dirname, `anime_${Date.now()}.jpg`);

      const now = new Date();
      const timeString = now.toLocaleTimeString("en-BD", { hour12: true });
      const dateString = now.toLocaleDateString("en-BD", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
      });

      const messageBody =
`╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
✅ Anime Picture Request

📦 Total Images: ${images.length}
🎯 Status: Success ✅

📅 Date: ${dateString}
⏰ Time: ${timeString}
🖼️ Image: ${randomImage.split("/").pop()}

🎨 Category: Anime
👑 Owner: Rasel Mahmud
╚═══════════════════╝`;

      const response = await axios.get(randomImage, { responseType: "arraybuffer" });
      fs.writeFileSync(filePath, Buffer.from(response.data));

      await api.sendMessage({
        body: messageBody,
        attachment: fs.createReadStream(filePath)
      }, threadID, () => fs.unlinkSync(filePath), messageID);

    } catch (error) {
      return api.sendMessage("❌ Error sending anime image!", threadID, messageID);
    }
  }
};
