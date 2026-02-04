const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
  config: {
    name: "age",
    version: "1.2",
    author: "Rasel Mahmud",
    role: 0,
    countDown: 5,
    shortDescription: "Calculate age with stylish card",
    longDescription: "Calculate age and show in stylish card",
    category: "utility",
    guide: {
      en: "{pn} [birthdate in YYYY-MM-DD format]\nExample: {pn} 2000-01-15"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    try {
      // Check if birthdate is provided
      if (args.length === 0) {
        return message.reply("⚠️ Please provide your birthdate in YYYY-MM-DD format\nExample: /age 2000-01-15");
      }

      const birthdateStr = args[0];
      const birthdateRegex = /^\d{4}-\d{2}-\d{2}$/;
      
      if (!birthdateRegex.test(birthdateStr)) {
        return message.reply("❌ Invalid date format! Please use YYYY-MM-DD format.\nExample: /age 2000-01-15");
      }

      // Parse birthdate
      const birthdate = new Date(birthdateStr + "T00:00:00");
      
      // Check if date is valid
      if (isNaN(birthdate.getTime())) {
        return message.reply("❌ Invalid date! Please check your birthdate.");
      }

      // Check if date is not in future
      const now = new Date();
      if (birthdate > now) {
        return message.reply("❌ Birthdate cannot be in the future!");
      }

      api.setMessageReaction("⌛", event.messageID, () => {}, true);

      // Calculate age
      const age = calculateAge(birthdate, now);
      const nextBirthday = getNextBirthday(birthdate, now);
      const daysUntilBirthday = Math.ceil((nextBirthday - now) / (1000 * 60 * 60 * 24));
      
      // Get zodiac sign
      const zodiac = getZodiacSign(birthdate.getMonth() + 1, birthdate.getDate());
      const zodiacEmoji = getZodiacEmoji(zodiac);
      
      // Get birth day name
      const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const birthDayName = dayNames[birthdate.getDay()];
      
      // Format birthdate for display
      const formattedBirthdate = birthdate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Create canvas
      const width = 1200;
      const height = 650; // Reduced height since time section removed
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext("2d");

      // Draw background
      drawBackground(ctx, width, height);

      // Draw main content
      drawMainCard(ctx, width, height, birthdateStr, age, formattedBirthdate, zodiac, zodiacEmoji, 
                   birthDayName, daysUntilBirthday);

      // Save image
      const cachePath = path.join(__dirname, "cache_age.png");
      const buffer = canvas.toBuffer("image/png");
      fs.writeFileSync(cachePath, buffer);

      // Send message
      await message.reply({
        body: `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
🎂 AGE CALCULATOR 🎂
━━━━━━━━━━━━━━━━━━
📅 Birthdate: ${formattedBirthdate}
🎯 Age: ${age.years} years, ${age.months} months, ${age.days} days
⭐ Zodiac: ${zodiac} ${zodiacEmoji}
🎁 Next birthday in: ${daysUntilBirthday} days
📊 Born on: ${birthDayName}
━━━━━━━━━━━━━━━━━━
✨ Powered by: 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 | Rasel Mahmud
╚═══════════════════╝`,
        attachment: fs.createReadStream(cachePath)
      });

      // Clean up
      fs.unlinkSync(cachePath);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
      console.error("Age command error:", error);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      return message.reply("❌ An error occurred while calculating age. Please try again.");
    }
  }
};

// ===== HELPER FUNCTIONS =====

function calculateAge(birthdate, now) {
  let years = now.getFullYear() - birthdate.getFullYear();
  let months = now.getMonth() - birthdate.getMonth();
  let days = now.getDate() - birthdate.getDate();

  // Adjust negative values
  if (days < 0) {
    const prevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    days += prevMonth.getDate();
    months--;
  }
  
  if (months < 0) {
    months += 12;
    years--;
  }

  // Calculate total days lived
  const diffTime = Math.abs(now - birthdate);
  const totalDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const totalHours = Math.floor(diffTime / (1000 * 60 * 60));
  const totalMinutes = Math.floor(diffTime / (1000 * 60));
  const totalSeconds = Math.floor(diffTime / 1000);

  // Calculate hours, minutes, seconds
  let hours = now.getHours() - birthdate.getHours();
  let minutes = now.getMinutes() - birthdate.getMinutes();
  let seconds = now.getSeconds() - birthdate.getSeconds();
  
  if (seconds < 0) {
    seconds += 60;
    minutes--;
  }
  
  if (minutes < 0) {
    minutes += 60;
    hours--;
  }
  
  if (hours < 0) {
    hours += 24;
  }

  return {
    years,
    months,
    days,
    hours,
    minutes,
    seconds,
    totalDays,
    totalHours,
    totalMinutes,
    totalSeconds
  };
}

