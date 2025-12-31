const yts = require("yt-search");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const CACHE = path.join(__dirname, "cache");
if (!fs.existsSync(CACHE)) fs.mkdirSync(CACHE);

module.exports = {
  config: {
    name: "ytb",
    version: "1.1.1",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    category: "media",
    guide: {
      en:
        "{pn} -v <name> : download video\n" +
        "{pn} -a <name> : download audio\n" +
        "{pn} -u <url> -v|-a : download from url"
    }
  },

  onStart: async function ({ args, message, event, api, commandName }) {
    const type = args[0];
    if (!type) return message.SyntaxError();

    if (type === "-u") {
      const url = args[1];
      const mode = args[2] || "-v";
      if (!url) return message.reply("❌ Please provide a YouTube URL.");

      api.setMessageReaction("⏳", event.messageID, () => {}, true);

      try {
        if (mode === "-a") {
          await downloadAudio(url, message);
        } else {
          await downloadVideo(url, message);
        }
        api.setMessageReaction("✅", event.messageID, () => {}, true);
      } catch (e) {
        console.error(e);
        api.setMessageReaction("❌", event.messageID, () => {}, true);
        message.reply("❌ Download failed.");
      }
      return;
    }

    if (!["-v", "-a"].includes(type))
      return message.reply("❌ Use -v or -a");

    const query = args.slice(1).join(" ");
    if (!query) return message.SyntaxError();

    const res = await yts(query);
    const results = res.videos.slice(0, 5);

    if (!results.length) return message.reply("❌ No results found.");

    const body = results
      .map((v, i) => `${i + 1}. ${v.title}\n⏱ ${v.timestamp}`)
      .join("\n\n");

    const thumbs = await Promise.all(
      results.map(v => getStream(v.thumbnail))
    );

    const msg = await message.reply({
      body: `🎬 Choose a track:\n\n${body}\n\nReply with number (1-5)`,
      attachment: thumbs
    });

    global.GoatBot.onReply.set(msg.messageID, {
      commandName,
      author: event.senderID,
      messageID: msg.messageID,
      results,
      type
    });
  },

  onReply: async function ({ event, api, Reply, message }) {
    if (event.senderID !== Reply.author) return;

    const index = parseInt(event.body);
    if (isNaN(index) || index < 1 || index > Reply.results.length)
      return message.reply("❌ Invalid choice.");

    const video = Reply.results[index - 1];
    await api.unsendMessage(Reply.messageID);

    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      if (Reply.type === "-a") {
        await downloadAudio(video.url, message);
      } else {
        await downloadVideo(video.url, message);
      }
      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (e) {
      console.error(e);
      api.setMessageReaction("❌", event.messageID, () => {}, true);
      message.reply("❌ Download failed.");
    }
  }
};

async function downloadVideo(url, message) {
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
}

async function downloadAudio(url, message) {
  const apiUrl =
    "https://downvid.onrender.com/api/v1/download" +
    `?url=${encodeURIComponent(url)}&format=mp3`;

  const { data } = await axios.get(apiUrl);
  if (data.status !== "success" || !data.downloadUrl)
    throw new Error("API error");

  const file = path.join(CACHE, `${Date.now()}.mp3`);
  await streamToFile(data.downloadUrl, file);

  await message.reply({
    body: "🎧 Here is your audio",
    attachment: fs.createReadStream(file)
  });

  fs.unlinkSync(file);
}

async function streamToFile(url, filePath) {
  const res = await axios.get(url, { responseType: "stream" });
  const w = fs.createWriteStream(filePath);
  res.data.pipe(w);

  await new Promise((resolve, reject) => {
    w.on("finish", resolve);
    w.on("error", reject);
  });
}

async function getStream(url) {
  const res = await axios.get(url, { responseType: "stream" });
  return res.data;
}
