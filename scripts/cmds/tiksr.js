const axios = require("axios");

const baseApiUrl = async () => {
    const base = await axios.get(
        `https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json`,
    );
    return base.data.api;
};

module.exports.config = {
    name: "tiksr",
    aliases: ["tiktok"],
    version: "1.0",
    author: "Mesbah Bb'e",
    countDown: 5,
    role: 0,
    description: {
        en: "Search for TikTok videos",
    },
    category: "MEDIA",
    guide: {
        en:
            "{pn} <search> - <optional: number of results | blank>" +
            "\nExample:" +
            "\n{pn} caredit - 50",
    },
};

module.exports.onStart = async function ({ api, args, event }) {
    let search = args.join(" ");
    let searchLimit = 30;

    // REACTION: Processing
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    const match = search.match(/^(.+)\s*-\s*(\d+)$/);
    if (match) {
        search = match[1].trim();
        searchLimit = parseInt(match[2], 10);
    }

    const apiUrl = `${await baseApiUrl()}/tiktoksearch?search=${encodeURIComponent(search)}&limit=${searchLimit}`;

    try {
        const response = await axios.get(apiUrl);
        const data = response.data.data;
        const videoData = data[Math.floor(Math.random() * data.length)];

        const stream = await axios({
            method: "get",
            url: videoData.video,
            responseType: "stream",
        });

        let infoMessage = `╔═══❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═══╗
✅🔗 Video URL: ${videoData.video}
╚═══════════════╝\n`;

        api.sendMessage(
            { body: infoMessage, attachment: stream.data },
            event.threadID,
        );

        // REACTION: Success
        api.setMessageReaction("✅", event.messageID, () => {}, true);

    } catch (error) {
        console.error(error);

        // REACTION: Error
        api.setMessageReaction("❌", event.messageID, () => {}, true);

        api.sendMessage(
            "An error occurred while downloading the TikTok video.",
            event.threadID,
        );
    }
};
