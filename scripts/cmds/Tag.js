module.exports = {
  config: {
    name: "tag",
    aliases: ["mentionall", "all"],
    version: "1.2.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Tag everyone or reply to tag someone",
    longDescription: "Mention all members in the group, or if reply then mention only that user with optional text",
    category: "group",
    guide: {
      en: "{pn} [message] (or reply to a message with/without text)"
    }
  },

  onStart: async function ({ api, event, args, usersData }) {
    try {
      let msg;
      const mentions = [];

      // যদি reply থাকে -> শুধু ওইজনকে mention
      if (event.messageReply) {
        const uid = event.messageReply.senderID;
        const user = await usersData.get(uid);

        // যদি সাথে extra টেক্সট থাকে
        if (args.length > 0) {
          msg = `${args.join(" ")} → ${user.name}`;
        } else {
          msg = `🎯 Tagged ${user.name}`;
        }

        mentions.push({
          id: uid,
          tag: user.name
        });

      } else {
        // নাহলে সবাইকে mention
        const threadInfo = await api.getThreadInfo(event.threadID);
        const members = threadInfo.participantIDs;

        if (!members || members.length === 0) {
          return api.sendMessage("⚠️ No members found in this group!", event.threadID);
        }

        msg = args.length > 0 ? args.join(" ") : "Everyone tag here 👇";

        for (const id of members) {
          if (id !== api.getCurrentUserID()) {
            const user = await usersData.get(id);
            mentions.push({
              id: id,
              tag: user.name
            });
          }
        }
      }

      return api.sendMessage({ body: msg, mentions }, event.threadID);

    } catch (e) {
      console.error(e);
      return api.sendMessage("⚠️ Something went wrong while tagging!", event.threadID);
    }
  }
};
