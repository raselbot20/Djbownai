const fs = require("fs-extra");
const path = require("path");

module.exports = {
    config: {
        name: "bank",
        aliases: ["ব্যাংক", "atm", "বাংলাদেশ ব্যাংক"],
        version: "3.0",
        author: "Rasel Mahmud",
        countDown: 3,
        role: 0,
        description: "🏦 বাংলাদেশ ব্যাংক - Advanced Banking System",
        category: "economy",
        guide: {
            en: `╔════❰ 🏦 𝐁𝐀𝐍𝐊 𝐒𝐘𝐒𝐓𝐄𝐌 ❱════╗
🎯 𝐂𝐨𝐦𝐦𝐚𝐧𝐝𝐬:
• *bank - Check balance
• *bank deposit amount - Deposit money
• *bank withdraw amount - Withdraw money
• *bank loan amount - Take loan
• *bank repay amount - Repay loan
• *bank transfer @user amount - Transfer to user
• *bank interest - Check interest rates
• *bank history - Transaction history
• *bank help - Help guide
╚═══════════════════╝`
        }
    },

    onStart: async function ({ message, event, args, usersData, api, prefix }) {
        const { senderID, messageReply, mentions, threadID } = event;
        
        // Bot Admin ID
        const BOT_ADMIN_ID = "61586335299049";
        const isAdmin = senderID === BOT_ADMIN_ID;
        
        // Bank Configuration
        const BANK_CONFIG = {
            name: "🏦 বাংলাদেশ ব্যাংক",
            interestRate: 0.05, // 5% daily interest
            loanInterest: 0.10, // 10% loan interest
            maxLoan: 1000000000, // 1B max loan
            minDeposit: 1000,
            transactionFee: 0.01, // 1% transaction fee
            insurance: 0.001 // 0.1% insurance on deposits
        };
        
        // ==================== MONEY FORMATTING ====================
        const formatMoney = (amount, showFull = false) => {
            if (typeof amount !== 'number') amount = Number(amount);
            if (isNaN(amount)) return "৳0";
            
            if (amount >= 1e12) return `💎 ${(amount/1e12).toFixed(2)}T`;
            if (amount >= 1e9) return `💰 ${(amount/1e9).toFixed(2)}B`;
            if (amount >= 1e6) return `💵 ${(amount/1e6).toFixed(2)}M`;
            if (amount >= 1e3) return `💸 ${(amount/1e3).toFixed(0)}K`;
            
            if (showFull && amount < 1000) {
                return `৳${amount.toLocaleString('en-BD')}`;
            }
            return `৳${amount.toLocaleString()}`;
        };
        
        // ==================== CREATE BANK DISPLAY ====================
        const createBankDisplay = (title, content, type = "main") => {
            let header = "";
            let footer = `╚═══════════════════╝`;
            
            switch(type) {
                case "main":
                    header = `╔════❰ 🏦 𝐁𝐀𝐍𝐆𝐋𝐀𝐃𝐄𝐒𝐇 𝐁𝐀𝐍𝐊 ❱════╗\n`;
                    break;
                case "deposit":
                    header = `╔════❰ 💰 𝐃𝐄𝐏𝐎𝐒𝐈𝐓 ❱════╗\n`;
                    break;
                case "withdraw":
                    header = `╔════❰ 💳 𝐖𝐈𝐓𝐇𝐃𝐑𝐀𝐖 ❱════╗\n`;
                    break;
                case "loan":
                    header = `╔════❰ 🏦 𝐋𝐎𝐀𝐍 ❱════╗\n`;
                    break;
                case "transfer":
                    header = `╔════❰ 🔄 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑 ❱════╗\n`;
                    break;
                case "interest":
                    header = `╔════❰ 📈 𝐈𝐍𝐓𝐄𝐑𝐄𝐒𝐓 ❱════╗\n`;
                    break;
                case "history":
                    header = `╔════❰ 📋 𝐇𝐈𝐒𝐓𝐎𝐑𝐘 ❱════╗\n`;
                    break;
                default:
                    header = `╔════❰ 🏦 𝐁𝐀𝐍𝐊 ❱════╗\n`;
            }
            
            return header + content + footer;
        };
        
        // ==================== GET USER DATA ====================
        const getUserData = async (userID) => {
            let userData = await usersData.get(userID);
            
            if (!userData || !userData.bank) {
                userData = {
                    ...userData,
                    money: userData?.money || 0,
                    bank: {
                        balance: 0,
                        loan: 0,
                        lastInterest: Date.now(),
                        totalDeposited: 0,
                        totalWithdrawn: 0,
                        totalInterest: 0,
                        transactions: [],
                        accountNumber: `BD${Date.now()}${Math.floor(Math.random() * 1000)}`,
                        joinedDate: Date.now()
                    }
                };
                await usersData.set(userID, userData);
            }
            
            return userData;
        };
        
        // ==================== CALCULATE INTEREST ====================
        const calculateInterest = async (userID) => {
            const userData = await getUserData(userID);
            const bankData = userData.bank;
            
            const now = Date.now();
            const lastInterest = bankData.lastInterest || now;
            const hoursPassed = (now - lastInterest) / (1000 * 60 * 60);
            
            if (hoursPassed >= 24) {
                const days = Math.floor(hoursPassed / 24);
                const interest = bankData.balance * BANK_CONFIG.interestRate * days;
                
                if (interest > 0) {
                    bankData.balance += interest;
                    bankData.totalInterest += interest;
                    bankData.lastInterest = now;
                    
                    // Add transaction record
                    bankData.transactions.unshift({
                        type: "interest",
                        amount: interest,
                        date: now,
                        note: `Daily interest for ${days} days`
                    });
                    
                    // Keep only last 50 transactions
                    if (bankData.transactions.length > 50) {
                        bankData.transactions = bankData.transactions.slice(0, 50);
                    }
                    
                    await usersData.set(userID, userData);
                    return { earned: interest, days: days };
                }
            }
            
            return { earned: 0, days: 0 };
        };
        
        // ==================== HELP COMMAND ====================
        if (!args[0] || args[0].toLowerCase() === "help") {
            const helpContent = 
                `🎯 𝐁𝐀𝐍𝐊𝐈𝐍𝐆 𝐂𝐎𝐌𝐌𝐀𝐍𝐃𝐒:\n\n` +
                `🏦 *bank - Check bank balance\n` +
                `💰 *bank deposit amount - Deposit money\n` +
                `💳 *bank withdraw amount - Withdraw money\n` +
                `🏦 *bank loan amount - Take loan\n` +
                `💵 *bank repay amount - Repay loan\n` +
                `🔄 *bank transfer @user amount - Bank transfer\n` +
                `📈 *bank interest - Interest rates & info\n` +
                `📋 *bank history - Transaction history\n` +
                `❓ *bank help - This help menu\n\n` +
                `✨ 𝐁𝐀𝐍𝐊 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒:\n` +
                `• 5% daily interest on deposits\n` +
                `• Bank loans with 10% interest\n` +
                `• Secure transactions\n` +
                `• Transaction history\n` +
                `• Insurance on deposits\n\n` +
                `🏦 ${BANK_CONFIG.name}`;
            
            return message.reply(createBankDisplay("HELP GUIDE", helpContent, "main"));
        }
        
        // ==================== INTEREST COMMAND ====================
        if (args[0].toLowerCase() === "interest") {
            const userData = await getUserData(senderID);
            const interestResult = await calculateInterest(senderID);
            
            const interestContent = 
                `📊 𝐈𝐍𝐓𝐄𝐑𝐄𝐒𝐓 𝐑𝐀𝐓𝐄𝐒:\n\n` +
                `💰 𝐃𝐞𝐩𝐨𝐬𝐢𝐭 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭: ${(BANK_CONFIG.interestRate * 100)}% daily\n` +
                `🏦 𝐋𝐨𝐚𝐧 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭: ${(BANK_CONFIG.loanInterest * 100)}%\n` +
                `🛡️ 𝐃𝐞𝐩𝐨𝐬𝐢𝐭 𝐈𝐧𝐬𝐮𝐫𝐚𝐧𝐜𝐞: ${(BANK_CONFIG.insurance * 100)}%\n\n` +
                `💎 𝐘𝐎𝐔𝐑 𝐈𝐍𝐓𝐄𝐑𝐄𝐒𝐓:\n` +
                `📈 𝐁𝐚𝐧𝐤 𝐁𝐚𝐥𝐚𝐧𝐜𝐞: ${formatMoney(userData.bank.balance)}\n` +
                `💰 𝐋𝐚𝐬𝐭 𝟐𝟒𝐡 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭: ${formatMoney(interestResult.earned)}\n` +
                `🏆 𝐓𝐨𝐭𝐚𝐥 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭: ${formatMoney(userData.bank.totalInterest)}\n\n` +
                `💡 Deposit more money to earn more interest!`;
            
            return message.reply(createBankDisplay("INTEREST INFO", interestContent, "interest"));
        }
        
        // ==================== HISTORY COMMAND ====================
        if (args[0].toLowerCase() === "history") {
            const userData = await getUserData(senderID);
            const transactions = userData.bank.transactions || [];
            
            let historyContent = `📋 𝐓𝐑𝐀𝐍𝐒𝐀𝐂𝐓𝐈𝐎𝐍 𝐇𝐈𝐒𝐓𝐎𝐑𝐘\n\n`;
            
            if (transactions.length === 0) {
                historyContent += `No transactions yet.\n💡 Start by depositing money!`;
            } else {
                const recentTxns = transactions.slice(0, 10);
                
                recentTxns.forEach((txn, index) => {
                    const date = new Date(txn.date).toLocaleDateString('en-BD');
                    const typeEmoji = 
                        txn.type === 'deposit' ? '💰' :
                        txn.type === 'withdraw' ? '💳' :
                        txn.type === 'loan' ? '🏦' :
                        txn.type === 'repay' ? '💵' :
                        txn.type === 'interest' ? '📈' :
                        txn.type === 'transfer' ? '🔄' : '📝';
                    
                    historyContent += `${index + 1}. ${typeEmoji} ${txn.type.toUpperCase()}\n`;
                    historyContent += `   ${formatMoney(txn.amount)} | ${date}\n`;
                    if (txn.note) historyContent += `   📝 ${txn.note}\n`;
                    historyContent += `   ─────────────────\n`;
                });
                
                historyContent += `\n📊 Total Transactions: ${transactions.length}`;
            }
            
            return message.reply(createBankDisplay("TRANSACTION HISTORY", historyContent, "history"));
        }
        
        // ==================== DEPOSIT COMMAND ====================
        if (args[0].toLowerCase() === "deposit") {
            const amountArg = args[1];
            
            if (!amountArg) {
                return message.reply(
                    createBankDisplay("DEPOSIT ERROR",
                        `❌ Invalid Usage!\n\n💡 Use: *bank deposit amount\n✨ Example: *bank deposit 100000\n💎 Minimum deposit: ${formatMoney(BANK_CONFIG.minDeposit)}`,
                        "deposit"
                    )
                );
            }
            
            let amount = 0;
            
            if (amountArg.toLowerCase() === "all") {
                const userData = await getUserData(senderID);
                amount = userData.money || 0;
            } else if (amountArg.toLowerCase() === "half") {
                const userData = await getUserData(senderID);
                amount = Math.floor((userData.money || 0) / 2);
            } else {
                amount = parseFloat(amountArg.replace(/,/g, ''));
            }
            
            if (isNaN(amount) || amount <= 0) {
                return message.reply(createBankDisplay("DEPOSIT ERROR", "❌ Invalid amount!", "deposit"));
            }
            
            if (amount < BANK_CONFIG.minDeposit) {
                return message.reply(
                    createBankDisplay("DEPOSIT ERROR",
                        `❌ Minimum deposit is ${formatMoney(BANK_CONFIG.minDeposit)}!\n💡 You tried: ${formatMoney(amount)}`,
                        "deposit"
                    )
                );
            }
            
            const userData = await getUserData(senderID);
            
            if (amount > (userData.money || 0)) {
                const needed = amount - (userData.money || 0);
                return message.reply(
                    createBankDisplay("DEPOSIT ERROR",
                        `❌ Insufficient cash!\n\n💵 Cash: ${formatMoney(userData.money || 0)}\n💰 Needed: ${formatMoney(needed)} more`,
                        "deposit"
                    )
                );
            }
            
            // Calculate insurance bonus
            const insuranceBonus = Math.floor(amount * BANK_CONFIG.insurance);
            const totalDeposit = amount + insuranceBonus;
            
            // Update user data
            userData.money = (userData.money || 0) - amount;
            userData.bank.balance += totalDeposit;
            userData.bank.totalDeposited += totalDeposit;
            
            // Add transaction record
            userData.bank.transactions.unshift({
                type: "deposit",
                amount: totalDeposit,
                date: Date.now(),
                note: `Deposit + Insurance: ${formatMoney(amount)} + ${formatMoney(insuranceBonus)}`
            });
            
            // Keep only last 50 transactions
            if (userData.bank.transactions.length > 50) {
                userData.bank.transactions = userData.bank.transactions.slice(0, 50);
            }
            
            await usersData.set(senderID, userData);
            
            const depositContent = 
                `✅ 𝐃𝐄𝐏𝐎𝐒𝐈𝐓 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋!\n\n` +
                `💰 𝐃𝐞𝐩𝐨𝐬𝐢𝐭: ${formatMoney(amount)}\n` +
                `🛡️ 𝐈𝐧𝐬𝐮𝐫𝐚𝐧𝐜𝐞 𝐁𝐨𝐧𝐮𝐬: +${formatMoney(insuranceBonus)}\n` +
                `💎 𝐓𝐨𝐭𝐚𝐥 𝐂𝐫𝐞𝐝𝐢𝐭𝐞𝐝: ${formatMoney(totalDeposit)}\n\n` +
                `📊 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞𝐬:\n` +
                `🏦 𝐁𝐚𝐧𝐤: ${formatMoney(userData.bank.balance)}\n` +
                `💵 𝐂𝐚𝐬𝐡: ${formatMoney(userData.money)}\n\n` +
                `📈 Start earning 5% daily interest!`;
            
            return message.reply(createBankDisplay("DEPOSIT", depositContent, "deposit"));
        }
        
        // ==================== WITHDRAW COMMAND ====================
        if (args[0].toLowerCase() === "withdraw") {
            const amountArg = args[1];
            
            if (!amountArg) {
                return message.reply(
                    createBankDisplay("WITHDRAW ERROR",
                        `❌ Invalid Usage!\n\n💡 Use: *bank withdraw amount\n✨ Example: *bank withdraw 50000`,
                        "withdraw"
                    )
                );
            }
            
            let amount = 0;
            
            if (amountArg.toLowerCase() === "all") {
                const userData = await getUserData(senderID);
                amount = userData.bank.balance || 0;
            } else if (amountArg.toLowerCase() === "half") {
                const userData = await getUserData(senderID);
                amount = Math.floor((userData.bank.balance || 0) / 2);
            } else {
                amount = parseFloat(amountArg.replace(/,/g, ''));
            }
            
            if (isNaN(amount) || amount <= 0) {
                return message.reply(createBankDisplay("WITHDRAW ERROR", "❌ Invalid amount!", "withdraw"));
            }
            
            const userData = await getUserData(senderID);
            
            // Calculate transaction fee
            const fee = Math.floor(amount * BANK_CONFIG.transactionFee);
            const netWithdrawal = amount - fee;
            
            if (amount > userData.bank.balance) {
                const available = userData.bank.balance;
                return message.reply(
                    createBankDisplay("WITHDRAW ERROR",
                        `❌ Insufficient bank balance!\n\n🏦 Bank Balance: ${formatMoney(available)}\n💰 Requested: ${formatMoney(amount)}`,
                        "withdraw"
                    )
                );
            }
            
            // Update user data
            userData.bank.balance -= amount;
            userData.money = (userData.money || 0) + netWithdrawal;
            userData.bank.totalWithdrawn += amount;
            
            // Add transaction record
            userData.bank.transactions.unshift({
                type: "withdraw",
                amount: amount,
                date: Date.now(),
                note: `Withdrawal - Fee: ${formatMoney(amount)} - ${formatMoney(fee)}`
            });
            
            // Keep only last 50 transactions
            if (userData.bank.transactions.length > 50) {
                userData.bank.transactions = userData.bank.transactions.slice(0, 50);
            }
            
            await usersData.set(senderID, userData);
            
            const withdrawContent = 
                `✅ 𝐖𝐈𝐓𝐇𝐃𝐑𝐀𝐖 𝐒𝐔𝐂𝐂𝐄𝐒𝐒𝐅𝐔𝐋!\n\n` +
                `💳 𝐖𝐢𝐭𝐡𝐝𝐫𝐚𝐰: ${formatMoney(amount)}\n` +
                `🏛️ 𝐓𝐫𝐚𝐧𝐬𝐚𝐜𝐭𝐢𝐨𝐧 𝐅𝐞𝐞: -${formatMoney(fee)}\n` +
                `💎 𝐍𝐞𝐭 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝: ${formatMoney(netWithdrawal)}\n\n` +
                `📊 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞𝐬:\n` +
                `🏦 𝐁𝐚𝐧𝐤: ${formatMoney(userData.bank.balance)}\n` +
                `💵 𝐂𝐚𝐬𝐡: ${formatMoney(userData.money)}`;
            
            return message.reply(createBankDisplay("WITHDRAW", withdrawContent, "withdraw"));
        }
        
        // ==================== LOAN COMMAND ====================
        if (args[0].toLowerCase() === "loan") {
            const amountArg = args[1];
            
            if (!amountArg) {
                return message.reply(
                    createBankDisplay("LOAN ERROR",
                        `❌ Invalid Usage!\n\n💡 Use: *bank loan amount\n✨ Example: *bank loan 100000\n💰 Max Loan: ${formatMoney(BANK_CONFIG.maxLoan)}\n📈 Interest: ${BANK_CONFIG.loanInterest * 100}%`,
                        "loan"
                    )
                );
            }
            
            const amount = parseFloat(amountArg.replace(/,/g, ''));
            
            if (isNaN(amount) || amount <= 0) {
                return message.reply(createBankDisplay("LOAN ERROR", "❌ Invalid amount!", "loan"));
            }
            
            if (amount > BANK_CONFIG.maxLoan) {
                return message.reply(
                    createBankDisplay("LOAN ERROR",
                        `❌ Loan limit exceeded!\n\n💰 Max Loan: ${formatMoney(BANK_CONFIG.maxLoan)}\n💸 Requested: ${formatMoney(amount)}`,
                        "loan"
                    )
                );
            }
            
            const userData = await getUserData(senderID);
            
            // Check existing loan
            if (userData.bank.loan > 0) {
                return message.reply(
                    createBankDisplay("LOAN ERROR",
                        `❌ You already have a loan!\n\n🏦 Current Loan: ${formatMoney(userData.bank.loan)}\n💵 Please repay before taking new loan.`,
                        "loan"
                    )
                );
            }
            
            // Calculate total loan with interest
            const totalLoan = amount + Math.floor(amount * BANK_CONFIG.loanInterest);
            
            // Update user data
            userData.money = (userData.money || 0) + amount;
            userData.bank.loan = totalLoan;
            
            // Add transaction record
            userData.bank.transactions.unshift({
                type: "loan",
                amount: amount,
                date: Date.now(),
                note: `Loan taken. Total due: ${formatMoney(totalLoan)} (Interest: ${formatMoney(totalLoan - amount)})`
            });
            
            await usersData.set(senderID, userData);
            
            const loanContent = 
                `✅ 𝐋𝐎𝐀𝐍 𝐀𝐏𝐏𝐑𝐎𝐕𝐄𝐃!\n\n` +
                `💰 𝐋𝐨𝐚𝐧 𝐀𝐦𝐨𝐮𝐧𝐭: ${formatMoney(amount)}\n` +
                `📈 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭: ${formatMoney(totalLoan - amount)}\n` +
                `🏦 𝐓𝐨𝐭𝐚𝐥 𝐃𝐮𝐞: ${formatMoney(totalLoan)}\n\n` +
                `💵 𝐍𝐞𝐰 𝐂𝐚𝐬𝐡: ${formatMoney(userData.money)}\n` +
                `📅 𝐑𝐞𝐩𝐚𝐲 𝐛𝐲: ${new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-BD')}\n\n` +
                `⚠️ Repay using: *bank repay amount`;
            
            return message.reply(createBankDisplay("LOAN APPROVED", loanContent, "loan"));
        }
        
        // ==================== REPAY COMMAND ====================
        if (args[0].toLowerCase() === "repay") {
            const amountArg = args[1];
            
            if (!amountArg) {
                return message.reply(
                    createBankDisplay("REPAY ERROR",
                        `❌ Invalid Usage!\n\n💡 Use: *bank repay amount\n✨ Example: *bank repay 50000\n💎 Or: *bank repay all`,
                        "loan"
                    )
                );
            }
            
            const userData = await getUserData(senderID);
            
            if (userData.bank.loan <= 0) {
                return message.reply(
                    createBankDisplay("REPAY ERROR",
                        `❌ No active loan found!\n\n💡 You don't have any loan to repay.`,
                        "loan"
                    )
                );
            }
            
            let amount = 0;
            
            if (amountArg.toLowerCase() === "all") {
                amount = Math.min(userData.bank.loan, userData.money || 0);
            } else {
                amount = parseFloat(amountArg.replace(/,/g, ''));
            }
            
            if (isNaN(amount) || amount <= 0) {
                return message.reply(createBankDisplay("REPAY ERROR", "❌ Invalid amount!", "loan"));
            }
            
            if (amount > (userData.money || 0)) {
                const needed = amount - (userData.money || 0);
                return message.reply(
                    createBankDisplay("REPAY ERROR",
                        `❌ Insufficient cash!\n\n💵 Cash: ${formatMoney(userData.money || 0)}\n💰 Needed: ${formatMoney(needed)} more`,
                        "loan"
                    )
                );
            }
            
            const remainingLoan = Math.max(0, userData.bank.loan - amount);
            const fullyRepaid = remainingLoan === 0;
            
            // Update user data
            userData.money = (userData.money || 0) - amount;
            userData.bank.loan = remainingLoan;
            
            // Add transaction record
            userData.bank.transactions.unshift({
                type: "repay",
                amount: amount,
                date: Date.now(),
                note: `Loan repayment. Remaining: ${formatMoney(remainingLoan)}`
            });
            
            await usersData.set(senderID, userData);
            
            let repayContent = 
                `✅ 𝐋𝐎𝐀𝐍 𝐑𝐄𝐏𝐀𝐘𝐌𝐄𝐍𝐓!\n\n` +
                `💵 𝐏𝐚𝐢𝐝: ${formatMoney(amount)}\n` +
                `🏦 𝐑𝐞𝐦𝐚𝐢𝐧𝐢𝐧𝐠 𝐋𝐨𝐚𝐧: ${formatMoney(remainingLoan)}\n` +
                `💳 𝐍𝐞𝐰 𝐂𝐚𝐬𝐡: ${formatMoney(userData.money)}`;
            
            if (fullyRepaid) {
                repayContent += `\n\n🎉 𝐂𝐎𝐍𝐆𝐑𝐀𝐓𝐔𝐋𝐀𝐓𝐈𝐎𝐍𝐒!\n✅ Loan fully repaid!`;
            } else {
                repayContent += `\n\n💡 Pay remaining ${formatMoney(remainingLoan)} to clear loan.`;
            }
            
            return message.reply(createBankDisplay("LOAN REPAYMENT", repayContent, "loan"));
        }
        
        // ==================== TRANSFER COMMAND ====================
        if (args[0].toLowerCase() === "transfer") {
            const targetID = Object.keys(mentions)[0] || messageReply?.senderID;
            const amountArg = args[args.length - 1];
            
            if (!targetID || !amountArg) {
                return message.reply(
                    createBankDisplay("TRANSFER ERROR",
                        `❌ Invalid Usage!\n\n💡 Use: *bank transfer @user amount\n✨ Example: *bank transfer @friend 50000`,
                        "transfer"
                    )
                );
            }
            
            if (senderID === targetID) {
                return message.reply(createBankDisplay("TRANSFER ERROR", "❌ You can't transfer to yourself!", "transfer"));
            }
            
            const amount = parseFloat(amountArg.replace(/,/g, ''));
            
            if (isNaN(amount) || amount <= 0) {
                return message.reply(createBankDisplay("TRANSFER ERROR", "❌ Invalid amount!", "transfer"));
            }
            
            const [senderData, receiverData] = await Promise.all([
                getUserData(senderID),
                getUserData(targetID)
            ]);
            
            // Check bank balance
            if (amount > senderData.bank.balance) {
                const available = senderData.bank.balance;
                return message.reply(
                    createBankDisplay("TRANSFER ERROR",
                        `❌ Insufficient bank balance!\n\n🏦 Bank Balance: ${formatMoney(available)}\n💰 Requested: ${formatMoney(amount)}`,
                        "transfer"
                    )
                );
            }
            
            // Calculate transfer fee
            const fee = Math.floor(amount * BANK_CONFIG.transactionFee);
            const netTransfer = amount - fee;
            
            // Update sender
            senderData.bank.balance -= amount;
            senderData.bank.transactions.unshift({
                type: "transfer",
                amount: -amount,
                date: Date.now(),
                note: `Transfer to ${targetID}. Fee: ${formatMoney(fee)}`
            });
            
            // Update receiver
            receiverData.bank.balance += netTransfer;
            receiverData.bank.transactions.unshift({
                type: "transfer",
                amount: netTransfer,
                date: Date.now(),
                note: `Transfer from ${senderID}`
            });
            
            await Promise.all([
                usersData.set(senderID, senderData),
                usersData.set(targetID, receiverData)
            ]);
            
            const receiverName = await api.getUserInfo(targetID).then(info => info[targetID]?.name || `User ${targetID}`);
            
            const transferContent = 
                `✅ 𝐁𝐀𝐍𝐊 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑 𝐒𝐔𝐂𝐂𝐄𝐒𝐒!\n\n` +
                `👤 𝐓𝐨: ${receiverName}\n` +
                `💰 𝐀𝐦𝐨𝐮𝐧𝐭: ${formatMoney(amount)}\n` +
                `🏛️ 𝐓𝐫𝐚𝐧𝐬𝐟𝐞𝐫 𝐅𝐞𝐞: -${formatMoney(fee)}\n` +
                `💎 𝐍𝐞𝐭 𝐑𝐞𝐜𝐞𝐢𝐯𝐞𝐝: ${formatMoney(netTransfer)}\n\n` +
                `📊 𝐘𝐨𝐮𝐫 𝐍𝐞𝐰 𝐁𝐚𝐥𝐚𝐧𝐜𝐞:\n` +
                `🏦 𝐁𝐚𝐧𝐤: ${formatMoney(senderData.bank.balance)}\n` +
                `💵 𝐂𝐚𝐬𝐡: ${formatMoney(senderData.money)}`;
            
            // Notify receiver
            try {
                await api.sendMessage(
                    `🏦 𝐁𝐀𝐍𝐊 𝐓𝐑𝐀𝐍𝐒𝐅𝐄𝐑 𝐑𝐄𝐂𝐄𝐈𝐕𝐄𝐃!\n\n👤 From: ${await api.getUserInfo(senderID).then(info => info[senderID]?.name || `User ${senderID}`)}\n💰 Amount: ${formatMoney(netTransfer)}\n💎 Your New Bank Balance: ${formatMoney(receiverData.bank.balance)}`,
                    targetID
                );
            } catch (e) {
                console.error("Transfer notification error:", e);
            }
            
            return message.reply(createBankDisplay("BANK TRANSFER", transferContent, "transfer"));
        }
        
        // ==================== DEFAULT: CHECK BANK BALANCE ====================
        const userData = await getUserData(senderID);
        const interestResult = await calculateInterest(senderID);
        const userName = await api.getUserInfo(senderID).then(info => info[senderID]?.name || `User ${senderID}`);
        
        const bankContent = 
            `👤 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐇𝐨𝐥𝐝𝐞𝐫: ${userName}\n` +
            `🏦 𝐀𝐜𝐜𝐨𝐮𝐧𝐭 𝐍𝐨: ${userData.bank.accountNumber}\n\n` +
            `💰 𝐁𝐀𝐋𝐀𝐍𝐂𝐄𝐒:\n` +
            `💳 𝐂𝐚𝐬𝐡: ${formatMoney(userData.money || 0, true)}\n` +
            `🏦 𝐁𝐚𝐧𝐤: ${formatMoney(userData.bank.balance, true)}\n` +
            `📈 𝐃𝐚𝐢𝐥𝐲 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭: ${formatMoney(interestResult.earned)}\n\n` +
            `📊 𝐒𝐓𝐀𝐓𝐈𝐒𝐓𝐈𝐂𝐒:\n` +
            `💰 𝐓𝐨𝐭𝐚𝐥 𝐃𝐞𝐩𝐨𝐬𝐢𝐭𝐞𝐝: ${formatMoney(userData.bank.totalDeposited)}\n` +
            `💵 𝐓𝐨𝐭𝐚𝐥 𝐖𝐢𝐭𝐡𝐝𝐫𝐚𝐰𝐧: ${formatMoney(userData.bank.totalWithdrawn)}\n` +
            `📈 𝐓𝐨𝐭𝐚𝐥 𝐈𝐧𝐭𝐞𝐫𝐞𝐬𝐭: ${formatMoney(userData.bank.totalInterest)}\n` +
            `🏦 𝐂𝐮𝐫𝐫𝐞𝐧𝐭 𝐋𝐨𝐚𝐧: ${formatMoney(userData.bank.loan)}\n\n` +
            `💡 Use *bank help for all commands`;
        
        return message.reply(createBankDisplay("BANK ACCOUNT", bankContent, "main"));
    },

    // ==================== ON CHAT FOR DAILY INTEREST ====================
    onChat: async function ({ event, usersData, message }) {
        // Auto-calculate interest when user checks balance
        if (event.body?.toLowerCase() === "*bank" || event.body?.toLowerCase() === "*bank balance") {
            await this.calculateInterest(event.senderID);
        }
    },
    
    // Calculate interest function
    calculateInterest: async function (userID) {
        const userData = await usersData.get(userID);
        
        if (!userData || !userData.bank) return { earned: 0, days: 0 };
        
        const now = Date.now();
        const lastInterest = userData.bank.lastInterest || now;
        const hoursPassed = (now - lastInterest) / (1000 * 60 * 60);
        
        if (hoursPassed >= 24) {
            const days = Math.floor(hoursPassed / 24);
            const interestRate = 0.05; // 5% daily
            const interest = userData.bank.balance * interestRate * days;
            
            if (interest > 0) {
                userData.bank.balance += interest;
                userData.bank.totalInterest += interest;
                userData.bank.lastInterest = now;
                
                // Add transaction
                if (!userData.bank.transactions) userData.bank.transactions = [];
                userData.bank.transactions.unshift({
                    type: "interest",
                    amount: interest,
                    date: now,
                    note: `Daily interest for ${days} days`
                });
                
                // Keep only last 50 transactions
                if (userData.bank.transactions.length > 50) {
                    userData.bank.transactions = userData.bank.transactions.slice(0, 50);
                }
                
                await usersData.set(userID, userData);
                return { earned: interest, days: days };
            }
        }
        
        return { earned: 0, days: 0 };
    }
};
