module.exports = {
  config: {
    name: "babyhi",
    version: "2.2",
    author: "Rasel Mahmud",
    credit: "Rasel Mahmud",
    description: "Bot works anywhere, baby/bby works only exact",
    category: "CHAT"
  },

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    if (!event.body) return;

    const body = event.body.trim().toLowerCase();
    const senderID = event.senderID;

    let shouldReply = false;

    // 🔹 bot → যেকোনো জায়গায় থাকলেই
    if (body.includes("bot")) {
      shouldReply = true;
    }

    // 🔹 baby / bby → শুধু exact হলে
    const exactBaby = ["baby", "bby", "*baby", "*bby"];
    if (exactBaby.includes(body)) {
      shouldReply = true;
    }

    if (!shouldReply) return;

    let name = "User";
    try {
      const userInfo = await api.getUserInfo(senderID);
      name = userInfo[senderID]?.name || "User";
    } catch (e) {}

    const msg = `𝗛𝗲𝘆 @${name}\n𝗧𝘆𝗽𝗲 → *𝑩𝒂𝒃𝒚 𝒉𝒊`;

    api.sendMessage(
      {
        body: msg,
        mentions: [{ tag: `@${name}`, id: senderID }]
      },
      event.threadID,
      (err, info) => {
        if (!err) {
          setTimeout(() => {
            api.unsendMessage(info.messageID);
          }, 10000);
        }
      },
      event.messageID
    );
  }
};
