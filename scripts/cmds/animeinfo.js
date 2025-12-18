const axios = require("axios");

module.exports.config = {
  name: "animeinfo",
  version: "1.0.0",
  role: 0,
  author: "Rasel Mahmud",
  description: "Search anime cover and story",
  category: "media",
  usages: "[anime name]",
  cooldowns: 5
};

module.exports.onStart = async function ({ api, event, args }) {
  const query = args.join(" ");
  if (!query) {
    return api.sendMessage(
      "🎴 Anime name lekho",
      event.threadID,
      event.messageID
    );
  }

  try {
    const res = await axios.get("https://api.jikan.moe/v4/anime", {
      params: { q: query, limit: 1, sfw: true }
    });

    const anime = res.data.data[0];
    if (!anime) {
      return api.sendMessage(
        "❌ Kono anime paoa jay nai",
        event.threadID,
        event.messageID
      );
    }

    const title = anime.title_english || anime.title;
    const synopsis = anime.synopsis || "No description";
    const img =
      anime.images?.jpg?.large_image_url ||
      anime.images?.jpg?.image_url;

    const body =
`🎴 ${title}

📺 Type: ${anime.type}
📅 Year: ${anime.year}
⭐ Score: ${anime.score}

🧾 Story:
${synopsis}`;

    if (img) {
      const pic = await axios.get(img, { responseType: "stream" });
      return api.sendMessage(
        { body, attachment: pic.data },
        event.threadID,
        event.messageID
      );
    } else {
      return api.sendMessage(body, event.threadID, event.messageID);
    }

  } catch (e) {
    return api.sendMessage(
      "⚠️ Error hoise, pore try koro",
      event.threadID,
      event.messageID
    );
  }
};
