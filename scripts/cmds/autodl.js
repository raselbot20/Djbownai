const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { alldown } = require('shaon-videos-downloader');

module.exports = {
  config: {
    name: 'autodl',
    version: '1.6.0',
    hasPermssion: 0,
    author: 'Rasel Mahmud',
    description: 'Auto download video(s) from given URL(s) with fancy progress message.',
    commandCategory: 'media',
    usages: '',
    cooldowns: 5
  },

  onStart: async function () {
    console.log('[AUTODL] Command loaded successfully.');
  },

  onChat: async function ({ api, event }) {
    const text = event.body || '';
    const urls = (text.match(/https?:\/\/[^\s]+/g) || []).filter(u => u.startsWith('https://'));
    if (!urls.length) return;

    const cacheDir = path.join(__dirname, 'cache');
    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    for (const link of urls) {
      try {
        // Start ⏳ reaction
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

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
          response.data.pipe(writer);
        });

        // ✅ Download complete
        api.setMessageReaction('✅', event.messageID, () => {}, true);

        const platform = (() => {
          try { return new URL(link).hostname.replace('www.', '').toUpperCase(); } 
          catch { return 'UNKNOWN'; }
        })();

        // Fancy message box
        const message = `
╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗
\t✅ Video Downloaded!
\t📥 Platform: ${platform}
╚═══════════════╝
`;

        // Send video
        api.sendMessage({
          body: message,
          attachment: fs.createReadStream(filePath)
        }, event.threadID, event.messageID);

      } catch (err) {
        console.error('[AUTODL ERROR]:', err.message);
        api.setMessageReaction('❌', event.messageID, () => {}, true);
      }
    }
  }
};
