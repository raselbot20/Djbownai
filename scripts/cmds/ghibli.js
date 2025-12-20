const axios = require("axios");

module.exports = {
  config: {
    name: "ghibli",
    version: "1.0",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Convert image into Studio Ghibli style" },
    longDescription: { en: "Transform a normal image into Studio Ghibli animation style." },
    category: "ai",
    guide: { en: "Use: !ghibli <imageUrl> or reply to an image." }
  },

  onStart: async function ({ api, event, args }) {
    let imageUrl = args[0];

    if (
      !imageUrl &&
      event.messageReply &&
      event.messageReply.attachments &&
      event.messageReply.attachments.length > 0
    ) {
      const attachment = event.messageReply.attachments[0];
      if (attachment.type === "photo" || attachment.type === "image") {
        imageUrl = attachment.url || attachment.previewUrl;
      }
    }

    if (!imageUrl) {
      return api.sendMessage(
        "⚠️ Please provide an image URL or reply with an image.",
        event.threadID,
        event.messageID
      );
    }

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const response = await axios.get(
        "https://estapis.onrender.com/api/ai/img2img/ghibli/v12",
        { params: { imageUrl } }
      );

      if (!response.data || !response.data.url) {
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        return api.sendMessage(
          "❌ Failed to generate Ghibli image.",
          event.threadID,
          event.messageID
        );
      }

      const ghibliUrl = response.data.url;
      const fileName = response.data.orig_name || "ghibli.webp";

      const stream = await global.utils.getStreamFromURL(ghibliUrl, fileName);

      api.setMessageReaction("✅", event.messageID, () => {}, true);

      api.sendMessage(
        {
          body: `🎬 Studio Ghibli Style Generated!\n\n🖼️ File: ${fileName}\n📂 Path: ${response.data.path}`,
          attachment: stream,
        },
        event.threadID,
        event.messageID
      );
    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      api.sendMessage(
        "❌ An error occurred while generating the Ghibli-style image.",
        event.threadID,
        event.messageID
      );
    }
  },
};
