const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = {
    config: {
        name: "edit",
        aliases: ["nanopro", "nano", "editimg"],
        version: "1.3",
        author: "Rasel Mahmud",
        countDown: 0,
        role: 0,
        shortDescription: "AI Image Edit (Bangla + English supported)",
        category: "ai",
        guide: {
            en: "{pn} <prompt> (reply to image optional)",
            bn: "{pn} <প্রম্পট> (ইমেজ রিপ্লাই দিলেও চলবে)"
        },
    },

    onStart: async function ({ message, event, args, api }) {
        let prompt = args.join(" ").trim();
        const apiurl = "https://tawsif.is-a.dev/gemini/nano-banana";

        if (!prompt) return message.reply("❌ একটি প্রম্পট লিখুন।");

        api.setMessageReaction("⏳", event.messageID, () => {}, true);

        try {
            let imageUrl = null;

            // Reply-to-image
            if (event.messageReply && event.messageReply.attachments?.length > 0) {
                const att = event.messageReply.attachments[0];
                if (att.type === "photo") imageUrl = att.url;
            }

            // URL inside message
            const findUrl = args.find(x => x.startsWith("http"));
            if (!imageUrl && findUrl) {
                imageUrl = findUrl;
                prompt = prompt.replace(findUrl, "").trim();
            }

            if (!imageUrl) {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return message.reply("❌ ছবি পাওয়া যায়নি। দয়া করে একটি ছবিতে রিপ্লাই করুন।");
            }

            // API Request
            const res = await axios.get(apiurl, {
                params: {
                    prompt: prompt,
                    url: imageUrl
                }
            });

            if (!res.data || !res.data.imageUrl) {
                api.setMessageReaction("❌", event.messageID, () => {}, true);
                return message.reply("❌ API থেকে ছবি পাওয়া যায়নি।");
            }

            // Download edited image
            const editedURL = res.data.imageUrl;
            const img = await axios.get(editedURL, { responseType: "arraybuffer" });
            const buffer = Buffer.from(img.data, "binary");

            // Save temp file
            const cacheDir = path.join(__dirname, "cache");
            if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir);

            const filePath = path.join(cacheDir, `${Date.now()}.png`);
            fs.writeFileSync(filePath, buffer);

            api.setMessageReaction("✅", event.messageID, () => {}, true);

            // Stylish box message
            await message.reply(
                {
                    body: `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
|✨ Image Edited Successfully! ✅
|📝 Prompt: ${prompt}
╚═══════════════════╝`,
                    attachment: fs.createReadStream(filePath)
                },
                () => fs.unlinkSync(filePath)
            );

        } catch (error) {
            console.error("❌ ERROR:", error);
            api.setMessageReaction("❌", event.messageID, () => {}, true);
            return message.reply("❌ ইমেজ জেনারেশনে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।");
        }
    }
};
