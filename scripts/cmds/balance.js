// ==================== INFINITY CONSTANTS ====================
const INFINITY_SYMBOL = "♾️";
const INFINITY_VALUE = Number.MAX_SAFE_INTEGER * 1000;
const ADMIN_INFINITY_BALANCE = INFINITY_VALUE;
// ===========================================================

module.exports = {
  config: {
    name: "balance",
    aliases: ["bal", "$", "cash", "money", "টাকা", "ব্যালেন্স"],
    version: "6.0",
    author: "Rasel Mahmud",
    countDown: 2,
    role: 0,
    description: "♾️ Infinite Economy System with Ultimate Features",
    category: "economy",
    guide: {
      en: `╔════❰ ♾️ 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 𝐒𝐘𝐒𝐓𝐄𝐌 ❱════╗
🎯 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:
• *balance - Your balance
• *balance @user - Check others
• *balance send @user amount - Send money
• *balance daily - Daily bonus
• *balance weekly - Weekly bonus
• *balance top - Leaderboard
• *balance stats - Your stats
• *balance give @user amount - Give money (Admin)
• *balance help - Help guide
╚═══════════════════╝`
    }
  },

  onStart: async function ({ message, event, args, usersData, api, prefix }) {
    const { senderID, messageReply, mentions, threadID } = event;
    
    // 🔥 IMPORTANT: আপনার Facebook ID এখানে দিন
    const BOT_ADMIN_ID = "61586335299049"; // এখানে আপনার ID দিন
    const isAdmin = senderID === BOT_ADMIN_ID;
    
    // ==================== বাংলাদেশ সময় ফাংশন ====================
    const getBangladeshTime = () => {
      const now = new Date();
      const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000)); // UTC+6
      
      const date = bdTime.getDate().toString().padStart(2, '0');
      const month = (bdTime.getMonth() + 1).toString().padStart(2, '0');
      const year = bdTime.getFullYear();
      
      let hours = bdTime.getHours();
      const minutes = bdTime.getMinutes().toString().padStart(2, '0');
      const seconds = bdTime.getSeconds().toString().padStart(2, '0');
      
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      
      return `🕒 ${date}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
    };
    
    // ==================== ADVANCED MONEY FORMATTING ====================
    const formatMoney = (amount, isAdminUser = false) => {
      if (isAdminUser) {
        return `${INFINITY_SYMBOL} INFINITY`;
      }
      
      if (typeof amount !== 'number') amount = Number(amount);
      if (isNaN(amount)) return "💲0";
      if (amount >= INFINITY_VALUE * 0.9) return `${INFINITY_SYMBOL} INFINITY`;
      
      const scales = [
        { value: 1e33, suffix: 'Dc', emoji: '🌠', name: 'Decillion' },
        { value: 1e30, suffix: 'No', emoji: '🌟', name: 'Nonillion' },
        { value: 1e27, suffix: 'Oc', emoji: '⭐', name: 'Octillion' },
        { value: 1e24, suffix: 'Sp', emoji: '✨', name: 'Septillion' },
        { value: 1e21, suffix: 'Sx', emoji: '💫', name: 'Sextillion' },
        { value: 1e18, suffix: 'Qi', emoji: '🌌', name: 'Quintillion' },
        { value: 1e15, suffix: 'Qa', emoji: '🔮', name: 'Quadrillion' },
        { value: 1e12, suffix: 'T', emoji: '💎', name: 'Trillion' },
        { value: 1e9, suffix: 'B', emoji: '💰', name: 'Billion' },
        { value: 1e6, suffix: 'M', emoji: '💵', name: 'Million' },
        { value: 1e3, suffix: 'K', emoji: '💸', name: 'Thousand' }
      ];
      
      // Special formatting for huge numbers
      if (amount >= 1e15) {
        const log10 = Math.floor(Math.log10(amount));
        const base = amount / Math.pow(10, log10);
        const scale = scales.find(s => amount >= s.value) || scales[0];
        
        if (log10 >= 33) {
          return `${scale.emoji} ${base.toFixed(2)} × 10^${log10}`;
        } else {
          const scaledValue = amount / scale.value;
          if (scaledValue >= 1000) {
            const scaledLog = Math.floor(Math.log10(scaledValue));
            const scaledBase = (scaledValue / Math.pow(10, scaledLog)).toFixed(2);
            return `${scale.emoji} ${scaledBase} × 10^${scaledLog} ${scale.suffix}`;
          }
          return `${scale.emoji} ${scaledValue.toFixed(2)}${scale.suffix}`;
        }
      }
      
      // Standard formatting for smaller numbers
      for (const scale of scales) {
        if (amount >= scale.value) {
          const scaledValue = amount / scale.value;
          return `${scale.emoji} ${scaledValue.toFixed(2)}${scale.suffix}`;
        }
      }
      
      return `💲${amount.toLocaleString()}`;
    };
    
    // ==================== CHECK IF USER HAS INFINITY ====================
    const hasInfinityBalance = (userData) => {
      return userData && (
        userData.isAdmin === true || 
        userData.isInfinity === true ||
        (userData.money && Number(userData.money) >= INFINITY_VALUE * 0.9)
      );
    };
    
    // ==================== CREATE PREMIUM DISPLAY ====================
    const createPremiumDisplay = (title, content, type = "balance", isInfinity = false) => {
      let header = "";
      let footer = "";
      
      if (isInfinity) {
        header = `╔════❰ ${INFINITY_SYMBOL} 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 ❱════╗\n`;
        footer = `╚═══════════════════╝`;
      } else {
        switch(type) {
          case "balance":
            header = `╔════❰ 💰 𝐁𝐀𝐋𝐀𝐍𝐂𝐄 ❱════╗\n`;
            break;
          case "transfer":
            header = `╔════❰ 🔄 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑 ❱════╗\n`;
            break;
          case "bonus":
            header = `╔════❰ 🎁 𝐁𝐎𝐍𝐔𝐒 ❱════╗\n`;
            break;
          case "leaderboard":
            header = `╔═══❰ 🏆 𝐋𝐄𝐀𝐃𝐄𝐑𝐁𝐎𝐀𝐑𝐃 ❱═══╗\n`;
            break;
          case "stats":
            header = `╔════❰ 📊 𝐒𝐓𝐀𝐓𝐒 ❱════╗\n`;
            break;
          case "admin":
            header = `╔════❰ 👑 𝐀𝐃𝐌𝐈𝐍 ❱════╗\n`;
            break;
          default:
            header = `╔════❰ ✨ 𝐒𝐘𝐒𝐓𝐄𝐌 ❱════╗\n`;
        }
        footer = `╚═══════════════════╝`;
      }
      
      return header + content + footer;
    };
    
    // ==================== GET USER NAME ====================
    const getUserName = async (userID) => {
      try {
        const userInfo = await api.getUserInfo(userID);
        return userInfo[userID]?.name || `User ${userID}`;
      } catch (e) {
        return `User ${userID}`;
      }
    };
    
    // ==================== ADMIN GIVE COMMAND ====================
    if (args[0]?.toLowerCase() === "give" && isAdmin) {
      const targetID = Object.keys(mentions)[0] || messageReply?.senderID;
      const amountArg = args[args.length - 1];
      
      if (!targetID || !amountArg) {
        return message.reply(
          createPremiumDisplay("ADMIN ERROR", 
            `❌ Invalid Usage!\n\n💡 Use: *balance give @user amount\n✨ Example: *balance give @user 1000000000\n${INFINITY_SYMBOL} For infinity: *balance give @user infinity`,
            "admin"
          )
        );
      }
      
      const targetData = await usersData.get(targetID);
      let amount = 0;
      let isInfinityGive = false;
      
      if (amountArg.toLowerCase() === "infinity") {
        amount = ADMIN_INFINITY_BALANCE;
        isInfinityGive = true;
      } else {
        amount = parseFloat(amountArg);
        if (isNaN(amount) || amount <= 0) {
          return message.reply(createPremiumDisplay("ADMIN ERROR", "❌ Invalid amount!", "admin"));
        }
      }
      
      await usersData.set(targetID, {
        ...targetData,
        money: isInfinityGive ? ADMIN_INFINITY_BALANCE : amount,
        isAdmin: isInfinityGive ? true : targetData.isAdmin,
        isInfinity: isInfinityGive ? true : targetData.isInfinity,
        lastGiven: Date.now(),
        givenBy: senderID
      });
      
      const targetName = await getUserName(targetID);
      const amountDisplay = isInfinityGive ? `${INFINITY_SYMBOL} INFINITY` : formatMoney(amount);
      
      const giveContent = 
        `✅ 𝐀𝐃𝐌𝐈𝐍 𝐆𝐈𝐕𝐄 𝐒𝐔𝐂𝐂𝐄𝐒𝐒!\n\n` +
        `👤 𝐓𝐨: ${targetName}\n` +
        `💰 𝐀𝐦𝐨𝐮𝐧𝐭: ${amountDisplay}\n` +
        `📅 𝐓𝐢𝐦𝐞: ${getBangladeshTime()}\n\n` +
        `${isInfinityGive ? `♾️ 𝐍𝐨𝐰 𝐡𝐚𝐬 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 𝐛𝐚𝐥𝐚𝐧𝐜𝐞!` : ``}`;
      
      return message.reply(createPremiumDisplay("ADMIN GIVE", giveContent, "admin", isInfinityGive));
    }
    
    // ==================== HELP COMMAND ====================
    if (args[0]?.toLowerCase() === "help") {
      const helpContent = 
        `🎯 𝐀𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:\n\n` +
        `💰 *balance - Your balance\n` +
        `👤 *balance @user - Check others\n` +
        `🔄 *balance send @user amount - Send money\n` +
        `🎁 *balance daily - Daily bonus\n` +
        `📅 *balance weekly - Weekly bonus\n` +
        `🏆 *balance top - Leaderboard\n` +
        `📊 *balance stats - Your statistics\n` +
        `${isAdmin ? `👑 *balance give @user amount - Give money (Admin)\n` : ``}` +
        `❓ *balance help - This help menu\n\n` +
        `✨ 𝐌𝐨𝐧𝐞𝐲 𝐒𝐜𝐚𝐥𝐞𝐬:\n` +
        `🌠 Dc - Decillion (10³³)\n` +
        `🌟 No - Nonillion (10³⁰)\n` +
        `⭐ Oc - Octillion (10²⁷)\n` +
        `✨ Sp - Septillion (10²⁴)\n` +
        `💫 Sx - Sextillion (10²¹)\n` +
        `🌌 Qi - Quintillion (10¹⁸)\n` +
        `🔮 Qa - Quadrillion (10¹⁵)\n` +
        `💎 T - Trillion (10¹²)\n` +
        `💰 B - Billion (10⁹)\n` +
        `💵 M - Million (10⁶)\n` +
        `💸 K - Thousand (10³)\n` +
        `♾️ INFINITY - Unlimited\n\n` +
        `${getBangladeshTime()}\n` +
        `👑 𝐁𝐨𝐭: 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢`;
      
      return message.reply(createPremiumDisplay("HELP GUIDE", helpContent, "stats"));
    }
    
    // ==================== DAILY BONUS ====================
    if (args[0]?.toLowerCase() === "daily") {
      const userData = await usersData.get(senderID);
      
      // Admin always gets infinity, no daily needed
      if (hasInfinityBalance(userData)) {
        return message.reply(
          createPremiumDisplay("DAILY BONUS", 
            `${INFINITY_SYMBOL} 𝐘𝐨𝐮 𝐚𝐥𝐫𝐞𝐚𝐝𝐲 𝐡𝐚𝐯𝐞 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 𝐛𝐚𝐥𝐚𝐧𝐜𝐞!\n\n✨ No need for daily bonuses when you have everything!\n${getBangladeshTime()}`,
            "bonus", true
          )
        );
      }
      
      const now = Date.now();
      const lastDaily = userData.lastDaily || 0;
      const oneDay = 24 * 60 * 60 * 1000;
      
      if (now - lastDaily < oneDay) {
        const nextBonus = Math.ceil((oneDay - (now - lastDaily)) / (60 * 60 * 1000));
        return message.reply(
          createPremiumDisplay("DAILY BONUS", 
            `⏰ Come back in ${nextBonus} hours for your next daily bonus!\n${getBangladeshTime()}`,
            "bonus"
          )
        );
      }
      
      // Bigger bonuses for balance system
      const baseBonus = 10000000 + Math.floor(Math.random() * 15000000); // 10M-25M
      const streak = (userData.dailyStreak || 0) + 1;
      const streakBonus = Math.floor(baseBonus * (streak * 0.15)); // 15% per streak
      const totalBonus = baseBonus + streakBonus;
      
      await usersData.set(senderID, {
        ...userData,
        money: (userData.money || 0) + totalBonus,
        lastDaily: now,
        dailyStreak: streak,
        totalBonuses: (userData.totalBonuses || 0) + totalBonus
      });
      
      const bonusContent = 
        `🎉 𝐃𝐀𝐈𝐋𝐘 𝐁𝐎𝐍𝐔𝐒 𝐂𝐋𝐀𝐈𝐌𝐄𝐃!\n\n` +
        `💰 𝐁𝐚𝐬𝐞 𝐁𝐨𝐧𝐮𝐬: ${formatMoney(baseBonus)}\n` +
        `🔥 𝐒𝐭𝐫𝐞𝐚𝐤 𝐁𝐨𝐧𝐮𝐬: ${formatMoney(streakBonus)}\n` +
        `✨ 𝐓𝐨𝐭𝐚𝐥: ${formatMoney(totalBonus)}\n` +
        `📈 𝐒𝐭𝐫𝐞𝐚𝐤: ${streak} days\n\n` +
        `💡 Come back tomorrow for more!\n${getBangladeshTime()}`;
      
      return message.reply(createPremiumDisplay("DAILY BONUS", bonusContent, "bonus"));
    }
    
    // ==================== WEEKLY BONUS ====================
    if (args[0]?.toLowerCase() === "weekly") {
      const userData = await usersData.get(senderID);
      
      if (hasInfinityBalance(userData)) {
        return message.reply(
          createPremiumDisplay("WEEKLY BONUS", 
            `${INFINITY_SYMBOL} 𝐘𝐨𝐮 𝐚𝐥𝐫𝐞𝐚𝐝𝐲 𝐡𝐚𝐯𝐞 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 𝐛𝐚𝐥𝐚𝐧𝐜𝐞!\n\n💰 No need for weekly bonuses!\n${getBangladeshTime()}`,
            "bonus", true
          )
        );
      }
      
      const now = Date.now();
      const lastWeekly = userData.lastWeekly || 0;
      const oneWeek = 7 * 24 * 60 * 60 * 1000;
      
      if (now - lastWeekly < oneWeek) {
        const nextBonus = Math.ceil((oneWeek - (now - lastWeekly)) / (24 * 60 * 60 * 1000));
        return message.reply(
          createPremiumDisplay("WEEKLY BONUS", 
            `📅 Come back in ${nextBonus} days for your next weekly bonus!\n${getBangladeshTime()}`,
            "bonus"
          )
        );
      }
      
      const bonusAmount = 100000000 + Math.floor(Math.random() * 200000000); // 100M-300M
      
      await usersData.set(senderID, {
        ...userData,
        money: (userData.money || 0) + bonusAmount,
        lastWeekly: now,
        totalBonuses: (userData.totalBonuses || 0) + bonusAmount
      });
      
      const bonusContent = 
        `🎊 𝐖𝐄𝐄𝐊𝐋𝐘 𝐁𝐎𝐍𝐔𝐒 𝐂𝐋𝐀𝐈𝐌𝐄𝐃!\n\n` +
        `💰 𝐁𝐨𝐧𝐮𝐬: ${formatMoney(bonusAmount)}\n\n` +
        `💡 Come back next week for another bonus!\n${getBangladeshTime()}`;
      
      return message.reply(createPremiumDisplay("WEEKLY BONUS", bonusContent, "bonus"));
    }
    
    // ==================== LEADERBOARD - FIXED ====================
    if (args[0]?.toLowerCase() === "top") {
      try {
        const allUsers = await usersData.getAll();
        
        // ✅ FIX: Infinity Users গোনার জন্য প্রথমে চেক করুন
        const infinityUsers = allUsers.filter(user => {
          const userData = user.data;
          return userData && (
            userData.isAdmin === true || 
            userData.isInfinity === true ||
            (userData.money && Number(userData.money) >= INFINITY_VALUE * 0.9)
          );
        });
        
        // ✅ সব ইউজারকে ব্যালেন্স অনুযায়ী সাজানো (Infinity ইউজাররা প্রথমে)
        const richList = allUsers
          .filter(user => user.data) // যাদের ডাটা আছে
          .map(user => ({
            id: user.userID,
            balance: Number(user.data.money) || 0,
            isInfinity: hasInfinityBalance(user.data),
            name: "Loading..."
          }))
          .sort((a, b) => {
            // ১ম: Infinity ইউজার আগে
            if (a.isInfinity && !b.isInfinity) return -1;
            if (!a.isInfinity && b.isInfinity) return 1;
            if (a.isInfinity && b.isInfinity) return 0;
            
            // ২য়: বেশি টাকা আগে
            return b.balance - a.balance;
          })
          .slice(0, 10); // শুধু টপ ১০
        
        // ✅ নামগুলো লোড করুন
        for (let i = 0; i < Math.min(5, richList.length); i++) {
          if (richList[i]) {
            richList[i].name = await getUserName(richList[i].id);
          }
        }
        
        let leaderboardContent = `🏆 𝐓𝐎𝐏 ${Math.min(10, richList.length)} 𝐑𝐈𝐂𝐇𝐄𝐒𝐓\n\n`;
        
        richList.forEach((user, index) => {
          if (!user) return;
          
          let medal = "";
          if (index === 0) medal = "🥇";
          else if (index === 1) medal = "🥈";
          else if (index === 2) medal = "🥉";
          else medal = `#${index + 1}`;
          
          const displayName = user.name && user.name.length > 15 ? 
            user.name.substring(0, 12) + "..." : 
            user.name || `User ${user.id}`;
          
          const balanceDisplay = user.isInfinity ? 
            `${INFINITY_SYMBOL} INFINITY` : 
            formatMoney(user.balance);
          
          leaderboardContent += `${medal} ${displayName}\n💰 ${balanceDisplay}\n━━━━━━━━━━━━━━━━━━\n`;
        });
        
        // ✅ সঠিকভাবে Infinity Users গণনা
        const infinityCount = infinityUsers.length;
        
        // ✅ টোটাল ওয়েলথ (শুধু Non-Infinity ইউজারদের)
        const normalUsers = allUsers.filter(user => {
          const userData = user.data;
          return userData && !(
            userData.isAdmin === true || 
            userData.isInfinity === true ||
            (userData.money && Number(userData.money) >= INFINITY_VALUE * 0.9)
          );
        });
        
        const totalWealth = normalUsers.reduce((sum, user) => {
          return sum + (Number(user.data?.money) || 0);
        }, 0);
        
        leaderboardContent += `\n📊 𝐒𝐭𝐚𝐭𝐬:\n`;
        leaderboardContent += `♾️ Infinity Users: ${infinityCount}\n`;
        leaderboardContent += `💰 Total Wealth: ${formatMoney(totalWealth)}\n`;
        leaderboardContent += `🕒 ${getBangladeshTime()}`;
        
        return message.reply(createPremiumDisplay("LEADERBOARD", leaderboardContent, "leaderboard"));
        
      } catch (error) {
        console.error("Leaderboard error:", error);
        return message.reply(
          createPremiumDisplay("ERROR", 
            `❌ Error loading leaderboard\n${getBangladeshTime()}`,
            "balance"
          )
        );
      }
    }
    
    // ==================== STATS COMMAND ====================
    if (args[0]?.toLowerCase() === "stats") {
      const userData = await usersData.get(senderID);
      const userName = await getUserName(senderID);
      const hasInfinity = hasInfinityBalance(userData);
      
      const statsContent = 
        `👤 𝐔𝐬𝐞𝐫: ${userName}\n` +
        `${hasInfinity ? `${INFINITY_SYMBOL} 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 𝐔𝐒𝐄𝐑\n` : ''}\n` +
        `💰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(userData.money || 0, hasInfinity)}\n` +
        `⭐ 𝐑𝐚𝐧𝐤: ${this.getRank(Number(userData.money || 0), hasInfinity)}\n` +
        `📈 𝐃𝐚𝐢𝐥𝐲 𝐒𝐭𝐫𝐞𝐚𝐤: ${userData.dailyStreak || 0} days\n` +
        `🎁 𝐓𝐨𝐭𝐚𝐥 𝐁𝐨𝐧𝐮𝐬𝐞𝐬: ${formatMoney(userData.totalBonuses || 0)}\n` +
        `🔄 𝐓𝐨𝐭𝐚𝐥 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫𝐬: ${userData.totalTransfers || 0}\n` +
        `📅 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐀𝐠𝐞: ${userData.createdAt ? Math.floor((Date.now() - userData.createdAt) / (24 * 60 * 60 * 1000)) : "?"} days\n\n` +
        `${!hasInfinity ? `💎 𝐍𝐞𝐱𝐭 𝐑𝐚𝐧𝐤: ${formatMoney(this.getNextRankAmount(Number(userData.money || 0)))} needed` : `${INFINITY_SYMBOL} 𝐘𝐨𝐮 𝐡𝐚𝐯𝐞 𝐚𝐜𝐡𝐢𝐞𝐯𝐞𝐝 𝐦𝐚𝐱𝐢𝐦𝐮𝐦!`}\n${getBangladeshTime()}`;
      
      return message.reply(createPremiumDisplay("STATISTICS", statsContent, "stats", hasInfinity));
    }
    
    // ==================== SEND/TRANSFER COMMAND ====================
    if (args[0]?.toLowerCase() === "send") {
      const targetID = Object.keys(mentions)[0] || messageReply?.senderID;
      const amountArg = args[args.length - 1];
      
      if (!targetID || !amountArg) {
        return message.reply(
          createPremiumDisplay("TRANSFER ERROR", 
            `❌ Invalid Usage!\n\n💡 Use: *balance send @user amount\n✨ Example: *balance send @friend 1000000\n${INFINITY_SYMBOL} To send infinity: *balance send @user infinity\n${getBangladeshTime()}`,
            "transfer"
          )
        );
      }
      
      if (senderID === targetID) {
        return message.reply(
          createPremiumDisplay("TRANSFER ERROR", 
            `❌ You can't send money to yourself!\n${getBangladeshTime()}`,
            "transfer"
          )
        );
      }
      
      const [senderData, receiverData] = await Promise.all([
        usersData.get(senderID),
        usersData.get(targetID)
      ]);
      
      const senderHasInfinity = hasInfinityBalance(senderData);
      let amount = 0;
      let isInfinityTransfer = false;
      
      if (amountArg.toLowerCase() === "infinity") {
        if (!senderHasInfinity) {
          return message.reply(createPremiumDisplay("TRANSFER ERROR", 
            `❌ You don't have INFINITY balance!\n\n💡 Only infinity users can send infinity.\n${getBangladeshTime()}`,
            "transfer"
          ));
        }
        amount = ADMIN_INFINITY_BALANCE;
        isInfinityTransfer = true;
      } else {
        amount = parseFloat(amountArg);
        if (isNaN(amount) || amount <= 0) {
          return message.reply(
            createPremiumDisplay("TRANSFER ERROR", 
              `❌ Amount must be positive!\n${getBangladeshTime()}`,
              "transfer"
            )
          );
        }
        
        if (!senderHasInfinity && (!senderData.money || senderData.money < amount)) {
          const needed = amount - (senderData.money || 0);
          return message.reply(
            createPremiumDisplay("TRANSFER ERROR", 
              `❌ Insufficient Balance!\n\n💳 Your Balance: ${formatMoney(senderData.money || 0)}\n💰 Needed: ${formatMoney(needed)} more\n${getBangladeshTime()}`,
              "transfer"
            )
          );
        }
      }
      
      // Calculate tax (1% for normal transfers, 0% for infinity)
      const tax = !isInfinityTransfer && amount > 1000000 ? Math.floor(amount * 0.01) : 0;
      const netAmount = amount - tax;
      
      // Update sender (only if not infinity user sending normal amount)
      if (!senderHasInfinity || (senderHasInfinity && !isInfinityTransfer)) {
        await usersData.set(senderID, {
          ...senderData,
          money: senderHasInfinity ? senderData.money : (senderData.money || 0) - amount,
          totalTransfers: (senderData.totalTransfers || 0) + 1,
          totalSent: (senderData.totalSent || 0) + amount
        });
      }
      
      // Update receiver
      await usersData.set(targetID, {
        ...receiverData,
        money: isInfinityTransfer ? ADMIN_INFINITY_BALANCE : (receiverData.money || 0) + netAmount,
        isAdmin: isInfinityTransfer ? true : receiverData.isAdmin,
        isInfinity: isInfinityTransfer ? true : receiverData.isInfinity,
        totalReceived: (receiverData.totalReceived || 0) + netAmount
      });
      
      const receiverName = await getUserName(targetID);
      const amountDisplay = isInfinityTransfer ? `${INFINITY_SYMBOL} INFINITY` : formatMoney(amount);
      const taxDisplay = tax > 0 ? formatMoney(tax) : "💖 No Tax";
      
      const transferContent = 
        `✅ 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋!\n\n` +
        `👤 𝐓𝐨: ${receiverName}\n` +
        `💰 𝐀𝐦𝐨𝐮𝐧𝐭: ${amountDisplay}\n` +
        `🏛️ 𝐓𝐚𝐱: ${taxDisplay}\n` +
        `🎯 𝐍𝐞𝐭 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝: ${isInfinityTransfer ? `${INFINITY_SYMBOL} INFINITY` : formatMoney(netAmount)}\n` +
        `💳 𝐘𝐨𝐮𝐫 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(senderHasInfinity ? senderData.money : ((senderData.money || 0) - amount), senderHasInfinity)}\n\n` +
        `${getBangladeshTime()}`;
      
      // Notify receiver
      try {
        await api.sendMessage(
          `💰 𝐌𝐎𝐍𝐄𝐘 𝐑𝐄𝐂𝐄𝐈𝐕𝐄𝐃!\n\n👤 From: ${await getUserName(senderID)}\n💰 Amount: ${isInfinityTransfer ? `${INFINITY_SYMBOL} INFINITY` : formatMoney(netAmount)}\n${isInfinityTransfer ? `♾️ 𝐍𝐨𝐰 𝐲𝐨𝐮 𝐡𝐚𝐯𝐞 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘!` : `💳 New Balance: ${formatMoney((receiverData.money || 0) + netAmount)}`}\n${getBangladeshTime()}`,
          targetID
        );
      } catch (e) {
        console.error("Could not notify receiver:", e);
      }
      
      return message.reply(createPremiumDisplay("TRANSFER", transferContent, "transfer", isInfinityTransfer));
    }
    
    // ==================== CHECK OTHERS BALANCE ====================
    if (messageReply?.senderID && !args[0]) {
      const targetID = messageReply.senderID;
      const userName = await getUserName(targetID);
      const userData = await usersData.get(targetID);
      const hasInfinity = hasInfinityBalance(userData);
      
      const balanceContent = 
        `👤 𝐔𝐬𝐞𝐫: ${userName}\n` +
        `${hasInfinity ? `${INFINITY_SYMBOL} 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 𝐔𝐒𝐄𝐑\n` : ''}\n` +
        `💰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(userData.money || 0, hasInfinity)}\n` +
        `⭐ 𝐑𝐚𝐧𝐤: ${this.getRank(Number(userData.money || 0), hasInfinity)}\n` +
        `📅 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐀𝐠𝐞: ${userData.createdAt ? Math.floor((Date.now() - userData.createdAt) / (24 * 60 * 60 * 1000)) : "?"} days\n\n` +
        `💡 Use *balance stats for more details\n${getBangladeshTime()}`;
      
      return message.reply(createPremiumDisplay("BALANCE CHECK", balanceContent, "balance", hasInfinity));
    }
    
    // ==================== CHECK MULTIPLE USERS ====================
    if (Object.keys(mentions).length > 0) {
      const balances = await Promise.all(
        Object.entries(mentions).map(async ([uid, name]) => {
          const userData = await usersData.get(uid);
          const hasInfinity = hasInfinityBalance(userData);
          return `${name.replace('@', '')}: ${formatMoney(userData.money || 0, hasInfinity)}`;
        })
      );
      
      const multiContent = 
        `👥 𝐌𝐔𝐋𝐓𝐈𝐏𝐋𝐄 𝐁𝐀𝐋𝐀𝐍𝐂𝐄𝐒\n\n` +
        balances.join('\n') + '\n\n' +
        `💡 Total Users: ${balances.length}\n${getBangladeshTime()}`;
      
      return message.reply(createPremiumDisplay("BALANCES", multiContent, "balance"));
    }
    
    // ==================== DEFAULT: CHECK OWN BALANCE ====================
    const userData = await usersData.get(senderID);
    const userName = await getUserName(senderID);
    const hasInfinity = hasInfinityBalance(userData);
    
    // Ensure admin always has infinity
    if (isAdmin && !hasInfinity) {
      await usersData.set(senderID, {
        ...userData,
        money: ADMIN_INFINITY_BALANCE,
        isAdmin: true,
        isInfinity: true
      });
      
      // Refresh userData after update
      const updatedData = await usersData.get(senderID);
      const ownBalanceContent = 
        `👤 𝐖𝐞𝐥𝐜𝐨𝐦𝐞, ${userName}!\n` +
        `${INFINITY_SYMBOL} 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 𝐔𝐒𝐄𝐑\n\n` +
        `💰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(updatedData.money || 0, true)}\n` +
        `⭐ 𝐑𝐚𝐧𝐤: ${this.getRank(Number(updatedData.money || 0), true)}\n` +
        `📈 𝐃𝐚𝐢𝐥𝐲 𝐒𝐭𝐫𝐞𝐚𝐤: ${updatedData.dailyStreak || 0} days\n\n` +
        `${INFINITY_SYMBOL} You have achieved maximum wealth!\n${getBangladeshTime()}`;
      
      return message.reply(createPremiumDisplay("YOUR BALANCE", ownBalanceContent, "balance", true));
    }
    
    const ownBalanceContent = 
      `👤 𝐖𝐞𝐥𝐜𝐨𝐦𝐞, ${userName}!\n` +
      `${hasInfinity ? `${INFINITY_SYMBOL} 𝐈𝐍𝐅𝐈𝐍𝐈𝐓𝐘 𝐔𝐒𝐄𝐑\n` : ''}\n` +
      `💰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(userData.money || 0, hasInfinity)}\n` +
      `⭐ 𝐑𝐚𝐧𝐤: ${this.getRank(Number(userData.money || 0), hasInfinity)}\n` +
      `📈 𝐃𝐚𝐢𝐥𝐲 𝐒𝐭𝐫𝐞𝐚𝐤: ${userData.dailyStreak || 0} days\n\n` +
      `${!hasInfinity ? `💎 Next rank at: ${formatMoney(this.getNextRankAmount(Number(userData.money || 0)))}\n🎁 Daily bonus: *balance daily\n` : `${INFINITY_SYMBOL} You have achieved maximum wealth!\n`}` +
      `${getBangladeshTime()}`;
    
    return message.reply(createPremiumDisplay("YOUR BALANCE", ownBalanceContent, "balance", hasInfinity));
  },

  // ==================== HELPER FUNCTIONS ====================
  
  // Get user rank based on balance
  getRank: function (balance, hasInfinity = false) {
    if (hasInfinity) return `${INFINITY_SYMBOL} INFINITE EMPEROR`;
    
    const ranks = [
      { min: 1e33, rank: "🌌 Cosmic Emperor", emoji: "👑" },
      { min: 1e30, rank: "🌟 Galactic Overlord", emoji: "💫" },
      { min: 1e27, rank: "⭐ Universal King", emoji: "👑" },
      { min: 1e24, rank: "✨ Multiverse Lord", emoji: "💎" },
      { min: 1e21, rank: "💫 Galaxy Ruler", emoji: "💰" },
      { min: 1e18, rank: "🌌 Universal Emperor", emoji: "👑" },
      { min: 1e15, rank: "✨ Galactic Billionaire", emoji: "💎" },
      { min: 1e12, rank: "💎 Trillionaire", emoji: "💰" },
      { min: 1e9, rank: "💰 Billionaire", emoji: "💵" },
      { min: 1e6, rank: "💵 Millionaire", emoji: "💸" },
      { min: 1e5, rank: "💸 Wealthy", emoji: "🪙" },
      { min: 1e4, rank: "🪙 Affluent", emoji: "💳" },
      { min: 1e3, rank: "💳 Stable", emoji: "💲" },
      { min: 100, rank: "💲 Beginner", emoji: "👶" },
      { min: 0, rank: "🆕 Newcomer", emoji: "🎯" }
    ];
    
    for (const rank of ranks) {
      if (balance >= rank.min) {
        return `${rank.emoji} ${rank.rank}`;
      }
    }
    return "🎯 Newcomer";
  },
  
  // Get amount needed for next rank
  getNextRankAmount: function (currentBalance) {
    const thresholds = [100, 1e3, 1e4, 1e5, 1e6, 1e9, 1e12, 1e15, 1e18, 1e21, 1e24, 1e27, 1e30, 1e33];
    
    for (const threshold of thresholds) {
      if (currentBalance < threshold) {
        return threshold;
      }
    }
    return currentBalance * 2;
  }
};
