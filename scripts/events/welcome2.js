const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "welcome2",
    version: "2.1",
    author: "Saimx69x | Edited by Rasel",
    category: "events"
  },

  onStart: async function ({ api, event }) {
    if (event.logMessageType !== "log:subscribe") return;

    const { threadID, logMessageData } = event;
    const newUsers = logMessageData.addedParticipants;
    const botID = api.getCurrentUserID();

    if (newUsers.some(u => u.userFbId === botID)) return;

    const threadInfo = await api.getThreadInfo(threadID);
    const groupName = threadInfo.threadName;
    const memberCount = threadInfo.participantIDs.length;

    for (const user of newUsers) {
      const userId = user.userFbId;
      const fullName = user.fullName;

      try {
        // ✅ API তৈরি (যেখানে লেখা থাকবে ছবির ভিতরে)
        const apiUrl = `https://xsaim8x-xxx-api.onrender.com/api/welcome?name=${encodeURIComponent(fullName)}&uid=${userId}&threadname=${encodeURIComponent(groupName)}&members=${memberCount}`;

        const cacheDir = path.join(__dirname, "..", "cache");
        await fs.ensureDir(cacheDir);

        const imagePath = path.join(cacheDir, `welcome_${userId}.png`);

        // ✅ Image Download
        const response = await axios.get(apiUrl, { responseType: "arraybuffer" });
        fs.writeFileSync(imagePath, response.data);

        // ✅ শুধু পিকচার পাঠানো (কোনো লেখা নেই)
        await api.sendMessage({
          attachment: fs.createReadStream(imagePath)
        }, threadID);

        // ✅ Clean cache
        fs.unlinkSync(imagePath);

      } catch (err) {
        console.error("❌ Welcome image error:", err);
      }
    }
  }
};
