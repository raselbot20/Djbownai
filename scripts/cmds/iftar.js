const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "iftar",
    aliases: ["sehri", "roza", "ramadan", "iftt"],
    version: "2.0.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    description: "🌙 Ramadan Iftar & Sehri Times for all districts of Bangladesh",
    category: "islamic",
    guide: "{pn} [district name] (e.g., {pn} Dhaka)"
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID } = event;

    if (!args[0]) {
      return api.sendMessage(
        "❌ Please enter a district name.\nExample: *iftar Dhaka\nor: *sehri Chattogram",
        threadID,
        messageID
      );
    }

    const cityInput = args.join(" ").trim();

    try {
      // ===== API with Bangladesh Timezone =====
      const apiUrl = `https://api.aladhan.com/v1/timingsByCity?city=${encodeURIComponent(cityInput)}&country=Bangladesh&method=1&school=1&timezonestring=Asia/Dhaka`;

      const response = await axios.get(apiUrl);
      
      if (!response.data || !response.data.data) {
        throw new Error("Invalid response from API");
      }

      const data = response.data.data;
      const timings = data.timings;
      const dateInfo = data.date;

      // ===== Date Formatting =====
      const gregorianDate = `${dateInfo.gregorian.day} ${dateInfo.gregorian.month.en} ${dateInfo.gregorian.year}`;
      
      // Hijri date
      const hijriMonth = dateInfo.hijri.month.en;
      const hijriDay = dateInfo.hijri.day;
      const hijriYear = dateInfo.hijri.year;
      const hijriDate = `${hijriDay} ${hijriMonth} ${hijriYear} AH`;

      // ===== Time Formatting (12-hour with AM/PM) =====
      function formatTo12Hour(timeStr) {
        if (!timeStr) return "N/A";
        
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

      // ===== Iftar & Sehri Times =====
      const sehriEnd = formatTo12Hour(timings.Fajr);
      const iftarTime = formatTo12Hour(timings.Maghrib);
      
      const sehriEndMinutes = timeToMinutes(sehriEnd);
      const iftarMinutes = timeToMinutes(iftarTime);

      // Calculate fasting duration
      function calculateFastingDuration() {
        const sehri = sehriEndMinutes;
        const iftar = iftarMinutes;
        
        let duration;
        if (iftar > sehri) {
          duration = iftar - sehri;
        } else {
          duration = (24 * 60 - sehri) + iftar;
        }
        
        const hours = Math.floor(duration / 60);
        const minutes = duration % 60;
        return `${hours}h ${minutes}m`;
      }

      const fastingDuration = calculateFastingDuration();

      // Determine if it's fasting time or not
      const isFastingTime = currentTimeInMinutes >= sehriEndMinutes && 
                           currentTimeInMinutes < iftarMinutes;

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

      // 🌙 Background with gradient (Purple to Dark Blue)
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, '#1a0b2e');
      gradient.addColorStop(0.3, '#2a1a4a');
      gradient.addColorStop(0.6, '#1e3a5a');
      gradient.addColorStop(1, '#0a2a3a');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // ✨ Decorative stars (multiple colors)
      for (let i = 0; i < 80; i++) {
        const colors = ['rgba(255, 215, 0, 0.2)', 'rgba(255, 255, 255, 0.15)', 'rgba(173, 216, 230, 0.1)'];
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
        const x = Math.random() * width;
        const y = Math.random() * height;
        const size = Math.random() * 5;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 🕌 Top crescent with gold effect
      ctx.shadowColor = "#ffaa00";
      ctx.shadowBlur = 50;
      
      // Main crescent
      ctx.fillStyle = "#ffd700";
      ctx.beginPath();
      ctx.arc(width/2 - 40, 80, 55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1a0b2e";
      ctx.beginPath();
      ctx.arc(width/2 + 15, 60, 50, 0, Math.PI * 2);
      ctx.fill();
      
      // Small stars around crescent
      ctx.fillStyle = "#fff5b0";
      const starPositions = [
        [width/2 + 50, 35], [width/2 + 100, 65], [width/2 - 100, 45],
        [width/2 - 150, 85], [width/2 + 140, 105], [width/2 + 180, 45]
      ];
      starPositions.forEach(([x, y]) => {
        ctx.shadowBlur = 30;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.shadowBlur = 0;

      // 🏆 Main Title
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 62px 'Georgia', 'Times New Roman', serif";
      ctx.textAlign = "center";
      ctx.fillText("🌙 RAMADAN 2026 🌙", width/2, 180);
      
      // Decorative line under title
      ctx.strokeStyle = "#ffd700";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(300, 200);
      ctx.lineTo(700, 200);
      ctx.stroke();

      // 📍 Location Box (Royal Blue)
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#1e3a8a";
      roundRect(200, 230, 600, 150, 30);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffd700";
      ctx.font = "bold 52px 'Arial'";
      ctx.fillText(`📍 ${cityName.toUpperCase()}`, width/2, 310);

      ctx.fillStyle = "#ffffff";
      ctx.font = "28px 'Arial'";
      ctx.fillText(gregorianDate, width/2, 360);

      ctx.fillStyle = "#ffb347";
      ctx.font = "26px 'Arial'";
      ctx.fillText(`🎀 ${hijriDate}`, width/2, 400);

      // ===== IFTAR & SEHRI MAIN BOXES (Colorful) =====
      
      // Sehri Box (Deep Purple)
      ctx.shadowBlur = 25;
      ctx.fillStyle = "#5b2c6f";
      roundRect(120, 440, 350, 200, 30);
      ctx.fill();
      
      // Sehri icon
      ctx.fillStyle = "#f39c12";
      ctx.font = "bold 40px 'Arial'";
      ctx.fillText("🌙", 200, 520);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px 'Arial'";
      ctx.fillText("SEHRI ENDS", 280, 520);
      
      ctx.fillStyle = "#f1c40f";
      ctx.font = "bold 60px 'Arial'";
      ctx.fillText(sehriEnd, 290, 600);

      // Iftar Box (Sunset Orange)
      ctx.fillStyle = "#c44536";
      roundRect(530, 440, 350, 200, 30);
      ctx.fill();
      
      ctx.fillStyle = "#ffd966";
      ctx.font = "bold 40px 'Arial'";
      ctx.fillText("☀️", 620, 520);
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 36px 'Arial'";
      ctx.fillText("IFTAR TIME", 690, 520);
      
      ctx.fillStyle = "#ffe05d";
      ctx.font = "bold 60px 'Arial'";
      ctx.fillText(iftarTime, 700, 600);

      // Fasting Duration Box (Teal)
      ctx.fillStyle = "#117a65";
      roundRect(250, 670, 500, 80, 20);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 30px 'Arial'";
      ctx.fillText(`✨ FASTING DURATION: ${fastingDuration}`, width/2, 725);

      // Current Status Box (Dynamic color)
      ctx.fillStyle = isFastingTime ? "#b03a2e" : "#27ae60";
      roundRect(250, 770, 500, 70, 20);
      ctx.fill();
      
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 28px 'Arial'";
      const statusText = isFastingTime ? "🔴 FASTING IN PROGRESS" : "🟢 NOT FASTING (After Iftar)";
      ctx.fillText(statusText, width/2, 820);

      // Ramadan Blessings Box
      ctx.fillStyle = "#8e44ad";
      roundRect(250, 860, 500, 60, 15);
      ctx.fill();
      
      ctx.fillStyle = "#f0e68c";
      ctx.font = "italic 24px 'Georgia'";
      ctx.fillText("✨ Ramadan Mubarak! May your fast be accepted ✨", width/2, 900);

      // 📖 Ramadan Hadith Box (Dark Golden)
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#784b2e";
      roundRect(150, 940, 700, 110, 25);
      ctx.fill();

      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ffdb9d";
      ctx.font = "italic 24px 'Times New Roman'";
      ctx.fillText('"Whoever fasts during Ramadan with faith', width/2, 990);
      ctx.fillText('and seeking reward, all their past sins will be forgiven."', width/2, 1030);
      ctx.fillStyle = "#ffd700";
      ctx.font = "20px 'Arial'";
      ctx.fillText("(Sahih Bukhari & Muslim)", width/2, 1065);

      // 🕌 Additional Info (Time remaining until next event)
      ctx.fillStyle = "#2c3e50";
      roundRect(200, 1090, 600, 60, 15);
      ctx.fill();
      
      let nextEvent, nextEventTime;
      if (isFastingTime) {
        nextEvent = "IFTAR";
        nextEventTime = iftarTime;
      } else {
        nextEvent = "SEHRI ENDS";
        nextEventTime = sehriEnd;
      }
      
      ctx.fillStyle = "#ecf0f1";
      ctx.font = "bold 24px 'Arial'";
      ctx.fillText(`⏳ Next: ${nextEvent} at ${nextEventTime}`, width/2, 1130);

      // ⭐ Footer with gradient text
      const footerGradient = ctx.createLinearGradient(400, 1250, 600, 1250);
      footerGradient.addColorStop(0, '#ffd700');
      footerGradient.addColorStop(1, '#ff8c00');
      ctx.fillStyle = footerGradient;
      ctx.font = "bold 22px 'Arial'";
      ctx.fillText("💞 Heli•LUMO | Rasel Mahmud 💞", width/2, 1190);

      // Ramadan Decoration
      ctx.fillStyle = "#ffd700";
      for (let i = 0; i < 5; i++) {
        const x = 150 + i * 180;
        ctx.beginPath();
        ctx.arc(x, 1240, 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // ✨ Main Border with gradient
      const borderGradient = ctx.createLinearGradient(0, 0, width, height);
      borderGradient.addColorStop(0, '#ffd700');
      borderGradient.addColorStop(0.5, '#ff8c00');
      borderGradient.addColorStop(1, '#ffd700');
      ctx.strokeStyle = borderGradient;
      ctx.lineWidth = 10;
      ctx.strokeRect(20, 20, width - 40, height - 40);

      // Corner decorations (Colorful)
      const cornerColors = ['#ffd700', '#ff8c00', '#ff6b6b', '#9b59b6'];
      const corners = [
        [40, 40], [width-55, 40], 
        [40, height-55], [width-55, height-55]
      ];
      corners.forEach(([x, y], index) => {
        ctx.fillStyle = cornerColors[index];
        ctx.beginPath();
        ctx.arc(x, y, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner small dot
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fill();
      });

      // ===== Save and Send =====
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `iftar_${Date.now()}.png`);
      
      const buffer = canvas.toBuffer("image/png");
      await fs.writeFile(filePath, buffer);

      await api.sendMessage({
        body: `🌙 Ramadan Iftar & Sehri Times - ${cityName}\n⏰ Bangladesh Standard Time`,
        attachment: fs.createReadStream(filePath)
      }, threadID, messageID);

      // Cleanup after 1 minute
      setTimeout(() => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }, 60000);

    } catch (error) {
      console.error("Iftar Command Error:", error);
      api.sendMessage(
        "❌ Unable to fetch Iftar & Sehri times.\n" +
        "Please enter a valid district name (e.g., Dhaka, Chattogram, Sylhet)\n" +
        "Or try again later.",
        threadID,
        messageID
      );
    }
  }
};
