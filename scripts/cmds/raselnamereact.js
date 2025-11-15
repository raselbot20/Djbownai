module.exports = {
  config: {
    name: "raselreact",
    version: "2.0",
    author: "Rasel Mahmud",
    credit: "Rasel Mahmud",
    description: "React 🫅 whenever someone types Rasel or রাসেল (any font, any style)",
    category: "fun"
  },

  onStart: async function () {},

  onChat: async function ({ event, api }) {
    const { body, messageID } = event;
    if (!body) return;

    // ফন্ট/স্টাইল normalize করার জন্য টেক্সট ছোট হাতের অক্ষরে নেবে
    const text = body
      .toLowerCase()
      // fancy font গুলোকে normalize করার জন্য সব symbol replace
      .normalize("NFKD")
      .replace(/[^a-zA-Z\u0980-\u09FF]/g, "");

    // বাংলা এবং ইংরেজি সব ফর্ম
    const patterns = [
      "rasel", "রাসেল", "রাশেল", "r4sel", "ɾasel", "ʀasel",
      "ʀᴀsᴇʟ", "ʀɑsel", "ʀaꜱel", "𝓻𝓪𝓼𝓮𝓵", "𝘳𝘢𝘴𝘦𝘭", "𝗿𝗮𝘀𝗲𝗹",
      "𝐫𝐚𝐬𝐞𝐥", "𝒓𝒂𝒔𝒆𝒍", "𝑟𝑎𝑠𝑒𝑙", "𝕣𝕒𝕤𝕖𝕝", "🅁🄰🅂🄴🄻", "ʀⲁѕeℓ",
      "raselm", "raselmahmud", "রাসেলমাহমুদ"
    ];

    // মিল খুঁজবে
    if (patterns.some(word => text.includes(word))) {
      api.setMessageReaction("🫅", messageID, () => {}, true);
    }
  }
};
