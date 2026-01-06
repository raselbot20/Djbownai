const fs = require("fs-extra"); 

const axios = require("axios");

module.exports = {
	config: {
		name: "emojimix",
      aliases: ["mix"],
		version: "1.4",
		author: "NTKhang (Modified by Ullash)",
		countDown: 5,
		role: 0,
		shortDescription: "Mix 2 emoji",
		longDescription: {
			vi: "Mix 2 emoji lại với nhau",
			en: "Mix 2 emoji together"
		},
		guide: {
			vi: "   {pn} <emoji1> <emoji2>\n   Ví dụ:  {pn} 🤣 🥰",
			en: "   {pn} <emoji1> <emoji2>\n   Example:  {pn} 🤣 🥰"
		},
		category: "fun"
	},

	langs: {
		vi: {
			error: "Rất tiếc, emoji %1 và %2 không mix được",
			success: "Emoji %1 và %2 mix thành công"
		},
		en: {
			error: "Sorry, emoji %1 and %2 can't mix",
			success: "Emoji %1 and %2 mixed successfully"
		}
	},

	onStart: async function ({ message, args, getLang }) {
		const emoji1 = args[0];
		const emoji2 = args[1];

		if (!emoji1 || !emoji2)
			return message.SyntaxError();

		const img = await generateEmojimix(emoji1, emoji2);

		if (!img)
			return message.reply(getLang("error", emoji1, emoji2));

		message.reply({
			body: getLang("success", emoji1, emoji2),
			attachment: img
		});
	}
};

async function generateEmojimix(emoji1, emoji2) {
	try {
		const url = "https://mahbub-ullash.cyberbot.top/api/emojimix";

		const response = await axios.get(url, {
			params: { emoji1, emoji2 },
			responseType: "stream"
		});

		response.data.path = `emojimix_${Date.now()}.png`;
		return response.data;
	}
	catch (err) {
		return null;
	}
}
