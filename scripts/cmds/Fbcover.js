const { createCanvas, loadImage } = require('canvas');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');

module.exports = {
	config: {
		name: 'fbcover',
		aliases: [],
		version: '8.0',
		author: 'Rasel Mahmud',
		countDown: 5,
		role: 0,
		shortDescription: 'Create responsive Facebook cover',
		longDescription: 'Generate responsive Facebook cover that works perfectly on all devices',
		category: 'image',
		guide: {
			en: '{pn} name | title | address | email | phone | color\nExample: {pn} Rasel Mahmud | Developer | Dhaka, BD | rasel@example.com | 017XXXXXXX | blue'
		}
	},

	onStart: async function ({ api, event, args, usersData }) {
		try {
			const input = args.join(' ');
			
			if (!input) {
				return api.sendMessage(
					`╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗
🎨 **ULTIMATE FB COVER GENERATOR** 🎨\n━━━━━━━━━━━━━━━━━━\n📝 Usage: fbcover name | title | address | email | phone | color\n\n🌈 Available colors: blue, red, green, purple, orange, pink, teal, gold, black, white, silver, violet, cyan, magenta, amber, emerald, indigo, rose\n\n📸 Example: fbcover Rasel Mahmud | Developer | Dhaka, Bangladesh | example@mail.com | 01712345678 | blue
╚═══════════════════╝`,
					event.threadID,
					event.messageID
				);
			}

			const parts = input.split('|').map(p => p.trim());
			if (parts.length < 6) {
				return api.sendMessage(
					`⚠️ Please provide all 6 parameters:\n1. Name\n2. Title/Subname\n3. Address\n4. Email\n5. Phone\n6. Color`,
					event.threadID,
					event.messageID
				);
			}

			const [name, title, address, email, phone, color] = parts;
			let uid = event.senderID;

			// Check if mentioned or replied
			if (event.type === "message_reply") {
				uid = event.messageReply.senderID;
			} else if (Object.keys(event.mentions).length > 0) {
				uid = Object.keys(event.mentions)[0];
			}

			const userInfo = await usersData.get(uid);
			const userName = userInfo.name;

			api.sendMessage("🎨 Creating your ultimate Facebook cover... Please wait!", event.threadID, event.messageID);

			// Responsive Facebook cover size (optimized for mobile & desktop)
			const width = 1500;
			const height = 500;
			const safeZone = 80; // Safe zone for mobile devices
			const canvas = createCanvas(width, height);
			const ctx = canvas.getContext('2d');

			// Enhanced color schemes with perfect color codes
			const colorSchemes = {
				// Primary Colors
				blue: {
					primary: '#1877F2',
					secondary: '#0A5BC4',
					accent: '#42A5F5',
					light: '#E3F2FD',
					dark: '#0D47A1',
					text: '#FFFFFF',
					gradient: ['#1877F2', '#0A5BC4', '#1565C0']
				},
				red: {
					primary: '#FF5252',
					secondary: '#D32F2F',
					accent: '#FF8A80',
					light: '#FFEBEE',
					dark: '#C62828',
					text: '#FFFFFF',
					gradient: ['#FF5252', '#D32F2F', '#B71C1C']
				},
				green: {
					primary: '#4CAF50',
					secondary: '#2E7D32',
					accent: '#81C784',
					light: '#E8F5E9',
					dark: '#1B5E20',
					text: '#FFFFFF',
					gradient: ['#4CAF50', '#2E7D32', '#1B5E20']
				},
				purple: {
					primary: '#9C27B0',
					secondary: '#7B1FA2',
					accent: '#BA68C8',
					light: '#F3E5F5',
					dark: '#6A1B9A',
					text: '#FFFFFF',
					gradient: ['#9C27B0', '#7B1FA2', '#4A148C']
				},
				orange: {
					primary: '#FF9800',
					secondary: '#EF6C00',
					accent: '#FFB74D',
					light: '#FFF3E0',
					dark: '#E65100',
					text: '#FFFFFF',
					gradient: ['#FF9800', '#EF6C00', '#FF6F00']
				},
				pink: {
					primary: '#E91E63',
					secondary: '#C2185B',
					accent: '#F48FB1',
					light: '#FCE4EC',
					dark: '#880E4F',
					text: '#FFFFFF',
					gradient: ['#E91E63', '#C2185B', '#AD1457']
				},
				teal: {
					primary: '#009688',
					secondary: '#00796B',
					accent: '#4DB6AC',
					light: '#E0F2F1',
					dark: '#004D40',
					text: '#FFFFFF',
					gradient: ['#009688', '#00796B', '#004D40']
				},
				gold: {
					primary: '#FFD700',
					secondary: '#FFC107',
					accent: '#FFE082',
					light: '#FFF8E1',
					dark: '#FF8F00',
					text: '#000000',
					gradient: ['#FFD700', '#FFC107', '#FFA000']
				},
				
				// Advanced Colors
				black: {
					primary: '#000000',
					secondary: '#212121',
					accent: '#424242',
					light: '#757575',
					dark: '#000000',
					text: '#FFFFFF',
					gradient: ['#000000', '#212121', '#424242']
				},
				white: {
					primary: '#FFFFFF',
					secondary: '#F5F5F5',
					accent: '#E0E0E0',
					light: '#FFFFFF',
					dark: '#BDBDBD',
					text: '#000000',
					gradient: ['#FFFFFF', '#F5F5F5', '#EEEEEE']
				},
				silver: {
					primary: '#C0C0C0',
					secondary: '#A9A9A9',
					accent: '#D3D3D3',
					light: '#F5F5F5',
					dark: '#808080',
					text: '#000000',
					gradient: ['#C0C0C0', '#A9A9A9', '#808080']
				},
				violet: {
					primary: '#8A2BE2',
					secondary: '#6A0DAD',
					accent: '#9370DB',
					light: '#E6E6FA',
					dark: '#4B0082',
					text: '#FFFFFF',
					gradient: ['#8A2BE2', '#6A0DAD', '#4B0082']
				},
				cyan: {
					primary: '#00BCD4',
					secondary: '#0097A7',
					accent: '#4DD0E1',
					light: '#E0F7FA',
					dark: '#006064',
					text: '#FFFFFF',
					gradient: ['#00BCD4', '#0097A7', '#00838F']
				},
				magenta: {
					primary: '#FF00FF',
					secondary: '#CC00CC',
					accent: '#FF66FF',
					light: '#FFE6FF',
					dark: '#990099',
					text: '#FFFFFF',
					gradient: ['#FF00FF', '#CC00CC', '#990099']
				},
				amber: {
					primary: '#FFC107',
					secondary: '#FFA000',
					accent: '#FFD54F',
					light: '#FFF8E1',
					dark: '#FF8F00',
					text: '#000000',
					gradient: ['#FFC107', '#FFA000', '#FF8F00']
				},
				emerald: {
					primary: '#50C878',
					secondary: '#3CB371',
					accent: '#90EE90',
					light: '#E8F5E9',
					dark: '#228B22',
					text: '#FFFFFF',
					gradient: ['#50C878', '#3CB371', '#2E8B57']
				},
				indigo: {
					primary: '#3F51B5',
					secondary: '#303F9F',
					accent: '#7986CB',
					light: '#E8EAF6',
					dark: '#1A237E',
					text: '#FFFFFF',
					gradient: ['#3F51B5', '#303F9F', '#283593']
				},
				rose: {
					primary: '#FF4081',
					secondary: '#F50057',
					accent: '#FF80AB',
					light: '#FCE4EC',
					dark: '#C51162',
					text: '#FFFFFF',
					gradient: ['#FF4081', '#F50057', '#D81B60']
				}
			};

			// Get color scheme or default to blue
			const scheme = colorSchemes[color.toLowerCase()] || colorSchemes.blue;

			// ===== RESPONSIVE BACKGROUND DESIGN =====
			// Create multi-layer gradient background
			const backgroundGradient = ctx.createLinearGradient(safeZone, safeZone, width - safeZone, height - safeZone);
			backgroundGradient.addColorStop(0, scheme.gradient[0]);
			backgroundGradient.addColorStop(0.5, scheme.gradient[1]);
			backgroundGradient.addColorStop(1, scheme.gradient[2]);
			
			ctx.fillStyle = backgroundGradient;
			ctx.fillRect(safeZone, safeZone, width - 2*safeZone, height - 2*safeZone);

			// Add subtle noise texture
			ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
			for (let i = 0; i < 200; i++) {
				const x = Math.random() * (width - 2*safeZone) + safeZone;
				const y = Math.random() * (height - 2*safeZone) + safeZone;
				const size = Math.random() * 3;
				ctx.beginPath();
				ctx.arc(x, y, size, 0, Math.PI * 2);
				ctx.fill();
			}

			// Add geometric pattern lines
			ctx.strokeStyle = `rgba(255, 255, 255, 0.1)`;
			ctx.lineWidth = 1;
			
			// Diagonal lines
			for (let i = safeZone; i < width - safeZone; i += 50) {
				ctx.beginPath();
				ctx.moveTo(i, safeZone);
				ctx.lineTo(i + 100, height - safeZone);
				ctx.stroke();
			}

			// ===== LOAD PROFILE PICTURE =====
			let profileImage = null;
			try {
				const profileUrl = `https://graph.facebook.com/${uid}/picture?width=600&height=600&access_token=6628568379|c1e620fa708a1d5696fb991c1bde5662`;
				const response = await axios.get(profileUrl, { responseType: 'arraybuffer', timeout: 10000 });
				profileImage = await loadImage(Buffer.from(response.data, 'binary'));
			} catch (error) {
				console.log('Profile image not loaded, using placeholder');
			}

			// ===== CENTERED PROFILE SECTION (Optimized for Mobile) =====
			const profileSize = 150; // Reduced for mobile visibility
			const profileX = safeZone + 50;
			const profileY = (height - profileSize) / 2;
			
			// Profile picture frame with glow effect
			ctx.shadowColor = scheme.accent;
			ctx.shadowBlur = 20;
			ctx.shadowOffsetX = 0;
			ctx.shadowOffsetY = 0;
			
			// Outer ring
			ctx.fillStyle = scheme.accent;
			ctx.beginPath();
			ctx.arc(profileX + profileSize/2, profileY + profileSize/2, profileSize/2 + 8, 0, Math.PI * 2);
			ctx.fill();
			
			// Middle ring
			ctx.fillStyle = scheme.secondary;
			ctx.beginPath();
			ctx.arc(profileX + profileSize/2, profileY + profileSize/2, profileSize/2 + 4, 0, Math.PI * 2);
			ctx.fill();
			
			ctx.shadowBlur = 0;

			// Draw profile picture
			if (profileImage) {
				ctx.save();
				ctx.beginPath();
				ctx.arc(profileX + profileSize/2, profileY + profileSize/2, profileSize/2, 0, Math.PI * 2);
				ctx.closePath();
				ctx.clip();
				ctx.drawImage(profileImage, profileX, profileY, profileSize, profileSize);
				ctx.restore();
			} else {
				// Placeholder with initials
				ctx.fillStyle = scheme.primary;
				ctx.beginPath();
				ctx.arc(profileX + profileSize/2, profileY + profileSize/2, profileSize/2, 0, Math.PI * 2);
				ctx.fill();
				
				ctx.fillStyle = scheme.text;
				ctx.font = 'bold 50px Arial';
				ctx.textAlign = 'center';
				const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
				ctx.fillText(initials, profileX + profileSize/2, profileY + profileSize/2 + 15);
			}

			// Inner border
			ctx.strokeStyle = scheme.light;
			ctx.lineWidth = 3;
			ctx.beginPath();
			ctx.arc(profileX + profileSize/2, profileY + profileSize/2, profileSize/2, 0, Math.PI * 2);
			ctx.stroke();

			// ===== INFORMATION SECTION (Right side - Responsive) =====
			const infoX = profileX + profileSize + 70;
			const infoY = safeZone + 40;
			const infoWidth = width - infoX - safeZone;

			// Name with proper spacing
			ctx.fillStyle = scheme.text;
			ctx.font = 'bold 48px "Segoe UI", Arial, sans-serif';
			ctx.textAlign = 'left';
			
			// Truncate name if too long for mobile
			let displayName = name;
			if (ctx.measureText(displayName).width > infoWidth * 0.8) {
				for (let i = name.length; i > 0; i--) {
					displayName = name.substring(0, i) + '...';
					if (ctx.measureText(displayName).width <= infoWidth * 0.8) break;
				}
			}
			ctx.fillText(displayName, infoX, infoY + 50);

			// Title with accent color
			ctx.fillStyle = scheme.accent;
			ctx.font = 'bold 28px "Segoe UI", Arial, sans-serif';
			
			let displayTitle = title;
			if (ctx.measureText(displayTitle).width > infoWidth * 0.7) {
				for (let i = title.length; i > 0; i--) {
					displayTitle = title.substring(0, i) + '...';
					if (ctx.measureText(displayTitle).width <= infoWidth * 0.7) break;
				}
			}
			ctx.fillText(displayTitle, infoX, infoY + 90);

			// ===== DETAILS IN ORGANIZED LAYOUT =====
			const detailsStartY = infoY + 140;
			const detailHeight = 35;
			const columnWidth = (infoWidth - 40) / 2; // Two columns with spacing

			// Function to draw detail with proper spacing
			function drawDetail(icon, label, value, x, y, maxWidth) {
				const iconX = x;
				const textX = x + 40;
				
				// Draw icon
				ctx.fillStyle = scheme.accent;
				ctx.font = '24px Arial';
				ctx.fillText(icon, iconX, y);
				
				// Draw label
				ctx.fillStyle = scheme.light;
				ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
				ctx.fillText(label, textX, y - 3);
				
				// Draw value with word wrapping
				ctx.fillStyle = scheme.text;
				ctx.font = '18px "Segoe UI", Arial, sans-serif';
				
				const words = value.split(' ');
				let line = '';
				let lineCount = 0;
				const lineHeight = 22;
				const maxLines = 2;
				
				for (let n = 0; n < words.length; n++) {
					const testLine = line + words[n] + ' ';
					const metrics = ctx.measureText(testLine);
					
					if (metrics.width > maxWidth && n > 0) {
						if (lineCount < maxLines) {
							ctx.fillText(line, textX, y + (lineCount + 1) * lineHeight);
							lineCount++;
						}
						line = words[n] + ' ';
					} else {
						line = testLine;
					}
				}
				
				if (lineCount < maxLines) {
					ctx.fillText(line, textX, y + (lineCount + 1) * lineHeight);
				}
				
				// Return next Y position
				return y + Math.min(lineCount + 1, maxLines) * lineHeight + 25;
			}

			// Left column details
			let currentY = detailsStartY;
			currentY = drawDetail('📍', 'Address:', address, infoX, currentY, columnWidth - 50);
			currentY = drawDetail('📧', 'Email:', email, infoX, currentY, columnWidth - 50);

			// Right column details
			currentY = detailsStartY;
			currentY = drawDetail('📱', 'Phone:', phone, infoX + columnWidth + 20, currentY, columnWidth - 50);
			currentY = drawDetail('👤', 'User:', userName, infoX + columnWidth + 20, currentY, columnWidth - 50);

			// ===== DECORATIVE ELEMENTS =====
			// Add subtle divider line
			ctx.strokeStyle = `rgba(255, 255, 255, 0.2)`;
			ctx.lineWidth = 2;
			ctx.beginPath();
			ctx.moveTo(safeZone, height - safeZone - 60);
			ctx.lineTo(width - safeZone, height - safeZone - 60);
			ctx.stroke();

			// Add corner accents
			ctx.strokeStyle = scheme.accent;
			ctx.lineWidth = 2;
			const cornerSize = 20;
			
			// Top-left corner
			ctx.beginPath();
			ctx.moveTo(safeZone + 10, safeZone + 10);
			ctx.lineTo(safeZone + 10 + cornerSize, safeZone + 10);
			ctx.moveTo(safeZone + 10, safeZone + 10);
			ctx.lineTo(safeZone + 10, safeZone + 10 + cornerSize);
			ctx.stroke();
			
			// Top-right corner
			ctx.beginPath();
			ctx.moveTo(width - safeZone - 10, safeZone + 10);
			ctx.lineTo(width - safeZone - 10 - cornerSize, safeZone + 10);
			ctx.moveTo(width - safeZone - 10, safeZone + 10);
			ctx.lineTo(width - safeZone - 10, safeZone + 10 + cornerSize);
			ctx.stroke();
			
			// Bottom-left corner
			ctx.beginPath();
			ctx.moveTo(safeZone + 10, height - safeZone - 10);
			ctx.lineTo(safeZone + 10 + cornerSize, height - safeZone - 10);
			ctx.moveTo(safeZone + 10, height - safeZone - 10);
			ctx.lineTo(safeZone + 10, height - safeZone - 10 - cornerSize);
			ctx.stroke();
			
			// Bottom-right corner
			ctx.beginPath();
			ctx.moveTo(width - safeZone - 10, height - safeZone - 10);
			ctx.lineTo(width - safeZone - 10 - cornerSize, height - safeZone - 10);
			ctx.moveTo(width - safeZone - 10, height - safeZone - 10);
			ctx.lineTo(width - safeZone - 10, height - safeZone - 10 - cornerSize);
			ctx.stroke();

			// ===== BORDER =====
			ctx.strokeStyle = scheme.primary;
			ctx.lineWidth = 4;
			ctx.strokeRect(safeZone/2, safeZone/2, width - safeZone, height - safeZone);

			// ===== BOT CREDIT =====
			ctx.fillStyle = `rgba(255, 255, 255, 0.5)`;
			ctx.font = 'italic 14px Arial';
			ctx.textAlign = 'center';
			ctx.fillText('Heli•LUMO | Rasel Mahmud', width / 2, height - safeZone/2);

			// ===== SAVE IMAGE =====
			const cacheDir = path.join(__dirname, '..', 'cache');
			await fs.ensureDir(cacheDir);
			const fileName = `fbcover_${uid}_${Date.now()}.png`;
			const filePath = path.join(cacheDir, fileName);
			
			const buffer = canvas.toBuffer('image/png');
			fs.writeFileSync(filePath, buffer);

			// Send the responsive cover
			await api.sendMessage({
				body: `╔═════❰ 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢 ❱═════╗          
✅ Your cover is perfectly visible on all devices!
━━━━━━━━━━━━━━━━━━\n━━━━━━━━━━━━━━━━━━\n👤 Name: ${name}\n💼 Title: ${title}\n📍 Address: ${address}\n📧 Email: ${email}\n📱 Phone: ${phone}\n🎨 Theme: ${color}\n📱 Optimized for: Mobile & Desktop\n━━━━━━━━━━━━━━━━━━\n━━━━━━━━━━━━━━━━━━
🎨 Created by: 𝗥𝗮𝘀𝗲𝗹 | 𝐇𝐞𝐈𝐢•𝗟𝗨𝗠𝗢
╚═══════════════════╝`,
				attachment: fs.createReadStream(filePath)
			}, event.threadID, event.messageID);

			// Clean up
			setTimeout(() => {
				if (fs.existsSync(filePath)) {
					fs.unlinkSync(filePath);
				}
			}, 10000);

		} catch (error) {
			console.error('Ultimate FB Cover Error:', error);
			api.sendMessage(
				`❌ An error occurred: ${error.message}\n\nPlease make sure the color name is correct and try again.`,
				event.threadID,
				event.messageID
			);
		}
	}
};
