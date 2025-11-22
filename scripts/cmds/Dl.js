module.exports = {
  config: {
    name: "autodl",
    version: "0.0.3",
    hasPermssion: 0,
    credits: "Rasel Mahmud",
    description: "Auto video downloader",
    commandCategory: "user",
    usages: "",
    cooldowns: 5,
  },

  onStart: async function () {},

  onChat: async function ({ api, event }) {
    const axios = require("axios");
    const fs = require("fs-extra");
    const { alldown } = require("shaon-videos-downloader");

    const message = event.body || "";
    const body = message.toLowerCase();

    // auto trigger only if starts with https://
    if (!body.startsWith("https://")) return;

    try {
      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      const data = await alldown(message);
      const url = data.url;

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      const video = (
        await axios.get(url, { responseType: "arraybuffer" })
      ).data;

      const path = __dirname + "/cache/autodl.mp4";
      fs.writeFileSync(path, Buffer.from(video, "utf-8"));

      // platform detect → simple extractor
      const getPlatform = (link) => {
        try {
          const host = new URL(link).hostname.replace("www.", "");
          return host.toUpperCase();
        } catch {
          return "UNKNOWN";
        }
      };

      const platform = getPlatform(message);

      return api.sendMessage(
        {
          body:
            `✅ Download Complete!\n\n📱 Platform: ${platform}`,
          attachment: fs.createReadStream(path),
        },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.log(err);
      api.sendMessage(
        "❌ Error while downloading the video!",
        event.threadID,
        event.messageID
      );
    }
  },
};
