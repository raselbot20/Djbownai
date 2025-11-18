const supportGroupID = "23969001856034196"; // তোমার support group এর threadID

module.exports = {
  config: {
    name: "supportgc",
    version: "2.0.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Add user to support group (auto add or pending)",
    longDescription: "Anyone can use this command to join the support group. Bot will add directly if admin, otherwise send pending request.",
    category: "system",
    guide: "{pn}"
  },

  onStart: async function ({ api, event }) {
    const userID = event.senderID;
    const threadID = event.threadID;

    try {
      // === Step 1: support group info নাও
      const supportInfo = await api.getThreadInfo(supportGroupID);
      const participants = supportInfo.participantIDs.map(String);
      const adminIDs = supportInfo.adminIDs.map(a => a.id || a.userID || a);
      const botID = String(api.getCurrentUserID());
      const botIsAdmin = adminIDs.includes(botID);

      // === Step 2: user already member কিনা
      if (participants.includes(String(userID))) {
        return api.sendMessage(
          "✅ You are already in the support group.",
          threadID,
          event.messageID
        );
      }

      // === Step 3: add করার চেষ্টা করো
      try {
        await api.addUserToGroup(userID, supportGroupID);

        return api.sendMessage(
          `✅ You have been ${botIsAdmin ? "added" : "requested (pending approval)"} to the support group!`,
          threadID,
          event.messageID
        );
      } catch (err) {
        console.error("supportgc: addUserToGroup failed:", err);

        return api.sendMessage(
          "⚠️ Could not add you automatically. Please make sure the group allows adding or wait for admin approval.",
          threadID,
          event.messageID
        );
      }

    } catch (err) {
      console.error("supportgc: unexpected error:", err);
      return api.sendMessage(
        "❌ Something went wrong. Please try again later.",
        threadID,
        event.messageID
      );
    }
  }
};
