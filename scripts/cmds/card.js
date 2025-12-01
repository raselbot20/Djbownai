const jimp = require("jimp");
const fs = require("fs");
const path = require("path");

module.exports = {
  config: {
    name: "card",
    aliases: ["কার্ড"],
    version: "1.8",
    author: "Abdul Alim",
    countDown: 2,
    role: 0,
    shortDescription: "Face on card",
    longDescription: "Generate a card with someone's avatar, with default fixed avatar size and position",
    category: "love",
    guide: {
      en: "{pn} (use reply or mention to target someone)"
    }
  },

  onStart: async function ({ message, event, args, usersData }) {
    // Determine target
    let uid;
    if (event.messageReply) {
      uid = event.messageReply.senderID;
    } else if (Object.keys(event.mentions).length > 0) {
      uid = Object.keys(event.mentions)[0];
    } else {
      uid = event.senderID;
    }

  
    let avatarSize = 195;
    let posX = 210;
    let posY = 53;

    try {
      const tmpDir = path.join(__dirname, "tmp");
      if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

      // Get username
      let username = "this person";
      if (usersData && typeof usersData.get === 'function') {
        const userData = await usersData.get(uid);
        if (userData && userData.name) username = userData.name;
      }

      // Generate image
      const pathSave = await generateDogImage(uid, avatarSize, posX, posY);

      await message.reply({
        body: `${username} Hope you like it 💌✨`,
        attachment: fs.createReadStream(pathSave),
      });

      // Cleanup after 5 seconds
      setTimeout(() => {
        if (fs.existsSync(pathSave)) fs.unlinkSync(pathSave);
      }, 5000);

    } catch (error) {
      console.error("Error:", error);
      message.reply("An error occurred while processing the image.");
    }
  }
};

async function generateDogImage(targetID, avatarSize = 195, posX = 210, posY = 53) {
  try {
    // Fetch avatar from Facebook Graph API
    let avatar = await jimp.read(`https://graph.facebook.com/${targetID}/picture?width=512&height=512&access_token=6628568379%7Cc1e620fa708a1d5696fb991c1bde5662`);

    // Square avatar - no circle cropping
    // avatar.circle();

    const pathSave = path.join(__dirname, "tmp", `${targetID}_dog.png`);

    // Background 500x670
    let img = await jimp.read("https://i.postimg.cc/zGPDKTR8/1763267411327.png");
    img.contain(500, 670);

    // Composite avatar onto background
    img.composite(avatar.resize(avatarSize, avatarSize), posX, posY);

    await img.writeAsync(pathSave);
    return pathSave;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
}
