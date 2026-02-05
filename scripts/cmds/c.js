module.exports = {
  config: {
    name: "c",
    aliases: ["deletebot", "clearbot"],
    author: "Rasel Mahmud",
    version: "2.7",
    cooldowns: 5,
    role: 0,
    shortDescription: "Unsend all bot messages safely without leaving",
    longDescription: "Deletes all messages sent by the bot in this thread, auto detects bot ID",
    category: "box chat",
    guide: {
      en: "{p}{n}"
    }
  },

  onStart: async function ({ api, event, message }) {
    try {
      const threadID = event.threadID;

      // ✅ Auto-detect bot ID
      const botID = api.getCurrentUserID();

      let totalUnsent = 0;

      // Fetch last 100 messages (adjustable)
      const history = await api.getThreadHistory(threadID, 100);
      if (!history || history.length === 0)
        return message.reply("❌ No messages found in this thread.");

      // Filter only bot messages
      const botMessages = history.filter(m => m.senderID === botID);
      if (botMessages.length === 0)
        return message.reply("❌ No bot messages found to unsend.");

      // Unsend messages one by one with delay to avoid leave
      for (const m of botMessages) {
        try {
          await api.unsendMessage(m.messageID);
          totalUnsent++;
          await new Promise(r => setTimeout(r, 500)); // 0.5 sec delay
        } catch (err) {
          console.log(`⚠️ Failed to unsend message ${m.messageID}`);
        }
      }

      return message.reply(`✅ Successfully unsent ${totalUnsent} bot message(s).`);

    } catch (err) {
      console.error(err);
      return message.reply("❌ Error while unsending messages.");
    }
  }
};
