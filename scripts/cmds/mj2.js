const A = require("axios");
const { createCanvas: B, loadImage: C } = require("canvas");
const D = require("fs");
const E = require("path");

module.exports = {
  config: {
    name: "mj2",
    aliases: ["midjourney2"],
    version: "0.0.1",
    author: "ArYAN",
    countDown: 10,
    role: 0,
    category: "ai",
    guide: "{pn} <prompt>"
  },

  onStart: async function ({ api, event, args, message }) {
    const p = args.join(" ");
    if (!p) return message.reply("Please provide a prompt.");

    const w = await message.reply("Generating images. Please wait.");
    const tmp = E.join(__dirname, "tmp");
    if (!D.existsSync(tmp)) D.mkdirSync(tmp);

    try {
      const q = Array.from({ length: 4 }, () => 
        A.get(`http://103.187.23.122:4030/aryan/Midjourney?prompt=${encodeURIComponent(p)}&apikey=aryannix`, {
          responseType: "arraybuffer"
        })
      );

      const r = await Promise.all(q);
      const b = r.map(res => Buffer.from(res.data));

      const cvs = B(1024, 1024);
      const ctx = cvs.getContext("2d");

      const l = await Promise.all(b.map(img => C(img)));

      ctx.drawImage(l[0], 0, 0, 512, 512);
      ctx.drawImage(l[1], 512, 0, 512, 512);
      ctx.drawImage(l[2], 0, 512, 512, 512);
      ctx.drawImage(l[3], 512, 512, 512, 512);

      const pathG = E.join(tmp, `mj_${event.senderID}.png`);
      D.writeFileSync(pathG, cvs.toBuffer());

      return message.reply({
        body: "Midjourney Image Reply with V1, V2, V3, or V4 for the image.",
        attachment: D.createReadStream(pathG)
      }, (err, info) => {
        global.GoatBot.onReply.set(info.messageID, {
          commandName: this.config.name,
          author: event.senderID,
          imgs: b
        });
        api.unsendMessage(w.messageID);
      });

    } catch (e) {
      return message.reply("Error: " + e.message);
    }
  },

  onReply: async function ({ api, event, Reply, message }) {
    const { imgs, author } = Reply;
    if (event.senderID != author) return;

    const v = event.body.trim().toUpperCase();
    const m = { "V1": 0, "V2": 1, "V3": 2, "V4": 3 };

    if (m.hasOwnProperty(v)) {
      const i = m[v];
      const p = E.join(__dirname, "tmp", `mj_${v}_${event.senderID}.png`);
      D.writeFileSync(p, imgs[i]);

      message.reply({
        body: "Here is your " + v + " image.",
        attachment: D.createReadStream(p)
      });
    }
  }
};
