module.exports = {
  config: {
    name: "linkarr",
    aliases: ["arr", "array"],
    version: "3.0",
    author: "Rasel Mahmud",
    role: 0,
    shortDescription: "Convert links to clean JSON array",
    category: "utility",
    guide: "{p}linkarr <links> | reply message"
  },

  onStart: async function ({ api, event, args }) {
    let text = "";

    // reply message থেকে text নেওয়া
    if (event.messageReply && event.messageReply.body) {
      text = event.messageReply.body;
    } 
    // command args থেকে text নেওয়া
    else if (args.length > 0) {
      text = args.join(" ");
    }

    if (!text) {
      return api.sendMessage("❌ No links provided!", event.threadID, event.messageID);
    }

    // valid https URLs only
    const urlRegex = /https?:\/\/[^\s"'<>]+/gi;
    let links = text.match(urlRegex) || [];

    // filter out empty strings & invalid URLs
    links = links
      .map(l => l.trim())
      .filter(l => l && l.startsWith("http"));

    // remove duplicates
    links = [...new Set(links)];

    if (links.length === 0) {
      return api.sendMessage("❌ No valid links found!", event.threadID, event.messageID);
    }

    // clean JSON array output
    const output = "[\n  " + links.map(l => `"${l}"`).join(",\n  ") + "\n]";

    return api.sendMessage(output, event.threadID, event.messageID);
  }
};
