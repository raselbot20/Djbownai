module.exports = {
  config: {
    name: "autosticker",
    version: "3.0",
    author: "xalman",
    countDown: 1,
    role: 0,
    description: "Replies with a random sticker from the list when any sticker is sent.",
    category: "no prefix",
    guide: ""
  },

  onChat: async function ({ api, event }) {
    const { attachments, type, threadID, messageID } = event;

    if (type === "message" && attachments && attachments[0] && attachments[0].type === "sticker") {
      
      const allStickers = [
        "529234074205621",
        "2041012539459553",
        "2041012109459596",
        "2041012262792914",
        "2041011389459668",
        "2041011836126290",
        "2041012406126233"
      ];

      const randomSticker = allStickers[Math.floor(Math.random() * allStickers.length)];

      return api.sendMessage({
        sticker: randomSticker
      }, threadID, messageID);
    }
  },

  onStart: async function ({}) {
  }
};
