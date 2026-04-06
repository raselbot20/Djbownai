const axios = require("axios");
const FormData = require("form-data");

const fonts = {
  bold: (text) => {
    if (!text) return "";
    const str = String(text);
    const map = {
      'A': '𝐀', 'B': '𝐁', 'C': '𝐂', 'D': '𝐃', 'E': '𝐄', 'F': '𝐅', 'G': '𝐆', 'H': '𝐇', 'I': '𝐈', 'J': '𝐉', 'K': '𝐊', 'L': '𝐋', 'M': '𝐌', 'N': '𝐍', 'O': '𝐎', 'P': '𝐏', 'Q': '𝐐', 'R': '𝐑', 'S': '𝐒', 'T': '𝐓', 'U': '𝐔', 'V': '𝐕', 'W': '𝐖', 'X': '𝐗', 'Y': '𝐘', 'Z': '𝐙',
      'a': '𝐚', 'b': '𝐛', 'c': '𝐜', 'd': '𝐝', 'e': '𝐞', 'f': '𝐟', 'g': '𝐠', 'h': '𝐡', 'i': '𝐢', 'j': '𝐣', 'k': '𝐤', 'l': '𝐥', 'm': '𝐦', 'n': '𝐧', 'o': '𝐨', 'p': '𝐩', 'q': '𝐪', 'r': '𝐫', 's': '𝐬', 't': '𝐭', 'u': '𝐮', 'v': '𝐯', 'w': '𝐰', 'x': '𝐱', 'y': '𝐲', 'z': '𝐳',
      '0': '𝟎', '1': '𝟏', '2': '𝟐', '3': '𝟑', '4': '𝟒', '5': '𝟓', '6': '𝟔', '7': '𝟕', '8': '𝟖', '9': '𝟗'
    };
    return str.split('').map(char => map[char] || char).join('');
  }
};

const BASE = "https://filthy-milzie-beb-bot-e9c14634.koyeb.app";
const HEADERS = {
  "X-API-Key": "onlyforstbotusersV2.4.78",
  "apikey": "chudmaranirpula"
};

async function processImage(message, event, model) {
  const processMsg = await message.reply(`⏳ ${fonts.bold("𝐏𝐫𝐨𝐜𝐞𝐬𝐬𝐢𝐧𝐠 𝐢𝐦𝐚𝐠𝐞, 𝐩𝐥𝐞𝐚𝐬𝐞 𝐰𝐚𝐢𝐭...")}`);
  const startTime = Date.now();

  try {
    const imageUrl = event.messageReply?.attachments?.[0]?.url;
    if (!imageUrl) throw new Error("No image URL found.");

    const imgStream = await axios({ url: imageUrl, responseType: "stream" });

    const form = new FormData();
    form.append("image", imgStream.data, "input.jpg");
    form.append("model_id", String(model.id));

    const res = await axios.post(`${BASE}/aimirror`, form, {
      headers: { ...form.getHeaders(), ...HEADERS },
      maxBodyLength: Infinity,
      timeout: 120000
    });

    if (!res.data?.success || !res.data?.images?.length) {
      throw new Error("Failed to generate images from API.");
    }

    const attachments = await Promise.all(
      res.data.images.map(async (url) => {
        const img = await axios({ url, responseType: "stream" });
        img.data.path = "output.jpg";
        return img.data;
      })
    );

    const processTime = ((Date.now() - startTime) / 1000).toFixed(2);
    await message.unsend(processMsg.messageID).catch(() => {});

    const successCard = 
      `✅ ${fonts.bold("𝐀𝐈 𝐀𝐫𝐭 𝐑𝐞𝐬𝐮𝐥𝐭𝐬")}\n\n` +
      `🎨 ${fonts.bold("𝐌𝐨𝐝𝐞𝐥")} : ${model.name || model.id}\n` +
      `🆔 ${fonts.bold("𝐈𝐃")} : ${model.id}\n` +
      `⏱️ ${fonts.bold("𝐓𝐢𝐦𝐞")} : ${processTime}s`;

    return message.reply({ body: successCard, attachment: attachments });

  } catch (err) {
    await message.unsend(processMsg.messageID).catch(() => {});
    return message.reply(`❌ ${fonts.bold("𝐄𝐫𝐫𝐨𝐫:")} ${err.message}`);
  }
}

