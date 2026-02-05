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

        // Check if required properties exist
        if (!senderID || !threadID || !messageID) {
            return; // Skip if any required property is missing
        }

        // Admin bypass - safely convert senderID to string
        if (ANTI_SPAM_CONFIG.ADMIN_UIDS.includes(String(senderID))) return;

        const now = Date.now();

        // Check if group is banned
        if (bannedGroups.has(threadID)) {
            const info = bannedGroups.get(threadID);
            if (now < info.expires) {
                await this.deleteMessage(api, messageID);
                return;
            } else {
                bannedGroups.delete(threadID); // unban auto
            }
        }

        // Check if user is banned
        if (bannedUsers.has(senderID)) {
            const info = bannedUsers.get(senderID);
            if (now < info.expires) {
                await this.deleteMessage(api, messageID);
                return;
            } else {
                bannedUsers.delete(senderID); // unban auto
            }
        }

        // Initialize user and group history if not exists
        if (!userHistory.has(senderID)) userHistory.set(senderID, []);
        if (!groupHistory.has(threadID)) groupHistory.set(threadID, []);

        // Get recent messages within time window
        const userMsgs = userHistory.get(senderID).filter(m => now - m < ANTI_SPAM_CONFIG.TIME_WINDOW);
        const groupMsgs = groupHistory.get(threadID).filter(m => now - m < ANTI_SPAM_CONFIG.TIME_WINDOW);

        // Add current message timestamp
        userMsgs.push(now);
        groupMsgs.push(now);

        // Update history
        userHistory.set(senderID, userMsgs);
        groupHistory.set(threadID, groupMsgs);

        // Detect user spam
        if (userMsgs.length >= ANTI_SPAM_CONFIG.MESSAGE_LIMIT) {
            bannedUsers.set(senderID, { 
                expires: now + ANTI_SPAM_CONFIG.USER_BAN_DURATION 
            });
            await this.deleteMessage(api, messageID);
            return;
        }

        // Detect group spam
        if (groupMsgs.length >= ANTI_SPAM_CONFIG.MESSAGE_LIMIT * 3) {
            bannedGroups.set(threadID, { 
                expires: now + ANTI_SPAM_CONFIG.GROUP_BAN_DURATION 
            });
            await this.deleteMessage(api, messageID);
            return;
        }

        // Optional: Check character limit
        if (event.body && event.body.length > ANTI_SPAM_CONFIG.CHAR_LIMIT) {
            await this.deleteMessage(api, messageID);
            return;
        }
    },

    deleteMessage: async function(api, messageID) {
        try {
            await api.unsendMessage(messageID);
        } catch (e) {
            console.error("Failed to delete message:", e);
        }
    },

    // Optional: Add a cleanup function to periodically clear old history
    cleanupOldHistory: function() {
        const now = Date.now();
        const cleanupTime = ANTI_SPAM_CONFIG.TIME_WINDOW * 2; // Keep history for 2x the time window

        // Clean user history
        for (const [userId, timestamps] of userHistory.entries()) {
            const filtered = timestamps.filter(t => now - t < cleanupTime);
            if (filtered.length === 0) {
                userHistory.delete(userId);
            } else {
                userHistory.set(userId, filtered);
            }
        }

        // Clean group history
        for (const [threadId, timestamps] of groupHistory.entries()) {
            const filtered = timestamps.filter(t => now - t < cleanupTime);
            if (filtered.length === 0) {
                groupHistory.delete(threadId);
            } else {
                groupHistory.set(threadId, filtered);
            }
        }
    }
};

// Optional: Run cleanup every 30 minutes
setInterval(() => {
    module.exports.cleanupOldHistory();
}, 30 * 60 * 1000);
