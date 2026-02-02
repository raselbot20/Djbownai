const axios = require('axios');

// বটের গ্লোবাল নিকনেম
const BOT_NICKNAME = "➤『 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 💎✨』☜ヅ";

async function getTikTokVideo() {
  // ... (আপনার আগের পুরো getTikTokVideo ফাংশন একই থাকবে) ...
  // পুরো ফাংশনটি এখানে কপি করুন
}

async function getStreamFromURL(url) {
  // ... (আপনার আগের পুরো getStreamFromURL ফাংশন একই থাকবে) ...
  // পুরো ফাংশনটি এখানে কপি করুন
}

async function setBotNickname(api, threadID) {
  // ... (আপনার আগের পুরো setBotNickname ফাংশন একই থাকবে) ...
  // পুরো ফাংশনটি এখানে কপি করুন
}

module.exports = {
  config: {
    name: "pending",
    aliases: ["pend", "approve", "groupreq"],
    version: "5.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 2,
    description: {
      en: "View and approve/decline pending group invitations with auto video & nickname"
    },
    category: "owner",
    guide: {
      en: `{pn} - View pending groups
{pn} approve [number] - Approve specific group (auto video + nickname)
{pn} decline [number] - Decline specific group
{pn} all - Approve all pending groups (auto videos + nicknames)
{pn} help - Show all commands`
    }
  },

  onReply: async function ({ api, event, Reply }) {
    // ... (আপনার আগের পুরো onReply ফাংশন একই থাকবে) ...
    // পুরো ফাংশনটি এখানে কপি করুন
  },

  // ✅ ✅ ✅ এখানে সংশোধন করা হয়েছে ✅ ✅ ✅
  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const command = args[0] ? args[0].toLowerCase() : 'list';

    if (command === 'help') {
      // help command একই থাকবে
      const helpMessage = `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 - PENDING SYSTEM ❱════╗
      
📋 **AVAILABLE COMMANDS:**

1. \`${global.GoatBot.config.prefix}pending\` - View all pending group requests
2. \`${global.GoatBot.config.prefix}pending approve [numbers]\` - Approve specific groups (auto video + nickname)
3. \`${global.GoatBot.config.prefix}pending decline [numbers]\` - Decline specific groups
4. \`${global.GoatBot.config.prefix}pending all\` - Approve ALL pending groups (auto videos + nicknames)
5. \`${global.GoatBot.config.prefix}pending help\` - Show this help message

📝 **USAGE EXAMPLES:**
• \`${global.GoatBot.config.prefix}pending approve 1 3 5\` - Approve groups 1, 3, and 5
• \`${global.GoatBot.config.prefix}pending decline 2 4\` - Decline groups 2 and 4
• \`${global.GoatBot.config.prefix}pending\` then reply with numbers to approve

⚡ **SPECIAL FEATURES:**
• Auto-sends anime phonk edit video when approving groups
• Auto-sets bot nickname to "${BOT_NICKNAME}" in approved groups
• Can manage pending from ANY group
• Quick approve/decline options

╚══════════════════════════╝`;
      
      return api.sendMessage(helpMessage, threadID, messageID);
    }

    if (command === 'all') {
      // ... (all command একই থাকবে) ...
      // পুরো অংশটি কপি করুন
    }

    if (command === 'approve' || command === 'decline') {
      // ... (approve/decline command একই থাকবে) ...
      // পুরো অংশটি কপি করুন
    }

    // ✅ ✅ ✅ এখানে মূল পরিবর্তন করা হয়েছে ✅ ✅ ✅
    try {
      console.log('🔄 Fetching thread lists...');
      
      // ✅ দ্বিতীয় কোডের মতো করে দুটি আলাদা লিস্ট নিন
      let spam = [];
      let pending = [];
      
      try {
        spam = await api.getThreadList(100, null, ["OTHER"]) || [];
        console.log(`✅ OTHER threads found: ${spam.length}`);
      } catch (e) {
        console.error('❌ Error fetching OTHER threads:', e.message);
      }
      
      try {
        pending = await api.getThreadList(100, null, ["PENDING"]) || [];
        console.log(`✅ PENDING threads found: ${pending.length}`);
      } catch (e) {
        console.error('❌ Error fetching PENDING threads:', e.message);
      }
      
      // ✅ দুটি লিস্ট একত্রিত করুন এবং সঠিকভাবে ফিল্টার করুন
      const allThreads = [...spam, ...pending];
      console.log(`📊 Total threads before filter: ${allThreads.length}`);
      
      // ✅ দ্বিতীয় কোডের মতো একই ফিল্টার প্রয়োগ করুন
      const pendingGroups = allThreads.filter(group => 
        group.isSubscribed && group.isGroup
      );
      
      console.log(`📋 Filtered pending groups: ${pendingGroups.length}`);
      
      if (pendingGroups.length === 0) {
        return api.sendMessage("📭 No pending group invitations!", threadID, messageID);
      }
      
      // ✅ বাকি অংশ আপনার আগের মতোই থাকবে
      let listMessage = `╔════❰ ⏳𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ⏳❱════╗\n\n`;
      listMessage += `📋 Total Pending Groups: ${pendingGroups.length}\n\n`;
      
      pendingGroups.forEach((group, index) => {
        listMessage += `${index + 1}. ${group.name || 'Unknown Group'}\n`;
        listMessage += `   👥 Members: ${group.participantIDs ? group.participantIDs.length : 'N/A'}\n`;
        listMessage += `   🆔 ID: ${group.threadID}\n\n`;
      });
      
      listMessage += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      listMessage += `📌 **QUICK COMMANDS:**\n`;
      listMessage += `• ${global.GoatBot.config.prefix}pending approve 1 2 3\n`;
      listMessage += `• ${global.GoatBot.config.prefix}pending decline 4 5\n`;
      listMessage += `• ${global.GoatBot.config.prefix}pending all (approve all)\n\n`;
      listMessage += `📝 **OR REPLY** with numbers to approve\n`;
      listMessage += `Example: 1 3 5\n`;
      listMessage += `╚═════════════════════╝`;
      
      console.log(`📤 Sending list of ${pendingGroups.length} groups...`);
      
      await api.sendMessage(listMessage, threadID, (err, info) => {
        if (err) {
          console.error('❌ Error sending message:', err.message);
          return;
        }
        
        if (!err && info) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "pending",
            messageID: info.messageID,
            author: senderID,
            pending: pendingGroups,
            type: 'approve'
          });
          console.log(`✅ Reply handler set for message ID: ${info.messageID}`);
        }
      }, messageID);
      
    } catch (error) {
      console.error('❌ Pending Error:', error);
      return api.sendMessage(`❌ Error fetching pending list: ${error.message}`, threadID, messageID);
    }
  }
};
