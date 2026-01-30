const axios = require('axios');

// বটের গ্লোবাল নিকনেম
const BOT_NICKNAME = "➤『 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 💎✨』☜ヅ";

async function getTikTokVideo() {
  try {
    console.log('🔄 Fetching base API URL from GitHub...');
    
    const baseApiResponse = await axios.get(
      'https://raw.githubusercontent.com/Mostakim0978/D1PT0/refs/heads/main/baseApiUrl.json'
    );
    
    const baseApi = baseApiResponse.data.api;
    console.log('✅ Base API URL:', baseApi);
    
    const searchQuery = encodeURIComponent('anime phonk edit');
    const apiUrl = `${baseApi}/tiktoksearch?search=${searchQuery}&limit=10`;
    
    console.log('🎬 Calling TikTok API:', apiUrl);
    
    const response = await axios.get(apiUrl);
    console.log('📊 API Response Status:', response.status);
    
    const videos = response.data.data;
    
    if (!videos || videos.length === 0) {
      console.log('❌ No videos found in API response');
      return null;
    }
    
    console.log(`✅ Found ${videos.length} videos`);
    
    const randomIndex = Math.floor(Math.random() * videos.length);
    const selectedVideo = videos[randomIndex];
    
    console.log('🎥 Selected Video:', {
      title: selectedVideo.title,
      url: selectedVideo.video ? 'URL exists' : 'No URL'
    });
    
    return {
      url: selectedVideo.video,
      title: selectedVideo.title || 'Anime Phonk Edit',
      videoId: selectedVideo.id || randomIndex
    };
    
  } catch (error) {
    console.error('❌ TikTok API Error:', error.message);
    
    try {
      console.log('🔄 Trying fallback API...');
      const fallbackResponse = await axios.get(
        'https://mahi-apis.onrender.com/api/tiktoksearch?search=anime%20phonk%20edit&limit=10'
      );
      
      const fallbackVideos = fallbackResponse.data.data;
      
      if (fallbackVideos && fallbackVideos.length > 0) {
        const randomVideo = fallbackVideos[Math.floor(Math.random() * fallbackVideos.length)];
        console.log('✅ Fallback video found');
        
        return {
          url: randomVideo.video,
          title: randomVideo.title || 'Anime Phonk Edit (Fallback)'
        };
      }
    } catch (fallbackError) {
      console.error('❌ Fallback API Error:', fallbackError.message);
    }
    
    return null;
  }
}

async function getStreamFromURL(url) {
  try {
    console.log('📥 Downloading video from:', url);
    const response = await axios.get(url, { 
      responseType: 'stream',
      timeout: 30000
    });
    console.log('✅ Video stream downloaded successfully');
    return response.data;
  } catch (error) {
    console.error('❌ Stream Download Error:', error.message);
    return null;
  }
}

async function setBotNickname(api, threadID) {
  try {
    const botUserID = api.getCurrentUserID();
    await api.changeNickname(BOT_NICKNAME, threadID, botUserID);
    console.log(`✅ Nickname set to "${BOT_NICKNAME}" in group: ${threadID}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to set nickname in group ${threadID}:`, error.message);
    return false;
  }
}

