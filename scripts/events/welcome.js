const { getTime, drive } = global.utils;
const fs = require("fs");
const path = require("path");
if (!global.temp.welcomeEvent)
	global.temp.welcomeEvent = {};

module.exports = {
	config: {
		name: "welcome",
		version: "1.9",
		author: "Rasel Mahmud",
		category: "events"
	},

	langs: {
		en: {
			session1: "morning",
			session2: "noon",
			session3: "afternoon",
			session4: "evening",
			// 🆕 যখন বটকে গ্রুপে ইনভাইট করবে তখন যে মেসেজ যাবে:
			welcomeMessage: `💫 Thank you for inviting me to the group!
🤖 Bot prefix: %1
🛠 To view all commands, type: %1help
👑 Admin Facebook ID: https://www.facebook.com/raselmahmud.q`,
			
			multiple1: "you",
			multiple2: "you guys",
			
			// 🆕 ডিফল্ট ওয়েলকাম মেসেজ
			defaultWelcomeMessage: `💙❖💙✨
🖤 𝙰𝚂𝚂𝙰𝙻𝙰𝙼𝚄𝙰𝙻𝙰𝙸𝙺𝚄𝙼 ✨ {userName} ✨
WELCOME TO 💖 {boxName} 💖
❖💛❖
🌸 You are our ✨ {memberCount}ᵗʰ ✨ member!
🥰 Hope you enjoy your time here!
💬 Have a great & positive {session}! ✨
❖💙❖
👤 Added By: {authorName}
💎━━━━━━━━━━━━━━💎`
		}
	},

	onStart: async ({ threadsData, message, event, api, getLang }) => {
		if (event.logMessageType == "log:subscribe")
			return async function () {
				const hours = getTime("HH");
				const { threadID } = event;
				const { nickNameBot } = global.GoatBot.config;
				const prefix = global.utils.getPrefix(threadID);
				const dataAddedParticipants = event.logMessageData.addedParticipants;

				// ✅ যদি নতুন সদস্য বট হয়
				if (dataAddedParticipants.some((item) => item.userFbId == api.getCurrentUserID())) {
					if (nickNameBot)
						api.changeNickname(nickNameBot, threadID, api.getCurrentUserID());

					// ✅ ভিডিওসহ মেসেজ পাঠাবে
					const videoPath = path.join(__dirname, "tmp", "received_1509247970115917.mp4");
					if (fs.existsSync(videoPath)) {
						return message.send({
							body: getLang("welcomeMessage", prefix),
							attachment: fs.createReadStream(videoPath)
						});
					} else {
						return message.send(getLang("welcomeMessage", prefix));
					}
				}

				// ✅ যদি নতুন সদস্য সাধারণ ইউজার হয়
				if (!global.temp.welcomeEvent[threadID])
					global.temp.welcomeEvent[threadID] = {
						joinTimeout: null,
						dataAddedParticipants: []
					};

				global.temp.welcomeEvent[threadID].dataAddedParticipants.push(...dataAddedParticipants);
				clearTimeout(global.temp.welcomeEvent[threadID].joinTimeout);

				global.temp.welcomeEvent[threadID].joinTimeout = setTimeout(async function () {
					const threadData = await threadsData.get(threadID);
					if (threadData.settings.sendWelcomeMessage == false)
						return;

					const dataAddedParticipants = global.temp.welcomeEvent[threadID].dataAddedParticipants;
					const threadInfo = await api.getThreadInfo(threadID);
					const dataBanned = threadData.data.banned_ban || [];
					const threadName = threadData.threadName;
					const userName = [],
						mentions = [];
					let multiple = false;

					if (dataAddedParticipants.length > 1)
						multiple = true;

					for (const user of dataAddedParticipants) {
						if (dataBanned.some((item) => item.id == user.userFbId))
							continue;
						userName.push(user.fullName);
						mentions.push({
							tag: user.fullName,
							id: user.userFbId
						});
					}
					if (userName.length == 0) return;

					const memberCount = threadInfo.participantIDs.length;
					let authorName = "Unknown";
					try {
						const authorInfo = await api.getUserInfo(event.author);
						authorName = authorInfo[event.author]?.name || "Unknown";
					} catch (e) {}

					let { welcomeMessage = getLang("defaultWelcomeMessage") } = threadData.data;
					const form = {
						mentions: welcomeMessage.match(/\{userNameTag\}/g) ? mentions : null
					};
					welcomeMessage = welcomeMessage
						.replace(/\{userName\}|\{userNameTag\}/g, userName.join(", "))
						.replace(/\{boxName\}|\{threadName\}/g, threadName)
						.replace(/\{multiple\}/g, multiple ? getLang("multiple2") : getLang("multiple1"))
						.replace(/\{session\}/g, hours <= 10
							? getLang("session1")
							: hours <= 12
								? getLang("session2")
								: hours <= 18
									? getLang("session3")
									: getLang("session4"))
						.replace(/\{memberCount\}/g, memberCount)
						.replace(/\{authorName\}/g, authorName);

					form.body = welcomeMessage;

					if (threadData.data.welcomeAttachment) {
						const files = threadData.data.welcomeAttachment;
						const attachments = files.reduce((acc, file) => {
							acc.push(drive.getFile(file, "stream"));
							return acc;
						}, []);
						form.attachment = (await Promise.allSettled(attachments))
							.filter(({ status }) => status == "fulfilled")
							.map(({ value }) => value);
					}

					message.send(form);
					delete global.temp.welcomeEvent[threadID];
				}, 1500);
			};
	}
};
