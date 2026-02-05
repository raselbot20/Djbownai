const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

module.exports = {
  config: {
    name: "instastalk",
    aliases: ["igstalk"],
    version: "1.2",
    author: "Aryan Chauhan",
    countDown: 5,
    role: 0,
    shortDescription: { en: "Stalk an Instagram profile" },
    longDescription: { en: "Fetches Instagram profile details (public) using Aryan API." },
    category: "INFORMATION",
    guide: {
      en: "{pn} <username>\n\nExample:\n{pn} arychauhann"
    }
  },

  onStart: async function ({ api, args, event }) {
    if (!args[0]) {
      return api.sendMessage(
        "❌ Please provide an Instagram username.",
        event.threadID,
        event.messageID
      );
    }

    const username = args[0].replace("@", "");
    api.setMessageReaction("⏳", event.messageID, () => {}, true);

    try {
      const apiConfig = await axios.get(
        "https://raw.githubusercontent.com/arychauhann/APIs/main/api.json"
      );

      const baseApi = apiConfig.data && apiConfig.data.ary;
      if (!baseApi) {
        throw new Error("ARY API base URL not found in GitHub api.json");
      }

      const url = `${baseApi}/api/instastalk?query=${encodeURIComponent(username)}`;
      const { data } = await axios.get(url);

      if (!data.status || !data.result) {
        return api.sendMessage(
          "❌ Could not fetch profile info.",
          event.threadID,
          event.messageID
        );
      }

      const result = data.result;

      const caption =
`📸 Instagram Profile Stalk

👤 Full Name: ${result.fullName || "N/A"}
🔗 Username: ${result.username || username}
📝 Bio: ${result.bio || "No bio"}
✅ Verified: ${result.isVerified ? "Yes" : "No"}

👥 Followers: ${result.followers ?? "N/A"}
📂 Uploads: ${result.uploads ?? "N/A"}
📊 Engagement: ${result.engagement ?? "N/A"}`;

      let attachment = null;

      if (result.profileImage) {
        try {
          const imgPath = path.join(
            __dirname,
            "cache",
            `insta_${event.senderID}_${Date.now()}.jpg`
          );

          const imgRes = await axios.get(result.profileImage, {
            responseType: "arraybuffer"
          });

          fs.ensureDirSync(path.dirname(imgPath));
          fs.writeFileSync(imgPath, Buffer.from(imgRes.data, "binary"));

          attachment = fs.createReadStream(imgPath);

          api.sendMessage(
            {
              body: caption,
              attachment
            },
            event.threadID,
            (err) => {
              try {
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
              } catch (e) {}
            },
            event.messageID
          );
        } catch (e) {
          console.error("Error sending profile image:", e.message);
          api.sendMessage(
            caption,
            event.threadID,
            event.messageID
          );
        }
      } else {
        api.sendMessage(
          caption,
          event.threadID,
          event.messageID
        );
      }

      api.setMessageReaction("✅", event.messageID, () => {}, true);
    } catch (err) {
      console.error("❌ Instastalk Error:", err);
      api.sendMessage(
        "❌ Failed to fetch Instagram profile info.",
        event.threadID,
        event.messageID
      );
      api.setMessageReaction("❌", event.messageID, () => {}, true);
    }
  }
};
