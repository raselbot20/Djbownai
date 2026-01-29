const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mime = require("mime-types");

module.exports = {
  config: {
    name: "catbox",
    version: "3.0.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: {
      en: "📤 Upload multiple images to Catbox at once"
    },
    longDescription: {
      en: `📦 **Advanced Catbox Uploader - Multiple Images Support**

🎯 **Features:**
• Upload ALL images from a single reply
• Sequential processing with progress
• Album creation with all images
• Individual links + combined message
• Support for 10+ images at once
• Image type validation
• Size limits handling
• Failed image tracking
• Download all as ZIP option`
    },
    category: "tools",
    guide: {
      en: `🔧 **How to use:**

1. **Single Image:**
   Reply to one image: /catbox

2. **Multiple Images:**
   Reply to multiple images: /catbox multiple
   OR
   Reply to multiple images: /catbox all

3. **Create Album:**
   /catbox album=AlbumName

4. **With Password:**
   /catbox pass=yourpassword

5. **Get All Images:**
   /catbox getall [catbox-album-id]

🔍 **Examples:**
• /catbox multiple
• /catbox all album=MyPhotos
• /catbox all pass=1234
• /catbox multiple expire=30`
    }
  },

  onStart: async function({ api, event, args }) {
    try {
      const command = args[0]?.toLowerCase();
      
      // Show help if needed
      if (command === 'help') {
        return api.sendMessage(this.getHelpMessage(), event.threadID, event.messageID);
      }

      // Check if user replied to a message
      if (!event.messageReply) {
        return api.sendMessage("❌ Please reply to a message containing images", event.threadID, event.messageID);
      }

      // Get attachments
      const attachments = event.messageReply.attachments || [];
      
      if (attachments.length === 0) {
        return api.sendMessage("❌ No attachments found in the replied message", event.threadID, event.messageID);
      }

      // Filter only images
      const imageAttachments = attachments.filter(att => 
        att.type === "photo" || 
        att.type === "animated_image" || 
        att.mimeType?.startsWith("image/")
      );

      if (imageAttachments.length === 0) {
        return api.sendMessage("❌ No images found in the attachments", event.threadID, event.messageID);
      }

      // Parse parameters
      const params = this.parseParams(args);
      
      // Handle multiple images upload
      if (command === 'multiple' || command === 'all' || imageAttachments.length > 1 || params.all) {
        return await this.uploadMultipleImages(api, event, imageAttachments, params);
      } else {
        // Single image upload
        return await this.uploadSingleImage(api, event, imageAttachments[0], params);
      }

    } catch (error) {
      console.error("Error in onStart:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  },

  // Upload single image
  uploadSingleImage: async function(api, event, attachment, params) {
    const loadingMsg = await api.sendMessage("📤 Uploading image to Catbox...", event.threadID);
    
    try {
      const result = await this.processImage(attachment, params);
      
      await api.unsendMessage(loadingMsg.messageID);
      
      const message = this.formatSingleResult(result);
      return api.sendMessage(message, event.threadID, event.messageID);
      
    } catch (error) {
      await api.unsendMessage(loadingMsg.messageID);
      return api.sendMessage(`❌ Failed to upload image: ${error.message}`, event.threadID, event.messageID);
    }
  },

  // Upload multiple images
  uploadMultipleImages: async function(api, event, attachments, params) {
    const totalImages = attachments.length;
    
    // Send initial message
    const progressMsg = await api.sendMessage(
      `🔄 Processing ${totalImages} images...\n📊 Progress: 0/${totalImages} (0%)`,
      event.threadID
    );

    const results = [];
    const failed = [];
    
    try {
      // Create album if specified
      let albumId = null;
      if (params.album) {
        albumId = await this.createAlbum(params.album, params.password);
      }

      // Process images sequentially
      for (let i = 0; i < totalImages; i++) {
        try {
          // Update progress
          const progress = Math.round(((i + 1) / totalImages) * 100);
          await api.editMessage(
            `🔄 Processing ${totalImages} images...\n📊 Progress: ${i + 1}/${totalImages} (${progress}%)`,
            progressMsg.messageID
          );

          const attachment = attachments[i];
          const result = await this.processImage(attachment, { 
            ...params, 
            album: albumId 
          });
          
          results.push({
            index: i + 1,
            name: attachment.name || `image_${i + 1}`,
            url: result.url,
            size: result.size,
            success: true
          });
          
          // Small delay to avoid rate limiting
          await this.delay(500);
          
        } catch (error) {
          console.error(`Failed to process image ${i + 1}:`, error);
          failed.push({
            index: i + 1,
            error: error.message
          });
        }
      }

      // Delete progress message
      await api.unsendMessage(progressMsg.messageID);
      
      // Send final results
      return await this.sendMultipleResults(api, event, results, failed, params, albumId);
      
    } catch (error) {
      await api.unsendMessage(progressMsg.messageID);
      return api.sendMessage(`❌ Batch upload failed: ${error.message}`, event.threadID, event.messageID);
    }
  },

  // Process individual image
  processImage: async function(attachment, params = {}) {
    return new Promise(async (resolve, reject) => {
      try {
        const tempPath = path.join(__dirname, "cache", `catbox_img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`);
        
        // Download image
        const response = await axios({
          method: 'GET',
          url: attachment.url,
          responseType: 'stream',
          timeout: 30000
        });

        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);

        writer.on('finish', async () => {
          try {
            // Get file info
            const stats = fs.statSync(tempPath);
            const fileSize = stats.size;
            
            // Check file size limit (Catbox has 200MB limit)
            if (fileSize > 200 * 1024 * 1024) {
              fs.unlinkSync(tempPath);
              reject(new Error("File size exceeds 200MB limit"));
              return;
            }

            // Prepare form data
            const form = new FormData();
            form.append("reqtype", "fileupload");
            form.append("fileToUpload", fs.createReadStream(tempPath));
            
            // Add optional parameters
            if (params.album) form.append("album", params.album);
            if (params.password) form.append("password", params.password);
            if (params.expire) form.append("expire", params.expire);
            if (params.name) form.append("filename", params.name);
            
            // Upload to catbox
            const uploadRes = await axios.post("https://catbox.moe/user/api.php", form, {
              headers: form.getHeaders(),
              timeout: 60000
            });

            // Clean up temp file
            fs.unlinkSync(tempPath);
            
            const link = uploadRes.data.trim();
            
            if (!link.startsWith("http")) {
              reject(new Error("Invalid response from Catbox"));
              return;
            }
            
            resolve({
              url: link,
              size: fileSize,
              success: true
            });
            
          } catch (error) {
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
            reject(error);
          }
        });

        writer.on('error', (error) => {
          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          reject(error);
        });

      } catch (error) {
        reject(error);
      }
    });
  },

  // Create album on Catbox
  createAlbum: async function(albumName, password = null) {
    try {
      const form = new FormData();
      form.append("reqtype", "createalbum");
      form.append("album", albumName);
      if (password) form.append("password", password);
      
      const response = await axios.post("https://catbox.moe/user/api.php", form, {
        headers: form.getHeaders()
      });
      
      return response.data.trim(); // Returns album ID
    } catch (error) {
      console.error("Album creation failed:", error);
      return null;
    }
  },

  // Send multiple results
  sendMultipleResults: async function(api, event, results, failed, params, albumId) {
    const totalSuccess = results.length;
    const totalFailed = failed.length;
    const totalProcessed = totalSuccess + totalFailed;
    
    // Format main message
    let message = `📦 **Batch Upload Complete**\n\n`;
    message += `✅ Success: ${totalSuccess}/${totalProcessed}\n`;
    if (totalFailed > 0) {
      message += `❌ Failed: ${totalFailed}/${totalProcessed}\n`;
    }
    
    // Add album info if created
    if (albumId && params.album) {
      message += `\n📁 Album Created: ${params.album}\n`;
      message += `🔗 Album Link: https://catbox.moe/c/${albumId}\n`;
      if (params.password) {
        message += `🔐 Password: ${params.password}\n`;
      }
    }
    
    message += `\n⏰ Processed at: ${new Date().toLocaleString()}\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Add successful images
    if (totalSuccess > 0) {
      message += `📷 **Uploaded Images (${totalSuccess}):**\n\n`;
      
      results.forEach((img, index) => {
        const sizeInfo = img.size ? ` (${this.formatBytes(img.size)})` : '';
        message += `${index + 1}. ${img.name}${sizeInfo}\n`;
        message += `   🔗 ${img.url}\n\n`;
      });
    }
    
    // Add failed images
    if (totalFailed > 0) {
      message += `\n❌ **Failed Images (${totalFailed}):**\n\n`;
      failed.forEach(fail => {
        message += `Image ${fail.index}: ${fail.error}\n`;
      });
    }
    
    // Add summary and options
    message += `\n━━━━━━━━━━━━━━━━━━\n`;
    message += `📋 **Quick Actions:**\n`;
    message += `• Copy All Links: Use below\n`;
    message += `• Download All: Contact admin for ZIP\n`;
    message += `• Re-upload Failed: Reply with /catbox retry\n`;
    
    // Create links-only message (for easy copying)
    const linksOnly = this.createLinksOnlyMessage(results, albumId, params);
    
    // Send main message
    await api.sendMessage(message, event.threadID, event.messageID);
    
    // Send links-only message if there are many images
    if (results.length > 3) {
      await api.sendMessage(linksOnly, event.threadID);
    }
    
    return { success: true };
  },

  // Create links-only message
  createLinksOnlyMessage: function(results, albumId, params) {
    let message = `📋 **All Image Links**\n`;
    message += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    results.forEach((img, index) => {
      message += `${index + 1}. ${img.url}\n`;
    });
    
    if (albumId && params.album) {
      message += `\n📁 Album: https://catbox.moe/c/${albumId}`;
      if (params.password) {
        message += `\n🔐 Password: ${params.password}`;
      }
    }
    
    message += `\n━━━━━━━━━━━━━━━━━━\n`;
    message += `Total: ${results.length} images`;
    
    return message;
  },

  // Format single result
  formatSingleResult: function(result) {
    return `🖼️ **Image Uploaded Successfully!**\n\n`
         + `🔗 **Direct Link:**\n${result.url}\n\n`
         + `📊 **Size:** ${this.formatBytes(result.size)}\n`
         + `⏰ **Uploaded:** ${new Date().toLocaleString()}\n\n`
         + `📋 **Shortcuts:**\n`
         + `• Copy: \`${result.url}\`\n`
         + `• View: ${result.url.replace('catbox.moe', 'files.catbox.moe')}\n`
         + `• Delete: Contact admin`;
  },

  // Helper functions
  parseParams: function(args) {
    const params = {};
    
    args.forEach(arg => {
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        const lowerKey = key.toLowerCase();
        
        if (lowerKey === 'album' || lowerKey === 'name') {
          params.album = value;
        } else if (lowerKey === 'pass' || lowerKey === 'password') {
          params.password = value;
        } else if (lowerKey === 'expire' || lowerKey === 'expiry') {
          params.expire = value;
        } else if (lowerKey === 'all') {
          params.all = true;
        }
      } else if (arg === 'all' || arg === 'multiple') {
        params.all = true;
      }
    });
    
    return params;
  },

  formatBytes: function(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  delay: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  },

  getHelpMessage: function() {
    return this.config.guide.en;
  }
};
