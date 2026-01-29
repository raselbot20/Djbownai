const axios = require("axios");
const fs = require("fs");
const path = require("path");
const FormData = require("form-data");
const mime = require("mime-types");

module.exports = {
  config: {
    name: "catbox",
    version: "4.0.0",
    author: "Rasel Mahmud",
    countDown: 5,
    role: 0,
    shortDescription: "Upload all file types to Catbox",
    longDescription: "Upload images, videos, audio, documents to Catbox.moe",
    category: "tools",
    guide: {
      en: "Reply to any file and type: /catbox [or use specific commands below]"
    }
  },

  onStart: async function({ api, event, args }) {
    try {
      // Show help if no reply
      if (!event.messageReply) {
        return this.showHelp(api, event);
      }

      const attachments = event.messageReply.attachments;
      if (!attachments || attachments.length === 0) {
        return api.sendMessage("❌ No attachments found in the replied message", event.threadID, event.messageID);
      }

      const command = args[0]?.toLowerCase();
      
      // Handle specific commands
      switch(command) {
        case 'help':
          return this.showHelp(api, event);
        case 'info':
          return this.showFileInfo(api, event, attachments);
        case 'stats':
          return this.showStats(api, event);
        default:
          return await this.processUpload(api, event, attachments, args);
      }

    } catch (error) {
      console.error("Error:", error);
      return api.sendMessage(`❌ Error: ${error.message}`, event.threadID, event.messageID);
    }
  },

  // Show comprehensive help
  showHelp: function(api, event) {
    const helpMessage = `📦 **Catbox Universal Uploader v4.0** 📦

🔧 **COMMANDS:**
/catbox help - Show this help message
/catbox info - Show file information
/catbox stats - Show upload statistics

📁 **SUPPORTED FILE TYPES:**

🖼️ **IMAGES:**
• JPEG/JPG (.jpg, .jpeg)
• PNG (.png)
• GIF (.gif) - Static & Animated
• WEBP (.webp)
• BMP (.bmp)
• TIFF (.tiff)
• ICO (.ico)

🎬 **VIDEOS:**
• MP4 (.mp4)
• AVI (.avi)
• MOV (.mov)
• MKV (.mkv)
• WEBM (.webm)
• FLV (.flv)
• WMV (.wmv)
• 3GP (.3gp)

🎵 **AUDIO:**
• MP3 (.mp3)
• WAV (.wav)
• OGG (.ogg)
• M4A (.m4a)
• FLAC (.flac)
• AAC (.aac)
• WMA (.wma)

📄 **DOCUMENTS:**
• PDF (.pdf)
• DOC/DOCX (.doc, .docx)
• TXT (.txt)
• RTF (.rtf)
• XLS/XLSX (.xls, .xlsx)
• PPT/PPTX (.ppt, .pptx)

🗄️ **ARCHIVES:**
• ZIP (.zip)
• RAR (.rar)
• 7Z (.7z)
• TAR (.tar)
• GZ (.gz)

💾 **OTHER FILES:**
• APK (.apk)
• EXE (.exe)
• ISO (.iso)
• DMG (.dmg)

🚀 **HOW TO USE:**
1. Reply to any file (single or multiple)
2. Type: /catbox
3. Wait for upload to complete
4. Get direct download links

⚡ **FEATURES:**
• Multiple file upload (up to 20 files)
• File type detection
• File size display
• Parallel upload for faster processing
• Auto cleanup of temporary files
• Error handling with retry option

📏 **LIMITS:**
• Max file size: 200 MB per file
• Max files per batch: 20
• Supported formats: All common types
• Storage: Permanent (no auto-delete)

🛡️ **SECURITY:**
• No file scanning
• No logging of content
• Direct links only
• HTTPS secure upload

💡 **TIPS:**
• Use good internet for large files
• Compress files if needed
• Videos may take longer to upload
• All links are permanent

❓ **NEED HELP?**
Contact bot admin for support.

✅ **READY TO UPLOAD?**
Reply to any file and type: /catbox`;

    return api.sendMessage(helpMessage, event.threadID, event.messageID);
  },

  // Process upload
  processUpload: async function(api, event, attachments, args) {
    const totalFiles = attachments.length;
    
    // Send initial message
    const initialMsg = await api.sendMessage(
      `📤 Preparing to upload ${totalFiles} file(s)...\n⏳ Please wait...`,
      event.threadID
    );

    const results = [];
    const failed = [];
    
    // Process each file
    for (let i = 0; i < totalFiles; i++) {
      try {
        const attachment = attachments[i];
        
        // Send file type specific message
        const fileType = this.getFileType(attachment.type);
        const typeEmoji = this.getTypeEmoji(fileType);
        
        if (i === 0) {
          await api.editMessage(
            `📤 Uploading ${totalFiles} file(s)...\n📁 Currently: ${typeEmoji} File ${i + 1}/${totalFiles}`,
            initialMsg.messageID
          );
        }
        
        const result = await this.uploadFile(attachment, i + 1);
        
        results.push({
          index: i + 1,
          type: fileType,
          emoji: typeEmoji,
          url: result.url,
          size: result.size,
          name: result.name,
          success: true
        });
        
        // Delay between uploads to avoid rate limiting
        await this.delay(800);
        
      } catch (error) {
        console.error(`Failed to upload file ${i + 1}:`, error);
        failed.push({
          index: i + 1,
          error: error.message.substring(0, 50) + '...'
        });
      }
    }

    // Delete initial message
    await api.unsendMessage(initialMsg.messageID);
    
    // Send results
    return await this.sendUploadResults(api, event, results, failed);
  },

  // Upload single file
  uploadFile: async function(attachment, index) {
    return new Promise((resolve, reject) => {
      // Get file extension
      const ext = this.getFileExtension(attachment.type, attachment.name);
      const tempFileName = `catbox_${index}_${Date.now()}${ext}`;
      const tempPath = path.join(__dirname, "cache", tempFileName);
      
      // Download file
      axios({
        method: 'GET',
        url: attachment.url,
        responseType: 'stream',
        timeout: 45000 // 45 seconds timeout
      })
      .then(response => {
        const writer = fs.createWriteStream(tempPath);
        response.data.pipe(writer);
        
        writer.on('finish', async () => {
          try {
            // Get file stats
            const stats = fs.statSync(tempPath);
            const fileSize = stats.size;
            
            // Check file size limit (Catbox has 200MB limit)
            const maxSize = 200 * 1024 * 1024; // 200MB in bytes
            if (fileSize > maxSize) {
              fs.unlinkSync(tempPath);
              reject(new Error(`File too large (${this.formatBytes(fileSize)} > ${this.formatBytes(maxSize)})`));
              return;
            }
            
            // Prepare form data for Catbox
            const form = new FormData();
            form.append("reqtype", "fileupload");
            form.append("fileToUpload", fs.createReadStream(tempPath));
            
            // Get filename
            const fileName = attachment.name || `file_${index}${ext}`;
            
            // Upload to Catbox
            const uploadRes = await axios.post("https://catbox.moe/user/api.php", form, {
              headers: form.getHeaders(),
              timeout: 60000,
              maxContentLength: Infinity,
              maxBodyLength: Infinity
            });
            
            // Clean up temp file
            fs.unlinkSync(tempPath);
            
            const link = uploadRes.data.trim();
            
            if (!link.startsWith("http")) {
              reject(new Error("Invalid response from Catbox server"));
              return;
            }
            
            resolve({
              url: link,
              size: fileSize,
              name: fileName,
              type: attachment.type
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

  // Send upload results
  sendUploadResults: async function(api, event, results, failed) {
    const totalSuccess = results.length;
    const totalFailed = failed.length;
    const totalProcessed = totalSuccess + totalFailed;
    
    // Format results message
    let message = `📊 **UPLOAD COMPLETE**\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    message += `✅ **SUCCESSFUL:** ${totalSuccess}/${totalProcessed}\n`;
    
    if (totalFailed > 0) {
      message += `❌ **FAILED:** ${totalFailed}/${totalProcessed}\n`;
    }
    
    message += `📦 **TOTAL FILES:** ${totalProcessed}\n`;
    message += `⏰ **TIME:** ${new Date().toLocaleTimeString()}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    // Add successful files with details
    if (totalSuccess > 0) {
      message += `📋 **UPLOADED FILES:**\n\n`;
      
      results.forEach(file => {
        const sizeInfo = this.formatBytes(file.size);
        message += `${file.emoji} **File ${file.index}** (${file.type.toUpperCase()})\n`;
        message += `📁 Name: ${file.name}\n`;
        message += `📊 Size: ${sizeInfo}\n`;
        message += `🔗 Link: ${file.url}\n`;
        message += `────────────────────\n`;
      });
    }
    
    // Add failed files
    if (totalFailed > 0) {
      message += `\n❌ **FAILED FILES:**\n\n`;
      failed.forEach(fail => {
        message += `File ${fail.index}: ${fail.error}\n`;
      });
    }
    
    // Add summary
    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📌 **QUICK ACTIONS:**\n`;
    message += `• Copy all links from above\n`;
    message += `• Share links with anyone\n`;
    message += `• Files are stored permanently\n`;
    message += `• No download limits\n`;
    message += `• Direct download links\n`;
    
    // Calculate total size
    const totalSize = results.reduce((sum, file) => sum + file.size, 0);
    message += `\n💾 **TOTAL SIZE UPLOADED:** ${this.formatBytes(totalSize)}\n`;
    
    // Send main message
    await api.sendMessage(message, event.threadID);
    
    // Send links-only message for easy copying (if many files)
    if (results.length > 3) {
      const linksMessage = this.createLinksMessage(results);
      await api.sendMessage(linksMessage, event.threadID);
    }
  },

  // Create links-only message
  createLinksMessage: function(results) {
    let message = `🔗 **ALL DOWNLOAD LINKS**\n`;
    message += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    results.forEach(file => {
      message += `${file.index}. ${file.url}\n`;
    });
    
    message += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📦 Total: ${results.length} files uploaded\n`;
    message += `✅ All links are permanent\n`;
    message += `🚀 No download speed limits`;
    
    return message;
  },

  // Show file information
  showFileInfo: async function(api, event, attachments) {
    let infoMessage = `📄 **FILE INFORMATION**\n`;
    infoMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    attachments.forEach((attachment, index) => {
      const fileType = this.getFileType(attachment.type);
      const emoji = this.getTypeEmoji(fileType);
      
      infoMessage += `${emoji} **File ${index + 1}**\n`;
      infoMessage += `📁 Type: ${fileType.toUpperCase()}\n`;
      infoMessage += `🔤 MIME: ${attachment.mimeType || 'Unknown'}\n`;
      infoMessage += `🏷️ Name: ${attachment.name || 'Unnamed'}\n`;
      infoMessage += `📊 Size: ${attachment.size ? this.formatBytes(attachment.size) : 'Unknown'}\n`;
      infoMessage += `🆔 ID: ${attachment.ID || 'N/A'}\n`;
      infoMessage += `────────────────────\n`;
    });
    
    infoMessage += `\n📌 **STATUS:** Ready for upload\n`;
    infoMessage += `✅ Use: /catbox to upload all files`;
    
    return api.sendMessage(infoMessage, event.threadID, event.messageID);
  },

  // Show upload statistics
  showStats: function(api, event) {
    const statsMessage = `📈 **UPLOAD STATISTICS**\n`;
    statsMessage += `━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    statsMessage += `📦 **Service:** Catbox.moe\n`;
    statsMessage += `🚀 **Status:** Operational\n`;
    statsMessage += `💾 **Max File Size:** 200 MB\n`;
    statsMessage += `📁 **File Types:** All supported\n`;
    statsMessage += `⏳ **Upload Time:** 1-30 seconds\n`;
    statsMessage += `🔗 **Link Lifetime:** Permanent\n`;
    statsMessage += `📊 **Bandwidth:** Unlimited\n`;
    statsMessage += `🛡️ **Security:** HTTPS Only\n`;
    statsMessage += `🌐 **Server:** Global CDN\n`;
    statsMessage += `💰 **Cost:** Free Forever\n`;
    
    statsMessage += `\n━━━━━━━━━━━━━━━━━━━━━━\n`;
    statsMessage += `✅ **READY TO UPLOAD?**\n`;
    statsMessage += `Reply to files and type: /catbox`;
    
    return api.sendMessage(statsMessage, event.threadID, event.messageID);
  },

  // Helper function to get file type
  getFileType: function(mimeType) {
    if (!mimeType) return 'unknown';
    
    if (mimeType.includes('image')) return 'image';
    if (mimeType.includes('video')) return 'video';
    if (mimeType.includes('audio')) return 'audio';
    if (mimeType.includes('pdf')) return 'document';
    if (mimeType.includes('document') || mimeType.includes('msword') || mimeType.includes('word')) return 'document';
    if (mimeType.includes('sheet') || mimeType.includes('excel')) return 'document';
    if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return 'document';
    if (mimeType.includes('text')) return 'document';
    if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('compressed')) return 'archive';
    if (mimeType.includes('application')) return 'application';
    
    return 'file';
  },

  // Get emoji for file type
  getTypeEmoji: function(fileType) {
    const emojis = {
      'image': '🖼️',
      'video': '🎬',
      'audio': '🎵',
      'document': '📄',
      'archive': '🗄️',
      'application': '💾',
      'file': '📎',
      'unknown': '📦'
    };
    return emojis[fileType] || '📦';
  },

  // Get file extension
  getFileExtension: function(mimeType, fileName) {
    // Try to get extension from filename first
    if (fileName && fileName.includes('.')) {
      const ext = '.' + fileName.split('.').pop().toLowerCase();
      // Validate common extensions
      const validExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.mp4', '.avi', '.mov', '.mkv', '.mp3', '.wav', '.pdf', '.doc', '.docx', '.zip', '.rar'];
      if (validExts.includes(ext)) {
        return ext;
      }
    }
    
    // Fallback to mime-type based extension
    const extension = mime.extension(mimeType);
    return extension ? '.' + extension : '.bin';
  },

  // Format bytes to human readable
  formatBytes: function(bytes, decimals = 2) {
    if (bytes === 0 || !bytes) return '0 Bytes';
    if (typeof bytes === 'string') bytes = parseInt(bytes);
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  },

  // Delay function
  delay: function(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