function getNextBirthday(birthdate, now) {
  const currentYear = now.getFullYear();
  let nextBirthday = new Date(currentYear, birthdate.getMonth(), birthdate.getDate());
  
  if (nextBirthday < now) {
    nextBirthday.setFullYear(currentYear + 1);
  }
  
  return nextBirthday;
}

function getZodiacSign(month, day) {
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "Aquarius";
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return "Pisces";
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "Aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "Taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "Gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "Cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "Leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "Virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "Libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "Scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "Sagittarius";
  return "Capricorn";
}

function getZodiacEmoji(zodiac) {
  const emojiMap = {
    "Aries": "♈",
    "Taurus": "♉",
    "Gemini": "♊",
    "Cancer": "♋",
    "Leo": "♌",
    "Virgo": "♍",
    "Libra": "♎",
    "Scorpio": "♏",
    "Sagittarius": "♐",
    "Capricorn": "♑",
    "Aquarius": "♒",
    "Pisces": "♓"
  };
  return emojiMap[zodiac] || "⭐";
}

function drawBackground(ctx, width, height) {
  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#1a1a2e");
  gradient.addColorStop(0.5, "#16213e");
  gradient.addColorStop(1, "#0f3460");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Star effect
  ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = Math.random() * 1.5;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // Geometric patterns
  ctx.strokeStyle = "rgba(255, 215, 0, 0.1)";
  ctx.lineWidth = 1;
  
  // Circles
  for (let i = 0; i < 8; i++) {
    const radius = 50 + i * 60;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawMainCard(ctx, width, height, birthdateStr, age, formattedBirthdate, zodiac, zodiacEmoji, 
                      birthDayName, daysUntilBirthday) {
  
  const cardWidth = width - 100;
  const cardHeight = height - 100;
  const cardX = 50;
  const cardY = 50;

  // Card shadow
  ctx.shadowColor = "rgba(255, 215, 0, 0.3)";
  ctx.shadowBlur = 30;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 0;

  // Card background
  ctx.fillStyle = "rgba(25, 25, 35, 0.9)";
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 25);
  ctx.fill();

  // Card border
  ctx.shadowBlur = 0;
  ctx.strokeStyle = "#ffd700";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardWidth, cardHeight, 25);
  ctx.stroke();

  // Title
  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 50px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
  ctx.shadowBlur = 10;
  ctx.fillText("🎂 AGE CALCULATOR 🎂", width / 2, cardY + 70);
  ctx.shadowBlur = 0;

  // Title divider
  ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cardX + 150, cardY + 90);
  ctx.lineTo(cardX + cardWidth - 150, cardY + 90);
  ctx.stroke();

  // Main content area
  const contentY = cardY + 140;
  const column1X = cardX + 80;
  const column2X = cardX + cardWidth / 2 + 40;

  // Function to draw info box
  function drawInfoBox(x, y, icon, title, value, color = "#ffffff") {
    // Box background
    ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
    ctx.beginPath();
    ctx.roundRect(x, y, 450, 50, 10);
    ctx.fill();

    // Icon
    ctx.fillStyle = "#ffd700";
    ctx.font = "28px Arial";
    ctx.fillText(icon, x + 20, y + 35);

    // Title
    ctx.fillStyle = "#cccccc";
    ctx.font = "bold 20px 'Segoe UI', Arial, sans-serif";
    ctx.fillText(title, x + 60, y + 25);

    // Value
    ctx.fillStyle = color;
    ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(value, x + 430, y + 30);
    ctx.textAlign = "left";
  }

  // Left column
  let currentY = contentY;
  drawInfoBox(column1X, currentY, "📅", "Birth Date", formattedBirthdate, "#ffffff");
  currentY += 65;
  
  drawInfoBox(column1X, currentY, "🎯", "Age (Years)", `${age.years} years`, "#ff9999");
  currentY += 65;
  
  drawInfoBox(column1X, currentY, "📊", "Age (Months)", `${age.months} months`, "#99ccff");
  currentY += 65;
  
  drawInfoBox(column1X, currentY, "📅", "Age (Days)", `${age.days} days`, "#99ff99");
  currentY += 65;
  
  drawInfoBox(column1X, currentY, "⭐", "Zodiac Sign", `${zodiac} ${zodiacEmoji}`, "#ffcc66");

  // Right column
  currentY = contentY;
  drawInfoBox(column2X, currentY, "🎂", "Next Birthday", `in ${daysUntilBirthday} days`, "#ff6666");
  currentY += 65;
  
  drawInfoBox(column2X, currentY, "📅", "Born on", birthDayName, "#66ccff");
  currentY += 65;
  
  drawInfoBox(column2X, currentY, "⏳", "Total Days Lived", age.totalDays.toLocaleString(), "#cc99ff");
  currentY += 65;
  
  drawInfoBox(column2X, currentY, "⏰", "Total Hours", age.totalHours.toLocaleString(), "#ff9966");
  currentY += 65;
  
  drawInfoBox(column2X, currentY, "📈", "Total Minutes", age.totalMinutes.toLocaleString(), "#66ffcc");

  // Detailed age section (moved up since time section removed)
  const detailY = cardY + cardHeight - 120;
  ctx.fillStyle = "rgba(255, 215, 0, 0.1)";
  ctx.beginPath();
  ctx.roundRect(cardX + 80, detailY, cardWidth - 160, 70, 15);
  ctx.fill();

  ctx.fillStyle = "#ffd700";
  ctx.font = "bold 24px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Detailed Age:", width / 2, detailY + 30);
  
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px 'Segoe UI', Arial, sans-serif";
  ctx.fillText(`${age.years}y ${age.months}m ${age.days}d ${age.hours}h ${age.minutes}m ${age.seconds}s`, width / 2, detailY + 60);

  // Footer credit (moved up)
  const footerY = cardY + cardHeight - 30;
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "italic 18px 'Segoe UI', Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("✨ Powered by: Heli•LUMO | Created by Rasel Mahmud ✨", width / 2, footerY);

  // Corner decorations
  ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
  ctx.lineWidth = 2;
  const cornerSize = 30;
  
  // Top-left
  ctx.beginPath();
  ctx.moveTo(cardX + 20, cardY + 20);
  ctx.lineTo(cardX + 20 + cornerSize, cardY + 20);
  ctx.moveTo(cardX + 20, cardY + 20);
  ctx.lineTo(cardX + 20, cardY + 20 + cornerSize);
  ctx.stroke();
  
  // Top-right
  ctx.beginPath();
  ctx.moveTo(cardX + cardWidth - 20, cardY + 20);
  ctx.lineTo(cardX + cardWidth - 20 - cornerSize, cardY + 20);
  ctx.moveTo(cardX + cardWidth - 20, cardY + 20);
  ctx.lineTo(cardX + cardWidth - 20, cardY + 20 + cornerSize);
  ctx.stroke();
  
  // Bottom-left
  ctx.beginPath();
  ctx.moveTo(cardX + 20, cardY + cardHeight - 20);
  ctx.lineTo(cardX + 20 + cornerSize, cardY + cardHeight - 20);
  ctx.moveTo(cardX + 20, cardY + cardHeight - 20);
  ctx.lineTo(cardX + 20, cardY + cardHeight - 20 - cornerSize);
  ctx.stroke();
  
  // Bottom-right
  ctx.beginPath();
  ctx.moveTo(cardX + cardWidth - 20, cardY + cardHeight - 20);
  ctx.lineTo(cardX + cardWidth - 20 - cornerSize, cardY + cardHeight - 20);
  ctx.moveTo(cardX + cardWidth - 20, cardY + cardHeight - 20);
  ctx.lineTo(cardX + cardWidth - 20, cardY + cardHeight - 20 - cornerSize);
  ctx.stroke();
}

// Add roundRect function to canvas context
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function (x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    this.beginPath();
    this.moveTo(x + radius, y);
    this.arcTo(x + width, y, x + width, y + height, radius);
    this.arcTo(x + width, y + height, x, y + height, radius);
    this.arcTo(x, y + height, x, y, radius);
    this.arcTo(x, y, x + width, y, radius);
    this.closePath();
    return this;
  };
    }
