const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");

module.exports = {
  config: {
    name: "catbox",
    version: "5.0.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Upload files to Catbox",
    longDescription: "Upload images, videos, audio, documents to Catbox.moe",
    category: "tools",
    guide: "Reply to any file and type: /catbox"
  },

  onStart: async function({ api, event, args }) {
    try {
      // Check if replied to a message
      if (!event.messageReply) {
        return api.sendMessage("❌ Please reply to a file first", event.threadID, event.messageID);
      }

      const attachments = event.messageReply.attachments;
      if (!attachments || attachments.length === 0) {
        return api.sendMessage("❌ No files found in the replied message", event.threadID, event.messageID);
      }

      // Single file upload
      if (attachments.length === 1) {
        return await this.uploadSingleFile(api, event, attachments[0]);
      }
      
      // Multiple files upload
      return await this.uploadMultipleFiles(api, event, attachments);

    } catch (error) {
      console.error("Error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  },

  // Upload single file
  uploadSingleFile: async function(api, event, attachment) {
    try {
      await api.sendMessage("📤 Uploading to Catbox...", event.threadID);
      
      const result = await this.uploadFile(attachment.url, attachment.name || "file");
      
      const message = `✅ Successfully uploaded to Catbox!\n🔗 ${result.url}`;
      
      return api.sendMessage(message, event.threadID);
      
    } catch (error) {
      console.error("Upload error:", error);
      return api.sendMessage(`❌ Upload failed: ${error.message}`, event.threadID);
    }
  },

  // Upload multiple files
  uploadMultipleFiles: async function(api, event, attachments) {
    try {
      const totalFiles = attachments.length;
      await api.sendMessage(`📤 Uploading ${totalFiles} files to Catbox...`, event.threadID);
      
      const results = [];
      const failed = [];
      
      // Upload files one by one
      for (let i = 0; i < totalFiles; i++) {
        try {
          const attachment = attachments[i];
          const result = await this.uploadFile(attachment.url, attachment.name || `file_${i + 1}`);
          
          results.push({
            index: i + 1,
            url: result.url,
            success: true
          });
          
          // Small delay between uploads
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          console.error(`Failed file ${i + 1}:`, error);
          failed.push({
            index: i + 1,
            error: error.message
          });
        }
      }
      
      // Send results
      return this.sendBatchResults(api, event, results, failed);
      
    } catch (error) {
      console.error("Batch upload error:", error);
      return api.sendMessage(`❌ Batch upload failed: ${error.message}`, event.threadID);
    }
  },

  // Core upload function
  uploadFile: async function(fileUrl, fileName) {
    return new Promise((resolve, reject) => {
      // Create temp file path
      const tempPath = path.join(__dirname, "cache", `catbox_temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      
      // Download file
      axios({
        method: 'GET',
        url: fileUrl,
        responseType: 'stream',
        timeout: 30000
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
              reject(new Error("Invalid response from Catbox"));
              return;
            }
            
            resolve({
              url: link,
              fileName: fileName
            });
            
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
    
    // Format message
    let message = `📊 **UPLOAD COMPLETE**\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `✅ **SUCCESSFUL:** ${totalSuccess}/${totalProcessed}\n`;
    
    if (totalFailed > 0) {
      message += `❌ **FAILED:** ${totalFailed}/${totalProcessed}\n`;
    }
    
    message += `📦 **TOTAL FILES:** ${totalProcessed}\n`;
    message += `⏰ **TIME:** ${new Date().toLocaleTimeString()}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Add successful files
    if (totalSuccess > 0) {
      message += `✅ **UPLOADED FILES:**\n\n`;
      
      results.forEach(file => {
        message += `File ${file.index}: ${file.url}\n`;
      });
      
      message += `\n`;
    }
    
    // Add failed files (simplified)
    if (totalFailed > 0) {
      message += `❌ **FAILED FILES:** ${totalFailed} files failed to upload\n`;
    }
    
    // Send the message
    return api.sendMessage(message, event.threadID);
  }
};
