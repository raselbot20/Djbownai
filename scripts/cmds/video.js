const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CACHE = path.join(__dirname, "cache");
if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);

module.exports = {
  config: {
    name: "video",
    version: "1.0.0",
    author: "Aryan Chauhan",
    role: 0,
    category: "media",
    guide: {
      en: "{pn} <video name | youtube url>"
    }
  },

  onStart: async function ({ api, event, args, message }) {
    if (!args.length)
      return message.reply("❌ Enter video name or YouTube URL.");

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      let url;

      if (args[0].startsWith("http")) {
        url = args[0];
      } else {
        const search = await yts(args.join(" "));
        if (!search.videos || !search.videos[0])
          throw new Error("No results");

        url = search.videos[0].url;
      }

      const apiUrl =
        "https://downvid.onrender.com/api/v1/download" +
        `?url=${encodeURIComponent(url)}&format=mp4`;

      const { data } = await axios.get(apiUrl);
      if (data.status !== "success" || !data.downloadUrl)
        throw new Error("API error");

      const file = path.join(CACHE, `${Date.now()}.mp4`);
      await streamToFile(data.downloadUrl, file);

      await message.reply({
        body: "🎥 Here is your video",
        attachment: fs.createReadStream(file)
      });

      fs.unlinkSync(file);
      api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (err) {
      console.error(err);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Failed to download video.");
    }
  }
};

async function streamToFile(url, filePath) {
  const res = await axios.get(url, { responseType: "stream" });
  const w = fs.createWriteStream(filePath);
  res.data.pipe(w);

  await new Promise((resolve, reject) => {
    w.on("finish", resolve);
    w.on("error", reject);
  });
}
