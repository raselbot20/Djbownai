module.exports = {

  config: {

    name: "inbox",

    aliases: ["in"],

    version: "1.0",

    author: "Rasel Mahmud",

    countDown: 10,

    role: 0,

    shortDescription: {

      en: "Bot will Go Your Inbox And Add Your Group "

    },

    longDescription: {

      en: ""

    },

    category: "fun",

    guide: {

      en: ""

    }

  },

  langs: {

    en: {

      gg: ""

    },

    id: {

      gg: ""

    }

  },

  onStart: async function({ api, event, args, message }) {

    try {

      const query = encodeURIComponent(args.join(' '));

      message.reply("✅ SUCCESSFULLY SEND MESSAGE \n\n🔰PLEASE CHECK YOUR INBOX ,  PLEASE SEE IT😘", event.threadID);

      api.sendMessage("✅ HELLO, BROTHER AND SISTER\n🔰 NOW I AM IN YOUR INBOX   ,  ADD YOUR GROUP❤️‍🩹", event.senderID);

    } catch (error) {

      console.error("Error bro: " + error);

    }

  }

}
