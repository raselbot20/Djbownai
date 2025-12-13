module.exports = {
  config: {
    name: "babyhi",
    version: "2.0",
    author: "Rasel Mahmud",
    credit: "Rasel Mahmud",
    description: "Stylish auto reply with mention when someone says bot, heli, helilumo or lumo",
    category: "fun"
  },
  onStart: async function () {},
  onChat: async function ({ event, api }) {
    const body = (event.body || "").toLowerCase();
    const triggers = ["bot", "heli", "helilumo", "baby", "bby"];
    if (triggers.some(word => body.includes(word))) {
      const senderID = event.senderID;
      let name = "User";
      try {
        const userInfo = await api.getUserInfo(senderID);
        name = userInfo[senderID]?.name || "User";
      } catch (e) {}
      const msg = `𝗛𝗲𝘆 @${name} \n 𝗧𝘆𝗽𝗲 → *𝑩𝒂𝒃𝒚 𝒉𝒊`;
      api.sendMessage(
        {
          body: msg,
          mentions: [{ tag: `@${name}`, id: senderID }]
        },
        event.threadID,
        async (err, info) => {
          if (!err) {
            // 10 সেকেন্ড পর মেসেজ রিমুভ করবে
            setTimeout(() => {
              api.unsendMessage(info.messageID);
            }, 10000);
          }
        },
        event.messageID
      );
    }
  }
};
