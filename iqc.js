const { MessageMedia } = require("whatsapp-web.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

module.exports.handleIQC = async (message, client) => {
    try {
        const quoted = await message.getQuotedMessage();
        if (!quoted) return message.reply("⚠️ Balas pesan orang untuk pakai *.iqc*");

        const replyText = message.body.replace(/^\.iqc\s*/i, "").trim();
        const originalText = quoted.body || "(pesan kosong)";

        const contactQuoted = await quoted.getContact();
        const contactSender = await message.getContact();

        const pfpQuoted = await contactQuoted.getProfilePicUrl();
        const pfpSender = await contactSender.getProfilePicUrl();

        const canvas = createCanvas(800, 450);
        const ctx = canvas.getContext("2d");

        // Latar belakang dark mode (seperti WhatsApp)
        ctx.fillStyle = "#0d1418";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ====== QUOTED MESSAGE (atas) dengan bar hijau di kiri seperti WhatsApp
        const quotedX = 60;
        const quotedY = 60;
        const quotedWidth = 680;
        const quotedHeight = 100;
        
        // Bar hijau di kiri
        ctx.fillStyle = "#25d366";
        ctx.fillRect(quotedX, quotedY, 6, quotedHeight);
        
        // Background quoted message
        ctx.fillStyle = "#1a2529";
        ctx.fillRect(quotedX + 10, quotedY, quotedWidth, quotedHeight);
        
        // Nama yang di-quote (abu-abu terang)
        ctx.font = "20px Arial";
        ctx.fillStyle = "#8ba9b8";
        ctx.fillText(contactQuoted.pushname || "Pengguna", quotedX + 25, quotedY + 30);
        
        // Teks quoted (putih agak transparan)
        ctx.font = "18px Arial";
        ctx.fillStyle = "#b8c6cd";
        ctx.fillText(originalText, quotedX + 25, quotedY + 65);

        // ====== BUBBLE REPLY (bawah) - Putih seperti gambar
        const bubbleX = 150;
        const bubbleY = 200;
        const bubbleWidth = 600;
        const bubbleHeight = 140;

        // Bubble putih modern
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(bubbleX + 25, bubbleY);
        ctx.lineTo(bubbleX + bubbleWidth - 25, bubbleY);
        ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY, bubbleX + bubbleWidth, bubbleY + 25);
        ctx.lineTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - 25);
        ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight, bubbleX + bubbleWidth - 25, bubbleY + bubbleHeight);
        ctx.lineTo(bubbleX + 25, bubbleY + bubbleHeight);
        ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleHeight, bubbleX, bubbleY + bubbleHeight - 25);
        ctx.lineTo(bubbleX, bubbleY + 25);
        ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + 25, bubbleY);
        ctx.fill();
        
        // Avatar sender
        let avatarSender;
        if (pfpSender) {
            const buffer = await (await fetch(pfpSender)).arrayBuffer();
            avatarSender = await loadImage(Buffer.from(buffer));
        } else {
            const defaultCanvas = createCanvas(90, 90);
            const defaultCtx = defaultCanvas.getContext("2d");
            defaultCtx.fillStyle = "#666666";
            defaultCtx.fillRect(0, 0, 90, 90);
            defaultCtx.fillStyle = "#ffffff";
            defaultCtx.font = "bold 40px Arial";
            defaultCtx.textAlign = "center";
            defaultCtx.textBaseline = "middle";
            defaultCtx.fillText((contactSender.pushname || "A").charAt(0).toUpperCase(), 45, 45);
            avatarSender = await loadImage(defaultCanvas.toBuffer("image/png"));
        }
        
        // Avatar bulat
        ctx.save();
        ctx.beginPath();
        ctx.arc(85, 270, 45, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatarSender, 40, 225, 90, 90);
        ctx.restore();
        
        // Nama pengirim (orange seperti gambar)
        ctx.font = "bold 30px Arial";
        ctx.fillStyle = "#ff8800";
        ctx.fillText(contactSender.pushname || "Kamu", 175, 240);
        
        // Teks reply (hitam karena bubble putih)
        ctx.font = "26px Arial";
        ctx.fillStyle = "#000000";
        ctx.fillText(replyText, 175, 285);

        // Timestamp di pojok kanan bawah
        const now = new Date();
        const jam = now.getHours().toString().padStart(2, "0");
        const menit = now.getMinutes().toString().padStart(2, "0");
        ctx.font = "16px Arial";
        ctx.fillStyle = "#999999";
        ctx.fillText(`AI ✧ ${jam}.${menit}`, 650, 325);

        // Simpan & kirim
        const outPath = path.join(__dirname, "iqc_result.png");
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outPath, buffer);
        const media = MessageMedia.fromFilePath(outPath);
        await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
    } catch (err) {
        console.error(err);
        message.reply("❌ Gagal membuat IQC bubble chat.");
    }
};
