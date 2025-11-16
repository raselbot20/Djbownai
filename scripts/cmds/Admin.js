const axios = require("axios");
const fs = require("fs-extra");

module.exports = {
  config: {
    name: "admin",
    aliases: ["owner", "botadmin"],
    version: "1.0.1",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Show bot owner/admin info",
    longDescription: "Displays information about the bot's owner or admin.",
    category: "system",
    guide: {
      en: "{pn} admin"
    }
  },

  onStart: async function ({ api, event, args }) {
    const input = args.join(" ").toLowerCase().replace(/\s+/g, " ");

    const validInputs = [
      "owner",
      "adminbot",
      "botadmin",
      "bot admin",
      "owner bot",
      "botowner",
      "ownerinfo",
      "adminbotinfo",
      "botadmininfo",
      "bot admin info",
      "owner bot info",
      "botownerinfo"
    ];

    // যদি ইনপুট না দেয়, তবুও কাজ করবে
    if (input && !validInputs.includes(input)) {
      return;
    }

    const msg = `
╔═══════◇🌟◇═══════╗
         𝘽𝙊𝙏 𝙊𝙒𝙉𝙀𝙍 𝙄𝙉𝙁𝙊
╚═══════◇💠◇═══════╝

╔🪪 Name      		: Rasel Mahmud					
╠📏 Height     		: 5 feet 8 inches
╠🌍 Location   		: Lives in Mymensingh, studies in Rajshahi
╠🔗 Facebook 1  	: https://www.facebook.com/raselmahmud.q
╠🛡️ YouTube    	: https://youtube.com/@rmsilentgaming
╚═══════════════════╝

═══════════◇✨◇═════════
Thanks for your interest in the owner!
   𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 💎✨𝐇𝓾𝐛
═══════════◇🔮◇═════════
`;

    const imgURL = "https://graph.facebook.com/100024220812646/picture?height=720&width=720&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662";
    const path = __dirname + "/admin_info.jpg";

    try {
      const res = await axios.get(imgURL, { responseType: "arraybuffer" });
      fs.writeFileSync(path, Buffer.from(res.data, "binary"));

      await api.sendMessage({
        body: msg,
        attachment: fs.createReadStream(path)
      }, event.threadID, () => fs.unlinkSync(path), event.messageID);

      api.setMessageReaction("🤺", event.messageID, () => {}, true);
    } catch (e) {
      console.error("⚠️ Error sending admin info:", e);
      api.sendMessage(msg, event.threadID, event.messageID);
    }
  }
};
