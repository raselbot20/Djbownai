const axios = require("axios");

module.exports = {

  config: {

    name: "screenshot",

    aliases: ["ss"],

    version: "1.0",

    author: "Denesh",

    countDown: 3,

    role: 0,

    shortDescription: "Take website screenshot",

    longDescription: "Capture website screenshot via Render API",

    category: "utility",

    guide: "{pn} <url>"

  },

  onStart: async function ({ message, args }) {

    if (!args[0]) return message.reply("Please enter a website URL.");

    let site = args.join(" ").trim();

    if (!site.startsWith("http")) site = "https://" + site;

    const apiURL =

      "https://screenshot-api-bxwt.onrender.com/api/screenshot?site=" +

      encodeURIComponent(site);

    try {

      const res = await axios.get(apiURL, { responseType: "stream" });

      message.reply({

        body: `Screenshot of: ${site}`,

        attachment: res.data

      });

    } catch (err) {

      message.reply("Error fetching screenshot: " + err.message);

    }

  }

};
