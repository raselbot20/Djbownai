const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { alldown } = require('shaon-videos-downloader');

module.exports = {
  config: {
    name: 'autodl',
    version: '1.4.0',
    hasPermssion: 0,
    author: 'Rasel Mahmud',
    description: 'Auto download video(s) with progress from given URL(s).',
    commandCategory: 'media',
    usages: '',
    cooldowns: 5
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const text = event.body || '';
    const urls = (text.match(/https?:\/\/[^\s]+/g) || []).filter(u => u.startsWith('https://'));
    if (urls.length === 0) return;

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    for (const link of urls) {
      try {
        // Start reaction
        api.setMessageReaction('⏳', event.messageID, () => {}, true);

        const data = await alldown(link);
        if (!data || !data.url) throw new Error('No downloadable URL found');

        const url = data.url;
        const safeName = (data.title || 'video').replace(/[^a-zA-Z0-9.-]/g, '_');
        const filePath = path.join(cacheDir, `${safeName}_${Date.now()}.mp4`);

        // Download video with progress
        const response = await axios({ method: 'GET', url, responseType: 'stream' });
        const totalSize = parseInt(response.headers['content-length']) || 0;
        let downloaded = 0;
        let lastPercent = 0;

        const writer = fs.createWriteStream(filePath);

        // Handle progress
        response.data.on('data', (chunk) => {
          downloaded += chunk.length;
          if (totalSize) {
            const percent = Math.floor((downloaded / totalSize) * 100);
            if (percent - lastPercent >= 5) {
              api.setMessageReaction('⏳', event.messageID, () => {}, true);
              lastPercent = percent;
            }
          }
        });

        // Wait for download to finish before sending
        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
          response.data.pipe(writer);
        });

        // ✅ Reaction
        api.setMessageReaction('✅', event.messageID, () => {}, true);

        const platform = (() => {
          try { return new URL(link).hostname.replace('www.', '').toUpperCase(); } 
          catch { return 'UNKNOWN'; }
        })();

        // Send video
        api.sendMessage({
          body: `✅ Download Complete!\n\n📱 Platform: ${platform}\n🌐 URL: ${link}`,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, event.messageID);

      } catch (err) {
        // Only ❌ reaction on failure, no message
        api.setMessageReaction('❌', event.messageID, () => {}, true);
      }
    }
  }
};
