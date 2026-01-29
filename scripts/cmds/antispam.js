const fs = require("fs");
const path = require("path");

// Anti-spam configuration
const ANTI_SPAM_CONFIG = {
    // Spam detection thresholds
    MESSAGE_LIMIT: 8,           // Max messages in time window
    TIME_WINDOW: 8000,          // 8 seconds window
    CHAR_LIMIT: 400,            // Max characters per message
    
    // Ban durations (in milliseconds)
    USER_BAN_DURATION: 20 * 60 * 1000,   // 20 minutes
    GROUP_BAN_DURATION: 45 * 60 * 1000,  // 45 minutes
    
    // Admin UIDs (immune to spam detection)
    ADMIN_UIDS: ["61586335299049"],
    
    // Spam patterns to detect
    SPAM_PATTERNS: [
        /(.)\1{8,}/,            // Repeated characters (aaaaaaaa)
        /(http|https|www\.)/gi, // Links
        /[@#]\w+\s?/gi,         // @mentions and #tags
        /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]{8,}/gi, // Special chars
        /(\S+\s+){15,}/gi,      // Too many words quickly
        /\n{5,}/gi              // Too many line breaks
    ]
};

// Global storage for spam tracking
const userMessageHistory = new Map();
const groupMessageHistory = new Map();
const bannedUsers = new Map();
const bannedGroups = new Map();

