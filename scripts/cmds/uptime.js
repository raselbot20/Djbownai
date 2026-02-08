const os = require("os");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "7.2",
    author: "Rasel Mahmud",
    role: 0,
    shortDescription: "Show bot uptime with animated progress",
    longDescription: "Displays bot uptime stats with editMessage animation",
    category: "system",
    guide: "{p}uptime"
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    const delay = ms => new Promise(res => setTimeout(res, ms));

    // Smart editMessage handler
    const editMessageSafe = async (content, messageID) => {
      try {
        await api.editMessage(content, messageID);
      } catch (e) {
        console.error("Edit message failed:", e.message);
      }
    };

    try {
      // STEP 1: Send initial message
      const initialMsg = await api.sendMessage(
        `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  📡 𝐒𝐓𝐀𝐑𝐓𝐈𝐍𝐆 𝐒𝐘𝐒𝐓𝐄𝐌...
┃  ▱▱▱▱▱▱▱▱▱▱ 𝟎%
╚═══════════════════╝`,
        event.threadID
      );
      let currentMessageID = initialMsg.messageID;

      await delay(800);

      // STEP 2: Animation steps
      const animationSteps = [
        { percent: "50%", bar: "▰▰▰▰▰▱▱▱▱▱", delay: 800 },
        { percent: "75%", bar: "▰▰▰▰▰▰▰▱▱▱", delay: 800 },
        { percent: "100%", bar: "▰▰▰▰▰▰▰▰▰▰", delay: 800 }
      ];

      for (const step of animationSteps) {
        await editMessageSafe(
          `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  📡 𝐏𝐑𝐎𝐂𝐄𝐒𝐒𝐈𝐍𝐆 𝐃𝐀𝐓𝐀
┃  ${step.bar} ${step.percent}
╚═══════════════════╝`,
          currentMessageID
        );
        await delay(step.delay);
      }

      // STEP 3: Calculate uptime
      const uptime = process.uptime();
      const days = Math.floor(uptime / 86400);
      const hours = Math.floor((uptime % 86400) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const uptimeFormatted = `${days}𝐝 ${hours}𝐡 ${minutes}𝐦 ${seconds}𝐬`;

      const ping = Date.now() - event.timestamp;

      // Bangladesh time
      const now = new Date();
      const bangladeshTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Dhaka" }));
      const date = bangladeshTime.toLocaleDateString("en-GB", { day: 'numeric', month: 'short', year: 'numeric' });
      const time = bangladeshTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', hour12: true });

      // User and thread counts
      let totalUsers = 0;
      let totalThreads = 0;

      try { totalUsers = (await usersData.getAll()).length; } catch {}
      try { totalThreads = (await threadsData.getAll()).length; } catch {}

      // STEP 4: Show final uptime stats in the same message (edit)
      const finalMessage = `
╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  ⏱️  𝐔𝐏𝐓𝐈𝐌𝐄 : ${uptimeFormatted}
┃  📡 𝐏𝐈𝐍𝐆 : ${ping}𝐦𝐬
┃  📅 𝐃𝐀𝐓𝐄 : ${date}
┃  ⏰ 𝐓𝐈𝐌𝐄 : ${time} (𝐁𝐃𝐓)
┃  👥 𝐔𝐒𝐄𝐑𝐒 : ${totalUsers}
┃  💬 𝐓𝐇𝐑𝐄𝐀𝐃𝐒 : ${totalThreads}
┃  👑 𝐂𝐑𝐄𝐀𝐓𝐎𝐑 : 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝
┃  ✅ 𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐏𝐄𝐑𝐀𝐓𝐈𝐎𝐍𝐀𝐋
╚═══════════════════╝
`.trim();

      await editMessageSafe(finalMessage, currentMessageID);

    } catch (error) {
      console.error("Uptime command error:", error);

      const errorMessage = `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
┃  ⚠️  𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐍𝐋𝐈𝐍𝐄
┃  📊 𝐁𝐨𝐭 𝐢𝐬 𝐫𝐮𝐧𝐧𝐢𝐧𝐠 𝐧𝐨𝐫𝐦𝐚𝐥𝐥𝑦
╚═══════════════════╝`;

      if (currentMessageID) await editMessageSafe(errorMessage, currentMessageID);
      else await api.sendMessage(errorMessage, event.threadID);
    }
  }
};
