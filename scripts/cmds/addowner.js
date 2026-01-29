const util = require("util");

module.exports = {
  config: {
    name: "addowner",
    version: "1.1.0",
    hasPermssion: 0, // anyone can use
    credits: "Rasel Mahmud",
    description: "Invite owner to the current group",
    commandCategory: "system",
    usages: "addowner",
    cooldowns: 5
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;

    // --- CONFIGURED OWNER UID ---
    const ownerUID = "61586335299049";

    try {
      // 1) First check if owner is already in group
      let threadInfo;
      try {
        threadInfo = await api.getThreadInfo(threadID);
      } catch (e) {
        console.error("getThreadInfo error:", e);
        return api.sendMessage(
          `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
          `         ❌ 𝐄𝐑𝐑𝐎𝐑\n\n` +
          `Cannot read group information.\n` +
          `Make sure bot has proper access.\n\n` +
          `👑 Developer: Rasel Mahmud\n` +
          `🔗 https://fb.com/share/1AcArr1zGL\n` +
          `╚═══════════════════╝`,
          threadID,
          messageID
        );
      }

      // Check if owner is already a member
      const participants = (threadInfo.participantIDs || []).map(String);
      if (participants.includes(ownerUID)) {
        return api.sendMessage(
          `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
          `         ℹ️ 𝐀𝐋𝐑𝐄𝐀𝐃𝐘 𝐌𝐄𝐌𝐁𝐄𝐑\n\n` +
          `Owner (ID: ${ownerUID})\n` +
          `is already in this group.\n\n` +
          `👑 Developer: Rasel Mahmud\n` +
          `🔗 https://fb.com/share/1AcArr1zGL\n` +
          `╚═══════════════════╝`,
          threadID,
          messageID
        );
      }

      // 2) Get bot's admin status
      const botID = String(api.getCurrentUserID());
      const adminIDs = (threadInfo.adminIDs || []).map(a => 
        (a && a.id) ? String(a.id) : String(a)
      );
      const botIsAdmin = adminIDs.includes(botID);

      // 3) Try to add owner
      try {
        await api.addUserToGroup(ownerUID, threadID);
        
        // Success - get owner name
        let ownerName = ownerUID;
        try {
          const userInfo = await api.getUserInfo([ownerUID]);
          if (userInfo && userInfo[ownerUID] && userInfo[ownerUID].name) {
            ownerName = userInfo[ownerUID].name;
          }
        } catch (e) {
          // Ignore name error
        }

        // Success message
        return api.sendMessage(
          `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
          `         ✅ 𝐎𝐖𝐍𝐄𝐑 𝐀𝐃𝐃𝐄𝐃\n\n` +
          `🎉 Owner invitation sent!\n\n` +
          `👑 Name: ${ownerName}\n` +
          `🆔 UID: ${ownerUID}\n` +
          `📌 Status: Successfully added\n\n` +
          `🌟 Royal entry completed!\n` +
          `💎 Shine like a diamond!\n\n` +
          `👑 Developer: Rasel Mahmud\n` +
          `🔗 https://fb.com/share/1AcArr1zGL\n` +
          `╚═══════════════════╝`,
          threadID,
          messageID
        );

      } catch (addErr) {
        console.error("addUserToGroup error:", addErr);
        
        // Different error handling based on bot admin status
        if (!botIsAdmin) {
          // Bot is not admin - pending request
          return api.sendMessage(
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         ⏳ 𝐏𝐄𝐍𝐃𝐈𝐍𝐆 𝐑𝐄𝐐𝐔𝐄𝐒𝐓\n\n` +
            `Owner invitation sent as pending.\n\n` +
            `⚠️ Bot is not admin in this group\n` +
            `📌 Check group's pending requests\n` +
            `🆔 UID: ${ownerUID}\n\n` +
            `Note: Group admin needs to approve\n` +
            `the request manually.\n\n` +
            `👑 Developer: Rasel Mahmud\n` +
            `🔗 https://fb.com/share/1AcArr1zGL\n` +
            `╚═══════════════════╝`,
            threadID,
            messageID
          );
        } else {
          // Bot is admin but still failed
          const errorMsg = addErr.message || "Unknown error";
          
          return api.sendMessage(
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         ❌ 𝐅𝐀𝐈𝐋𝐄𝐃\n\n` +
            `Failed to add owner to group.\n\n` +
            `⚠️ Error: ${errorMsg}\n` +
            `🆔 UID: ${ownerUID}\n\n` +
            `Possible reasons:\n` +
            `• Owner blocked the bot\n` +
            `• Privacy settings\n` +
            `• Account restrictions\n\n` +
            `👑 Developer: Rasel Mahmud\n` +
            `🔗 https://fb.com/share/1AcArr1zGL\n` +
            `╚═══════════════════╝`,
            threadID,
            messageID
          );
        }
      }

    } catch (err) {
      console.error("Unexpected addowner error:", err);
      
      return api.sendMessage(
        `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
        `         ⚠️ 𝐒𝐘𝐒𝐓𝐄𝐌 𝐄𝐑𝐑𝐎𝐑\n\n` +
        `Unexpected system error occurred.\n\n` +
        `🔄 Please try again later\n` +
        `📞 Contact developer if persists\n\n` +
        `👑 Developer: Rasel Mahmud\n` +
        `🔗 https://fb.com/share/1AcArr1zGL\n` +
        `╚═══════════════════╝`,
        threadID,
        messageID
      );
    }
  }
};
