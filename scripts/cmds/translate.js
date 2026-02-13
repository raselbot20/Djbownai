const axios = require('axios');
const defaultEmojiTranslate = "🌐";

module.exports = {
	config: {
		name: "translate",
		aliases: ["trans", "tns", "translator", "অনুবাদ"],
		version: "2.0",
		author: "Rasel Mahmud",
		countDown: 5,
		role: 0,
		description: {
			en: "Translate text to the desired language",
			bn: "পাঠ্য কাঙ্ক্ষিত ভাষায় অনুবাদ করুন"
		},
		category: "utility",
		guide: {
			en: "   {pn} <text>: Translate text to the language of your chat box or the default language of the bot"
				+ "\n   {pn} <text> -> <ISO 639-1>: Translate text to the desired language"
				+ "\n   or you can reply a message to translate the content of that message"
				+ "\n   Example:"
				+ "\n    {pn} hello -> bn (for Bangla)"
				+ "\n    {pn} নমস্কার -> en (for English)"
				+ "\n    {pn} নমস্কার -> hi (for Hindi)"
				+ "\n    {pn} hello -> ar (for Arabic)"
				+ "\n   Language Codes:"
				+ "\n    en - English, bn - Bangla, hi - Hindi, ar - Arabic"
				+ "\n    es - Spanish, fr - French, zh - Chinese, ja - Japanese"
				+ "\n   {pn} -r [on | off]: Turn on or off the automatic translation mode when someone reacts to the message"
				+ "\n   {pn} -r set <emoji>: Set the emoji to translate the message in your chat group",
			
			bn: "   {pn} <text>: আপনার চ্যাট বক্সের ভাষায় বা বটের ডিফল্ট ভাষায় পাঠ্য অনুবাদ করুন"
				+ "\n   {pn} <text> -> <ISO 639-1>: পাঠ্যটি কাঙ্ক্ষিত ভাষায় অনুবাদ করুন"
				+ "\n   অথবা আপনি একটি বার্তার উত্তর দিয়ে সেই বার্তার বিষয়বস্তু অনুবাদ করতে পারেন"
				+ "\n   উদাহরণ:"
				+ "\n    {pn} hello -> bn (বাংলার জন্য)"
				+ "\n    {pn} নমস্কার -> en (ইংরেজির জন্য)"
				+ "\n    {pn} নমস্কার -> hi (হিন্দির জন্য)"
				+ "\n    {pn} hello -> ar (আরবির জন্য)"
				+ "\n   ভাষা কোড:"
				+ "\n    en - ইংরেজি, bn - বাংলা, hi - হিন্দি, ar - আরবি"
				+ "\n    es - স্প্যানিশ, fr - ফরাসি, zh - চাইনিজ, ja - জাপানিজ"
				+ "\n   {pn} -r [on | off]: বার্তায় কেউ প্রতিক্রিয়া জানালে স্বয়ংক্রিয় অনুবাদ মোড চালু বা বন্ধ করুন"
				+ "\n   {pn} -r set <emoji>: আপনার চ্যাট গ্রুপে বার্তা অনুবাদ করতে ইমোজি সেট করুন"
		}
	},

	langs: {
		en: {
			translateTo: "🌐 Translated from %1 to %2",
			invalidArgument: "❌ Invalid argument, please choose on or off",
			turnOnTransWhenReaction: `✅ Turned on translate message when reaction, try to react "${defaultEmojiTranslate}" to any message to translate it (does not support bot messages)\n Only messages after turning on this feature will be translatable`,
			turnOffTransWhenReaction: "✅ Turned off translate message when reaction",
			inputEmoji: "🌀 Please react to this message to set that emoji as the translation emoji",
			emojiSet: "✅ Translation emoji has been set to %1",
			noText: "❌ No text provided to translate",
			error: "❌ Translation error: %1",
			detectedLanguage: "🔍 Detected language: %1",
			supportedLanguages: "📚 Supported Languages:",
			languageList: `en - English\nbn - Bangla/Bengali\nhi - Hindi\nar - Arabic\nes - Spanish\nfr - French\nzh - Chinese\nja - Japanese\nru - Russian\npt - Portuguese\nde - German\nit - Italian\nko - Korean\nid - Indonesian\ntr - Turkish\nvi - Vietnamese\nth - Thai\nur - Urdu\nfa - Persian\nml - Malayalam\nta - Tamil\nte - Telugu\nkn - Kannada\nmr - Marathi\ngu - Gujarati\npa - Punjabi\nor - Odia\nas - Assamese\nne - Nepali\nsi - Sinhala\nmy - Burmese\nkm - Khmer\nlo - Lao\nbo - Tibetan\nmn - Mongolian`,
			usage: "💡 Usage: translate <text> -> <language code>"
		},
		bn: {
			translateTo: "🌐 %1 থেকে %2 তে অনুবাদ করা হয়েছে",
			invalidArgument: "❌ ভুল আর্গুমেন্ট, অনুগ্রহ করে on বা off চয়ন করুন",
			turnOnTransWhenReaction: `✅ প্রতিক্রিয়া জানালে অনুবাদ বার্তা চালু করা হয়েছে, যেকোনো বার্তায় "${defaultEmojiTranslate}" প্রতিক্রিয়া দেখিয়ে এটি অনুবাদ করুন (বট বার্তা সমর্থিত নয়)\n এই বৈশিষ্ট্যটি চালু করার পরেই শুধুমাত্র বার্তা অনুবাদ করা যাবে`,
			turnOffTransWhenReaction: "✅ প্রতিক্রিয়া জানালে অনুবাদ বার্তা বন্ধ করা হয়েছে",
			inputEmoji: "🌀 বার্তা অনুবাদ করতে ইমোজি সেট করতে এই বার্তায় প্রতিক্রিয়া দিন",
			emojiSet: "✅ অনুবাদ ইমোজি %1 তে সেট করা হয়েছে",
			noText: "❌ অনুবাদের জন্য কোন পাঠ্য দেওয়া হয়নি",
			error: "❌ অনুবাদ ত্রুটি: %1",
			detectedLanguage: "🔍 সনাক্ত ভাষা: %1",
			supportedLanguages: "📚 সমর্থিত ভাষাসমূহ:",
			languageList: `en - ইংরেজি\nbn - বাংলা\nhi - হিন্দি\nar - আরবি\nes - স্প্যানিশ\nfr - ফরাসি\nzh - চাইনিজ\nja - জাপানিজ\nru - রাশিয়ান\npt - পর্তুগিজ\nde - জার্মান\nit - ইতালিয়ান\nko - কোরিয়ান\nid - ইন্দোনেশিয়ান\ntr - তুর্কি\nvi - ভিয়েতনামি\nth - থাই\nur - উর্দু\nfa - ফারসি\nml - মালয়ালম\nta - তামিল\nte - তেলেগু\nkn - কন্নড়\nmr - মারাঠি\ngu - গুজরাটি\npa - পাঞ্জাবি\nor - ওড়িয়া\nas - অসমীয়া\nne - নেপালি\nsi - সিংহলি\nmy - বার্মিজ\nkm - খমের\nlo - লাও\nbo - তিব্বতি\nmn - মঙ্গোলিয়ান`,
			usage: "💡 ব্যবহার: translate <পাঠ্য> -> <ভাষা কোড>"
		}
	},

	onStart: async function ({ message, event, args, threadsData, getLang, commandName }) {
		// Show language list if no arguments
		if (args.length === 0 || args[0] === "help") {
			return message.reply(
				`${getLang("supportedLanguages")}\n\n${getLang("languageList")}\n\n${getLang("usage")}`
			);
		}

		// Reaction settings
		if (["-r", "-react", "-reaction"].includes(args[0])) {
			if (args[1] == "set") {
				return message.reply(getLang("inputEmoji"), (err, info) =>
					global.GoatBot.onReaction.set(info.messageID, {
						type: "setEmoji",
						commandName,
						messageID: info.messageID,
						authorID: event.senderID
					})
				);
			}
			const isEnable = args[1] == "on" ? true : args[1] == "off" ? false : null;
			if (isEnable == null)
				return message.reply(getLang("invalidArgument"));
			await threadsData.set(event.threadID, isEnable, "data.translate.autoTranslateWhenReaction");
			return message.reply(isEnable ? getLang("turnOnTransWhenReaction") : getLang("turnOffTransWhenReaction"));
		}

		const { body = "" } = event;
		let content;
		let langCodeTrans;
		const langOfThread = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language || "en";

		// Handle message reply
		if (event.messageReply) {
			content = event.messageReply.body;
			let lastIndexSeparator = body.lastIndexOf("->");
			if (lastIndexSeparator == -1)
				lastIndexSeparator = body.lastIndexOf("=>");

			if (lastIndexSeparator != -1 && (body.length - lastIndexSeparator == 4 || body.length - lastIndexSeparator == 5))
				langCodeTrans = body.slice(lastIndexSeparator + 2).trim();
			else if ((args[0] || "").match(/\w{2,3}/))
				langCodeTrans = args[0].match(/\w{2,3}/)[0];
			else
				langCodeTrans = langOfThread;
		}
		else {
			content = event.body;
			let lastIndexSeparator = content.lastIndexOf("->");
			if (lastIndexSeparator == -1)
				lastIndexSeparator = content.lastIndexOf("=>");

			if (lastIndexSeparator != -1 && (content.length - lastIndexSeparator == 4 || content.length - lastIndexSeparator == 5)) {
				langCodeTrans = content.slice(lastIndexSeparator + 2).trim();
				content = content.slice(content.indexOf(args[0]), lastIndexSeparator).trim();
			}
			else {
				langCodeTrans = langOfThread;
				content = args.join(" ");
			}
		}

		if (!content)
			return message.reply(getLang("noText"));

		// Call translation function
		await translateAndSendMessage(content, langCodeTrans, message, getLang);
	},

	onChat: async ({ event, threadsData }) => {
		if (!await threadsData.get(event.threadID, "data.translate.autoTranslateWhenReaction"))
			return;
		
		// Store message for reaction-based translation
		global.GoatBot.onReaction.set(event.messageID, {
			commandName: 'translate',
			messageID: event.messageID,
			body: event.body,
			authorID: event.senderID,
			threadID: event.threadID
		});
	},

	// Handle reaction events
	onReaction: async ({ event, message, threadsData, getLang }) => {
		const { messageID, userID } = event;
		const reactionData = global.GoatBot.onReaction.get(messageID);
		
		if (!reactionData) return;

		// Set emoji for translation
		if (reactionData.type === "setEmoji" && reactionData.authorID === userID) {
			await threadsData.set(event.threadID, event.reaction, "data.translate.translateEmoji");
			global.GoatBot.onReaction.delete(messageID);
			return message.reply(getLang("emojiSet", event.reaction));
		}

		// Translate message on reaction
		if (reactionData.commandName === 'translate') {
			const translateEmoji = await threadsData.get(event.threadID, "data.translate.translateEmoji") || defaultEmojiTranslate;
			
			if (event.reaction === translateEmoji && reactionData.body) {
				const langOfThread = await threadsData.get(event.threadID, "data.lang") || global.GoatBot.config.language || "en";
				await translateAndSendMessage(reactionData.body, langOfThread, message, getLang, true);
			}
		}
	}
};

