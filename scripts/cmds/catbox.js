const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "catbox",
    version: "9.0.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Upload files with auto-unsend progress",
    longDescription: "Upload files to Catbox with progress messages that auto-unsend",
    category: "tools",
    guide: "Reply to any file and type: /catbox"
  },

  onStart: async function({ api, event }) {
    try {
      // Check if replied to a message
      if (!event.messageReply) {
        return api.sendMessage(this.createBox("❌ Please reply to a file first"), event.threadID, event.messageID);
      }

      const attachments = event.messageReply.attachments;
      if (!attachments || attachments.length === 0) {
        return api.sendMessage(this.createBox("❌ No files found in the replied message"), event.threadID, event.messageID);
      }

      // Send initial progress message
      const progressMsg = await api.sendMessage(
        this.createBox(`📤 Starting upload...\n║ Files: ${attachments.length}\n║ Status: Preparing`),
        event.threadID
      );

      // Single file upload
      if (attachments.length === 1) {
        const result = await this.uploadSingleFile(api, event, attachments[0], progressMsg);
        return result;
      }
      
      // Multiple files upload
      const result = await this.uploadMultipleFiles(api, event, attachments, progressMsg);
      return result;

    } catch (error) {
      console.error("Error:", error);
      return api.sendMessage(this.createBox(`❌ Error: ${error.message}`), event.threadID, event.messageID);
    }
  },

  // Create beautiful box design
  createBox: function(content) {
    const boxTop = "╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗";
    const boxBottom = "╚════════════════════╝";
    
    // Format content with box borders
    const lines = content.split('\n');
    const formatted = lines.map(line => `║ ${line}`).join('\n');
    
    return `${boxTop}\n${formatted}\n${boxBottom}`;
  },

  // Update progress message
  updateProgress: async function(api, progressMsg, current, total, status) {
    try {
      const progressContent = `📤 Uploading...\n║ Progress: ${current}/${total}\n║ Status: ${status}`;
      await api.editMessage(this.createBox(progressContent), progressMsg.messageID);
    } catch (error) {
      // If edit fails, just continue
      console.log("Progress update skipped");
    }
  },

  // Get Bangladesh time
  getBangladeshTime: function() {
    const now = new Date();
    // Bangladesh is UTC+6
    const bdTime = new Date(now.getTime() + (6 * 60 * 60 * 1000));
    
    const date = bdTime.getDate().toString().padStart(2, '0');
    const month = (bdTime.getMonth() + 1).toString().padStart(2, '0');
    const year = bdTime.getFullYear();
    
    let hours = bdTime.getHours();
    const minutes = bdTime.getMinutes().toString().padStart(2, '0');
    const seconds = bdTime.getSeconds().toString().padStart(2, '0');
    
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    
    return `🕒 ${date}/${month}/${year}, ${hours}:${minutes}:${seconds} ${ampm}`;
  },

  // Upload single file
  uploadSingleFile: async function(api, event, attachment, progressMsg) {
    try {
      // Update progress
      await this.updateProgress(api, progressMsg, 1, 1, "Uploading file...");
      
      const result = await this.uploadFile(attachment.url);
      
      // Auto unsend progress message
      await api.unsendMessage(progressMsg.messageID);
      
      const bdTime = this.getBangladeshTime();
      const successMessage = 
        `✅ File uploaded successfully!\n` +
        `🔗 ${result}\n` +
        `━━━━━━━━━━━━━━━━━━\n` +
        `${bdTime}\n` +
        `📎 Direct download link`;
      
      return api.sendMessage(this.createBox(successMessage), event.threadID);
      
    } catch (error) {
      // Auto unsend progress message on error too
      if (progressMsg) {
        await api.unsendMessage(progressMsg.messageID);
      }
      
      console.error("Upload error:", error);
      return api.sendMessage(this.createBox(`❌ Upload failed:\n║ ${error.message}`), event.threadID);
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async function(api, event, attachments, progressMsg) {
    try {
      const totalFiles = attachments.length;
      const results = [];
      const failed = [];
      
      // Upload files one by one
      for (let i = 0; i < totalFiles; i++) {
        try {
          // Update progress for each file
          await this.updateProgress(api, progressMsg, i + 1, totalFiles, `File ${i + 1}/${totalFiles}`);
          
          const attachment = attachments[i];
          const result = await this.uploadFile(attachment.url);
          
          results.push({
            index: i + 1,
            url: result,
            success: true
          });
          
          // Small delay between uploads
          await new Promise(resolve => setTimeout(resolve, 500));
          
        } catch (error) {
          console.error(`Failed file ${i + 1}:`, error);
          failed.push({
            index: i + 1,
            error: error.message.substring(0, 30) + '...'
          });
        }
      }
      
      // Auto unsend progress message after completion
      await api.unsendMessage(progressMsg.messageID);
      
      // Send final results
      return this.sendBatchResults(api, event, results, failed);
      
    } catch (error) {
      // Auto unsend progress message on error
      if (progressMsg) {
        await api.unsendMessage(progressMsg.messageID);
      }
      
      console.error("Batch upload error:", error);
      return api.sendMessage(this.createBox(`❌ Batch upload failed:\n║ ${error.message}`), event.threadID);
    }
  },

  // Core upload function
  uploadFile: async function(fileUrl) {
    return new Promise((resolve, reject) => {
      const tempPath = path.join(__dirname, "cache", `catbox_${Date.now()}_${Math.random().toString(36).substr(2, 6)}.temp`);
      
      // Download file
      axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
        timeout: 40000
      })
      .then(response => {
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);
        
        writer.on('finish', async () => {
          try {
            // Upload to Catbox
            const form = new FormData();
            form.append("reqtype", "fileupload");
            form.append("fileToUpload", fs.createReadStream(tempPath));
            
            const uploadRes = await axios.post("https://catbox.moe/user/api.php", form, {
              headers: form.getHeaders(),
              timeout: 60000
            });
            
            // Clean up temp file
            if (fs.existsSync(tempPath)) {
              fs.unlinkSync(tempPath);
            }
            
            const link = uploadRes.data.trim();
            
            if (!link.startsWith("http")) {
              reject(new Error("Invalid response from Catbox server"));
              return;
            }
            
            resolve(link);
            
          } catch (error) {
            // Clean up on error
            if (fs.existsSync(tempPath)) {
              fs.unlinkSync(tempPath);
            }
            reject(error);
          }
        });
        
        writer.on('error', (error) => {
          if (fs.existsSync(tempPath)) {
            fs.unlinkSync(tempPath);
          }
          reject(error);
        });
        
      })
      .catch(error => {
        reject(error);
      });
    });
  },

  // Send batch results
  sendBatchResults: async function(api, event, results, failed) {
    const totalSuccess = results.length;
    const totalFailed = failed.length;
    const totalProcessed = totalSuccess + totalFailed;
    
    const bdTime = this.getBangladeshTime();
    
    // Format message content
    let content = `📦 **UPLOAD COMPLETE**\n`;
    content += `━━━━━━━━━━━━━━━━━━\n`;
    content += `✅ Successful: ${totalSuccess}/${totalProcessed}\n`;
    
    if (totalFailed > 0) {
      content += `❌ Failed: ${totalFailed}/${totalProcessed}\n`;
    }
    
    content += `📁 Total Files: ${totalProcessed}\n`;
    content += `${bdTime}\n`;
    content += `━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Add successful files
    if (totalSuccess > 0) {
      content += `🔗 **DOWNLOAD LINKS:**\n`;
      
      results.forEach(file => {
        content += `\n${file.index}. ${file.url}`;
      });
      
      content += `\n\n`;
    }
    
    // Add failed files info
    if (totalFailed > 0) {
      content += `❌ ${totalFailed} file(s) failed to upload\n`;
    }
    
    content += `\n━━━━━━━━━━━━━━━━━━\n`;
    content += `📌 **QUICK INFO:**\n`;
    content += `• All links are permanent\n`;
    content += `• No download limits\n`;
    content += `• Direct download links`;
    
    return api.sendMessage(this.createBox(content), event.threadID);
  }
};
