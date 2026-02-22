const fs = require('fs');
const path = require('path');

module.exports = {
  config: {
    name: "join2",
    aliases: ["boxlist", "allbox", "groups", "grouplist"],
    version: "3.0.0",
    author: "RaselMahmud",
    role: 2,
    shortDescription: "Advanced group management with whitelist",
    longDescription: "View groups, add/leave, and whitelist by name/TID/number",
    category: "system",
    countDown: 5,
    guide: {
      en: "📌 **COMMANDS:**\n• /join2 - Show group list\n• add 1 2 - Add yourself\n• out 1 2 - Leave groups\n• page 2 - Next page"
    }
  },

  onStart: async function ({ api, event }) {
    const { threadID, messageID, senderID } = event;
    const perPage = 10;

    try {
      // Load whitelist
      const whitelistPath = path.join(__dirname, '..', 'whitelist.json');
      let whitelist = {};
      
      if (fs.existsSync(whitelistPath)) {
        try {
          whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
        } catch (e) {
          console.error("Error reading whitelist:", e);
        }
      }

      // Fetch all threads
      const allThreads = await api.getThreadList(100, null, ["INBOX"]);
      
      // Filter active groups only
      const groups = allThreads.filter(t => t.isGroup && t.isSubscribed);
      
      if (!groups.length) {
        return api.sendMessage("⚠️ বটটি কোনো গ্রুপে নেই।", threadID, messageID);
      }

      // Sort by name
      groups.sort((a, b) => (a.name || "").localeCompare(b.name || ""));

      const page = 1;
      const start = (page - 1) * perPage;
      const end = start + perPage;
      const currentGroups = groups.slice(start, end);

      // Create message
      let msg = `📦 | 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓 (𝐏𝐚𝐠𝐞 ${page}/${Math.ceil(groups.length/perPage)})\n`;
      msg += `📊 𝐓𝐨𝐭𝐚𝐥: ${groups.length} groups | 🔒 WL: ${Object.keys(whitelist).length}\n\n`;
      
      currentGroups.forEach((g, i) => {
        const globalIndex = start + i + 1;
        const isWhitelisted = whitelist[g.threadID] || false;
        const wlStatus = isWhitelisted ? "🔒" : "🔓";
        const memberCount = g.participantIDs?.length || 0;
        
        msg += `${globalIndex}. ${wlStatus} ${g.name || "Unnamed Group"}\n`;
        msg += `   📍 TID: ${g.threadID}\n`;
        msg += `   👥 ${memberCount} members\n\n`;
      });

      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🎯 **𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒:**\n`;
      msg += `• add 1 3 - Add yourself to groups\n`;
      msg += `• out 1 2 - Leave from groups\n`;
      msg += `• page 2 - Next page`;

      // Send message with reply handler
      api.sendMessage(msg.trim(), threadID, (err, info) => {
        if (err) return console.error(err);
        
        global.GoatBot.onReply = global.GoatBot.onReply || new Map();
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: senderID,
          groups: groups,
          page: page,
          perPage: perPage,
          whitelist: whitelist
        });
      }, messageID);

    } catch (error) {
      console.error("Error in join2:", error);
      api.sendMessage("❌ Error loading group list.", threadID, messageID);
    }
  },

  onReply: async function ({ api, event, Reply }) {
    const { threadID, messageID, senderID, body } = event;
    
    // Check if reply is from the same user
    if (senderID !== Reply.author) {
      return api.sendMessage("❌ Only command author can use this.", threadID, messageID);
    }

    const args = body.trim().split(/\s+/);
    const command = args[0].toLowerCase();
    const perPage = Reply.perPage || 10;
    const whitelistPath = path.join(__dirname, '..', 'whitelist.json');

    // Load current whitelist
    let whitelist = {};
    if (fs.existsSync(whitelistPath)) {
      try {
        whitelist = JSON.parse(fs.readFileSync(whitelistPath, 'utf8'));
      } catch (e) {
        console.error("Error reading whitelist:", e);
      }
    }

    // ========== HELPER FUNCTIONS ==========
    
    // Find group by various methods
    const findGroup = (input, groups = Reply.groups) => {
      // Check if input is a number (index)
      const num = parseInt(input);
      if (!isNaN(num) && num > 0 && num <= groups.length) {
        return groups[num - 1];
      }
      
      // Check if input is TID (numeric string)
      if (/^\d+$/.test(input)) {
        return groups.find(g => g.threadID === input);
      }
      
      // Check by name (case insensitive, partial match)
      const searchName = input.toLowerCase();
      const matchingGroups = groups.filter(g => 
        g.name && g.name.toLowerCase().includes(searchName)
      );
      
      if (matchingGroups.length === 1) return matchingGroups[0];
      if (matchingGroups.length > 1) {
        return {
          multiple: true,
          groups: matchingGroups
        };
      }
      
      return null;
    };

    // Get group display info
    const getGroupInfo = (group) => {
      return `${group.name || "Unnamed Group"} (${group.threadID})`;
    };

    // Save whitelist to file
    const saveWhitelist = () => {
      try {
        fs.writeFileSync(whitelistPath, JSON.stringify(whitelist, null, 2));
        return true;
      } catch (error) {
        console.error("Whitelist save error:", error);
        return false;
      }
    };

    // ========== PAGE COMMAND ==========
    if (command === "page") {
      const pageNum = parseInt(args[1]);
      if (isNaN(pageNum) || pageNum < 1) {
        return api.sendMessage("❌ Invalid page number.", threadID, messageID);
      }

      const start = (pageNum - 1) * perPage;
      const end = start + perPage;
      const currentGroups = Reply.groups.slice(start, end);

      if (!currentGroups.length) {
        return api.sendMessage("⚠️ No more groups.", threadID, messageID);
      }

      // Create paginated message
      let msg = `📦 | 𝐆𝐑𝐎𝐔𝐏 𝐋𝐈𝐒𝐓 (𝐏𝐚𝐠𝐞 ${pageNum}/${Math.ceil(Reply.groups.length/perPage)})\n`;
      msg += `📊 𝐓𝐨𝐭𝐚𝐥: ${Reply.groups.length} groups | 🔒 WL: ${Object.keys(whitelist).length}\n\n`;
      
      currentGroups.forEach((g, i) => {
        const globalIndex = start + i + 1;
        const isWhitelisted = whitelist[g.threadID] || false;
        const wlStatus = isWhitelisted ? "🔒" : "🔓";
        const memberCount = g.participantIDs?.length || 0;
        
        msg += `${globalIndex}. ${wlStatus} ${g.name || "Unnamed Group"}\n`;
        msg += `   📍 TID: ${g.threadID}\n`;
        msg += `   👥 ${memberCount} members\n\n`;
      });

      msg += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      msg += `🎯 Use: page ${pageNum + 1} for next page`;

      // Send with reply handler
      api.sendMessage(msg.trim(), threadID, (err, info) => {
        if (err) return console.error(err);
        
        global.GoatBot.onReply = global.GoatBot.onReply || new Map();
        global.GoatBot.onReply.set(info.messageID, {
          commandName: Reply.commandName,
          author: Reply.author,
          groups: Reply.groups,
          page: pageNum,
          perPage: perPage,
          whitelist: whitelist
        });
      });
      return;
    }

    // ========== ADD COMMAND ==========
    if (command === "add") {
      if (args.length < 2) {
        return api.sendMessage("❌ Usage: add 1 2 3", threadID, messageID);
      }

      const addedGroups = [];
      const failedGroups = [];

      for (let i = 1; i < args.length; i++) {
        const group = findGroup(args[i]);
        
        if (!group) {
          await api.sendMessage(`❌ Not found: ${args[i]}`, threadID);
          continue;
        }

        if (group.multiple) {
          await api.sendMessage(`❌ Multiple matches for "${args[i]}". Use TID instead.`, threadID);
          continue;
        }

        try {
          await api.addUserToGroup(senderID, group.threadID);
          addedGroups.push(getGroupInfo(group));
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error("Add error:", error);
          failedGroups.push(getGroupInfo(group));
        }
      }

      let resultMsg = "";
      if (addedGroups.length > 0) {
        resultMsg += `✅ Added to:\n${addedGroups.map(g => `• ${g}`).join('\n')}\n\n`;
      }
      if (failedGroups.length > 0) {
        resultMsg += `❌ Failed:\n${failedGroups.map(g => `• ${g}`).join('\n')}`;
      }

      if (!resultMsg) resultMsg = "❌ No groups added.";
      return api.sendMessage(resultMsg, threadID);
    }

    // ========== OUT/LEAVE COMMAND ==========
    if (command === "out") {
      if (args.length < 2) {
        return api.sendMessage("❌ Usage: out 1 2 3", threadID, messageID);
      }

      const leftGroups = [];
      const failedGroups = [];

      for (let i = 1; i < args.length; i++) {
        const group = findGroup(args[i]);
        
        if (!group) {
          await api.sendMessage(`❌ Not found: ${args[i]}`, threadID);
          continue;
        }

        if (group.multiple) {
          await api.sendMessage(`❌ Multiple matches for "${args[i]}". Use TID instead.`, threadID);
          continue;
        }

        try {
          await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
          leftGroups.push(getGroupInfo(group));
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error("Leave error:", error);
          failedGroups.push(getGroupInfo(group));
        }
      }

      let resultMsg = "";
      if (leftGroups.length > 0) {
        resultMsg += `✅ Left:\n${leftGroups.map(g => `• ${g}`).join('\n')}\n\n`;
      }
      if (failedGroups.length > 0) {
        resultMsg += `❌ Failed:\n${failedGroups.map(g => `• ${g}`).join('\n')}`;
      }

      if (!resultMsg) resultMsg = "❌ No groups left.";
      return api.sendMessage(resultMsg, threadID);
    }

    // ========== WHITELIST ON COMMAND ==========
    if (command === "wl" && args[1] === "on") {
      if (args.length < 3) {
        return api.sendMessage("❌ Usage: wl on 1/name/tid", threadID, messageID);
      }

      const target = args.slice(2).join(" ").replace(/["']/g, "");
      const group = findGroup(target);

      if (!group) {
        return api.sendMessage(`❌ Group not found: ${target}`, threadID, messageID);
      }

      if (group.multiple) {
        let msg = `❌ Multiple matches found:\n\n`;
        group.groups.forEach((g, i) => {
          msg += `${i + 1}. ${getGroupInfo(g)}\n`;
        });
        msg += `\nUse TID instead: wl on TID_HERE`;
        return api.sendMessage(msg, threadID, messageID);
      }

      // Check if already whitelisted
      if (whitelist[group.threadID]) {
        return api.sendMessage(
          `⚠️ Already whitelisted:\n` +
          `📌 ${getGroupInfo(group)}\n` +
          `📅 Added: ${new Date(whitelist[group.threadID].addedAt).toLocaleDateString()}`,
          threadID
        );
      }

      // Add to whitelist
      whitelist[group.threadID] = {
        name: group.name || "Unnamed Group",
        addedBy: senderID,
        addedAt: new Date().toISOString(),
        status: "active",
        addedVia: target
      };

      // Save whitelist
      if (saveWhitelist()) {
        return api.sendMessage(
          `✅ Whitelist ENABLED:\n\n` +
          `📌 Group: ${group.name || "Unnamed Group"}\n` +
          `🆔 TID: ${group.threadID}\n` +
          `👥 Members: ${group.participantIDs?.length || 0}\n\n` +
          `📍 Bot will now be INACTIVE in this group.\n` +
          `🔧 Disable with: wl off ${group.threadID}`,
          threadID
        );
      } else {
        return api.sendMessage("❌ Failed to save whitelist.", threadID);
      }
    }

    // ========== WHITELIST OFF COMMAND ==========
    if (command === "wl" && args[1] === "off") {
      if (args.length < 3) {
        return api.sendMessage("❌ Usage: wl off 1/name/tid", threadID, messageID);
      }

      const target = args.slice(2).join(" ").replace(/["']/g, "");
      let group = null;
      let groupId = null;

      // Check if target is a TID in whitelist
      if (whitelist[target]) {
        groupId = target;
        group = Reply.groups.find(g => g.threadID === target);
      } else {
        // Find group by search
        const foundGroup = findGroup(target);
        if (foundGroup && !foundGroup.multiple) {
          group = foundGroup;
          groupId = group.threadID;
        }
      }

      if (!groupId || !whitelist[groupId]) {
        return api.sendMessage(`❌ Not whitelisted: ${target}`, threadID, messageID);
      }

      // Remove from whitelist
      const groupName = whitelist[groupId].name;
      delete whitelist[groupId];

      // Save whitelist
      if (saveWhitelist()) {
        return api.sendMessage(
          `✅ Whitelist DISABLED:\n\n` +
          `📌 Group: ${groupName}\n` +
          `🆔 TID: ${groupId}\n\n` +
          `📍 Bot will now be ACTIVE in this group.`,
          threadID
        );
      } else {
        return api.sendMessage("❌ Failed to update whitelist.", threadID);
      }
    }

    // ========== WHITELIST LIST COMMAND ==========
    if (command === "wl" && args[1] === "list") {
      const whitelistedIds = Object.keys(whitelist);
      
      if (whitelistedIds.length === 0) {
        return api.sendMessage("📭 No groups are whitelisted.", threadID);
      }

      let msg = `🔒 𝐖𝐇𝐈𝐓𝐄𝐋𝐈𝐒𝐓𝐄𝐃 𝐆𝐑𝐎𝐔𝐏𝐒 (${whitelistedIds.length})\n\n`;
      
      whitelistedIds.forEach((id, index) => {
        const wlData = whitelist[id];
        const groupInfo = Reply.groups.find(g => g.threadID === id);
        const groupName = groupInfo ? groupInfo.name : wlData.name;
        const addedDate = new Date(wlData.addedAt).toLocaleDateString();
        
        msg += `${index + 1}. ${groupName}\n`;
        msg += `   🆔 ${id}\n`;
        msg += `   📅 ${addedDate}\n`;
        msg += `   🔧 Disable: wl off ${id}\n\n`;
      });

      msg += `📍 Total: ${whitelistedIds.length} whitelisted groups`;
      
      return api.sendMessage(msg, threadID);
    }

    // ========== WHITELIST STATUS COMMAND ==========
    if (command === "wl" && args[1] === "status") {
      if (args.length < 3) {
        return api.sendMessage("❌ Usage: wl status 1/name/tid", threadID, messageID);
      }

      const target = args.slice(2).join(" ").replace(/["']/g, "");
      const group = findGroup(target);

      if (!group) {
        return api.sendMessage(`❌ Group not found: ${target}`, threadID);
      }

      if (group.multiple) {
        let msg = `❌ Multiple matches found:\n\n`;
        group.groups.forEach((g, i) => {
          msg += `${i + 1}. ${getGroupInfo(g)}\n`;
        });
        return api.sendMessage(msg, threadID);
      }

      const isWhitelisted = whitelist[group.threadID];
      
      if (isWhitelisted) {
        const wlData = whitelist[group.threadID];
        return api.sendMessage(
          `🔒 𝐖𝐇𝐈𝐓𝐄𝐋𝐈𝐒𝐓𝐄𝐃\n\n` +
          `📌 Group: ${group.name || "Unnamed Group"}\n` +
          `🆔 TID: ${group.threadID}\n` +
          `📅 Added: ${new Date(wlData.addedAt).toLocaleString()}\n` +
          `👤 By: ${wlData.addedBy}\n` +
          `📍 Bot is INACTIVE in this group\n\n` +
          `🔧 Remove with: wl off ${group.threadID}`,
          threadID
        );
      } else {
        return api.sendMessage(
          `🔓 𝐍𝐎𝐓 𝐖𝐇𝐈𝐓𝐄𝐋𝐈𝐒𝐓𝐄𝐃\n\n` +
          `📌 Group: ${group.name || "Unnamed Group"}\n` +
          `🆔 TID: ${group.threadID}\n` +
          `📍 Bot is ACTIVE in this group\n\n` +
          `🔧 Whitelist with: wl on ${group.threadID}`,
          threadID
        );
      }
    }

    // ========== INVALID COMMAND ==========
    return api.sendMessage(
      `❌ Invalid command.\n\n` +
      `🎯 **Available Commands:**\n` +
      `• add 1 3 - Add yourself to groups\n` +
      `• out 1 2 - Leave from groups\n` +
      `• wl on 1 - Whitelist by number\n` +
      `• wl on "Group Name" - Whitelist by name\n` +
      `• wl on 123456789 - Whitelist by TID\n` +
      `• wl off 1/name/tid - Remove whitelist\n` +
      `• wl list - Show whitelisted groups\n` +
      `• wl status 1/name/tid - Check status\n` +
      `• page 2 - Next page`,
      threadID
    );
  }
};
