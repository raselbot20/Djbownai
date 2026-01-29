const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "slots",
        aliases: ["slot", "slotmachine", "স্লট"],
        version: "2.0",
        author: "Rasel Mahmud",
        countDown: 3,
        role: 0,
        description: "🎰 Ultra-premium slot machine with advanced features",
        category: "game",
        guide: {
            en: "Use: {pn} [bet amount]\nExamples: {pn} 1000, {pn} all, {pn} max"
        }
    },

    onStart: async function ({ message, event, args, usersData, api }) {
        const { senderID, threadID } = event;
        
        // Get user data
        let userData = await usersData.get(senderID);
        if (!userData || typeof userData.money === 'undefined') {
            userData = {
                money: 1000000, // 1 million starting balance
                slotWins: 0,
                slotLosses: 0,
                biggestSlotWin: 0,
                totalSpins: 0,
                jackpotWins: 0
            };
            await usersData.set(senderID, userData);
        }
        
        const currentBalance = userData.money;
        
        // ==================== BALANCE CHECK ====================
        if (!args[0] || args[0].toLowerCase() === "balance") {
            const balanceMsg = 
                `🎰 𝐒𝐋𝐎𝐓 𝐌𝐀𝐂𝐇𝐈𝐍𝐄 𝐁𝐀𝐋𝐀𝐍𝐂𝐄\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(currentBalance)}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📊 𝐒𝐭𝐚𝐭𝐢𝐬𝐭𝐢𝐜𝐬:\n` +
                `🎯 𝐖𝐢𝐧𝐬: ${userData.slotWins || 0}\n` +
                `📉 𝐋𝐨𝐬𝐬𝐞𝐬: ${userData.slotLosses || 0}\n` +
                `💰 𝐁𝐢𝐠𝐠𝐞𝐬𝐭 𝐖𝐢𝐧: ${this.formatMoney(userData.biggestSlotWin || 0)}\n` +
                `🎰 𝐓𝐨𝐭𝐚𝐥 𝐒𝐩𝐢𝐧𝐬: ${userData.totalSpins || 0}\n` +
                `👑 𝐉𝐚𝐜𝐤𝐩𝐨𝐭𝐬: ${userData.jackpotWins || 0}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💡 𝐔𝐬𝐚𝐠𝐞: *slots <amount>\n` +
                `✨ 𝐄𝐱𝐚𝐦𝐩𝐥𝐞: *slots 1000000`;
            
            return message.reply(balanceMsg);
        }
        
        // ==================== PARSE BET AMOUNT ====================
        let betInput = args[0].toLowerCase();
        let betAmount = 0;
        
        // Special keywords
        if (betInput === "all" || betInput === "max") {
            betAmount = currentBalance;
        } else if (betInput === "half") {
            betAmount = Math.floor(currentBalance / 2);
        } else if (betInput.endsWith("k")) {
            const num = parseFloat(betInput.slice(0, -1)) * 1000;
            betAmount = Math.floor(num);
        } else if (betInput.endsWith("m")) {
            const num = parseFloat(betInput.slice(0, -1)) * 1000000;
            betAmount = Math.floor(num);
        } else if (betInput.endsWith("b")) {
            const num = parseFloat(betInput.slice(0, -1)) * 1000000000;
            betAmount = Math.floor(num);
        } else {
            // Remove commas and parse
            betInput = betInput.replace(/,/g, '');
            betAmount = parseInt(betInput);
        }
        
        // Validate bet
        if (isNaN(betAmount) || betAmount <= 0) {
            return message.reply(
                `❌ 𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐁𝐞𝐭 𝐀𝐦𝐨𝐮𝐧𝐭!\n\n` +
                `💡 𝐕𝐚𝐥𝐢𝐝 𝐄𝐱𝐚𝐦𝐩𝐥𝐞𝐬:\n` +
                `• *slots 1000000\n` +
                `• *slots all\n` +
                `• *slots half\n` +
                `• *slots 10k / 1m / 1b`
            );
        }
        
        if (betAmount > currentBalance) {
            return message.reply(
                `❌ 𝐈𝐧𝐬𝐮𝐟𝐟𝐢𝐜𝐢𝐞𝐧𝐭 𝐅𝐮𝐧𝐝𝐬!\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💳 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(currentBalance)}\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💡 𝐍𝐞𝐞𝐝: ${this.formatMoney(betAmount - currentBalance)} 𝐦𝐨𝐫𝐞!`
            );
        }
        
        // ==================== GENERATE SLOT RESULTS ====================
        const symbols = [
            { emoji: "🍒", name: "Cherry", weight: 25, multiplier: 2 },
            { emoji: "🍋", name: "Lemon", weight: 20, multiplier: 3 },
            { emoji: "🍇", name: "Grapes", weight: 18, multiplier: 4 },
            { emoji: "🍉", name: "Watermelon", weight: 15, multiplier: 5 },
            { emoji: "⭐", name: "Star", weight: 10, multiplier: 10 },
            { emoji: "7️⃣", name: "Seven", weight: 5, multiplier: 20 },
            { emoji: "👑", name: "Crown", weight: 4, multiplier: 50 },
            { emoji: "💎", name: "Diamond", weight: 3, multiplier: 100 }
        ];
        
        // Weighted random selection
        const getRandomSymbol = () => {
            const totalWeight = symbols.reduce((sum, s) => sum + s.weight, 0);
            let random = Math.random() * totalWeight;
            for (const symbol of symbols) {
                if (random < symbol.weight) return symbol;
                random -= symbol.weight;
            }
            return symbols[0];
        };
        
        // Generate 3 slots with special effects chance
        const slots = [];
        const slotEffects = [];
        
        for (let i = 0; i < 3; i++) {
            // 10% chance for special glowing effect
            const hasEffect = Math.random() < 0.1;
            const symbol = getRandomSymbol();
            slots.push(symbol);
            slotEffects.push(hasEffect ? "✨" : "  ");
        }
        
        const [slot1, slot2, slot3] = slots;
        
        // ==================== CALCULATE WINNINGS ====================
        let winMultiplier = 0;
        let resultType = "LOSS";
        let bonusMessage = "";
        let jackpotBonus = 0;
        
        // Check for matches
        if (slot1.emoji === slot2.emoji && slot2.emoji === slot3.emoji) {
            // Triple match
            winMultiplier = slot1.multiplier;
            
            if (slot1.emoji === "👑") {
                resultType = "ROYAL_JACKPOT";
                winMultiplier = 200;
                jackpotBonus = Math.floor(betAmount * 0.5); // 50% bonus
                bonusMessage = "👑 𝐑𝐎𝐘𝐀𝐋 𝐉𝐀𝐂𝐊𝐏𝐎𝐓! +50% Bonus!";
            } else if (slot1.emoji === "💎") {
                resultType = "DIAMOND_JACKPOT";
                winMultiplier = 500;
                jackpotBonus = Math.floor(betAmount * 1); // 100% bonus
                bonusMessage = "💎 𝐃𝐈𝐀𝐌𝐎𝐍𝐃 𝐉𝐀𝐂𝐊𝐏𝐎𝐓! +100% Bonus!";
            } else if (slot1.emoji === "7️⃣") {
                resultType = "MEGA_JACKPOT";
                winMultiplier = 100;
                jackpotBonus = Math.floor(betAmount * 0.3); // 30% bonus
                bonusMessage = "7️⃣ 𝐌𝐄𝐆𝐀 𝐉𝐀𝐂𝐊𝐏𝐎𝐓! +30% Bonus!";
            } else {
                resultType = "TRIPLE_MATCH";
            }
            
        } else if (slot1.emoji === slot2.emoji || slot2.emoji === slot3.emoji || slot1.emoji === slot3.emoji) {
            // Double match
            const matchedSymbol = slot1.emoji === slot2.emoji ? slot1 : slot3;
            winMultiplier = Math.floor(matchedSymbol.multiplier / 2);
            resultType = "DOUBLE_MATCH";
            
        } else {
            // Check for special patterns
            const isAscending = symbols.indexOf(slot1) < symbols.indexOf(slot2) && symbols.indexOf(slot2) < symbols.indexOf(slot3);
            const isDescending = symbols.indexOf(slot1) > symbols.indexOf(slot2) && symbols.indexOf(slot2) > symbols.indexOf(slot3);
            
            if (isAscending) {
                winMultiplier = 3;
                resultType = "ASCENDING_PATTERN";
                bonusMessage = "📈 𝐀𝐬𝐜𝐞𝐧𝐝𝐢𝐧𝐠 𝐏𝐚𝐭𝐭𝐞𝐫𝐧!";
            } else if (isDescending) {
                winMultiplier = 3;
                resultType = "DESCENDING_PATTERN";
                bonusMessage = "📉 𝐃𝐞𝐬𝐜𝐞𝐧𝐝𝐢𝐧𝐠 𝐏𝐚𝐭𝐭𝐞𝐫𝐧!";
            } else {
                // 25% chance for small consolation win
                if (Math.random() < 0.25) {
                    winMultiplier = 1.5;
                    resultType = "CONSOLATION_WIN";
                    bonusMessage = "🍀 𝐋𝐮𝐜𝐤𝐲 𝐂𝐨𝐧𝐬𝐨𝐥𝐚𝐭𝐢𝐨𝐧!";
                } else {
                    winMultiplier = 0;
                    resultType = "LOSS";
                }
            }
        }
        
        // Calculate total winnings
        const baseWinnings = Math.floor(betAmount * winMultiplier);
        const totalWinnings = baseWinnings + jackpotBonus;
        const newBalance = currentBalance - betAmount + totalWinnings;
        
        // ==================== UPDATE USER STATS ====================
        const updatedStats = {
            money: newBalance,
            totalSpins: (userData.totalSpins || 0) + 1,
            slotWins: (userData.slotWins || 0) + (totalWinnings > 0 ? 1 : 0),
            slotLosses: (userData.slotLosses || 0) + (totalWinnings === 0 ? 1 : 0),
            biggestSlotWin: Math.max(userData.biggestSlotWin || 0, totalWinnings),
            jackpotWins: (userData.jackpotWins || 0) + 
                (resultType === "ROYAL_JACKPOT" || resultType === "DIAMOND_JACKPOT" || resultType === "MEGA_JACKPOT" ? 1 : 0)
        };
        
        await usersData.set(senderID, { ...userData, ...updatedStats });
        
        // ==================== CREATE VISUAL SLOT MACHINE ====================
        const slotMachine = this.createSlotMachine(slots, slotEffects, resultType);
        
        // ==================== CREATE RESULT MESSAGE ====================
        let resultMessage = "";
        const resultColor = totalWinnings > 0 ? "🟢" : "🔴";
        
        if (resultType === "ROYAL_JACKPOT") {
            resultMessage = 
                `${resultColor} 𝐑𝐎𝐘𝐀𝐋 𝐉𝐀𝐂𝐊𝐏𝐎𝐓! 👑\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💰 𝐁𝐚𝐬𝐞 𝐖𝐢𝐧: ${this.formatMoney(baseWinnings)}\n` +
                `✨ 𝐁𝐨𝐧𝐮𝐬: +${this.formatMoney(jackpotBonus)}\n` +
                `🎉 𝐓𝐨𝐭𝐚𝐥 𝐖𝐨𝐧: ${this.formatMoney(totalWinnings)}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}`;
                
        } else if (resultType === "DIAMOND_JACKPOT") {
            resultMessage = 
                `${resultColor} 𝐃𝐈𝐀𝐌𝐎𝐍𝐃 𝐉𝐀𝐂𝐊𝐏𝐎𝐓! 💎\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💰 𝐁𝐚𝐬𝐞 𝐖𝐢𝐧: ${this.formatMoney(baseWinnings)}\n` +
                `✨ 𝐁𝐨𝐧𝐮𝐬: +${this.formatMoney(jackpotBonus)}\n` +
                `🎉 𝐓𝐨𝐭𝐚𝐥 𝐖𝐨𝐧: ${this.formatMoney(totalWinnings)}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}`;
                
        } else if (resultType === "MEGA_JACKPOT") {
            resultMessage = 
                `${resultColor} 𝐌𝐄𝐆𝐀 𝐉𝐀𝐂𝐊𝐏𝐎𝐓! 7️⃣\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💰 𝐁𝐚𝐬𝐞 𝐖𝐢𝐧: ${this.formatMoney(baseWinnings)}\n` +
                `✨ 𝐁𝐨𝐧𝐮𝐬: +${this.formatMoney(jackpotBonus)}\n` +
                `🎉 𝐓𝐨𝐭𝐚𝐥 𝐖𝐨𝐧: ${this.formatMoney(totalWinnings)}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}`;
                
        } else if (resultType === "TRIPLE_MATCH") {
            resultMessage = 
                `${resultColor} 𝐓𝐑𝐈𝐏𝐋𝐄 𝐌𝐀𝐓𝐂𝐇! 🎯\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💰 𝐖𝐨𝐧: ${this.formatMoney(totalWinnings)}\n` +
                `✨ 𝐌𝐮𝐥𝐭𝐢𝐩𝐥𝐢𝐞𝐫: ${winMultiplier}x\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}`;
                
        } else if (resultType === "DOUBLE_MATCH") {
            resultMessage = 
                `${resultColor} 𝐃𝐎𝐔𝐁𝐋𝐄 𝐌𝐀𝐓𝐂𝐇! ✨\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💰 𝐖𝐨𝐧: ${this.formatMoney(totalWinnings)}\n` +
                `✨ 𝐌𝐮𝐥𝐭𝐢𝐩𝐥𝐢𝐞𝐫: ${winMultiplier}x\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}`;
                
        } else if (resultType.includes("PATTERN")) {
            resultMessage = 
                `${resultColor} 𝐒𝐏𝐄𝐂𝐈𝐀𝐋 𝐏𝐀𝐓𝐓𝐄𝐑𝐍! 📊\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💰 𝐖𝐨𝐧: ${this.formatMoney(totalWinnings)}\n` +
                `${bonusMessage}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}`;
                
        } else if (resultType === "CONSOLATION_WIN") {
            resultMessage = 
                `${resultColor} 𝐂𝐎𝐍𝐒𝐎𝐋𝐀𝐓𝐈𝐎𝐍 𝐖𝐈𝐍! 🍀\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💰 𝐖𝐨𝐧: ${this.formatMoney(totalWinnings)}\n` +
                `${bonusMessage}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}`;
                
        } else {
            resultMessage = 
                `${resultColor} 𝐍𝐎 𝐖𝐈𝐍 😔\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎰 𝐁𝐞𝐭: ${this.formatMoney(betAmount)}\n` +
                `💸 𝐋𝐨𝐬𝐭: ${this.formatMoney(betAmount)}\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🏦 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${this.formatMoney(newBalance)}\n` +
                `💡 𝐓𝐫𝐲 𝐚𝐠𝐚𝐢𝐧, 𝐥𝐮𝐜𝐤 𝐦𝐚𝐲 𝐜𝐡𝐚𝐧𝐠𝐞!`;
        }
        
        // ==================== FINAL MESSAGE ====================
        const finalMessage = 
            slotMachine + "\n\n" + 
            resultMessage + "\n\n" +
            `🎰 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗎 𝐒𝐥𝐨𝐭𝐬 | 𝐒𝐩𝐢𝐧 𝐂𝐨𝐮𝐧𝐭: ${updatedStats.totalSpins}`;
        
        return message.reply(finalMessage);
    },

    // ==================== HELPER FUNCTIONS ====================
    
    // Money formatting with emojis
    formatMoney: function (amount) {
        amount = Number(amount);
        if (isNaN(amount)) return "💲0";
        
        const formats = [
            { value: 1e12, suffix: 'T', emoji: '✨', decimals: 2 },
            { value: 1e9, suffix: 'B', emoji: '💎', decimals: 2 },
            { value: 1e6, suffix: 'M', emoji: '💰', decimals: 1 },
            { value: 1e3, suffix: 'K', emoji: '💵', decimals: 0 }
        ];
        
        for (const format of formats) {
            if (amount >= format.value) {
                const value = (amount / format.value).toFixed(format.decimals);
                return `${format.emoji}${value}${format.suffix}`;
            }
        }
        
        return `💲${amount.toLocaleString()}`;
    },
    
    // Create beautiful slot machine display
    createSlotMachine: function (slots, effects, resultType) {
        const [slot1, slot2, slot3] = slots;
        const [effect1, effect2, effect3] = effects;
        
        // Special borders for jackpots
        let border = "=";
        let corner = "✧";
        
        if (resultType.includes("JACKPOT")) {
            border = "★";
            corner = "✦";
        } else if (resultType === "TRIPLE_MATCH") {
            border = "═";
            corner = "╔╗╚╝";
        }
        
        const topBorder = `${corner}${border.repeat(20)}${corner}`;
        const middleBorder = `${border}${' '.repeat(20)}${border}`;
        const bottomBorder = `${corner}${border.repeat(20)}${corner}`;
        
        // Create the slot display with effects
        const slotDisplay = 
            `🎰 ${topBorder} 🎰\n` +
            `   ${middleBorder}\n` +
            `   ${border}  ${effect1}${slot1.emoji}   ${effect2}${slot2.emoji}   ${effect3}${slot3.emoji}  ${border}\n` +
            `   ${middleBorder}\n` +
            `🎰 ${bottomBorder} 🎰\n` +
            `   ${slot1.name}  |  ${slot2.name}  |  ${slot3.name}`;
        
        return slotDisplay;
    },
    
    // Additional features
    onChat: async function ({ event, message, usersData }) {
        const msg = event.body?.toLowerCase() || "";
        
        // Leaderboard for slots
        if (msg === "*slots top" || msg === "*slot leaders") {
            try {
                const allUsers = await usersData.getAll();
                
                const slotPlayers = allUsers
                    .filter(user => user.data?.slotWins || user.data?.totalSpins)
                    .map(user => ({
                        id: user.userID,
                        wins: user.data.slotWins || 0,
                        balance: user.data.money || 0,
                        jackpots: user.data.jackpotWins || 0,
                        biggestWin: user.data.biggestSlotWin || 0,
                        name: "Loading..."
                    }))
                    .sort((a, b) => (b.wins * 100 + b.jackpots * 1000) - (a.wins * 100 + a.jackpots * 1000))
                    .slice(0, 10);
                
                // Get user names
                for (let user of slotPlayers) {
                    try {
                        const userInfo = await api.getUserInfo(user.id);
                        user.name = userInfo[user.id]?.name || `User ${user.id}`;
                    } catch (e) {
                        user.name = `User ${user.id}`;
                    }
                }
                
                let leaderboard = 
                    `🏆 𝐒𝐋𝐎𝐓 𝐌𝐀𝐂𝐇𝐈𝐍𝐄 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃\n` +
                    `━━━━━━━━━━━━━━━━━━\n`;
                
                slotPlayers.forEach((player, index) => {
                    let medal = "";
                    if (index === 0) medal = "🥇";
                    else if (index === 1) medal = "🥈";
                    else if (index === 2) medal = "🥉";
                    else medal = `#${index + 1}`;
                    
                    leaderboard += 
                        `${medal} ${player.name}\n` +
                        `🎯 Wins: ${player.wins} | 👑 Jackpots: ${player.jackpots}\n` +
                        `💰 Biggest Win: ${this.formatMoney(player.biggestWin)}\n` +
                        `━━━━━━━━━━━━━━━━━━\n`;
                });
                
                await message.reply(leaderboard);
                
            } catch (error) {
                console.error("Slot leaderboard error:", error);
            }
        }
        
        // Help command
        if (msg === "*slots help") {
            const helpMsg = 
                `🎰 𝐒𝐋𝐎𝐓 𝐌𝐀𝐂𝐇𝐈𝐍𝐄 𝐇𝐄𝐋𝐏\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `📌 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:\n` +
                `• *slots <amount> - Spin slots\n` +
                `• *slots all - Bet all money\n` +
                `• *slots half - Bet half\n` +
                `• *slots balance - Check balance\n` +
                `• *slots top - Leaderboard\n` +
                `• *slots help - This help\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `🎯 𝐖𝐢𝐧𝐧𝐢𝐧𝐠 𝐂𝐨𝐦𝐛𝐨𝐬:\n` +
                `• 3x 👑 = 200x + 50% bonus\n` +
                `• 3x 💎 = 500x + 100% bonus\n` +
                `• 3x 7️⃣ = 100x + 30% bonus\n` +
                `• 3x same = 2-20x\n` +
                `• 2x same = 1-10x\n` +
                `• Patterns = 3x\n` +
                `━━━━━━━━━━━━━━━━━━\n` +
                `💡 𝐓𝐢𝐩: Higher bets increase jackpot chances!`;
            
            await message.reply(helpMsg);
        }
    }
};
