module.exports = {
  config: {
    name: "bossbusy",
    version: "1.1",
    author: "Rasel Mahmud",
    credit: "Rasel Mahmud",
    description: "Auto reply + react when someone mentions Rasel Mahmud or his UID",
    category: "fun"
  },

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    const { mentions, body, threadID, messageID, senderID } = event;
    const text = (body || "").toLowerCase();

    const targetUID = "100024220812646";
    const targetName = "rasel mahmud";

    // Mention detect করা
    const mentioned =
      (mentions && Object.keys(mentions).includes(targetUID)) ||
      text.includes(targetName);

    if (mentioned) {
      const message = `🫅 𝗕𝗼𝘀𝘀 𝗥𝗮𝘀𝗲𝗹 𝗠𝗮𝗵𝗺𝘂𝗱 𝗶𝘀 𝗰𝘂𝗿𝗿𝗲𝗻𝘁𝗹𝘆 𝗯𝘂𝘀𝘆 𝘄𝗶𝘁𝗵 𝗿𝗲𝗮𝘀𝗼𝗻:\n\n✧ Assalamualaikum 🌺💙🌹\n✧ আমাকে স্মরণ করার জন্য আপনাকে  \n° ধন্যবাদ»̶̶͓͓͓̽̽̽⑅⃝✺𝄞𒆜🫰🌺\n✧ দুঃখজনক হলেও বলতে হচ্ছে আপনাদের  \n° সাথে আমি আর আগের মত আড্ডা দিতে  \n° পারব না । আমার আমিটা কে প্রমাণ করতে  \n° নিজেকে গুটিয়ে নিলাম ।  \n\n✧ 🫰🌺 𝗥𝗮𝘀𝗲𝗹 𝗠𝗮𝗵𝗺𝘂𝗱 🌺🫰 ✧`;

      // মেসেজ পাঠানো
      api.sendMessage({ body: message }, threadID, messageID);

      // যে mention করেছে বা লিখেছে, তার মেসেজে react দেবে 🫅
      api.setMessageReaction("🫅", messageID, () => {}, true);
    }
  }
};
