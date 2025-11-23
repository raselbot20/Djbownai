const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { alldown } = require('shaon-videos-downloader');

module.exports = {
  config: {
    name: 'autodl',
    version: '3.0.0',
    hasPermssion: 0,
    author: 'Rasel Mahmud',
    description: 'Auto download videos when someone sends any link.',
    commandCategory: 'media',
    usages: '',
    cooldowns: 0
  },

  onStart: async function ({ api, event }) {
    const text = event.body || "";

    // 🔍 সব লিঙ্ক বের করা
    const urls = (text.match(/https?:\/\/[^\s]+/g) || [])
      .filter(u => u.startsWith("http"));

    if (urls.length === 0) return;

    const cacheDir = path.join(__dirname, "cache");
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    for (const link of urls) {
      try {
        // Start reaction
        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        // Download info
        const data = await alldown(link);
        if (!data?.url) throw new Error("NO_URL");

        const filePath = path.join(cacheDir, `auto_${Date.now()}.mp4`);

        // Download file
        const stream = await axios({
          url: data.url,
          method: "GET",
          responseType: "stream"
        });

        await new Promise((resolve, reject) => {
          const writer = fs.createWriteStream(filePath);
          writer.on("finish", resolve);
          writer.on("error", reject);
          stream.data.pipe(writer);
        });

        // Success reaction
        api.setMessageReaction("✅", event.messageID, () => {}, true);

        // Send file
        api.sendMessage(
          {
            body: `✅ Download Complete!\n🔗 URL: ${link}`,
            attachment: fs.createReadStream(filePath)
          },
          event.threadID,
          () => {
            try { fs.unlinkSync(filePath); } catch {};
          }
        );

      } catch (err) {
        // Error reaction only
        api.setMessageReaction("❌", event.messageID, () => {}, true);
      }
    }
  },

  onReply() {},
  onLoad() {}
};
