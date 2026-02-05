const axios = require('axios');

module.exports = {
  config: {
    name: "bomber",
    aliases: ["bombing", "smsbomb"],
    version: "1.7",
    author: "Zihad Ahmed",
    countDown: 5,
    role: 0,
    isPremium: true,
    shortDescription: "SMS Bomber Tool",
    longDescription: "Sends SMS using xihad-4-x public API (Note: count may be ignored by API)",
    category: "🔥 | Premium",
    guide: {
      en: "{pn} <number> - <count>\nExample: {pn} 018xxxxxxxx - 5"
    }
  },

  onStart: async function ({ message, args, api }) {
    if (args.length < 1) {
      return message.reply("Usage: -bomber <number> - <count>\nExample: -bomber 018xxxxxxxx - 1");
    }

    const input = args.join(" ");
    const [numberPart, countPart] = input.split("-").map(part => part.trim());
    let number = numberPart ? numberPart.replace(/\s+/g, '') : null;
    let count = countPart ? parseInt(countPart) : 1;

    if (!number || isNaN(count) || count < 1) {
      return message.reply("Invalid format! Example: -bomber 018xxxxxxxx - 10");
    }

    // Clean number further (BD format check)
    if (number.startsWith("880") && number.length === 13) {
      number = "01" + number.slice(3);
    } else if (!number.startsWith("01") || number.length !== 11) {
      return message.reply("Only Bangladeshi numbers supported (must start with 01 and be 11 digits)");
    }

    // Limit count to prevent overload
    count = Math.min(count, 50);

    // New API URL
    const apiUrl = `https://xihad-4-x.vercel.app/Tools/Bomber?number=${number}&count=${count}&apikey=hi`;

    let processingMsg;
    try {
      processingMsg = await message.reply(
        `⏳ Starting SMS bombing...\n\nTarget: ${number}\nRequested: ${count}`
      );

      const response = await axios.get(apiUrl, {
        timeout: 25000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
          'Accept': 'application/json, text/plain, */*',
          'Referer': 'https://www.google.com/'
        }
      });

      // Unsend loading message (GoatBot style)
      if (processingMsg && processingMsg.messageID) {
        try {
          await api.unsendMessage(processingMsg.messageID);
        } catch (unsendError) {
          console.error("Unsend failed:", unsendError.message);
        }
      }

      // Check response (adapt based on actual API output; assuming it has 'status' or 'success')
      if (response.status === 200 && (response.data?.status === true || response.data?.success)) {
        await message.reply(
          `✅ Bombing started!\n\n` +
          `Target: ${number}\n` +
          `Requested count: ${count}\n` +
          `API message: ${response.data.message || response.data.result || 'Attack initiated'}\n` +
          `Note: Some APIs ignore count and send fixed amount (~100 SMS)`
        );
      } else {
        await message.reply(
          `❌ API issue (Status: ${response.status})\n` +
          `Details: ${JSON.stringify(response.data || 'No details from API')}`
        );
      }

    } catch (error) {
      // Try to unsend loading even on error
      if (processingMsg && processingMsg.messageID) {
        try {
          await api.unsendMessage(processingMsg.messageID);
        } catch {}
      }

      let errorMsg = "❌ Failed!\n";
      if (error.response) {
        errorMsg += `Status: ${error.response.status}\nDetails: ${JSON.stringify(error.response.data || 'No info')}`;
      } else if (error.code === 'ECONNABORTED') {
        errorMsg += "Timeout - API might be slow or down";
      } else {
        errorMsg += error.message;
      }

      await message.reply(errorMsg);
      console.error("Bomber Error:", error);
    }
  }
};