module.exports = {
    config: {
        name: "antispam",
        aliases: ["spamguard", "spamblock"],
        version: "3.0",
        author: "Rasel Mahmud",
        countDown: 1,
        role: 0,
        description: "🛡️ Auto Anti-Spam Protection System",
        category: "security",
        guide: {
            en: "{pn} status - Show status\n{pn} list - Show banned users"
        }
    },

    onStart: async function({ api, event, args }) {
        const { threadID, messageID, senderID } = event;
        const command = args[0]?.toLowerCase();

        switch(command) {
            case "status":
                return await this.showStatus(api, event);
            case "list":
                return await this.showBannedList(api, event);
            case "help":
                return await this.showHelp(api, event);
            default:
                return await this.showAutoStatus(api, event);
        }
    },

    // ✅ AUTO TRIGGER - NO NEED TO ENABLE
    onChat: async function({ api, event }) {
        const { threadID, messageID, senderID, body } = event;
        
        try {
            // Skip if empty message
            if (!body || body.trim().length === 0) return;

            // Check if sender is admin (immune)
            if (ANTI_SPAM_CONFIG.ADMIN_UIDS.includes(senderID.toString())) {
                return;
            }

            // ✅ Check if group is banned
            if (bannedGroups.has(threadID)) {
                const banInfo = bannedGroups.get(threadID);
                if (banInfo.expires > Date.now()) {
                    // Group is banned, delete ALL non-admin messages
                    await this.deleteMessage(api, messageID, threadID);
                    
                    // Notify user if it's their first message after ban
                    const userKey = `${threadID}_${senderID}`;
                    if (!banInfo.notifiedUsers || !banInfo.notifiedUsers.includes(userKey)) {
                        await this.notifyGroupBanned(api, senderID, threadID, banInfo);
                        if (!banInfo.notifiedUsers) banInfo.notifiedUsers = [];
                        banInfo.notifiedUsers.push(userKey);
                        bannedGroups.set(threadID, banInfo);
                    }
                    return;
                } else {
                    // Ban expired
                    bannedGroups.delete(threadID);
                }
            }

            // ✅ Check if user is banned
            if (bannedUsers.has(senderID)) {
                const banInfo = bannedUsers.get(senderID);
                if (banInfo.expires > Date.now()) {
                    // User is banned, delete message
                    await this.deleteMessage(api, messageID, threadID);
                    
                    // Notify user if not already notified recently
                    if (!banInfo.lastNotified || Date.now() - banInfo.lastNotified > 30000) {
                        await this.notifyBannedUser(api, senderID, threadID, banInfo);
                        banInfo.lastNotified = Date.now();
                        bannedUsers.set(senderID, banInfo);
                    }
                    return;
                } else {
                    // Ban expired
                    bannedUsers.delete(senderID);
                }
            }

            // ✅ AUTO SPAM DETECTION (Always Active)
            const isSpam = await this.detectSpam(api, event);
            
            if (isSpam) {
                // Handle spam detection
                await this.handleSpamDetection(api, event);
            }

        } catch (error) {
            console.error("Anti-spam error:", error);
        }
    },

    // ✅ AUTO DETECT SPAM
    detectSpam: async function(api, event) {
        const { senderID, threadID, body } = event;
        
        // Skip short messages
        if (body.length < 10) return false;
        
        // Initialize tracking
        if (!userMessageHistory.has(senderID)) {
            userMessageHistory.set(senderID, []);
        }
        
        if (!groupMessageHistory.has(threadID)) {
            groupMessageHistory.set(threadID, []);
        }
        
        const userHistory = userMessageHistory.get(senderID);
        const groupHistory = groupMessageHistory.get(threadID);
        const now = Date.now();
        
        // Clean old messages
        const cleanHistory = (history) => {
            return history.filter(msg => now - msg.time < ANTI_SPAM_CONFIG.TIME_WINDOW);
        };
        
        userMessageHistory.set(senderID, cleanHistory(userHistory));
        groupMessageHistory.set(threadID, cleanHistory(groupHistory));
        
        // Add current message
        const messageData = { time: now, content: body, threadID };
        userHistory.push(messageData);
        groupHistory.push(messageData);
        
        // ✅ Check 1: User message flood
        if (userHistory.length >= ANTI_SPAM_CONFIG.MESSAGE_LIMIT) {
            console.log(`🚨 SPAM DETECTED: User ${senderID} - Flood (${userHistory.length} messages)`);
            return true;
        }
        
        // ✅ Check 2: Group message flood (multiple users spamming)
        if (groupHistory.length >= ANTI_SPAM_CONFIG.MESSAGE_LIMIT * 2) {
            console.log(`🚨 SPAM DETECTED: Group ${threadID} - Multi-user flood`);
            
            // If multiple users flooding, ban group
            const uniqueUsers = [...new Set(groupHistory.map(msg => {
                const userHist = userMessageHistory.get(msg.senderID) || [];
                return userHist.length >= 3 ? msg.senderID : null;
            }))].filter(Boolean);
            
            if (uniqueUsers.length >= 3) {
                await this.autoBanGroup(api, threadID, "Multiple users flooding");
                return true;
            }
            return true;
        }
        
        // ✅ Check 3: Message too long
        if (body.length > ANTI_SPAM_CONFIG.CHAR_LIMIT) {
            console.log(`🚨 SPAM DETECTED: User ${senderID} - Too long (${body.length} chars)`);
            return true;
        }
        
        // ✅ Check 4: Spam patterns
        for (const pattern of ANTI_SPAM_CONFIG.SPAM_PATTERNS) {
            const matches = body.match(pattern);
            if (matches && matches.length > 2) {
                console.log(`🚨 SPAM DETECTED: User ${senderID} - Pattern match`);
                return true;
            }
        }
        
        // ✅ Check 5: Repeated same message
        const recentUserMessages = userHistory
            .slice(-4)
            .map(msg => msg.content.trim().toLowerCase());
        
        if (recentUserMessages.length >= 3) {
            const uniqueMessages = [...new Set(recentUserMessages)];
            if (uniqueMessages.length === 1) {
                console.log(`🚨 SPAM DETECTED: User ${senderID} - Repeated message`);
                return true;
            }
        }
        
        return false;
    },

    // ✅ AUTO HANDLE SPAM DETECTION
    handleSpamDetection: async function(api, event) {
        const { threadID, messageID, senderID, body } = event;
        
        // Delete the spam message immediately
        await this.deleteMessage(api, messageID, threadID);
        
        // Get user history for this thread
        const userHistory = userMessageHistory.get(senderID) || [];
        const recentInThread = userHistory.filter(msg => 
            msg.threadID === threadID && 
            Date.now() - msg.time < 60000
        );
        
        // Check spam count in last minute
        if (recentInThread.length >= 5) {
            // User spamming heavily - ban user
            await this.autoBanUser(api, senderID, threadID, "Heavy spamming");
        } else if (recentInThread.length >= 3) {
            // User spamming moderately - warn and temp action
            await this.warnUser(api, senderID, threadID, recentInThread.length);
        } else {
            // First offense - just delete and warn
            await this.firstWarning(api, senderID, threadID);
        }
    },

    // ✅ AUTO BAN USER
    autoBanUser: async function(api, userID, threadID, reason) {
        // Check if already banned
        if (bannedUsers.has(userID)) {
            const banInfo = bannedUsers.get(userID);
            if (banInfo.expires > Date.now()) {
                return; // Already banned
            }
        }
        
        // Ban the user
        bannedUsers.set(userID, {
            bannedBy: "auto-system",
            bannedAt: Date.now(),
            expires: Date.now() + ANTI_SPAM_CONFIG.USER_BAN_DURATION,
            reason: reason,
            threadID: threadID
        });
        
        // Get user name
        let userName = "User";
        try {
            const userInfo = await api.getUserInfo(userID);
            userName = userInfo[userID]?.name || "User";
        } catch (e) {
            console.error("Error getting user info:", e);
        }
        
        // Notify group
        const warningMessage = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         ⛔ 𝐀𝐔𝐓𝐎-𝐁𝐀𝐍 𝐀𝐂𝐓𝐈𝐕𝐀𝐓𝐄𝐃\n\n` +
            `User auto-banned for spamming!\n\n` +
            `👤 User: ${userName}\n` +
            `🆔 UID: ${userID}\n` +
            `⏰ Duration: 20 minutes\n` +
            `📝 Reason: ${reason}\n\n` +
            `⚠️ Banned user cannot:\n` +
            `• Send any messages\n` +
            `• Use bot commands\n` +
            `• React to messages\n\n` +
            `🛡️ Auto-protection system active\n` +
            `╚═══════════════════╝`;
        
        try {
            await api.sendMessage(warningMessage, threadID);
        } catch (e) {
            console.error("Error sending ban notification:", e);
        }
        
        // Notify the banned user
        await this.notifyBannedUser(api, userID, threadID, {
            reason: reason,
            expires: Date.now() + ANTI_SPAM_CONFIG.USER_BAN_DURATION
        });
        
        console.log(`✅ AUTO-BANNED: User ${userID} for ${reason}`);
    },

    // ✅ AUTO BAN GROUP
    autoBanGroup: async function(api, threadID, reason) {
        // Check if already banned
        if (bannedGroups.has(threadID)) {
            const banInfo = bannedGroups.get(threadID);
            if (banInfo.expires > Date.now()) {
                return; // Already banned
            }
        }
        
        // Ban the group
        bannedGroups.set(threadID, {
            bannedBy: "auto-system",
            bannedAt: Date.now(),
            expires: Date.now() + ANTI_SPAM_CONFIG.GROUP_BAN_DURATION,
            reason: reason
        });
        
        // Get group name
        let groupName = "This Group";
        try {
            const threadInfo = await api.getThreadInfo(threadID);
            groupName = threadInfo.threadName || "This Group";
        } catch (e) {
            console.error("Error getting thread info:", e);
        }
        
        // Notify group
        const banMessage = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         🚫 𝐆𝐑𝐎𝐔𝐏 𝐀𝐔𝐓𝐎-𝐁𝐀𝐍𝐍𝐄𝐃\n\n` +
            `Group temporarily banned!\n\n` +
            `📛 Group: ${groupName}\n` +
            `⏰ Duration: 45 minutes\n` +
            `📝 Reason: ${reason}\n\n` +
            `⚠️ ALL messages blocked\n` +
            `⛔ Commands disabled\n` +
            `👑 Only admins can talk\n\n` +
            `🛡️ Anti-spam protection active\n` +
            `🕒 Auto-unban: ${new Date(Date.now() + ANTI_SPAM_CONFIG.GROUP_BAN_DURATION).toLocaleTimeString()}\n` +
            `╚═══════════════════╝`;
        
        try {
            await api.sendMessage(banMessage, threadID);
        } catch (e) {
            console.error("Error sending group ban notification:", e);
        }
        
        console.log(`✅ GROUP BANNED: ${threadID} for ${reason}`);
    },

    // First warning
    firstWarning: async function(api, userID, threadID) {
        try {
            const warningMsg = 
                `⚠️ 𝐒𝐏𝐀𝐌 𝐖𝐀𝐑𝐍𝐈𝐍𝐆\n\n` +
                `Your message was deleted for spam-like behavior.\n\n` +
                `Please avoid:\n` +
                `• Sending too many messages quickly\n` +
                `• Long repeated texts\n` +
                `• Excessive special characters\n\n` +
                `Next offense may result in temporary ban.`;
            
            await api.sendMessage(warningMsg, userID);
        } catch (error) {
            console.error("Error sending warning:", error);
        }
    },

    // Warn user
    warnUser: async function(api, userID, threadID, offenseCount) {
        try {
            const warningMsg = 
                `🚨 𝐅𝐈𝐍𝐀𝐋 𝐖𝐀𝐑𝐍𝐈𝐍𝐆\n\n` +
                `You have ${offenseCount} spam offenses.\n\n` +
                `⚠️ Next spam message will result in:\n` +
                `• 20 minute ban\n` +
                `• All messages blocked\n` +
                `• Commands disabled\n\n` +
                `Please follow group rules.`;
            
            await api.sendMessage(warningMsg, userID);
        } catch (error) {
            console.error("Error sending final warning:", error);
        }
    },

    // Show auto status
    showAutoStatus: async function(api, event) {
        const { threadID, messageID } = event;
        
        const statusMessage = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         🛡️ 𝐀𝐔𝐓𝐎 𝐀𝐍𝐓𝐈-𝐒𝐏𝐀𝐌\n\n` +
            `✅ System: AUTO-ACTIVE\n` +
            `🔄 Status: Always running\n` +
            `🎯 Mode: Automatic detection\n\n` +
            `⚙️ 𝐀𝐮𝐭𝐨 𝐂𝐨𝐧𝐟𝐢𝐠:\n` +
            `• Max messages: ${ANTI_SPAM_CONFIG.MESSAGE_LIMIT}/8s\n` +
            `• User ban: 20 minutes\n` +
            `• Group ban: 45 minutes\n` +
            `• Admin immune: Yes\n\n` +
            `🚫 𝐂𝐮𝐫𝐫𝐞𝐧𝐭𝐥𝐲 𝐁𝐚𝐧𝐧𝐞𝐝:\n` +
            `• Users: ${bannedUsers.size}\n` +
            `• Groups: ${bannedGroups.size}\n\n` +
            `📋 Commands:\n` +
            `!antispam status - Show details\n` +
            `!antispam list - Banned list\n` +
            `╚═══════════════════╝`;
        
        await api.sendMessage(statusMessage, threadID, messageID);
    },

    // Show status
    showStatus: async function(api, event) {
        const { threadID, messageID, senderID } = event;
        
        let statusMessage = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         📊 𝐀𝐍𝐓𝐈-𝐒𝐏𝐀𝐌 𝐒𝐓𝐀𝐓𝐔𝐒\n\n`;
        
        // Check if group is banned
        if (bannedGroups.has(threadID)) {
            const banInfo = bannedGroups.get(threadID);
            const timeLeft = Math.ceil((banInfo.expires - Date.now()) / 60000);
            statusMessage += `❌ 𝐆𝐑𝐎𝐔𝐏 𝐁𝐀𝐍𝐍𝐄𝐃\n`;
            statusMessage += `⏰ Time left: ${timeLeft} minutes\n`;
            statusMessage += `📝 Reason: ${banInfo.reason}\n\n`;
        } else {
            statusMessage += `✅ 𝐆𝐑𝐎𝐔𝐏 𝐒𝐓𝐀𝐓𝐔𝐒: Active\n\n`;
        }
        
        // Check if user is banned
        if (bannedUsers.has(senderID)) {
            const banInfo = bannedUsers.get(senderID);
            const timeLeft = Math.ceil((banInfo.expires - Date.now()) / 60000);
            statusMessage += `⛔ 𝐘𝐎𝐔 𝐀𝐑𝐄 𝐁𝐀𝐍𝐍𝐄𝐃\n`;
            statusMessage += `⏰ Time left: ${timeLeft} minutes\n`;
            statusMessage += `📝 Reason: ${banInfo.reason}\n\n`;
        }
        
        // Statistics
        statusMessage += `📈 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬:\n`;
        statusMessage += `• Banned users: ${bannedUsers.size}\n`;
        statusMessage += `• Banned groups: ${bannedGroups.size}\n`;
        statusMessage += `• Active protections: ${userMessageHistory.size}\n\n`;
        
        statusMessage += `⚙️ 𝐀𝐮𝐭𝐨-𝐃𝐞𝐭𝐞𝐜𝐭𝐢𝐨𝐧:\n`;
        statusMessage += `• Always active\n`;
        statusMessage += `• No setup needed\n`;
        statusMessage += `• Real-time monitoring\n`;
        statusMessage += `╚═══════════════════╝`;
        
        await api.sendMessage(statusMessage, threadID, messageID);
    },

    // Show banned list
    showBannedList: async function(api, event) {
        const { threadID, messageID, senderID } = event;
        
        // Check if admin
        const isAdmin = ANTI_SPAM_CONFIG.ADMIN_UIDS.includes(senderID.toString());
        
        let listMessage = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         📋 𝐁𝐀𝐍𝐍𝐄𝐃 𝐋𝐈𝐒𝐓\n\n`;
        
        // Banned groups
        if (bannedGroups.size > 0) {
            listMessage += `⛔ 𝐁𝐚𝐧𝐧𝐞𝐝 𝐆𝐫𝐨𝐮𝐩𝐬:\n`;
            bannedGroups.forEach((info, groupID) => {
                const timeLeft = Math.ceil((info.expires - Date.now()) / 60000);
                listMessage += `• Group: ${groupID}\n`;
                listMessage += `  Time left: ${timeLeft}min\n`;
                listMessage += `  Reason: ${info.reason}\n\n`;
            });
        }
        
        // Banned users (admin sees all, users see only count)
        if (bannedUsers.size > 0) {
            if (isAdmin) {
                listMessage += `⛔ 𝐁𝐚𝐧𝐧𝐞𝐝 𝐔𝐬𝐞𝐫𝐬:\n`;
                let count = 1;
                for (const [userID, info] of bannedUsers) {
                    const timeLeft = Math.ceil((info.expires - Date.now()) / 60000);
                    listMessage += `${count}. UID: ${userID}\n`;
                    listMessage += `   Time: ${timeLeft}min | Reason: ${info.reason}\n`;
                    count++;
                    if (count > 10) {
                        listMessage += `... and ${bannedUsers.size - 10} more\n`;
                        break;
                    }
                }
            } else {
                listMessage += `⛔ 𝐁𝐚𝐧𝐧𝐞𝐝 𝐔𝐬𝐞𝐫𝐬: ${bannedUsers.size}\n`;
            }
        } else {
            listMessage += `✅ No users currently banned\n`;
        }
        
        listMessage += `\n🛡️ Auto-protection system active\n`;
        listMessage += `╚═══════════════════╝`;
        
        await api.sendMessage(listMessage, threadID, messageID);
    },

    // Show help
    showHelp: async function(api, event) {
        const { threadID, messageID } = event;
        
        const helpMessage = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         🛡️ 𝐀𝐔𝐓𝐎 𝐀𝐍𝐓𝐈-𝐒𝐏𝐀𝐌\n\n` +
            `✅ 𝐒𝐲𝐬𝐭𝐞𝐦: Fully Automatic\n` +
            `🔄 𝐍𝐨 𝐬𝐞𝐭𝐮𝐩 𝐫𝐞𝐪𝐮𝐢𝐫𝐞𝐝!\n\n` +
            `📋 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:\n\n` +
            `📊  !antispam status\n` +
            `    Show current status\n\n` +
            `📋  !antispam list\n` +
            `    Show banned users/groups\n\n` +
            `🎯 𝐀𝐮𝐭𝐨-𝐃𝐞𝐭𝐞𝐜𝐭𝐢𝐨𝐧:\n` +
            `• Message flooding\n` +
            `• Link spamming\n` +
            `• Character spam\n` +
            `• Group flood attacks\n\n` +
            `⏰ 𝐀𝐮𝐭𝐨-𝐁𝐚𝐧 𝐃𝐮𝐫𝐚𝐭𝐢𝐨𝐧𝐬:\n` +
            `• User: 20 minutes\n` +
            `• Group: 45 minutes\n\n` +
            `👑 𝐀𝐝𝐦𝐢𝐧 𝐈𝐦𝐦𝐮𝐧𝐞: Yes\n` +
            `╚═══════════════════╝`;
        
        await api.sendMessage(helpMessage, threadID, messageID);
    },

    // Delete message
    deleteMessage: async function(api, messageID, threadID) {
        try {
            await api.unsendMessage(messageID);
        } catch (error) {
            // Ignore delete errors
        }
    },

    // Notify banned user
    notifyBannedUser: async function(api, userID, threadID, banInfo) {
        try {
            const timeLeft = Math.ceil((banInfo.expires - Date.now()) / 60000);
            const message = 
                `⛔ 𝐘𝐎𝐔 𝐇𝐀𝐕𝐄 𝐁𝐄𝐄𝐍 𝐁𝐀𝐍𝐍𝐄𝐃\n\n` +
                `You are temporarily banned from the group.\n\n` +
                `📝 Reason: ${banInfo.reason}\n` +
                `⏰ Duration: 20 minutes\n` +
                `🕒 Time left: ${timeLeft} minutes\n\n` +
                `⚠️ During ban you cannot:\n` +
                `• Send any messages\n` +
                `• Use bot commands\n` +
                `• React to messages\n\n` +
                `🔓 Ban will auto-expire after ${timeLeft} minutes.`;
            
            await api.sendMessage(message, userID);
        } catch (error) {
            // Ignore notification errors
        }
    },

    // Notify group banned
    notifyGroupBanned: async function(api, userID, threadID, banInfo) {
        try {
            const timeLeft = Math.ceil((banInfo.expires - Date.now()) / 60000);
            const message = 
                `🚫 𝐆𝐑𝐎𝐔𝐏 𝐈𝐒 𝐓𝐄𝐌𝐏𝐎𝐑𝐀𝐑𝐈𝐋𝐘 𝐁𝐀𝐍𝐍𝐄𝐃\n\n` +
                `This group is temporarily banned.\n\n` +
                `📝 Reason: ${banInfo.reason}\n` +
                `⏰ Time left: ${timeLeft} minutes\n\n` +
                `⚠️ All messages are blocked\n` +
                `⛔ Commands disabled\n` +
                `👑 Only admins can talk\n\n` +
                `🕒 Auto-unban in ${timeLeft} minutes.`;
            
            await api.sendMessage(message, userID);
        } catch (error) {
            // Ignore notification errors
        }
    }
};
