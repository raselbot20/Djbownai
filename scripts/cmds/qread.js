const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports.config = {
  name: "qread",
  version: "1.0",
  author: "GoatMart",
  countDown: 5,
  role: 0,
  category: "tools",
  description: "Read QR code from image or URL and decode it",
  usages: "[reply QR image] or [QR image URL]",
};

module.exports.onStart = async function ({ api, event, args }) {
  const imageUrlArg = args[0];
  const qrReply = event.messageReply?.attachments?.[0]?.url;

  const apiUrl = "https://goatqrapi.onrender.com/api/read";

  try {
    const form = new FormData();

    if (imageUrlArg && imageUrlArg.startsWith("http")) {
      form.append("imageUrl", imageUrlArg);
    } else if (qrReply) {
      form.append("imageUrl", qrReply);
    } else {
      return api.sendMessage("❗ Please reply to a QR image or paste a QR image URL.", event.threadID, event.messageID);
    }

    const response = await axios.post(apiUrl, form, {
      headers: form.getHeaders(),
    });

    const resultText = response.data?.data;

    if (resultText) {
      return api.sendMessage(`✅ QR Code Decoded:\n\n${resultText}`, event.threadID, event.messageID);
    } else {
      return api.sendMessage("❌ QR code not detected in the image.", event.threadID, event.messageID);
    }
  } catch (err) {
    return api.sendMessage(`❌ Failed to read QR code:\n${err.message}`, event.threadID, event.messageID);
  }
};