module.exports = {
  config: {
    name: "art2",
    aliases: ["animefilter", "aimirror"],
    version: "2.4.79",
    author: "𝐑𝐚𝐟𝐢 𝐂𝐡𝐨𝐰𝐝𝐡𝐮𝐫𝐲́ 𝐈𝐈 🫦💌",
    countDown: 5,
    role: 0,
    description: "Transform images using AI Art models",
    category: "image",
    guide: {
      en: "Reply to an image:\n{pn} - Default model (103)\n{pn} <ID> - Specific model\n{pn} models - List models\n{pn} models <page> - Specific page\n{pn} -s <name> - Search models"
    }
  },

  onStart: async function ({ message, event, args }) {
    const { senderID, messageReply } = event;

    if (args[0] === "models" || args[0] === "list") {
      try {
        const res = await axios.get(`${BASE}/aimirror/models`, { headers: HEADERS });
        const allModels = res.data.models || [];
        if (!allModels.length) return message.reply(`❌ ${fonts.bold("𝐍𝐨 𝐦𝐨𝐝𝐞𝐥𝐬 𝐚𝐯𝐚𝐢𝐥𝐚𝐛𝐥𝐞.")}`);

        const page = parseInt(args[1]) || 1;
        const perPage = 50;
        const total = Math.ceil(allModels.length / perPage);
        
        if (page < 1 || page > total) return message.reply(`❌ ${fonts.bold(`𝐈𝐧𝐯𝐚𝐥𝐢𝐝 𝐩𝐚𝐠𝐞. 𝐕𝐚𝐥𝐢𝐝 𝐩𝐚𝐠𝐞𝐬: 𝟏-${total}`)}`);

        const start = (page - 1) * perPage;
        let listStr = `📋 ${fonts.bold(`𝐀𝐈 𝐀𝐫𝐭 𝐌𝐨𝐝𝐞𝐥𝐬 (𝐏𝐚𝐠𝐞 ${page}/${total})`)}\n\n`;
        
        allModels.slice(start, start + perPage).forEach((m, i) => {
          listStr += `${fonts.bold((start + i + 1).toString())}. ${m.name}\n`;
        });
        
        listStr += `\n📄 ${fonts.bold(`𝐓𝐨𝐭𝐚𝐥: ${allModels.length} | 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐧𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐬𝐞𝐥𝐞𝐜𝐭`)}`;

        const replyMsg = await message.reply(listStr);
        return global.GoatBot.onReply.set(replyMsg.messageID, {
          commandName: "art",
          author: senderID,
          type: "modelList",
          models: allModels,
          messageID: replyMsg.messageID
        });
      } catch (e) { 
        return message.reply(`❌ ${fonts.bold("𝐀𝐏𝐈 𝐄𝐫𝐫𝐨𝐫:")} ${e.message}`); 
      }
    }

    if (args[0] === "-s" || args[0] === "search") {
      const keyword = args.slice(1).join(" ");
      if (!keyword) return message.reply(`❌ ${fonts.bold("𝐏𝐫𝐨𝐯𝐢𝐝𝐞 𝐚 𝐬𝐞𝐚𝐫𝐜𝐡 𝐤𝐞𝐲𝐰𝐨𝐫𝐝.")}`);
      
      try {
        const res = await axios.get(`${BASE}/aimirror/models`, { headers: HEADERS, params: { search: keyword } });
        const results = res.data.models || [];
        if (!results.length) return message.reply(`❌ ${fonts.bold(`𝐍𝐨 𝐫𝐞𝐬𝐮𝐥𝐭𝐬 𝐟𝐨𝐮𝐧𝐝 𝐟𝐨𝐫 "${keyword}".`)}`);

        let listStr = `🔍 ${fonts.bold(`𝐒𝐞𝐚𝐫𝐜𝐡: "${keyword}"`)}\n\n`;
        results.forEach((m, i) => listStr += `${fonts.bold((i + 1).toString())}. ${m.name}\n`);
        listStr += `\n📄 ${fonts.bold(`${results.length} 𝐟𝐨𝐮𝐧𝐝 | 𝐑𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐧𝐮𝐦𝐛𝐞𝐫 𝐭𝐨 𝐬𝐞𝐥𝐞𝐜𝐭`)}`;

        const replyMsg = await message.reply(listStr);
        return global.GoatBot.onReply.set(replyMsg.messageID, {
          commandName: "art",
          author: senderID,
          type: "searchResults",
          searchResults: results,
          messageID: replyMsg.messageID
        });
      } catch (e) { 
        return message.reply(`❌ ${fonts.bold("𝐒𝐞𝐚𝐫𝐜𝐡 𝐄𝐫𝐫𝐨𝐫:")} ${e.message}`); 
      }
    }

    const attachment = messageReply?.attachments?.[0];
    if (!attachment || attachment.type !== "photo") {
      return message.reply(`❌ ${fonts.bold("𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐧 𝐢𝐦𝐚𝐠𝐞.")}`);
    }

    const modelId = (!isNaN(args[0]) && args[0]) ? parseInt(args[0]) : 103;
    return processImage(message, event, { id: modelId, name: `Model ${modelId}` });
  },

  onReply: async function ({ message, event, Reply, args }) {
    if (Reply.author !== event.senderID) return;
    
    const input = args.join(" ").trim();
    const serialNo = parseInt(input.replace("-sn ", ""));

    if (isNaN(serialNo)) return message.reply(`❌ ${fonts.bold("𝐏𝐥𝐞𝐚𝐬𝐞 𝐫𝐞𝐩𝐥𝐲 𝐰𝐢𝐭𝐡 𝐚 𝐯𝐚𝐥𝐢𝐝 𝐧𝐮𝐦𝐛𝐞𝐫.")}`);

    const list = Reply.type === "modelList" ? Reply.models : Reply.searchResults;
    if (!list || serialNo < 1 || serialNo > list.length) {
      return message.reply(`❌ ${fonts.bold(`𝐂𝐡𝐨𝐨𝐬𝐞 𝐚 𝐧𝐮𝐦𝐛𝐞𝐫 𝐛𝐞𝐭𝐰𝐞𝐞𝐧 𝟏 𝐚𝐧𝐝 ${list?.length || 0}.`)}`);
    }

    const selected = list[serialNo - 1];
    const attachment = event.messageReply?.attachments?.[0];

    if (!attachment || attachment.type !== "photo") {
      return message.reply(
        `✅ ${fonts.bold("𝐒𝐞𝐥𝐞𝐜𝐭𝐞𝐝:")} ${selected.name} (𝐈𝐃: ${selected.id})\n` +
        `📥 ${fonts.bold("𝐍𝐨𝐰 𝐫𝐞𝐩𝐥𝐲 𝐭𝐨 𝐚𝐧 𝐢𝐦𝐚𝐠𝐞 𝐰𝐢𝐭𝐡:")} art ${selected.id}`
      );
    }

    global.GoatBot.onReply.delete(Reply.messageID);
    return processImage(message, event, selected);
  }
};
