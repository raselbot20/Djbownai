const fs = require("fs-extra");
const path = require("path");
const jimp = require("jimp");

module.exports = {
  config: {
    name: "dustbin",
    version: "2.1",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Put someone in the dustbin",
    longDescription: "Generate a funny dustbin meme with mentioned/replied user's avatar",
    category: "fun",
    guide: "{pn} @tag | reply"
  },

  onStart: async function({ api, event }) {
    const threadID = event.threadID;
    const messageID = event.messageID;

    try {
      // --- Determine target user ---
      let uid, name;
      const mentions = Object.keys(event.mentions || {});
      if (mentions.length > 0) {
        uid = mentions[0];
        name = event.mentions[uid];
      } else if (event.type === "message_reply") {
        uid = event.messageReply.senderID;
        const info = await api.getUserInfo(uid);
        name = info[uid].name;
      } else {
        uid = event.senderID;
        const info = await api.getUserInfo(uid);
        name = info[uid].name;
      }

      // --- Prepare tmp folder ---
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);

      // --- Reactions ---
      try { api.setMessageReaction("⏳", messageID, () => {}, true); } catch(e){}

      // --- Avatar download ---
      const avatarUrl = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
      const avatarPath = path.join(tmpDir, `avatar_${uid}.png`);
      const avatarData = (await require("axios").get(avatarUrl, { responseType: "arraybuffer" })).data;
      fs.writeFileSync(avatarPath, Buffer.from(avatarData));

      // --- Dustbin template (manual place in tmp) ---
      const templatePath = path.join(tmpDir, "dustbin.png");
      if (!fs.existsSync(templatePath)) 
        return api.sendMessage("❌ Dustbin template missing!\nPlease place 'dustbin.png' in scripts/cmds/tmp/", threadID, messageID);

      // --- Processing ---
      try { api.setMessageReaction("🚮", messageID, () => {}, true); } catch(e){}

      const base = await jimp.read(templatePath);
      const avatarCircle = await jimp.read(avatarPath);
      avatarCircle.circle();

      base.composite(avatarCircle.resize(120, 120), 162, 410);

      const outputPath = path.join(tmpDir, `dustbin_final_${uid}_${Date.now()}.png`);
      await base.writeAsync(outputPath);

      // --- Success reaction ---
      try { api.setMessageReaction("✅", messageID, () => {}, true); } catch(e){}

      // --- Send final image ---
      api.sendMessage({
        body: `😂 ${name} 🚮`,
        attachment: fs.createReadStream(outputPath)
      }, threadID, () => {
        try { fs.unlinkSync(avatarPath); } catch(e){}
        try { fs.unlinkSync(outputPath); } catch(e){}
      }, messageID);

    } catch (err) {
      console.log(err);
      try { api.setMessageReaction("❌", messageID, () => {}, true); } catch(e){}
      api.sendMessage("⚠️ Something went wrong!\n" + err, threadID, messageID);
    }
  }
};
