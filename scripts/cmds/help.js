const { getPrefix } = global.utils;
const { commands, aliases } = global.GoatBot;

module.exports = {
  config: {
    name: "help",
    version: "3.5",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    description: "View command information with enhanced interface",
    category: "info",
    guide: "{pn} [command] - View command details\n{pn} all - View all commands\n{pn} c [category] - View commands in category"
  },

  onStart: async function({ message, args, event, role }) {
    const prefix = getPrefix(event.threadID);
    const commandName = args[0]?.toLowerCase();

    // Mid-centered Bot name (top & bottom)
    const botNameTop = "								╔═❰ ✨ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 💎✨ ❱═╗";
    const botNameBottom = "								❰𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢❱";

    // Footer template (normal text)
    const footer = `
─━─━─━─━─━─━─━─▢
┃ ⬤ Total cmds: ${commands.size}
┃ ⬤ Type [*help <cmd>] to learn the usage.
┃ ⬤ Type '*supportgc' to join supportgc
┃ ⬤ Type '*addowner' to add bot admin to your group chat
┗─━─━─━─━─━─━─━─▢
`;

    if (!commandName || commandName === "all") {
      // Build categories & commands
      const categoryMap = new Map();
      for (const [name, cmd] of commands) {
        if (cmd.config.role > 1 && role < cmd.config.role) continue;
        const category = cmd.config.category?.toUpperCase() || "GENERAL";
        if (!categoryMap.has(category)) categoryMap.set(category, []);
        categoryMap.get(category).push(name);
      }

      let replyMsg = botNameTop + "\n\n";

      // Add each category (bold Unicode)
      const sortedCategories = [...categoryMap.keys()];
      for (const cat of sortedCategories) {
        replyMsg += `									❖${cat}❖\n› ${categoryMap.get(cat).join(" › ")}\n\n`;
      }

      replyMsg += footer + "\n" + botNameBottom;

      return message.reply(replyMsg);
    }

    // Single command info
    const cmd = commands.get(commandName) || commands.get(aliases.get(commandName));
    if (!cmd) return message.reply(`⚠️ Command '${commandName}' not found!`);

    const config = cmd.config;
    const description = config.description?.en || config.description || "No description";
    const aliasesList = config.aliases?.join(", ") || "None";
    const category = config.category?.toUpperCase() || "GENERAL";

    let roleText;
    switch(config.role) {
      case 1: roleText = "👑 Group Admins"; break;
      case 2: roleText = "⚡ Bot Admins"; break;
      default: roleText = "👥 All Users";
    }

    let guide = config.guide?.en || config.usage || "No usage guide available";
    if (typeof guide === "object") guide = guide.body;
    guide = guide.replace(/\{prefix\}/g, prefix).replace(/\{name\}/g, config.name).replace(/\{pn\}/g, prefix + config.name);

    const singleCmdOutput = `
╔═❰ 𝗖𝗢𝗠𝗠𝗔𝗡𝗗 𝗜𝗡𝗙𝗢 ❱═╗
𝗡𝗮𝗺𝗲: ${config.name}
𝗗𝗲𝘀𝗰𝗿𝗶𝗽𝘁𝗶𝗼𝗻: ${description}
𝗖𝗮𝘁𝗲𝗴𝗼𝗿𝘆: ${category}
𝗔𝗹𝗶𝗮𝘀𝗲𝘀: ${aliasesList}
𝗩𝗲𝗿𝘀𝗶𝗼𝗻: ${config.version}
𝗣𝗲𝗿𝗺𝗶𝘀𝘀𝗶𝗼𝗻𝘀: ${roleText}
𝗖𝗼𝗼𝗹𝗱𝗼𝘄𝗻: ${config.countDown || 1}s
𝗨𝘀𝗮𝗴𝗲: ${guide}
╚═════════════════╝
`;

    return message.reply(singleCmdOutput);
  }
};
