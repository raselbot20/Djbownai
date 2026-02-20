// File: autoazan.js
const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const moment = require("moment-timezone");

module.exports.config = {
  name: "autoazan",
  version: "2.0",
  author: "Rasel Mahmud",
  role: 0,
  description: "🕌 ৫ ওয়াক্ত স্বয়ংক্রিয় আজান (ভিডিওসহ, না পারলে টেক্সট)",
  category: "islamic",
  countDown: 3,
};

const LOCATION = {
  name: "Dhaka",
  lat: 23.8103,
  lon: 90.4125
};

let lastSent = {};
let intervalID = null;

// ================= HADITH =================
function getHadith(namaz) {
  const hadith = {
    Fajr: "🕌 হাদিস: যে ব্যক্তি ফজরের নামাজ আদায় করে, সে আল্লাহর হেফাজতে থাকে।",
    Dhuhr: "🕌 হাদিস: যোহরের নামাজ রহমতের দরজা খুলে দেয়।",
    Asr: "🕌 হাদিস: আসরের নামাজ ইসলামের অন্যতম গুরুত্বপূর্ণ সালাত।",
    Maghrib: "🕌 হাদিস: মাগরিবের সালাত দিনের সমাপ্তির প্রশান্তি।",
    Isha: "🕌 হাদিস: ইশার নামাজ রাতের শান্তি ও নিরাপত্তা এনে দেয়।"
  };
  return hadith[namaz] || "🕌 নামাজ আদায় করা প্রত্যেক মুসলমানের উপর ফরজ।";
}

// ================= VIDEO FETCH =================
async function getVideoURL() {
  try {
    const res = await axios.get("https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json");
    return res.data?.data?.play || null;
  } catch {
    return null;
  }
}

// ================= NAMAZ TIME =================
async function getPrayerTimes() {
  const today = moment().tz("Asia/Dhaka").format("DD-MM-YYYY");
  const url = `http://api.aladhan.com/v1/timings/${today}?latitude=${LOCATION.lat}&longitude=${LOCATION.lon}&method=1&school=1`;
  const res = await axios.get(url);
  return res.data.data.timings;
}

// ================= SEND AZAN =================
async function sendAzan(api, namaz, time) {
  const hadith = getHadith(namaz);

  const message =
`🕌 ${namaz} এর আজান

${hadith}

⏰ সময়: ${time}
📍 স্থান: ${LOCATION.name}

🤲 আসুন নামাজের জন্য প্রস্তুত হই`;

  const videoURL = await getVideoURL();

  if (videoURL) {
    try {
      const cacheDir = path.join(__dirname, "cache");
      await fs.ensureDir(cacheDir);
      const filePath = path.join(cacheDir, `azan_${namaz}.mp4`);

      const stream = await axios({
        url: videoURL,
        method: "GET",
        responseType: "stream"
      });

      const writer = fs.createWriteStream(filePath);
      stream.data.pipe(writer);

      await new Promise((res, rej) => {
        writer.on("finish", res);
        writer.on("error", rej);
      });

      await api.sendMessage({
        body: message,
        attachment: fs.createReadStream(filePath)
      }, null);

      setTimeout(() => {
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      }, 60000);

      return;
    } catch {
      // ভিডিও ডাউনলোড ব্যর্থ হলে টেক্সট দিবে
      await api.sendMessage(message, null);
      return;
    }
  }

  // ভিডিও URL না পেলে
  await api.sendMessage(message, null);
}

// ================= AUTO LOOP =================
async function checkAzan(api) {
  try {
    const timings = await getPrayerTimes();
    const now = moment().tz("Asia/Dhaka").format("HH:mm");

    const prayers = {
      Fajr: timings.Fajr,
      Dhuhr: timings.Dhuhr,
      Asr: timings.Asr,
      Maghrib: timings.Maghrib,
      Isha: timings.Isha
    };

    for (const [name, time] of Object.entries(prayers)) {
      const cleanTime = time.split(" ")[0];

      if (now === cleanTime && lastSent[name] !== moment().format("YYYY-MM-DD")) {
        lastSent[name] = moment().format("YYYY-MM-DD");
        await sendAzan(api, name, cleanTime);
      }
    }

  } catch (e) {
    console.log("AutoAzan Error:", e.message);
  }
}

// ================= LOAD =================
module.exports.onLoad = async function ({ api }) {
  console.log("✅ AutoAzan V2 চালু হয়েছে (Dhaka Live Time)");
  if (!intervalID) {
    intervalID = setInterval(() => checkAzan(api), 60000);
  }
};
