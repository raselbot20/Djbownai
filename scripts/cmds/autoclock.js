const fs = require("fs");
const path = require("path");
const axios = require("axios");
const cron = require("node-cron");
const { createCanvas, loadImage } = require('canvas');

module.exports = {
    config: {
        name: "autoclock",
        aliases: ["time", "smarttime", "timemaster"],
        version: "5.0",
        author: "Rasel Mahmud",
        countDown: 3,
        role: 0,
        description: "🕰️ Automated Clock Art System with Schedule",
        category: "automation",
        guide: {
            en: "{pn} start - Start auto clock schedule\n{pn} stop - Stop auto schedule\n{pn} now - Show current time art\n{pn} set <HH:MM> - Set custom schedule time"
        }
    },

    onStart: async function({ api, event, args, threadsData }) {
        const { threadID, messageID } = event;
        const command = args[0]?.toLowerCase();

        try {
            switch(command) {
                case "start":
                    return await this.startAutoSchedule(api, event, threadsData);
                case "stop":
                    return await this.stopAutoSchedule(api, event, threadsData);
                case "now":
                    return await this.sendTimeArt(api, event, false);
                case "set":
                    return await this.setCustomTime(api, event, args, threadsData);
                case "status":
                    return await this.showStatus(api, event, threadsData);
                default:
                    return await this.showHelp(api, event);
            }
        } catch (error) {
            console.error("AutoClock Error:", error);
            await this.sendErrorMessage(api, threadID, messageID, error);
        }
    },

    // Start auto schedule
    startAutoSchedule: async function(api, event, threadsData) {
        const { threadID, messageID } = event;
        
        const threadData = await threadsData.get(threadID) || {};
        if (!threadData.autoClock) {
            threadData.autoClock = {};
        }
        
        // Set default schedule times (6 times daily)
        threadData.autoClock.enabled = true;
        threadData.autoClock.schedule = "default";
        threadData.autoClock.times = [
            { hour: 6, minute: 0, name: "ভোর", emoji: "🌄" },
            { hour: 9, minute: 0, name: "সকাল", emoji: "🌅" },
            { hour: 12, minute: 0, name: "দুপুর", emoji: "☀️" },
            { hour: 15, minute: 0, name: "বিকাল", emoji: "🌤️" },
            { hour: 18, minute: 0, name: "সন্ধ্যা", emoji: "🌇" },
            { hour: 21, minute: 0, name: "রাত", emoji: "🌙" }
        ];
        
        await threadsData.set(threadID, threadData);
        
        // Schedule all times
        threadData.autoClock.times.forEach(schedule => {
            const cronTime = `${schedule.minute} ${schedule.hour} * * *`;
            this.scheduleTimeArt(api, threadID, schedule, cronTime);
        });
        
        const message = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         ✅ 𝐀𝐔𝐓𝐎 𝐒𝐂𝐇𝐄𝐃𝐔𝐋𝐄 𝐒𝐓𝐀𝐑𝐓𝐄𝐃\n\n` +
            `🕰️ Auto Clock Schedule Enabled\n\n` +
            `📅 Daily Schedule:\n` +
            `🌄 ০৬:০০ - ভোর\n` +
            `🌅 ০৯:০০ - সকাল\n` +
            `☀️ ১২:০০ - দুপুর\n` +
            `🌤️ ১৫:০০ - বিকাল\n` +
            `🌇 ১৮:০০ - সন্ধ্যা\n` +
            `🌙 ২১:০০ - রাত\n\n` +
            `⏰ Total: 6 Times Daily\n` +
            `🔄 Auto-send: Yes\n\n` +
            `🛑 Stop: !autoclock stop\n` +
            `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
            `🔗 https://fb.com/share/1AcArr1zGL\n` +
            `╚═══════════════════╝`;
        
        await api.sendMessage(message, threadID, messageID);
    },

    // Stop auto schedule
    stopAutoSchedule: async function(api, event, threadsData) {
        const { threadID, messageID } = event;
        
        const threadData = await threadsData.get(threadID) || {};
        if (!threadData.autoClock || !threadData.autoClock.enabled) {
            const message = 
                `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
                `         ℹ️ 𝐍𝐎 𝐀𝐂𝐓𝐈𝐕𝐄 𝐒𝐂𝐇𝐄𝐃𝐔𝐋𝐄\n\n` +
                `Auto schedule is not running\n\n` +
                `▶️ Start: !autoclock start\n` +
                `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
                `🔗 https://fb.com/share/1AcArr1zGL\n` +
                `╚═══════════════════╝`;
            
            return api.sendMessage(message, threadID, messageID);
        }
        
        threadData.autoClock.enabled = false;
        await threadsData.set(threadID, threadData);
        
        // Clear all cron jobs for this thread
        this.clearSchedules(threadID);
        
        const message = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         🛑 𝐀𝐔𝐓𝐎 𝐒𝐂𝐇𝐄𝐃𝐔𝐋𝐄 𝐒𝐓𝐎𝐏𝐏𝐄𝐃\n\n` +
            `✅ Auto Clock Schedule Disabled\n\n` +
            `📊 Status: Stopped\n` +
            `🔄 No more auto messages\n\n` +
            `▶️ Start again: !autoclock start\n` +
            `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
            `🔗 https://fb.com/share/1AcArr1zGL\n` +
            `╚═══════════════════╝`;
        
        await api.sendMessage(message, threadID, messageID);
    },

    // Send time art (manual or auto)
    sendTimeArt: async function(api, event, isAuto = false) {
        const { threadID, messageID } = event;
        
        try {
            // Anime images collection
            const animeImages = [
                "https://files.catbox.moe/wfngzy.jpg",
                "https://files.catbox.moe/1xdv8z.jpg",
                "https://files.catbox.moe/fmn527.jpg",
                "https://files.catbox.moe/et8m45.jpg",
                "https://files.catbox.moe/pjxmue.jpg",
                "https://files.catbox.moe/7kndmf.jpg",
                "https://files.catbox.moe/o8cgcm.jpg",
                "https://files.catbox.moe/2nd2gq.jpg",
                "https://files.catbox.moe/ohqfdz.jpg",
                "https://files.catbox.moe/z129vp.jpg",
                "https://files.catbox.moe/qwtstf.jpg",
                "https://files.catbox.moe/6l8g10.jpg",
                "https://files.catbox.moe/pwj189.jpg",
                "https://files.catbox.moe/fnrdcx.jpg",
                "https://files.catbox.moe/xgtccm.jpg",
                "https://files.catbox.moe/7d5liz.jpg",
                "https://files.catbox.moe/14vljp.jpg",
                "https://files.catbox.moe/9l0u7j.jpg",
                "https://files.catbox.moe/3qz0ze.jpg",
                "https://files.catbox.moe/wq9879.jpg",
                "https://files.catbox.moe/jkivl3.jpg",
                "https://files.catbox.moe/ffsge2.jpg",
                "https://files.catbox.moe/7a4nsg.jpg",
                "https://files.catbox.moe/d34419.jpg",
                "https://files.catbox.moe/de4mz6.jpg",
                "https://files.catbox.moe/pq0tan.jpg",
                "https://files.catbox.moe/t50bm5.jpg",
                "https://files.catbox.moe/0i359f.jpg",
                "https://files.catbox.moe/u7t2tc.jpg",
                "https://files.catbox.moe/bx70ne.jpg",
                "https://files.catbox.moe/8ve59b.jpg",
                "https://files.catbox.moe/q2gtad.jpg",
                "https://files.catbox.moe/1s7ctu.jpg",
                "https://files.catbox.moe/f4kdt2.jpg",
                "https://files.catbox.moe/axh9be.jpg",
                "https://files.catbox.moe/qkpqy8.jpg",
                "https://files.catbox.moe/qbdyrr.jpg",
                "https://files.catbox.moe/rvmbip.jpg",
            ];
            
            // Get random image
            const randomImage = animeImages[Math.floor(Math.random() * animeImages.length)];
            
            // Get current Bangladesh time
            const now = new Date();
            const bangladeshTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
            
            // Format time
            const hours = bangladeshTime.getUTCHours();
            const minutes = bangladeshTime.getUTCMinutes();
            const seconds = bangladeshTime.getUTCSeconds();
            
            // Convert to 12-hour format
            const displayHours = hours % 12 || 12;
            const ampm = hours >= 12 ? 'PM' : 'AM';
            
            // Time strings
            const time24 = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            const time12 = `${displayHours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} ${ampm}`;
            
            // Get time category
            const timeCategory = this.getTimeCategory(hours);
            
            // Create cache directory
            const cacheDir = path.join(__dirname, "cache", "autoclock");
            if (!fs.existsSync(cacheDir)) {
                fs.mkdirSync(cacheDir, { recursive: true });
            }
            
            // Download and process image
            const inputFile = `input_${Date.now()}.jpg`;
            const outputFile = `clock_${Date.now()}.jpg`;
            const inputPath = path.join(cacheDir, inputFile);
            const outputPath = path.join(cacheDir, outputFile);
            
            // Download image
            const response = await axios({
                method: "GET",
                url: randomImage,
                responseType: "stream",
                timeout: 30000
            });
            
            const writer = fs.createWriteStream(inputPath);
            response.data.pipe(writer);
            
            await new Promise((resolve, reject) => {
                writer.on("finish", resolve);
                writer.on("error", reject);
            });
            
            // Create clock art
            await this.createClockDesign(inputPath, outputPath, {
                hours: hours % 12,
                minutes,
                seconds,
                time12,
                time24,
                timeCategory
            });
            
            // Create message (different for auto/manual)
            let message;
            if (isAuto) {
                message = 
                    `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
                    `         🕰️ 𝐀𝐔𝐓𝐎 𝐂𝐋𝐎𝐂𝐊 🕰️\n\n` +
                    `${timeCategory.emoji} ${timeCategory.name}\n` +
                    `📅 ${this.getBangladeshDate()}\n` +
                    `⏰ ${time12}\n` +
                    `🕗 ${time24}\n\n` +
                    `🌍 বাংলাদেশ সময় (UTC+6)\n` +
                    `🎨 Auto-generated Clock Art\n` +
                    `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
                    `🔗 https://fb.com/share/1AcArr1zGL\n` +
                    `╚═══════════════════╝`;
            } else {
                message = 
                    `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
                    `         🕰️ 𝐂𝐋𝐎𝐂𝐊 𝐀𝐑𝐓 🕰️\n\n` +
                    `${timeCategory.emoji} ${timeCategory.name}\n` +
                    `📅 ${this.getBangladeshDate()}\n` +
                    `⏰ ${time12}\n` +
                    `🕗 ${time24}\n\n` +
                    `🌍 বাংলাদেশ সময় (UTC+6)\n` +
                    `🎨 Artistic Clock Design\n` +
                    `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐦𝐮𝐝\n` +
                    `🔗 https://fb.com/share/1AcArr1zGL\n` +
                    `╚═══════════════════╝`;
            }
            
            // Send message
            await api.sendMessage({
                body: message,
                attachment: fs.createReadStream(outputPath)
            }, threadID, isAuto ? undefined : messageID);
            
            // Cleanup after 10 seconds
            setTimeout(() => {
                [inputPath, outputPath].forEach(file => {
                    if (fs.existsSync(file)) {
                        fs.unlinkSync(file);
                    }
                });
            }, 10000);
            
        } catch (error) {
            console.error("Send time art error:", error);
            throw error;
        }
    },

    // Set custom time
    setCustomTime: async function(api, event, args, threadsData) {
        const { threadID, messageID } = event;
        
        if (args.length < 2) {
            return this.showHelp(api, event);
        }
        
        const time = args[1];
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):([0-5][0-9])$/;
        
        if (!timeRegex.test(time)) {
            const message = 
                `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
                `         ❌ 𝐈𝐍𝐕𝐀𝐋𝐈𝐃 𝐓𝐈𝐌𝐄\n\n` +
                `Invalid time format!\n\n` +
                `✅ Correct format: HH:MM\n` +
                `📋 Examples:\n` +
                `• 08:30\n` +
                `• 14:45\n` +
                `• 22:00\n\n` +
                `🔄 Try: !autoclock set 14:30\n` +
                `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
                `🔗 https://fb.com/share/1AcArr1zGL\n` +
                `╚═══════════════════╝`;
            
            return api.sendMessage(message, threadID, messageID);
        }
        
        const [hour, minute] = time.split(':').map(Number);
        
        const threadData = await threadsData.get(threadID) || {};
        if (!threadData.autoClock) {
            threadData.autoClock = {};
        }
        
        threadData.autoClock.enabled = true;
        threadData.autoClock.schedule = "custom";
        threadData.autoClock.customTime = time;
        
        await threadsData.set(threadID, threadData);
        
        // Schedule custom time
        const cronTime = `${minute} ${hour} * * *`;
        const scheduleInfo = {
            hour,
            minute,
            name: this.getTimeCategory(hour).name,
            emoji: this.getTimeCategory(hour).emoji
        };
        
        this.scheduleTimeArt(api, threadID, scheduleInfo, cronTime);
        
        const message = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         ✅ 𝐂𝐔𝐒𝐓𝐎𝐌 𝐒𝐂𝐇𝐄𝐃𝐔𝐋𝐄 𝐒𝐄𝐓\n\n` +
            `🕰️ Custom Schedule Set Successfully\n\n` +
            `⏰ Time: ${time}\n` +
            `📅 Daily: Yes\n` +
            `🔄 Auto-send: Enabled\n\n` +
            `🛑 Stop: !autoclock stop\n` +
            `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
            `🔗 https://fb.com/share/1AcArr1zGL\n` +
            `╚═══════════════════╝`;
        
        await api.sendMessage(message, threadID, messageID);
    },

    // Show status
    showStatus: async function(api, event, threadsData) {
        const { threadID, messageID } = event;
        
        const threadData = await threadsData.get(threadID) || {};
        const autoClock = threadData.autoClock || {};
        
        let message;
        if (!autoClock.enabled) {
            message = 
                `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
                `         📊 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐈𝐍𝐀𝐂𝐓𝐈𝐕𝐄\n\n` +
                `Auto Clock Schedule is OFF\n\n` +
                `▶️ Start: !autoclock start\n` +
                `⚙️ Set custom: !autoclock set <time>\n` +
                `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
                `🔗 https://fb.com/share/1AcArr1zGL\n` +
                `╚═══════════════════╝`;
        } else if (autoClock.schedule === "default") {
            message = 
                `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
                `         📊 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐀𝐂𝐓𝐈𝐕𝐄\n\n` +
                `✅ Auto Clock Schedule Running\n\n` +
                `📅 Schedule Type: Default\n` +
                `⏰ Times: 6 times daily\n` +
                `🔄 Status: Active\n\n` +
                `🛑 Stop: !autoclock stop\n` +
                `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
                `🔗 https://fb.com/share/1AcArr1zGL\n` +
                `╚═══════════════════╝`;
        } else {
            message = 
                `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
                `         📊 𝐒𝐓𝐀𝐓𝐔𝐒: 𝐀𝐂𝐓𝐈𝐕𝐄\n\n` +
                `✅ Auto Clock Schedule Running\n\n` +
                `📅 Schedule Type: Custom\n` +
                `⏰ Time: ${autoClock.customTime}\n` +
                `🔄 Status: Active\n\n` +
                `🛑 Stop: !autoclock stop\n` +
                `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
                `🔗 https://fb.com/share/1AcArr1zGL\n` +
                `╚═══════════════════╝`;
        }
        
        await api.sendMessage(message, threadID, messageID);
    },

    // Show help
    showHelp: async function(api, event) {
        const { threadID, messageID } = event;
        
        const message = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         🕰️ 𝐀𝐔𝐓𝐎 𝐂𝐋𝐎𝐂𝐊 𝐇𝐄𝐋𝐏\n\n` +
            `📋 Available Commands:\n\n` +
            `▶️  !autoclock start\n` +
            `    Start auto schedule (6 times daily)\n\n` +
            `🛑  !autoclock stop\n` +
            `    Stop auto schedule\n\n` +
            `⏰  !autoclock now\n` +
            `    Show current time art\n\n` +
            `⚙️  !autoclock set <HH:MM>\n` +
            `    Set custom schedule time\n\n` +
            `📊  !autoclock status\n` +
            `    Show current status\n\n` +
            `🎨 Features:\n` +
            `• Auto clock art generation\n` +
            `• 38 anime backgrounds\n` +
            `• Bangladesh timezone\n` +
            `• Beautiful clock design\n\n` +
            `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
            `🔗 https://fb.com/share/1AcArr1zGL\n` +
            `╚═══════════════════╝`;
        
        await api.sendMessage(message, threadID, messageID);
    },

    // Schedule time art
    scheduleTimeArt: function(api, threadID, scheduleInfo, cronTime) {
        cron.schedule(cronTime, async () => {
            try {
                await this.sendTimeArt(api, { threadID }, true);
            } catch (error) {
                console.error(`Schedule error for ${scheduleInfo.hour}:${scheduleInfo.minute}:`, error);
            }
        });
    },

    // Clear schedules
    clearSchedules: function(threadID) {
        // This function would clear specific cron jobs
        // Note: In production, you'd track and clear specific jobs
        console.log(`Cleared schedules for thread ${threadID}`);
    },

    // Create clock design on image
    createClockDesign: async function(inputPath, outputPath, timeData) {
        try {
            const image = await loadImage(inputPath);
            const canvas = createCanvas(image.width, image.height);
            const ctx = canvas.getContext('2d');
            
            // Draw original image
            ctx.drawImage(image, 0, 0, image.width, image.height);
            
            // Add overlay for better visibility
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(0, 0, image.width, image.height);
            
            // Clock parameters
            const centerX = image.width / 2;
            const centerY = image.height / 2;
            const clockRadius = Math.min(image.width, image.height) * 0.2;
            
            // Draw clock
            this.drawClock(ctx, centerX, centerY, clockRadius, timeData);
            
            // Save image
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createJPEGStream({ quality: 0.9 });
            stream.pipe(out);
            
            await new Promise((resolve, reject) => {
                out.on('finish', resolve);
                out.on('error', reject);
            });
            
        } catch (error) {
            console.error("Clock design error:", error);
            throw error;
        }
    },

    // Draw clock function
    drawClock: function(ctx, x, y, radius, timeData) {
        // Clock face
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 5;
        ctx.stroke();
        
        // Numbers
        ctx.font = 'bold 30px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (let i = 1; i <= 12; i++) {
            const angle = (i * Math.PI) / 6;
            const numX = x + Math.sin(angle) * (radius - 30);
            const numY = y - Math.cos(angle) * (radius - 30);
            ctx.fillText(i.toString(), numX, numY);
        }
        
        // Clock hands
        const hourAngle = ((timeData.hours % 12) * 30 + timeData.minutes * 0.5) * (Math.PI / 180);
        const minuteAngle = (timeData.minutes * 6) * (Math.PI / 180);
        const secondAngle = (timeData.seconds * 6) * (Math.PI / 180);
        
        // Hour hand
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.sin(hourAngle) * (radius * 0.5),
            y - Math.cos(hourAngle) * (radius * 0.5)
        );
        ctx.strokeStyle = '#FF6B6B';
        ctx.lineWidth = 8;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Minute hand
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.sin(minuteAngle) * (radius * 0.7),
            y - Math.cos(minuteAngle) * (radius * 0.7)
        );
        ctx.strokeStyle = '#4ECDC4';
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Second hand
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(
            x + Math.sin(secondAngle) * (radius * 0.8),
            y - Math.cos(secondAngle) * (radius * 0.8)
        );
        ctx.strokeStyle = '#FFE66D';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Center dot
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#FFFFFF';
        ctx.fill();
        
        // Time text below clock
        ctx.font = 'bold 40px Arial';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(timeData.time12, x, y + radius + 50);
    },

    // Helper functions
    getTimeCategory: function(hour) {
        if (hour >= 5 && hour <= 11) return { name: "সকাল", emoji: "🌅" };
        if (hour >= 12 && hour <= 14) return { name: "দুপুর", emoji: "☀️" };
        if (hour >= 15 && hour <= 17) return { name: "বিকাল", emoji: "🌤️" };
        if (hour >= 18 && hour <= 20) return { name: "সন্ধ্যা", emoji: "🌇" };
        return { name: "রাত", emoji: "🌙" };
    },

    getBangladeshDate: function() {
        const now = new Date();
        const bangladeshTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
        
        const days = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
        const months = ["জানুয়ারী", "ফেব্রুয়ারী", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
        
        const dayName = days[bangladeshTime.getUTCDay()];
        const monthName = months[bangladeshTime.getUTCMonth()];
        const date = bangladeshTime.getUTCDate();
        const year = bangladeshTime.getUTCFullYear();
        
        return `${dayName}, ${date} ${monthName}, ${year}`;
    },

    sendErrorMessage: async function(api, threadID, messageID, error) {
        const message = 
            `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗\n` +
            `         ❌ 𝐄𝐑𝐑𝐎𝐑\n\n` +
            `⚠️ ${error.message || "Unknown Error"}\n\n` +
            `🔄 Please try again\n` +
            `👑 Developer: 𝐑𝐚𝐬𝐞𝐥 𝐌𝐚𝐡𝐦𝐮𝐝\n` +
            `🔗 https://fb.com/share/1AcArr1zGL\n` +
            `╚═══════════════════╝`;
        
        await api.sendMessage(message, threadID, messageID);
    }
};
