const axios = require('axios');
const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "groupinfo",
    aliases: ["ginfo"],
    version: "1.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Show group info",
    longDescription: "Shows group logo, name, admin list, and member count like the given picture.",
    category: "group",
  },

  onStart: async function({ api, event }) {
    const { threadID, messageID } = event;

    try {
      const threadInfo = await api.getThreadInfo(threadID);
      const groupName = threadInfo.threadName || "Unnamed Group";
      const groupImage = threadInfo.imageSrc || null;
      const adminIDs = threadInfo.adminIDs || [];
      const members = threadInfo.participantIDs || [];
      const adminCount = adminIDs.length;
      const memberCount = members.length;

      // ----- Fetch Admin Names -----
      const adminNames = [];
      for (const admin of adminIDs) {
        try {
          const info = await api.getUserInfo(admin.id || admin);
          const name = info[admin.id || admin]?.name || "Unknown";
          adminNames.push(name);
        } catch {
          adminNames.push("Unknown");
        }
      }

      // ----- Sample Members (up to 40) -----
      const sample = members.slice(0, 40);
      const memberNames = [];
      let i = 1;
      for (const id of sample) {
        try {
          const info = await api.getUserInfo(id);
          const name = info[id]?.name || "Unknown";
          memberNames.push(`${i}. ${name}`);
        } catch {
          memberNames.push(`${i}. Unknown`);
        }
        i++;
      }

      // ----- Build message -----
      const msg =
`🌐 Group Name: ${groupName}
🛡️ Admins (${adminCount}): ${adminNames.join(", ")}
👥 Members: ${memberCount}

📋 Sample Members (${sample.length}):
${memberNames.join("\n")}
`;

      // ----- Send message -----
      if (groupImage) {
        const imgPath = path.join(__dirname, "groupinfo.jpg");
        const imgData = (await axios.get(groupImage, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(imgPath, Buffer.from(imgData, "binary"));

        api.sendMessage({
          body: msg,
          attachment: fs.createReadStream(imgPath)
        }, threadID, () => fs.unlinkSync(imgPath), messageID);
      } else {
        api.sendMessage(msg, threadID, messageID);
      }

    } catch (error) {
      api.sendMessage(`❌ Error fetching group info:\n${error.message}`, threadID, messageID);
    }
  }
};
