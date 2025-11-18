const fs = require("fs-extra");
const path = require("path");
const axios = require("axios");
const { createCanvas, loadImage } = require("canvas");

module.exports = {
    config: {
        name: "toilet",
        version: "4.3",
        author: "Rasel Mahmud",
        countDown: 5,
        role: 0,
        shortDescription: "Put someone in toilet",
        longDescription: "Funny toilet meme with target avatar nicely positioned",
        category: "fun",
        guide: {
            en: "{pn} @tag or reply"
        }
    },

    onLoad: async () => {
        const cacheDir = path.join(__dirname, "cache");
        const toiletPath = path.join(cacheDir, "toilet.png");
        if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });
        if (!fs.existsSync(toiletPath)) {
            const res = await axios.get(
                "https://drive.google.com/uc?id=13ZqFryD-YY-JTs34lcy6b_w36UCCk0EI&export=download",
                { responseType: "arraybuffer" }
            );
            fs.writeFileSync(toiletPath, res.data);
        }
    },

    onStart: async ({ api, event }) => {
        const mentions = Object.keys(event.mentions || {});
        const messageReply = event.messageReply;
        let targetID = null;

        if (mentions.length > 0) {
            targetID = mentions[0];
        } else if (messageReply) {
            targetID = messageReply.senderID;
        } else {
            return api.sendMessage("⚠️ Please tag or reply to someone!", event.threadID, event.messageID);
        }

        try { api.setMessageReaction("⏳", event.messageID, () => {}, true); } catch(e){}

        try {
            const output = await generateImage(targetID);

            api.sendMessage(
                { body: "তোকে টয়লেটে ফেলে দিলাম 🤣🚽", attachment: fs.createReadStream(output) },
                event.threadID,
                () => {
                    fs.unlinkSync(output);
                    try { api.setMessageReaction("✅", event.messageID, () => {}, true); } catch(e){}
                },
                event.messageID
            );
        } catch (err) {
            console.error(err);
            try { api.setMessageReaction("❌", event.messageID, () => {}, true); } catch(e){}
            api.sendMessage("❌ Error while generating the toilet pic!", event.threadID, event.messageID);
        }
    }
};

// ===== Helper Functions =====
async function generateImage(targetID) {
    const cache = path.join(__dirname, "cache");
    const templatePath = path.join(cache, "toilet.png");
    const outputPath = path.join(cache, `toilet_${targetID}_${Date.now()}.png`);
    const avatarPath = path.join(cache, `avatar_${targetID}.png`);

    // Download avatar
    await downloadAvatar(targetID, avatarPath);

    // Load images
    const template = await loadImage(templatePath);
    const avatar = await loadImage(avatarPath);

    // Canvas
    const canvas = createCanvas(template.width, template.height);
    const ctx = canvas.getContext("2d");

    // Draw template
    ctx.drawImage(template, 0, 0);

    // Smaller avatar & nicely positioned
    const avatarSize = 70; // jimp কোডের মতো 70px
    const x = 100; // jimp কোড থেকে নেওয়া
    const y = 200; // jimp কোড থেকে নেওয়া

    // Draw circular avatar
    ctx.save();
    ctx.beginPath();
    ctx.arc(x + avatarSize / 2, y + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(avatar, x, y, avatarSize, avatarSize);
    ctx.restore();

    // Save final image
    const buffer = canvas.toBuffer("image/png");
    await fs.outputFile(outputPath, buffer);

    // Clean up
    fs.unlinkSync(avatarPath);

    return outputPath;
}

async function downloadAvatar(uid, savePath) {
    const url = `https://graph.facebook.com/${uid}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`;
    const data = (await axios.get(url, { responseType: "arraybuffer" })).data;
    fs.writeFileSync(savePath, Buffer.from(data));
}
