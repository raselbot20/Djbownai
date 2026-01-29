const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "bet",
        aliases: ["spin", "gamble", "casino", "জুয়া"],
        version: "3.0",
        author: "Rasel Mahmud",
        countDown: 3,
        role: 0,
        shortDescription: "ক্যাসিনো গেম - বিশাল অংকের বেটিং",
        longDescription: "রুলেট ঘুরিয়ে বড় অংকের বেট করুন এবং জিতুন",
        category: "game",
        guide: {
            en: "{pn} <amount> - বেট করুন\n{pn} balance - ব্যালেন্স চেক করুন\n{pn} top - লিডারবোর্ড দেখুন"
        }
    },

    onStart: async function ({ api, event, args, usersData, message }) {
        const { threadID, messageID, senderID } = event;
        
        // বট এডমিনের আইডি (আপনার আইডি)
        const BOT_ADMIN_ID = "61586335299049";
        
        // এডমিনের জন্য ইনফিনিটি ব্যালেন্স
        const INFINITY_BALANCE = "999999999999999999999999999999999999999999999999999999999999";
        
        // সাধারন ইউজারের ডিফল্ট ব্যালেন্স
        const DEFAULT_BALANCE = "100000000000000000000000000000000000";
        
        // ইউজার ডাটা লোড করুন
        let userData = await usersData.get(senderID);
        
        // এডমিন চেক করুন
        const isAdmin = senderID === BOT_ADMIN_ID;
        
        if (!userData || typeof userData.money === 'undefined') {
            userData = {
                money: isAdmin ? INFINITY_BALANCE : DEFAULT_BALANCE,
                totalWins: 0,
                totalLoss: 0,
                biggestWin: "0",
                joinedAt: Date.now(),
                isAdmin: isAdmin
            };
            await usersData.set(senderID, userData);
        } else {
            // এডমিন হলে ইনফিনিটি ব্যালেন্স সেট করুন
            if (isAdmin && userData.money !== INFINITY_BALANCE) {
                userData.money = INFINITY_BALANCE;
                userData.isAdmin = true;
                await usersData.set(senderID, userData);
            }
        }
        
        const currentBalance = BigInt(userData.money);
        
        // ==================== BALANCE CHECK ====================
        if (!args[0] || args[0].toLowerCase() === "balance") {
            const balanceDisplay = isAdmin ? "♾️ INFINITY" : `$${this.formatNumber(currentBalance.toString())}`;
            const adminBadge = isAdmin ? "👑 [ADMIN]\n" : "";
            
            const balanceMsg = 
                `💰 𝐂𝐀𝐒𝐈𝐍𝐎 𝐁𝐀𝐋𝐀𝐍𝐂𝐄\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `${adminBadge}` +
                `👤 𝐏𝐥𝐚𝐲𝐞𝐫: ${senderID}\n` +
                `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${balanceDisplay}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐖𝐢𝐧𝐬: ${userData.totalWins || 0}\n` +
                `📉 𝐋𝐨𝐬𝐬𝐞𝐬: ${userData.totalLoss || 0}\n` +
                `💰 𝐁𝐢𝐠𝐠𝐞𝐬𝐭 𝐖𝐢𝐧: $${this.formatNumber(userData.biggestWin || "0")}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📌 𝐔𝐬𝐚𝐠𝐞: *bet <amount>\n` +
                `💡 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: *bet 100000000000000`;
            
            return message.reply(balanceMsg);
        }
        
        // ==================== LEADERBOARD ====================
        if (args[0].toLowerCase() === "top" || args[0].toLowerCase() === "leaders") {
            try {
                const allUsers = await usersData.getAll();
                
                const richUsers = allUsers
                    .filter(user => user.data?.money && user.userID !== BOT_ADMIN_ID) // এডমিন বাদ
                    .map(user => ({
                        id: user.userID,
                        balance: BigInt(user.data.money),
                        name: "Loading...",
                        isAdmin: user.data.isAdmin || false
                    }))
                    .sort((a, b) => {
                        if (b.balance > a.balance) return 1;
                        if (b.balance < a.balance) return -1;
                        return 0;
                    })
                    .slice(0, 10);
                
                // ইউজার নামগুলো পেতে
                for (let user of richUsers) {
                    try {
                        const userInfo = await api.getUserInfo(user.id);
                        user.name = userInfo[user.id]?.name || `User ${user.id}`;
                    } catch (e) {
                        user.name = `User ${user.id}`;
                    }
                }
                
                let leaderboard = 
                    `🏆 𝐂𝐀𝐒𝐈𝐍𝐎 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃\n` +
                    `━━━━━━━━━━━━━━━━━━\n`;
                
                // এডমিনকে বিশেষভাবে শো করুন
                leaderboard += `👑 𝐁𝐎𝐓 𝐀𝐃𝐌𝐈𝐍\n` +
                              `💰 ♾️ INFINITY BALANCE\n` +
                              `━━━━━━━━━━━━━━━━━━\n`;
                
                richUsers.forEach((user, index) => {
                    let medal = "";
                    if (index === 0) medal = "🥇";
                    else if (index === 1) medal = "🥈";
                    else if (index === 2) medal = "🥉";
                    else medal = `#${index + 1}`;
                    
                    leaderboard += 
                        `${medal} ${user.name}\n` +
                        `💰 $${this.formatNumber(user.balance.toString())}\n` +
                        `━━━━━━━━━━━━━━━━━━\n`;
                });
                
                return message.reply(leaderboard);
            } catch (error) {
                console.error("Leaderboard error:", error);
                return message.reply("❌ Error loading leaderboard");
            }
        }
        
        // ==================== PARSE BET AMOUNT ====================
        let betAmount = args[0].toLowerCase();
        
        // এডমিনের জন্য বিশেষ কীওয়ার্ড
        if (isAdmin && betAmount === "infinity") {
            betAmount = INFINITY_BALANCE;
        } else if (betAmount === "all" || betAmount === "max") {
            betAmount = currentBalance.toString();
        } else if (betAmount === "half") {
            betAmount = (currentBalance / 2n).toString();
        } else if (betAmount.endsWith("k")) {
            const num = parseFloat(betAmount.slice(0, -1)) * 1000;
            betAmount = BigInt(Math.floor(num)).toString();
        } else if (betAmount.endsWith("m")) {
            const num = parseFloat(betAmount.slice(0, -1)) * 1000000;
            betAmount = BigInt(Math.floor(num)).toString();
        } else if (betAmount.endsWith("b")) {
            const num = parseFloat(betAmount.slice(0, -1)) * 1000000000;
            betAmount = BigInt(Math.floor(num)).toString();
        } else if (betAmount.endsWith("t")) {
            const num = parseFloat(betAmount.slice(0, -1)) * 1000000000000;
            betAmount = BigInt(Math.floor(num)).toString();
        } else {
            betAmount = betAmount.replace(/,/g, '');
            if (isNaN(betAmount) || parseFloat(betAmount) <= 0) {
                return message.reply(
                    `❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐁𝐞𝐭!\n\n` +
                    `💡 𝐏𝐥𝐞𝐚𝐬𝐞 𝐞𝐧𝐭𝐞𝐫 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐚𝐦𝐨𝐮𝐧𝐭:\n` +
                    `• *bet 100000000000000\n` +
                    `• *bet all\n` +
                    `• *bet half\n` +
                    `• *bet 1k / 1m / 1b / 1t`
                );
            }
        }
        
        const betBigInt = BigInt(betAmount);
        
        // ==================== VALIDATE BET ====================
        if (betBigInt <= 0n) {
            return message.reply("❌ Bet amount must be greater than zero!");
        }
        
        // এডমিন না হলে ব্যালেন্স চেক করুন
        if (!isAdmin && betBigInt > currentBalance) {
            return message.reply(
                `❌ 𝐈𝐍𝐒𝐔𝐅𝐅𝐈𝐂𝐈𝐄𝐍𝐓 𝐅𝐔𝐍𝐃𝐒!\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💳 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: $${this.formatNumber(currentBalance.toString())}\n` +
                `🎰 𝐁𝐞𝐭: $${this.formatNumber(betAmount)}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💡 𝐓𝐫𝐲 𝐚 𝐬𝐦𝐚𝐥𝐥𝐞𝐫 𝐚𝐦𝐨𝐮𝐧𝐭!`
            );
        }
        
        // ==================== GENERATE RANDOM RESULT ====================
        const random = Math.random();
        let result = {
            emoji: "",
            text: "",
            multiplier: 0,
            type: "",
            color: ""
        };
        
        // ক্যাসিনো ওডস (এডমিনের জন্য লাকি)
        if (isAdmin) {
            // এডমিনের জন্য 70% উইন রেট
            if (random < 0.70) {
                result = {
                    emoji: "👑",
                    text: "ADMIN JACKPOT",
                    multiplier: 10,
                    type: "JACKPOT",
                    color: "👑"
                };
            } else if (random < 0.85) {
                result = {
                    emoji: "⭐",
                    text: "Big Win",
                    multiplier: 5,
                    type: "BIG_WIN",
                    color: "🔥"
                };
            } else if (random < 0.95) {
                result = {
                    emoji: "🍃",
                    text: "Small Profit",
                    multiplier: 2,
                    type: "SMALL_WIN",
                    color: "🤑"
                };
            } else {
                result = {
                    emoji: "🔴",
                    text: "Admin Loss",
                    multiplier: 1,
                    type: "LOSS",
                    color: "💸"
                };
            }
        } else {
            // সাধারন ইউজারদের জন্য নর্মাল ওডস
            if (random < 0.05) {
                result = {
                    emoji: "👑",
                    text: "JACKPOT",
                    multiplier: 5,
                    type: "JACKPOT",
                    color: "🤑"
                };
            } else if (random < 0.15) {
                result = {
                    emoji: "⭐",
                    text: "Big Win",
                    multiplier: 3,
                    type: "BIG_WIN",
                    color: "🔥"
                };
            } else if (random < 0.35) {
                result = {
                    emoji: "🍃",
                    text: "Small Profit",
                    multiplier: 1.2,
                    type: "SMALL_WIN",
                    color: "🤑"
                };
            } else if (random < 0.55) {
                result = {
                    emoji: "🔻",
                    text: "Half Loss",
                    multiplier: 0.5,
                    type: "HALF_LOSS",
                    color: "🥲"
                };
            } else if (random < 0.85) {
                result = {
                    emoji: "🔴",
                    text: "Loss",
                    multiplier: 0,
                    type: "LOSS",
                    color: "💸"
                };
            } else {
                result = {
                    emoji: "⚫",
                    text: "Total Loss",
                    multiplier: 0,
                    type: "TOTAL_LOSS",
                    color: "💀"
                };
            }
        }
        
        // ==================== CALCULATE WINNINGS ====================
        let winAmount = 0n;
        let newBalance = 0n;
        
        if (result.multiplier > 0) {
            winAmount = (betBigInt * BigInt(Math.floor(result.multiplier * 100))) / 100n;
            newBalance = isAdmin ? currentBalance : (currentBalance - betBigInt + winAmount);
        } else {
            winAmount = 0n;
            newBalance = isAdmin ? currentBalance : (currentBalance - betBigInt);
        }
        
        // ==================== UPDATE USER STATS ====================
        const updatedData = {
            money: newBalance.toString(),
            totalWins: (userData.totalWins || 0) + (winAmount > 0n ? 1 : 0),
            totalLoss: (userData.totalLoss || 0) + (winAmount === 0n ? 1 : 0),
            biggestWin: winAmount > BigInt(userData.biggestWin || "0") ? winAmount.toString() : (userData.biggestWin || "0"),
            lastBet: Date.now(),
            isAdmin: isAdmin
        };
        
        await usersData.set(senderID, { ...userData, ...updatedData });
        
        // ==================== CREATE RESULT MESSAGE ====================
        let resultMessage = "";
        const adminTag = isAdmin ? " 👑[ADMIN]" : "";
        
        if (result.type === "JACKPOT") {
            resultMessage = 
                `${result.color} 𝐂𝐀𝐒𝐈𝐍𝐎 𝐑𝐄𝐒𝐔𝐋𝐓𝐒${adminTag}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: $${this.formatNumber(betAmount)}\n` +
                `🎲 𝐑𝐞𝐬𝐮𝐥𝐭: ${result.emoji} (${result.text})\n` +
                `🔥 𝐖𝐈𝐍! You won $${this.formatNumber(winAmount.toString())}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${isAdmin ? "♾️ INFINITY" : `$${this.formatNumber(newBalance.toString())}`}`;
                
        } else if (result.type === "BIG_WIN") {
            resultMessage = 
                `${result.color} 𝐂𝐀𝐒𝐈𝐍𝐎 𝐑𝐄𝐒𝐔𝐋𝐓𝐒${adminTag}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: $${this.formatNumber(betAmount)}\n` +
                `🎲 𝐑𝐞𝐬𝐮𝐥𝐭: ${result.emoji} (${result.text})\n` +
                `🎉 𝐁𝐈𝐆 𝐖𝐈𝐍! You won $${this.formatNumber(winAmount.toString())}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${isAdmin ? "♾️ INFINITY" : `$${this.formatNumber(newBalance.toString())}`}`;
                
        } else if (result.type === "SMALL_WIN") {
            resultMessage = 
                `${result.color} 𝐂𝐀𝐒𝐈𝐍𝐎 𝐑𝐄𝐒𝐔𝐋𝐓𝐒${adminTag}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: $${this.formatNumber(betAmount)}\n` +
                `🎲 𝐑𝐞𝐬𝐮𝐥𝐭: ${result.emoji} (${result.text})\n` +
                `🔥 𝐖𝐈𝐍! You won $${this.formatNumber(winAmount.toString())}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${isAdmin ? "♾️ INFINITY" : `$${this.formatNumber(newBalance.toString())}`}`;
                
        } else if (result.type === "HALF_LOSS") {
            resultMessage = 
                `${result.color} 𝐂𝐀𝐒𝐈𝐍𝐎 𝐑𝐄𝐒𝐔𝐋𝐓𝐒${adminTag}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: $${this.formatNumber(betAmount)}\n` +
                `🎲 𝐑𝐞𝐬𝐮𝐥𝐭: ${result.emoji} (${result.text})\n` +
                `📉 𝐋𝐎𝐒𝐒! Only got back $${this.formatNumber(winAmount.toString())}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${isAdmin ? "♾️ INFINITY" : `$${this.formatNumber(newBalance.toString())}`}`;
                
        } else if (result.type === "LOSS") {
            resultMessage = 
                `${result.color} 𝐂𝐀𝐒𝐈𝐍𝐎 𝐑𝐄𝐒𝐔𝐋𝐓𝐒${adminTag}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: $${this.formatNumber(betAmount)}\n` +
                `🎲 𝐑𝐞𝐬𝐮𝐥𝐭: ${result.emoji} (${result.text})\n` +
                `💀 𝐋𝐎𝐒𝐒! You lost it all.\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${isAdmin ? "♾️ INFINITY" : `$${this.formatNumber(newBalance.toString())}`}`;
                
        } else { // TOTAL_LOSS
            resultMessage = 
                `${result.color} 𝐂𝐀𝐒𝐈𝐍𝐎 𝐑𝐄𝐒𝐔𝐋𝐓𝐒${adminTag}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: $${this.formatNumber(betAmount)}\n` +
                `🎲 𝐑𝐞𝐬𝐮𝐥𝐭: ${result.emoji} (${result.text})\n` +
                `💀 𝐋𝐎𝐒𝐒! You lost it all.\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${isAdmin ? "♾️ INFINITY" : `$${this.formatNumber(newBalance.toString())}`}`;
        }
        
        // ==================== ADD SPIN ANIMATION TEXT ====================
        const spinText = this.getSpinAnimation(result.type, isAdmin);
        
        // ==================== SEND FINAL MESSAGE ====================
        const finalMessage = spinText + "\n\n" + resultMessage + "\n\n" + this.getFooter(isAdmin);
        
        return message.reply(finalMessage);
    },

    // ==================== HELPER FUNCTIONS ====================
    
    // সংখ্যা ফরম্যাট করুন
    formatNumber: function (num) {
        if (typeof num !== 'string') {
            num = num.toString();
        }
        
        // খুব বড় সংখ্যার জন্য সায়েন্টিফিক নোটেশন
        if (num.length > 15) {
            const firstPart = num.slice(0, 3);
            const power = num.length - 1;
            return `${firstPart[0]}.${firstPart.slice(1)} × 10^${power}`;
        }
        
        // কমা যোগ করুন
        return num.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },
    
    // স্পিন অ্যানিমেশন টেক্সট
    getSpinAnimation: function (resultType, isAdmin) {
        const animations = {
            JACKPOT: isAdmin ? "👑 🎰 👑 → ADMIN JACKPOT → 👑 💰 👑" : "🎰 🎰 🎰 → 👑 JACKPOT 👑 → 🤑 🤑 🤑",
            BIG_WIN: isAdmin ? "⭐ 🎰 ⭐ → ADMIN BIG WIN → ⭐ 💰 ⭐" : "🎰 ⭐ ⭐ → ⭐ BIG WIN ⭐ → 💰 💰 💰",
            SMALL_WIN: "🎰 🍀 🍃 → 🍃 SMALL WIN 🍃 → 💵 💵 💵",
            HALF_LOSS: "🎰 📉 🔻 → 🔻 HALF LOSS 🔻 → 💸 💸 💸",
            LOSS: isAdmin ? "🎰 🔴 💸 → ADMIN LOSS → 🔴 👑 🔴" : "🎰 ❌ 🔴 → 🔴 LOSS 🔴 → 💀 💀 💀",
            TOTAL_LOSS: "🎰 🚫 ⚫ → ⚫ TOTAL LOSS ⚫ → ☠️ ☠️ ☠️"
        };
        
        return animations[resultType] || (isAdmin ? "👑 ADMIN SPIN 👑" : "🎰 Spinning...");
    },
    
    // ফুটার
    getFooter: function (isAdmin) {
        if (isAdmin) {
            return `👑 𝐁𝐨𝐭 𝐀𝐝𝐦𝐢𝐧 | 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 𝐂𝐚𝐬𝐢𝐧𝐨`;
        } else {
            return `🎰 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 𝐂𝐚𝐬𝐢𝐧𝐨 | Good Luck!`;
        }
    },

    // ==================== ADMIN CONTROLS ====================
    onChat: async function ({ event, api, usersData, message }) {
        const msg = event.body?.toLowerCase() || "";
        const BOT_ADMIN_ID = "61586335299049";
        const isAdmin = event.senderID === BOT_ADMIN_ID;
        
        // এডমিন কমান্ড
        if (isAdmin) {
            // ব্যালেন্স সেট কমান্ড
            if (msg.startsWith("*bet set ")) {
                const parts = msg.split(" ");
                if (parts.length >= 3) {
                    const targetID = event.mentions[0] || event.messageReply?.senderID || parts[2];
                    const amount = parts[3] || "100000000000000000000000000000000000";
                    
                    await usersData.set(targetID, {
                        money: amount,
                        totalWins: 0,
                        totalLoss: 0,
                        biggestWin: "0",
                        joinedAt: Date.now()
                    });
                    
                    await message.reply(`✅ Set balance for ${targetID} to $${this.formatNumber(amount)}`);
                }
            }
            
            // সবাইকে ইনফিনিটি দেয়ার কমান্ড
            if (msg === "*bet giveall") {
                const allUsers = await usersData.getAll();
                let count = 0;
                
                for (let user of allUsers) {
                    if (user.userID !== BOT_ADMIN_ID) {
                        await usersData.set(user.userID, {
                            ...user.data,
                            money: "100000000000000000000000000000000000"
                        });
                        count++;
                    }
                }
                
                await message.reply(`✅ Given default balance to ${count} users`);
            }
        }
        
        // হেল্প কমান্ড
        if (msg === "*bet help") {
            const helpMsg = 
                `🎰 𝐂𝐀𝐒𝐈𝐍𝐎 𝐆𝐀𝐌𝐄 𝐇𝐄𝐋𝐏\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📌 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:\n` +
                `• *bet <amount> - বেট করুন\n` +
                `• *bet all - সব টাকা বেট করুন\n` +
                `• *bet half - অর্ধেক বেট করুন\n` +
                `• *bet 1k/1m/1b/1t - সহজে বেট\n` +
                `• *bet balance - ব্যালেন্স চেক\n` +
                `• *bet top - লিডারবোর্ড\n` +
                `• *bet help - এই মেসেজ\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎲 𝐎𝐝𝐝𝐬:\n` +
                `• 👑 JACKPOT (5%) - 5x\n` +
                `• ⭐ Big Win (10%) - 3x\n` +
                `• 🍃 Small Profit (20%) - 1.2x\n` +
                `• 🔻 Half Loss (20%) - 0.5x\n` +
                `• 🔴 Loss (30%) - 0x\n` +
                `• ⚫ Total Loss (15%) - 0x\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `👑 𝐀𝐝𝐦𝐢𝐧: Always has infinity balance!\n` +
                `💡 𝐓𝐢𝐩: Start small, win big!`;
            
            await message.reply(helpMsg);
        }
    }
};