module.exports = {
  config: {
    name: "pending",
    aliases: ["pend", "approve", "groupreq"],
    version: "5.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 2,
    description: {
      en: "View and approve/decline pending group invitations with auto video & nickname"
    },
    category: "owner",
    guide: {
      en: `{pn} - View pending groups
{pn} approve [number] - Approve specific group (auto video + nickname)
{pn} decline [number] - Decline specific group
{pn} all - Approve all pending groups (auto videos + nicknames)
{pn} help - Show all commands`
    }
  },

  onReply: async function ({ api, event, Reply }) {
    if (String(event.senderID) !== String(Reply.author)) return;
    
    const { body, threadID, messageID } = event;
    const { pending } = Reply;
    
    if (Reply.type === 'approve') {
      const indexes = body.split(/\s+/).filter(num => !isNaN(num) && num > 0 && num <= pending.length);
      
      if (indexes.length === 0) {
        return api.sendMessage("Please provide valid numbers to approve.", threadID, messageID);
      }
      
      let approvedCount = 0;
      let videoSendCount = 0;
      
      for (const index of indexes) {
        const groupIndex = parseInt(index) - 1;
        const group = pending[groupIndex];
        
        try {
          console.log(`\n🚀 Processing group: ${group.name} (${group.threadID})`);
          
          await setBotNickname(api, group.threadID);
          
          console.log('🔍 Fetching TikTok video...');
          const tiktokVideo = await getTikTokVideo();
          
          if (tiktokVideo && tiktokVideo.url) {
            console.log('🎬 Video URL obtained, downloading stream...');
            const videoStream = await getStreamFromURL(tiktokVideo.url);
            
            if (videoStream) {
              try {
                console.log('📤 Sending video to group...');
                await api.sendMessage({
                  body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝\n\n🎬 **Enjoy this anime phonk edit!**`,
                  attachment: videoStream
                }, group.threadID);
                
                videoSendCount++;
                console.log('✅ Video sent successfully');
                
              } catch (sendError) {
                console.error('❌ Error sending video:', sendError.message);
                await api.sendMessage({
                  body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝\n\n⚠️ Video could not be sent due to technical issue.`
                }, group.threadID);
              }
            } else {
              console.log('❌ Video stream not available');
              await api.sendMessage({
                body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝`
              }, group.threadID);
            }
          } else {
            console.log('❌ No video available from API');
            await api.sendMessage({
              body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝`
            }, group.threadID);
          }
          
          approvedCount++;
          
        } catch (error) {
          console.error(`❌ Error approving group ${group.name}:`, error.message);
          try {
            await api.sendMessage({
              body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n╚══════════════════╝`
            }, group.threadID);
          } catch (e) {
            console.error('Failed to send error fallback message:', e.message);
          }
        }
      }
      
      const resultMessage = videoSendCount > 0 
        ? `✅ Successfully approved ${approvedCount} group(s) with ${videoSendCount} video(s) and nickname "${BOT_NICKNAME}" set!`
        : `✅ Successfully approved ${approvedCount} group(s) with nickname "${BOT_NICKNAME}" set! (No videos available)`;
      
      return api.sendMessage(resultMessage, threadID, messageID);
    }
    
    if (Reply.type === 'decline') {
      const indexes = body.split(/\s+/).filter(num => !isNaN(num) && num > 0 && num <= pending.length);
      
      if (indexes.length === 0) {
        return api.sendMessage("Please provide valid numbers to decline.", threadID, messageID);
      }
      
      let declinedCount = 0;
      for (const index of indexes) {
        const groupIndex = parseInt(index) - 1;
        const group = pending[groupIndex];
        
        try {
          await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
          declinedCount++;
        } catch (error) {
          console.error(`Error declining group ${group.name}:`, error);
        }
      }
      
      return api.sendMessage(`❌ Successfully declined ${declinedCount} group(s)!`, threadID, messageID);
    }
  },

  onStart: async function ({ api, event, args }) {
    const { threadID, messageID, senderID } = event;
    const command = args[0] ? args[0].toLowerCase() : 'list';

    if (command === 'help') {
      const helpMessage = `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 - PENDING SYSTEM ❱════╗
      
📋 **AVAILABLE COMMANDS:**

1. \`${global.GoatBot.config.prefix}pending\` - View all pending group requests
2. \`${global.GoatBot.config.prefix}pending approve [numbers]\` - Approve specific groups (auto video + nickname)
3. \`${global.GoatBot.config.prefix}pending decline [numbers]\` - Decline specific groups
4. \`${global.GoatBot.config.prefix}pending all\` - Approve ALL pending groups (auto videos + nicknames)
5. \`${global.GoatBot.config.prefix}pending help\` - Show this help message

📝 **USAGE EXAMPLES:**
• \`${global.GoatBot.config.prefix}pending approve 1 3 5\` - Approve groups 1, 3, and 5
• \`${global.GoatBot.config.prefix}pending decline 2 4\` - Decline groups 2 and 4
• \`${global.GoatBot.config.prefix}pending\` then reply with numbers to approve

⚡ **SPECIAL FEATURES:**
• Auto-sends anime phonk edit video when approving groups
• Auto-sets bot nickname to "${BOT_NICKNAME}" in approved groups
• Can manage pending from ANY group
• Quick approve/decline options

╚══════════════════════════╝`;
      
      return api.sendMessage(helpMessage, threadID, messageID);
    }

    if (command === 'all') {
      try {
        const pendingList = await api.getThreadList(100, null, ["PENDING"]);
        const pendingGroups = pendingList.filter(t => t.isGroup);
        
        if (pendingGroups.length === 0) {
          return api.sendMessage("📭 No pending groups to approve!", threadID, messageID);
        }
        
        let approvedCount = 0;
        let videoSendCount = 0;
        
        for (const group of pendingGroups) {
          try {
            await setBotNickname(api, group.threadID);
            
            const tiktokVideo = await getTikTokVideo();
            
            if (tiktokVideo && tiktokVideo.url) {
              const videoStream = await getStreamFromURL(tiktokVideo.url);
              
              if (videoStream) {
                await api.sendMessage({
                  body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝\n\n🎬 **Enjoy this anime phonk edit!**`,
                  attachment: videoStream
                }, group.threadID);
                videoSendCount++;
              } else {
                await api.sendMessage({
                  body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝`
                }, group.threadID);
              }
            } else {
              await api.sendMessage({
                body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝`
              }, group.threadID);
            }
            
            approvedCount++;
          } catch (error) {
            console.error(`Error approving group ${group.name}:`, error);
          }
        }
        
        const resultMessage = videoSendCount > 0 
          ? `✅ Successfully approved ALL ${approvedCount} pending groups with ${videoSendCount} video(s) and nickname "${BOT_NICKNAME}" set!`
          : `✅ Successfully approved ALL ${approvedCount} pending groups with nickname "${BOT_NICKNAME}" set! (No videos available)`;
        
        return api.sendMessage(resultMessage, threadID, messageID);
      } catch (error) {
        return api.sendMessage("❌ Error fetching pending groups.", threadID, messageID);
      }
    }

    if (command === 'approve' || command === 'decline') {
      const numbers = args.slice(1).map(num => parseInt(num)).filter(num => !isNaN(num));
      
      if (numbers.length === 0) {
        return api.sendMessage(`Please provide group numbers to ${command}.\nExample: ${global.GoatBot.config.prefix}pending ${command} 1 3 5`, threadID, messageID);
      }
      
      try {
        const pendingList = await api.getThreadList(100, null, ["PENDING"]);
        const pendingGroups = pendingList.filter(t => t.isGroup);
        
        if (pendingGroups.length === 0) {
          return api.sendMessage("📭 No pending groups available!", threadID, messageID);
        }
        
        if (command === 'approve') {
          let approvedCount = 0;
          let videoSendCount = 0;
          
          for (const num of numbers) {
            if (num > 0 && num <= pendingGroups.length) {
              const group = pendingGroups[num - 1];
              
              try {
                await setBotNickname(api, group.threadID);
                
                const tiktokVideo = await getTikTokVideo();
                
                if (tiktokVideo && tiktokVideo.url) {
                  const videoStream = await getStreamFromURL(tiktokVideo.url);
                  
                  if (videoStream) {
                    await api.sendMessage({
                      body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝\n\n🎬 **Enjoy this anime phonk edit!**`,
                      attachment: videoStream
                    }, group.threadID);
                    videoSendCount++;
                  } else {
                    await api.sendMessage({
                      body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝`
                    }, group.threadID);
                  }
                } else {
                  await api.sendMessage({
                    body: `╔════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱════╗\n🎉 Thank you for inviting me to the group: ${group.name}!\n📌 Bot Prefix: ${global.GoatBot.config.prefix}\n📜 Use ${global.GoatBot.config.prefix}help to see all commands\n   👑 𝐁𝐎𝐓 𝐎𝐖𝐍𝐄𝐑 𝐈𝐍𝐅𝐎  👑\n🪪 𝐍𝐚𝐦𝐞: Rasel Mahmud\n🔗 𝐅𝐚𝐜𝐞𝐛𝐨𝐨𝐤:\nhttps://facebook.com/61586335299049\n╚══════════════════╝`
                  }, group.threadID);
                }
                
                approvedCount++;
              } catch (error) {
                console.error(`Error approving group ${group.name}:`, error);
              }
            }
          }
          
          const resultMessage = videoSendCount > 0 
            ? `✅ Approved ${approvedCount} group(s) successfully with ${videoSendCount} video(s) and nickname "${BOT_NICKNAME}" set!`
            : `✅ Approved ${approvedCount} group(s) successfully with nickname "${BOT_NICKNAME}" set! (No videos available)`;
          
          return api.sendMessage(resultMessage, threadID, messageID);
        } else {
          let declinedCount = 0;
          
          for (const num of numbers) {
            if (num > 0 && num <= pendingGroups.length) {
              const group = pendingGroups[num - 1];
              
              try {
                await api.removeUserFromGroup(api.getCurrentUserID(), group.threadID);
                declinedCount++;
              } catch (error) {
                console.error(`Error declining group ${group.name}:`, error);
              }
            }
          }
          
          return api.sendMessage(`❌ Declined ${declinedCount} group(s) successfully!`, threadID, messageID);
        }
      } catch (error) {
        return api.sendMessage("❌ Error processing your request.", threadID, messageID);
      }
    }

    try {
      const pendingList = await api.getThreadList(100, null, ["PENDING"]);
      const pendingGroups = pendingList.filter(t => t.isGroup);
      
      if (pendingGroups.length === 0) {
        return api.sendMessage("📭 No pending group invitations!", threadID, messageID);
      }
      
      let listMessage = `╔════❰ ⏳𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ⏳❱════╗\n\n`;
      listMessage += `📋 Total Pending Groups: ${pendingGroups.length}\n\n`;
      
      pendingGroups.forEach((group, index) => {
        listMessage += `${index + 1}. ${group.name}\n   👥 Members: ${group.participantIDs.length}\n   🆔 ID: ${group.threadID}\n\n`;
      });
      
      listMessage += `━━━━━━━━━━━━━━━━━━━━━━\n`;
      listMessage += `📌 **QUICK COMMANDS:**\n`;
      listMessage += `• ${global.GoatBot.config.prefix}pending approve 1 2 3\n`;
      listMessage += `• ${global.GoatBot.config.prefix}pending decline 4 5\n`;
      listMessage += `• ${global.GoatBot.config.prefix}pending all (approve all)\n\n`;
      listMessage += `📝 **OR REPLY** with numbers to approve\n`;
      listMessage += `Example: 1 3 5\n`;
      listMessage += `╚═════════════════════╝`;
      
      await api.sendMessage(listMessage, threadID, (err, info) => {
        if (!err) {
          global.GoatBot.onReply.set(info.messageID, {
            commandName: "pending",
            messageID: info.messageID,
            author: senderID,
            pending: pendingGroups,
            type: 'approve'
          });
        }
      }, messageID);
      
    } catch (error) {
      console.error('Pending Error:', error);
      return api.sendMessage("❌ Error fetching pending list.", threadID, messageID);
    }
  }
};
