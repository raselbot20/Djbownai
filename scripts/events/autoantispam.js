const fs = require("fs");

const ANTI_SPAM_CONFIG = {
    MESSAGE_LIMIT: 6,           // max messages in window
    TIME_WINDOW: 8000,          // 8 sec
    CHAR_LIMIT: 400,            // max characters
    USER_BAN_DURATION: 20 * 60 * 1000,   // 20 mins
    GROUP_BAN_DURATION: 45 * 60 * 1000,  // 45 mins
    ADMIN_UIDS: ["61587488309900"],      // admin bypass
};

const userHistory = new Map();
const groupHistory = new Map();
const bannedUsers = new Map();
const bannedGroups = new Map();

module.exports = {
    config: {
        name: "autoantispam",
        version: "1.0",
        author: "Rasel Mahmud",
        category: "events",
        description: "🛡️ Auto Anti-Spam & Auto Mute System",
    },

    onStart: async ({ api, event }) => {
        const { threadID, senderID, messageID } = event;

        // Admin bypass
        if (ANTI_SPAM_CONFIG.ADMIN_UIDS.includes(senderID.toString())) return;

        // Check if group is banned
        if (bannedGroups.has(threadID)) {
            const info = bannedGroups.get(threadID);
            if (Date.now() < info.expires) {
                await this.deleteMessage(api, messageID);
                return; // No reply
            } else bannedGroups.delete(threadID); // unban auto
        }

        // Check if user is banned
        if (bannedUsers.has(senderID)) {
            const info = bannedUsers.get(senderID);
            if (Date.now() < info.expires) {
                await this.deleteMessage(api, messageID);
                return; // No reply
            } else bannedUsers.delete(senderID); // unban auto
        }

        // Track messages
        if (!userHistory.has(senderID)) userHistory.set(senderID, []);
        if (!groupHistory.has(threadID)) groupHistory.set(threadID, []);
        const now = Date.now();
        const userMsgs = userHistory.get(senderID).filter(m => now - m < ANTI_SPAM_CONFIG.TIME_WINDOW);
        const groupMsgs = groupHistory.get(threadID).filter(m => now - m < ANTI_SPAM_CONFIG.TIME_WINDOW);

        userMsgs.push(now);
        groupMsgs.push(now);
        userHistory.set(senderID, userMsgs);
        groupHistory.set(threadID, groupMsgs);

        // Detect user spam
        if (userMsgs.length >= ANTI_SPAM_CONFIG.MESSAGE_LIMIT) {
            bannedUsers.set(senderID, { expires: now + ANTI_SPAM_CONFIG.USER_BAN_DURATION });
            await this.deleteMessage(api, messageID);
            return; // No reply
        }

        // Detect group spam
        if (groupMsgs.length >= ANTI_SPAM_CONFIG.MESSAGE_LIMIT * 3) {
            bannedGroups.set(threadID, { expires: now + ANTI_SPAM_CONFIG.GROUP_BAN_DURATION });
            await this.deleteMessage(api, messageID);
            return; // No reply
        }
    },

    deleteMessage: async function(api, messageID) {
        try {
            await api.unsendMessage(messageID);
        } catch (e) {}
    }
};
