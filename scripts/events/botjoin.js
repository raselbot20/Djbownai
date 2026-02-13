const { getTime } = global.utils;
const fs = require("fs");
const path = require("path");

module.exports = {
	config: {
		name: "botjoin",
		version: "1.0",
		author: "Rasel Mahmud",
		category: "events"
	},

	langs: {
		en: {
			welcomeMessage: `💫 Thank you for inviting me to the group!

🤖 Bot prefix: %1
🛠 To view all commands, type: %1help
👑 Admin Facebook ID: https://www.facebook.com/profile.php?id=61586673412830`
		}
	},

	onStart: async ({ message, event, api, getLang }) => {

		// ✅ শুধু bot join হলে কাজ করবে
		if (event.logMessageType !== "log:subscribe") return;

		const { threadID } = event;
		const { nickNameBot } = global.GoatBot.config;
		const prefix = global.utils.getPrefix(threadID);
		const dataAddedParticipants = event.logMessageData.addedParticipants;

		// ✅ যদি যোগ হওয়া ইউজার bot হয়
		if (!dataAddedParticipants.some(item => item.userFbId == api.getCurrentUserID())) {
			return; // ❌ সাধারণ মেম্বার হলে কিছুই করবে না
		}

		// ✅ bot nickname সেট করবে
		if (nickNameBot)
			api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());

		// ✅ ভিডিও path (নিজের ভিডিও রাখবে)
		const videoPath = path.join(__dirname, "tmp", "received_1509247970115917.mp4");

		// ✅ ভিডিও থাকলে ভিডিও + মেসেজ পাঠাবে
		if (fs.existsSync(videoPath)) {
			return message.send({
				body: getLang("welcomeMessage", prefix),
				attachment: fs.createReadStream(videoPath)
			});
		}

		// ✅ ভিডিও না থাকলে শুধু মেসেজ
		return message.send(getLang("welcomeMessage", prefix));
	}
};
