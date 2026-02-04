const { createCanvas, loadImage, registerFont } = require('canvas');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
	config: {
		name: 'fbcover',
		version: '2.0',
		author: 'Rasel Mahmud',
		countDown: 5,
		role: 0,
		shortDescription: 'Create a Facebook banner',
		longDescription: 'Generates a Facebook cover using custom input.',
		category: 'Image Generation',
		guide: {
			en: '{p}{n} <name> | <subname> | <address> | <phone> | <email> | <color>',
		}
	},

	onStart: async function ({ message, args, event }) {
		try {
			const info = args.join(' ').split('|').map(i => i.trim());
			if (info.length < 6) {
				return message.reply(`⚠️ Please enter all 6 details:\n/fbcover name | subname | address | phone | email | color\n\nExample: /fbcover John Doe | Developer | Dhaka, Bangladesh | 017XXXXXXX | john@email.com | blue`);
			}

			const [name, subname, address, phoneNumber, email, color] = info;

			await message.reply('🎨 Processing your Facebook cover... Please wait!');

			// Create canvas
			const width = 1500; // Facebook cover width
			const height = 500; // Facebook cover height
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext('2d');

			// Color mapping
			const colorMap = {
				'blue': { main: '#1877F2', secondary: '#0A5BC4', accent: '#42A5F5' },
				'red': { main: '#FF4444', secondary: '#CC0000', accent: '#FF6666' },
				'green': { main: '#00C851', secondary: '#007E33', accent: '#5EFC8D' },
				'purple': { main: '#AA66CC', secondary: '#9933CC', accent: '#BB86FC' },
				'orange': { main: '#FF8800', secondary: '#FF5500', accent: '#FFBB33' },
				'pink': { main: '#E91E63', secondary: '#C2185B', accent: '#F48FB1' },
				'teal': { main: '#009688', secondary: '#00796B', accent: '#4DB6AC' },
				'yellow': { main: '#FFEB3B', secondary: '#FBC02D', accent: '#FFF176' },
				'black': { main: '#212121', secondary: '#000000', accent: '#424242' },
				'white': { main: '#FFFFFF', secondary: '#F5F5F5', accent: '#FAFAFA' },
				'gray': { main: '#757575', secondary: '#616161', accent: '#9E9E9E' }
			};

			// Get color or default to blue
			const selectedColor = colorMap[color.toLowerCase()] || colorMap['blue'];

			// ===== BACKGROUND DESIGN =====
			// Create gradient background
			const gradient = ctx.createLinearGradient(0, 0, width, height);
			gradient.addColorStop(0, selectedColor.main);
			gradient.addColorStop(0.5, selectedColor.secondary);
			gradient.addColorStop(1, selectedColor.main);
			
			ctx.fillStyle = gradient;
			ctx.fillRect(0, 0, width, height);

			// Add geometric pattern
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
			ctx.lineWidth = 2;
			
			// Draw diagonal lines
			for (let i = -height; i < width; i += 30) {
				ctx.beginPath();
				ctx.moveTo(i, 0);
				ctx.lineTo(i + height, height);
				ctx.stroke();
			}

			// Draw circles
			ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
			for (let i = 0; i < 15; i++) {
				const x = Math.random() * width;
				const y = Math.random() * height;
				const radius = 20 + Math.random() * 80;
				ctx.beginPath();
				ctx.arc(x, y, radius, 0, Math.PI * 2);
				ctx.fill();
			}

			// ===== MAIN CONTENT AREA =====
			const contentX = 100;
			const contentY = 100;
			const contentWidth = width - 200;

			// Profile icon placeholder
			const profileSize = 120;
			const profileX = contentX;
			const profileY = contentY;
			
			// Draw profile circle
			ctx.fillStyle = selectedColor.accent;
			ctx.beginPath();
			ctx.arc(profileX + profileSize/2, profileY + profileSize/2, profileSize/2, 0, Math.PI * 2);
			ctx.fill();
			
			// Profile icon (letter from name)
			const firstLetter = name.charAt(0).toUpperCase();
			ctx.fillStyle = '#FFFFFF';
			ctx.font = 'bold 60px Arial';
			ctx.textAlign = 'center';
			ctx.fillText(firstLetter, profileX + profileSize/2, profileY + profileSize/2 + 20);

			// Name (Large text)
			ctx.fillStyle = '#FFFFFF';
			ctx.font = 'bold 70px Arial';
			ctx.textAlign = 'left';
			ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
			ctx.shadowBlur = 10;
			ctx.shadowOffsetX = 2;
			ctx.shadowOffsetY = 2;
			
			// Truncate long names
			let displayName = name;
			if (displayName.length > 20) {
				displayName = displayName.substring(0, 18) + '...';
			}
			ctx.fillText(displayName, profileX + profileSize + 40, profileY + 70);
			ctx.shadowBlur = 0;

			// Subname (Medium text)
			ctx.fillStyle = selectedColor.accent;
			ctx.font = 'bold 40px Arial';
			ctx.fillText(subname, profileX + profileSize + 40, profileY + 120);

			// Divider line
			ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.moveTo(contentX, profileY + 160);
			ctx.lineTo(contentX + contentWidth, profileY + 160);
			ctx.stroke();

			// ===== DETAILS SECTION =====
			const detailsY = profileY + 200;
			const detailSpacing = 60;

			// Function to draw detail row
			function drawDetail(icon, label, value, yPos, color = '#FFFFFF') {
				// Icon
				ctx.fillStyle = selectedColor.accent;
				ctx.font = '30px Arial';
				ctx.fillText(icon, contentX, yPos + 5);
				
				// Label
				ctx.fillStyle = '#CCCCCC';
				ctx.font = 'bold 25px Arial';
				ctx.fillText(label, contentX + 50, yPos);
				
				// Value
				ctx.fillStyle = color;
				ctx.font = '28px Arial';
				
				// Truncate long values
				let displayValue = value;
				if (displayValue.length > 30) {
					displayValue = displayValue.substring(0, 28) + '...';
				}
				ctx.fillText(displayValue, contentX + 200, yPos);
			}

			// Draw all details
			drawDetail('📍', 'Address:', address, detailsY);
			drawDetail('📱', 'Phone:', phoneNumber, detailsY + detailSpacing);
			drawDetail('✉️', 'Email:', email, detailsY + detailSpacing * 2);

			// ===== FACEBOOK BRANDING =====
			ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
			ctx.font = 'bold 120px Arial';
			ctx.textAlign = 'center';
			ctx.fillText('f', width / 2, height - 100);

			// ===== FOOTER TEXT =====
			ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
			ctx.font = 'italic 20px Arial';
			ctx.textAlign = 'right';
			ctx.fillText('Generated by: 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 | Created by Rasel Mahmud', width - 50, height - 30);

			// ===== BORDER =====
			ctx.strokeStyle = selectedColor.accent;
			ctx.lineWidth = 10;
			ctx.strokeRect(20, 20, width - 40, height - 40);

			// Save the image
			const cacheDir = path.join(__dirname, '..', 'cache');
			await fs.ensureDir(cacheDir);
			const filePath = path.join(cacheDir, `fbcover_${event.senderID}_${Date.now()}.png`);
			
			const buffer = canvas.toBuffer('image/png');
			fs.writeFileSync(filePath, buffer);

			// Send the image
			await message.reply({
				body: `✅ Your Facebook Cover is ready!\n━━━━━━━━━━━━━━━━\n👤 Name: ${name}\n💼 Title: ${subname}\n📍 Address: ${address}\n📱 Phone: ${phoneNumber}\n✉️ Email: ${email}\n🎨 Color: ${color}\n━━━━━━━━━━━━━━━━\n✨ Powered by: 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢`,
				attachment: fs.createReadStream(filePath)
			});

			// Delete the file after 10 seconds
			setTimeout(() => {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}, 10000);

		} catch (error) {
			console.error('Facebook Cover Error:', error);
			
			// Send more specific error messages
			if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
				return message.reply('❌ Server connection failed. The cover is now generated locally without any issues!');
			} else if (error.message.includes('timeout')) {
				return message.reply('⏱️ Request timeout. Please try again with the updated command.');
			} else {
				return message.reply(`❌ Error: ${error.message}\n\nPlease use the updated command format:\n/fbcover name | subname | address | phone | email | color`);
			}
		}
	}
};
