const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "namaj",
    aliases: ["salah", "namaz", "prayer"],
    version: "6.1.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    description: "🕌 পবিত্র নামাজের সময়সূচি (বাংলাদেশের সকল জেলা)",
    category: "islamic",
    guide: "{pn} [জেলার নাম] (যেমন: {pn} Dhaka)"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(
        "❌ অনুগ্রহ করে জেলার নাম লিখুন।\nExample: *namaj Dhaka\nor: *namaj Chattogram",
        threadID,
        messageID
      );
    }

    const cityInput = args.join(" ").trim();

    try {
      // ===== FIXED API with Bangladesh Timezone =====
      const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(cityInput)}&country=Bangladesh&method=1&school=1&timezonestring=Asia/Dhaka`;

      const response = await axios.get(apiUrl);
      
      if (!response.data || !response.data.data) {
        throw new Error("Invalid response from API");
      }

      const data = response.data.data;
      const timings = data.timings;
      const dateInfo = data.date;

      // ===== Date Formatting (Bangladesh Time) =====
      const gregorianDate = `${dateInfo.gregorian.day} ${dateInfo.gregorian.month.en} ${dateInfo.gregorian.year}`;
      
      // Hijri date in correct format
      const hijriMonth = dateInfo.hijri.month.en;
      const hijriDay = dateInfo.hijri.day;
      const hijriYear = dateInfo.hijri.year;
      const hijriDate = `${hijriDay} ${hijriMonth} ${hijriYear} AH`;

      // ===== Time Formatting (12-hour with AM/PM) =====
      function formatTo12Hour(timeStr) {
        if (!timeStr) return "N/A";
        
        // Remove any (BST) or similar suffixes
        const cleanTime = timeStr.split(' ')[0];
        const [hour, minute] = cleanTime.split(':').map(Number);
        
        const period = hour >= 12 ? 'PM' : 'AM';
        const hour12 = hour % 12 || 12;
        
        return `${hour12}:${minute.toString().padStart(2, '0')} ${period}`;
      }

      // Get current time in Bangladesh
      const now = new Date();
      const bangladeshTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Dhaka' }));
      const currentHour = bangladeshTime.getHours();
      const currentMinute = bangladeshTime.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      // Helper function to convert time string to minutes
      function timeToMinutes(timeStr) {
        if (!timeStr || timeStr === "N/A") return 0;
        
        const [timePart, period] = timeStr.split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        
        if (period === 'PM' && hours !== 12) hours += 12;
        if (period === 'AM' && hours === 12) hours = 0;
        
        return hours * 60 + minutes;
      }

      // ===== Prayer Times with Correct Format =====
      const prayers = [
        { 
          name: "FAJR", 
          icon: "✨",
          time: formatTo12Hour(timings.Fajr),
          minuteValue: timeToMinutes(formatTo12Hour(timings.Fajr))
        },
        { 
          name: "SUNRISE", 
          icon: "☀️",
          time: formatTo12Hour(timings.Sunrise),
          minuteValue: timeToMinutes(formatTo12Hour(timings.Sunrise))
        },
        { 
          name: "DHUHR", 
          icon: "💥",
          time: formatTo12Hour(timings.Dhuhr),
          minuteValue: timeToMinutes(formatTo12Hour(timings.Dhuhr))
        },
        { 
          name: "ASR", 
          icon: "☁️",
          time: formatTo12Hour(timings.Asr),
          minuteValue: timeToMinutes(formatTo12Hour(timings.Asr))
        },
        { 
          name: "MAGHRIB", 
          icon: "🌅",
          time: formatTo12Hour(timings.Maghrib),
          minuteValue: timeToMinutes(formatTo12Hour(timings.Maghrib))
        },
        { 
          name: "ISHA", 
          icon: "🌙",
          time: formatTo12Hour(timings.Isha),
          minuteValue: timeToMinutes(formatTo12Hour(timings.Isha))
        }
      ];

      // Calculate current prayer and next prayer
      let currentPrayerIndex = -1;
      for (let i = prayers.length - 1; i >= 0; i--) {
        if (currentTimeInMinutes >= prayers[i].minuteValue) {
          currentPrayerIndex = i;
          break;
        }
      }

      // Get next prayer
      let nextPrayer;
      if (currentPrayerIndex === -1) {
        // Before Fajr, next is Fajr
        nextPrayer = prayers[0];
      } else if (currentPrayerIndex === prayers.length - 1) {
        // After Isha, next is Fajr (next day)
        nextPrayer = prayers[0];
      } else {
        nextPrayer = prayers[currentPrayerIndex + 1];
      }

      // Get city name properly
      const cityName = cityInput.charAt(0).toUpperCase() + cityInput.slice(1).toLowerCase();

      // ===== BEAUTIFUL CANVAS DESIGN =====
      const width = 1000;
      const height = 1300;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Helper function for rounded rectangles
      function roundRect(x, y, w, h, r) {
        if (w < 2 * r) r = w / 2;
        if (h < 2 * r) r = h / 2;
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
        return ctx;
      }

      // 🌙 Background with gradient
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#0a1928');
      gradient.addColorStop(0.5, '#1a2f3f');
      gradient.addColorStop(1, '#0a1928');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ✨ Decorative stars
      ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
      for (let i = 0; i < 50; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 4;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 🕌 Top crescent and stars
      ctx.shadowColor = "#ffd700";
      ctx.shadowBlur = 40;
      
      // Main crescent
      ctx.fillStyle = "#d4af37";
      ctx.beginPath();
      ctx.arc(width/2 - 40, 80, 50, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#0a1928";
      ctx.beginPath();
      ctx.arc(width/2 + 10, 60, 45, 0, Math.PI * 2);
      ctx.fill();
      
      // Small stars
      ctx.fillStyle = "#f5e56b";
      const starPositions = [
        [width/2 + 40, 40], [width/2 + 80, 70], [width/2 - 90, 50],
        [width/2 - 130, 90], [width/2 + 120, 110]
      ];
      starPositions.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      // 🏆 Main Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 58px 'Times New Roman', 'Arial', serif";
      ctx.textAlign = "center";
      ctx.fillText("🎀 PRAYER TIMES 🎀", width/2, 180);

      // 📍 Location Box
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#1e3b5c";
      roundRect(200, 220, 600, 160, 30);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#d4af37";
      ctx.font = "bold 48px 'Arial'";
      ctx.fillText(`📍 ${cityName}`, width/2, 295);

      ctx.fillStyle = "#ffffff";
      ctx.font = "30px 'Arial'";
      ctx.fillText(gregorianDate, width/2, 350);

      ctx.fillStyle = "#f5e56b";
      ctx.font = "28px 'Arial'";
      ctx.fillText(`💞 ${hijriDate}`, width/2, 395);

      // ⏰ Prayer Times Table
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#0a2647";
      roundRect(150, 430, 700, 600, 30);
      ctx.fill();

      // Table Header
      ctx.fillStyle = "#d4af37";
      roundRect(170, 450, 250, 60, 15);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 32px 'Arial'";
      ctx.fillText("PRAYER", 290, 495);

      ctx.fillStyle = "#d4af37";
      roundRect(580, 450, 250, 60, 15);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillText("TIME", 700, 495);

      // Prayer Rows
      let yPos = 540;
      prayers.forEach((prayer, index) => {
        // Background for each row (same for all)
        ctx.fillStyle = index % 2 === 0 ? "#1e3b5c" : "#15304c";
        roundRect(165, yPos - 30, 670, 65, 15);
        ctx.fill();

        // If this is current prayer, add a border only
        if (index === currentPrayerIndex) {
          ctx.strokeStyle = "#ffd700";
          ctx.lineWidth = 4;
          roundRect(165, yPos - 30, 670, 65, 15);
          ctx.stroke();
        }

        // Prayer name with icon
        ctx.fillStyle = index === currentPrayerIndex ? "#ffd700" : "#f5e56b";
        ctx.font = "bold 28px 'Arial'";
        ctx.textAlign = "left";
        ctx.fillText(`${prayer.icon} ${prayer.name}`, 200, yPos + 10);

        // Prayer time
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 30px 'Arial'";
        ctx.textAlign = "right";
        ctx.fillText(prayer.time, 790, yPos + 10);

        // Add small indicator for current prayer
        if (index === currentPrayerIndex) {
          ctx.fillStyle = "#ffd700";
          ctx.font = "20px 'Arial'";
          ctx.textAlign = "left";
          ctx.fillText("◀ CURRENT", 820, yPos + 10);
        }

        yPos += 80;
      });

      // 📖 Next Prayer Box
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#1a3a4f";
      roundRect(220, 1070, 560, 80, 20);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#d4af37";
      ctx.font = "bold 28px 'Arial'";
      ctx.textAlign = "center";
      ctx.fillText(`⏰ NEXT PRAYER: ${nextPrayer.name} at ${nextPrayer.time}`, width/2, 1125);

      // 📖 Hadith
      ctx.fillStyle = "#1e3b5c";
      roundRect(200, 1160, 600, 90, 20);
      ctx.fill();

      ctx.fillStyle = "#aaccff";
      ctx.font = "italic 22px 'Times New Roman'";
      ctx.fillText('"Verily, the prayer restrains from shameful', width/2, 1210);
      ctx.fillStyle = "#f5e56b";
      ctx.fillText('and unjust deeds." (Surah Al-Ankabut: 45)', width/2, 1245);

      // ⭐ Footer
      ctx.fillStyle = "rgba(212, 175, 55, 0.7)";
      ctx.font = "20px 'Arial'";
      ctx.fillText("🎀 Heli•LUMO | Rasel Mahmud 🎀", width/2, 1280);

      // ✨ Border with corner decorations
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 8;
      ctx.strokeRect(25, 25, width - 50, height - 50);

      // Corner decorations
      ctx.fillStyle = "#d4af37";
      const corners = [
        [40, 40], [width-55, 40], 
        [40, height-55], [width-55, height-55]
      ];
      corners.forEach(([x, y]) => {
        ctx.beginPath();
        ctx.arc(x, y, 15, 0, Math.PI * 2);
        ctx.fill();
      });

      // ===== Save and Send =====
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `namaj_${Date.now()}.png`);
      
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(filePath, buffer);

      await api.sendMessage({
        body: `🕌 আজকের নামাজের সময়সূচি - ${cityName}\n⏰ বাংলাদেশ সময় অনুযায়ী`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID);

      // Cleanup after 1 minute
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 60000);

    } catch (error) {
      console.error("Namaj Command Error:", error);
      api.sendMessage(
        "❌ নামাজের সময় পাওয়া যাচ্ছে না।\n" +
        "দয়া করে সঠিক জেলার নাম লিখুন (যেমন: Dhaka, Chattogram, Sylhet)\n" +
        "অথবা কিছুক্ষণ পর আবার চেষ্টা করুন।",
        threadID,
        messageID
      );
    }
  }
};
