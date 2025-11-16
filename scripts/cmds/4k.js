const axios = require('axios');
const fs = require('fs');

const xyz = "ArYANAHMEDRUDRO";

module.exports = {
  config: {
    name: "4k",
    version: "1.0.0",
    role: 0,
    credits: "Rasel Mahmud",
    description: "Enhance Image into 4K quality",
    category: "IMAGE",
    cooldown: 5
  },

  onStart: async ({ api, event, args }) => {
    const tempImage = __dirname + "/cache/4k_enhanced.jpg";
    const { threadID, messageID } = event;

    // Get Image URL from reply or args
    const imageUrl = event.messageReply
      ? event.messageReply.attachments?.[0]?.url
      : args.join(" ");

    if (!imageUrl) {
      return api.sendMessage(
        "👉 Please reply to an image or give an image URL!",
        threadID,
        messageID
      );
    }

    try {
      const wait = await api.sendMessage("⏳ 𝐏𝐥𝐞𝐚𝐬𝐞 𝐖𝐚𝐢𝐭 𝐁𝐚𝐛𝐲... 😘", threadID);

      const apiUrl =
        `https://aryan-xyz-upscale-api-phi.vercel.app/api/upscale-image?imageUrl=${encodeURIComponent(imageUrl)}&apikey=${xyz}`;

      const res = await axios.get(apiUrl);
      const enhancedUrl = res.data?.resultImageUrl;

      if (!enhancedUrl) {
        throw new Error("API returned no image.");
      }

      const enhancedBuffer = (
        await axios.get(enhancedUrl, { responseType: "arraybuffer" })
      ).data;

      fs.writeFileSync(tempImage, Buffer.from(enhancedBuffer));

      api.sendMessage(
        {
          body: "✅ 𝐈𝐦𝐚𝐠𝐞 𝟒𝐊 𝐄𝐧𝐡𝐚𝐧𝐜𝐞𝐝 𝐒𝐮𝐜𝐜𝐞𝐬𝐬𝐟𝐮𝐥𝐥𝐲!",
          attachment: fs.createReadStream(tempImage)
        },
        threadID,
        () => fs.unlinkSync(tempImage),
        messageID
      );

      api.unsendMessage(wait.messageID);

    } catch (e) {
      api.sendMessage("❌ Error! (Maybe API Down?)", threadID, messageID);
      console.log(e);
    }
  }
};