// Translation function
async function translateAndSendMessage(text, targetLang, message, getLang, isReaction = false) {
	try {
		// Validate target language
		if (!targetLang || targetLang.length < 2 || targetLang.length > 3) {
			targetLang = "en";
		}

		// First detect source language
		const detectResponse = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
			params: {
				client: 'gtx',
				sl: 'auto',
				tl: 'en',
				dt: 't',
				q: text.substring(0, 100) // Only send first 100 chars for detection
			}
		});

		const sourceLang = detectResponse.data[2] || 'auto';
		
		// Now translate to target language
		const response = await axios.get(`https://translate.googleapis.com/translate_a/single`, {
			params: {
				client: 'gtx',
				sl: sourceLang,
				tl: targetLang,
				dt: 't',
				q: text
			}
		});

		const translatedText = response.data[0].map(item => item[0]).join('');
		
		// Get language names
		const languageNames = {
			en: "English", bn: "Bangla", hi: "Hindi", ar: "Arabic",
			es: "Spanish", fr: "French", zh: "Chinese", ja: "Japanese",
			ru: "Russian", pt: "Portuguese", de: "German", it: "Italian",
			ko: "Korean", id: "Indonesian", tr: "Turkish", vi: "Vietnamese",
			th: "Thai", ur: "Urdu", fa: "Persian", ml: "Malayalam",
			ta: "Tamil", te: "Telugu", kn: "Kannada", mr: "Marathi",
			gu: "Gujarati", pa: "Punjabi", or: "Odia", as: "Assamese",
			ne: "Nepali", si: "Sinhala", my: "Burmese", km: "Khmer",
			lo: "Lao", bo: "Tibetan", mn: "Mongolian"
		};

		const sourceLangName = languageNames[sourceLang] || sourceLang;
		const targetLangName = languageNames[targetLang] || targetLang;

		// Create response message
		const replyMessage = `${getLang("translateTo", sourceLangName, targetLangName)}\n\n` +
						   `📝 ${text}\n\n` +
						   `✅ ${translatedText}\n\n` +
						   `🔤 ${getLang("detectedLanguage")} ${sourceLangName} (${sourceLang})`;

		await message.reply(replyMessage);

	} catch (error) {
		console.error("Translation error:", error);
		await message.reply(getLang("error", error.message));
	}
}

// Clean up old reaction data periodically
setInterval(() => {
	const now = Date.now();
	for (const [key, data] of global.GoatBot.onReaction.entries()) {
		if (now - data.timestamp > 24 * 60 * 60 * 1000) { // 24 hours
			global.GoatBot.onReaction.delete(key);
		}
	}
}, 60 * 60 * 1000); // Clean every hour
