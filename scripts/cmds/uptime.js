const os = require("os");

module.exports = {
  config: {
    name: "uptime",
    aliases: ["up", "upt"],
    version: "7.0",
    author: "Rasel Mahmud",
    role: 0,
    shortDescription: "Show bot uptime with reliable animation",
    longDescription: "Displays bot uptime stats with guaranteed animation completion",
    category: "system",
    guide: "{p}uptime"
  },

  onStart: async function ({ api, event, usersData, threadsData }) {
    const delay = ms => new Promise(res => setTimeout(res, ms));
    
    // Smart message handler
    const editOrSend = async (content, messageID = null, maxRetries = 2) => {
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          if (messageID) {
            await api.editMessage(content, messageID);
            return messageID;
          } else {
            const msg = await api.sendMessage(content, event.threadID);
            return msg.messageID;
          }
        } catch (error) {
          if (attempt === maxRetries - 1) {
            // Last attempt: send as new message
            const newMsg = await api.sendMessage(content, event.threadID);
            return newMsg.messageID;
          }
          await delay(500 * (attempt + 1));
        }
      }
    };

    let currentMessageID = null;

    try {
      // STEP 1: Show initial message
      currentMessageID = await editOrSend(
        `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n┃  📡 𝐒𝐓𝐀𝐑𝐓𝐈𝐍𝐆 𝐒𝐘𝐒𝐓𝐄𝐌...\n┃  ▱▱▱▱▱▱▱▱▱▱ 𝟎%\n╚═══════════════════╝`
      );

      await delay(800); // Initial delay

      // STEP 2: Only 4 animation steps as requested
      const animationSteps = [
        { percent: "𝟎%", bar: "▱▱▱▱▱▱▱▱▱▱", delay: 800 },
        { percent: "𝟓𝟎%", bar: "▰▰▰▰▰▱▱▱▱▱", delay: 800 },
        { percent: "𝟕𝟓%", bar: "▰▰▰▰▰▰▰▱▱▱", delay: 800 },
        { percent: "𝟏𝟎𝟎%", bar: "▰▰▰▰▰▰▰▰▰▰", delay: 800 }
      ];

      // Show each step with longer delays
      for (const step of animationSteps) {
        const content = `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n┃  📡 𝐏𝐑𝐎𝐂𝐄𝐒𝐒𝐈𝐍𝐆 𝐃𝐀𝐓𝐀\n┃  ${step.bar} ${step.percent}\n╚═══════════════════╝`;
        
        currentMessageID = await editOrSend(content, currentMessageID);
        await delay(step.delay);
      }

      // STEP 3: Calculate all data
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
      const date = bangladeshTime.toLocaleDateString("en-GB", {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
      const time = bangladeshTime.toLocaleTimeString("en-US", {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });

      // Get user and thread counts
      let totalUsers = 0;
      let totalThreads = 0;
      
      try {
        if (usersData?.getAll) {
          const users = await usersData.getAll();
          totalUsers = users.length;
        }
      } catch (e) {
        console.log("User data fetch error:", e.message);
      }
      
      try {
        if (threadsData?.getAll) {
          const threads = await threadsData.getAll();
          totalThreads = threads.length;
        }
      } catch (e) {
        console.log("Thread data fetch error:", e.message);
      }

      // STEP 4: Final message with success indicator
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

      // Show completion message
      await editOrSend(
        `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n┃  ✅ 𝐃𝐀𝐓𝐀 𝐂𝐎𝐌𝐏𝐋𝐄𝐓𝐄\n┃  ▰▰▰▰▰▰▰▰▰▰ 𝟏𝟎𝟎%\n╚═══════════════════╝`,
        currentMessageID
      );
      
      await delay(600); // Final delay before showing results
      
      // Show final results
      await editOrSend(finalMessage, currentMessageID);

    } catch (error) {
      console.error("Uptime command error:", error);
      
      // Show error message in the same format
      const errorMessage = `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n┃  ⚠️  𝐒𝐓𝐀𝐓𝐔𝐒 : 𝐎𝐍𝐋𝐈𝐍𝐄\n┃  📊 𝐁𝐨𝐭 𝐢𝐬 𝐫𝐮𝐧𝐧𝐢𝐧𝐠 𝐧𝐨𝐫𝐦𝐚𝐥𝐥𝐲\n╚═══════════════════╝`;
      
      if (currentMessageID) {
        try {
          await api.editMessage(errorMessage, currentMessageID);
        } catch {
          await api.sendMessage(errorMessage, event.threadID);
        }
      } else {
        await api.sendMessage(errorMessage, event.threadID);
      }
    }
  }
};
