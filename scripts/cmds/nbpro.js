const axios = require('axios');

module.exports = {
  config: {
    name: "nbpro",
    aliases: [],
    author: "Tawsif~",
    category: "ai",
    countDown: 5,
    role: 0,
    description: {
      en: "edit & generate images using Nano-banana Pro"
    },
    guide: {
      en: " <prompt> | reply to image"
    }
  },
  onStart: async function({ api, message, event, args }) {
    let prompt = args.join(" ");

    if ((!event.messageReply && !event?.messageReply?.attachments[0]?.url && !prompt) || (event?.messageReply?.attachments[0]?.url && !prompt)) {
      return message.reply('provide a prompt or reply to an image');
    } else if (!event?.messageReply?.attachments[0] && prompt) {
      let ratio = prompt?.split("--ar=")[1] || prompt?.split("--ar ")[1] || '1:1';
      
      api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);
      
      try {
        const gres = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-gen?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`);
        await message.reply({
          body: "✅ | Generated", 
          attachment: await global.utils.getStreamFromURL(gres.data.imageUrl, 'gen.png')
        });
        api.setMessageReaction("✅", event.messageID, event.threadID, () => {}, true);
      } catch (e) {
        api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      }
    } else {
      let imgs = [];
      for (let i = 0; i < event.messageReply.attachments.length; i++) {
        imgs.push(event.messageReply.attachments[i].url);
      }

      api.setMessageReaction("⏳", event.messageID, event.threadID, () => {}, true);

      try {
        const eres = await axios.get(`https://tawsif.is-a.dev/gemini/nano-banana-pro-edit?prompt=${encodeURIComponent(prompt)}&urls=${encodeURIComponent(JSON.stringify(imgs))}`);
        await message.reply({
          body: "✅ | Image Edited",
          attachment: await global.utils.getStreamFromURL(eres.data.imageUrl, 'edit.png')
        });
        api.setMessageReaction("✅", event.messageID, event.threadID, () => {}, true);
      } catch (error) {
        api.setMessageReaction("❌", event.messageID, event.threadID, () => {}, true);
      }
    }
  }
};
