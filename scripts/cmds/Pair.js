const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { loadImage, createCanvas } = require("canvas");

module.exports = {
  config: {
    name: "pair",
    aliases: ["couple", "match"],
    version: "2.8",
    author: "Rasel Mahmud & ChatGPT",
    countDown: 5,
    role: 0,
    shortDescription: "💞 Romantic pairing with love stickers",
    longDescription:
      "ছেলে-মেয়ে অনুযায়ী জোড়া বানায় এবং রোমান্টিক ব্যাকগ্রাউন্ডে লাভ স্টিকার সহ সুন্দর ইমেজ তৈরি করে!",
    category: "fun",
  },

  onStart: async function ({ api, event }) {
    try {
      const { threadID, senderID, mentions } = event;
      const threadInfo = await api.getThreadInfo(threadID);
      const members = threadInfo.userInfo;

      if (members.length < 2)
        return api.sendMessage("😢 Pair তৈরি করার জন্য অন্তত ২ জন দরকার!", threadID);

      const senderInfo = members.find(m => m.id === senderID);
      const senderGender =
        senderInfo?.gender === 2
          ? "male"
          : senderInfo?.gender === 1
          ? "female"
          : "unknown";

      let user1 = senderID;
      let user2;

      // যদি mention করা থাকে
      if (Object.keys(mentions).length > 0) {
        user2 = Object.keys(mentions)[0];
      } else {
        // ছেলে হলে মেয়ের সাথে, মেয়ে হলে ছেলের সাথে pair করবে
        let candidates;

        if (senderGender === "male") {
          candidates = members.filter(m => m.id !== senderID && m.gender === 1);
        } else if (senderGender === "female") {
          candidates = members.filter(m => m.id !== senderID && m.gender === 2);
        } else {
          // gender না থাকলে র‍্যান্ডম
          candidates = members.filter(m => m.id !== senderID);
        }

        // যদি gender অনুযায়ী না পায়, fallback হিসেবে অন্যদের থেকে নেবে
        if (candidates.length === 0)
          candidates = members.filter(m => m.id !== senderID);

        user2 = candidates[Math.floor(Math.random() * candidates.length)].id;
      }

      // নাম বের করা
      const info = await api.getUserInfo([user1, user2]);
      const name1 =
        info[user1]?.name ||
        members.find(m => m.id === user1)?.name ||
        `User ${user1}`;
      const name2 =
        info[user2]?.name ||
        members.find(m => m.id === user2)?.name ||
        `User ${user2}`;

      // প্রোফাইল ছবি
      const pic1 = (
        await axios.get(
          `https://graph.facebook.com/${user1}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;
      const pic2 = (
        await axios.get(
          `https://graph.facebook.com/${user2}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`,
          { responseType: "arraybuffer" }
        )
      ).data;

      const img1 = await loadImage(Buffer.from(pic1));
      const img2 = await loadImage(Buffer.from(pic2));

      // Romantic Canvas
      const canvas = createCanvas(900, 500);
      const ctx = canvas.getContext("2d");

      // Gradient background
      const gradient = ctx.createLinearGradient(0, 0, 900, 500);
      gradient.addColorStop(0, "#ff9a9e");
      gradient.addColorStop(0.5, "#fad0c4");
      gradient.addColorStop(1, "#fbc2eb");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 900, 500);

      // 💕 Add transparent heart stickers randomly
      const heartEmojis = ["💖", "💘", "💞", "💕", "💓"];
      ctx.font = "40px Sans";
      for (let i = 0; i < 25; i++) {
        const x = Math.random() * 850;
        const y = Math.random() * 450;
        const emoji = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
        ctx.globalAlpha = 0.3;
        ctx.fillText(emoji, x, y);
      }
      ctx.globalAlpha = 1.0;

      // Love percent
      const lovePercent = Math.floor(Math.random() * 51) + 50;

      // Profile photos inside circles
      ctx.save();
      ctx.beginPath();
      ctx.arc(225, 245, 120, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img1, 105, 125, 240, 240);
      ctx.restore();

      ctx.save();
      ctx.beginPath();
      ctx.arc(675, 245, 120, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img2, 555, 125, 240, 240);
      ctx.restore();

      // মাঝখানে "LOVE" ❤️
      ctx.font = "bold 60px Sans";
      const loveText = "LOVE";
      const textWidth = ctx.measureText(loveText).width;
      ctx.shadowColor = "rgba(255,0,100,0.6)";
      ctx.shadowBlur = 15;
      ctx.fillStyle = "#ff0040";
      ctx.fillText(loveText, (900 - textWidth) / 2, 260);
      ctx.shadowBlur = 0;

      // নিচে নাম
      ctx.font = "26px Sans";
      ctx.fillStyle = "#fff";
      ctx.fillText(name1, 150, 440);
      ctx.fillText(name2, 620, 440);

      // নিচে ম্যাচ %
      ctx.font = "30px Sans";
      ctx.fillStyle = "#ff0040";
      ctx.fillText(`💞 Love Match: ${lovePercent}%`, 340, 480);

      // সেভ
      const cacheDir = path.join(__dirname, "cache");
      if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);
      const imgPath = path.join(cacheDir, `pair_${Date.now()}.png`);
      fs.writeFileSync(imgPath, canvas.toBuffer());

      // পাঠানো
      await api.sendMessage(
        {
          body: `💘 Congratulations ${name1} ❤️ ${name2}
💞 Love Match: ${lovePercent}% 🔥
🌸 তোমরা একে অপরের জন্য পারফেক্ট জুটি! 💕`,
          attachment: fs.createReadStream(imgPath),
        },
        threadID
      );

      setTimeout(() => fs.unlinkSync(imgPath), 10000);
    } catch (e) {
      console.error(e);
      api.sendMessage("❌ কিছু একটা সমস্যা হয়েছে! আবার চেষ্টা করো।", event.threadID);
    }
  },
};
