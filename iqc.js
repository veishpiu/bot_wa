const { MessageMedia } = require("whatsapp-web.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");

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

        const canvas = createCanvas(800, 400);
        const ctx = canvas.getContext("2d");

        // Latar belakang
        ctx.fillStyle = "#0b141a";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // ====== BUBBLE 1 (quoted)
        const drawBubble = (x, y, w, h, color) => {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(x + 20, y);
            ctx.lineTo(x + w - 20, y);
            ctx.quadraticCurveTo(x + w, y, x + w, y + 20);
            ctx.lineTo(x + w, y + h - 20);
            ctx.quadraticCurveTo(x + w, y + h, x + w - 20, y + h);
            ctx.lineTo(x + 20, y + h);
            ctx.quadraticCurveTo(x, y + h, x, y + h - 20);
            ctx.lineTo(x, y + 20);
            ctx.quadraticCurveTo(x, y, x + 20, y);
            ctx.fill();
        };

        // Avatar quoted
        if (pfpQuoted) {
            const buffer = await (await fetch(pfpQuoted)).arrayBuffer();
            const img = await loadImage(Buffer.from(buffer));
            ctx.save();
            ctx.beginPath();
            ctx.arc(90, 120, 35, 0, Math.PI * 2);
            ctx.clip();
            ctx.drawImage(img, 55, 85, 70, 70);
            ctx.restore();
        }

        drawBubble(150, 80, 580, 80, "#202c33");
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = "#f8cb6f";
        ctx.fillText(contactQuoted.pushname || "Pengguna", 160, 105);
        ctx.font = "22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(originalText, 160, 140);

        // ====== BUBBLE 2 (balasan)
        drawBubble(150, 200, 580, 100, "#1c2c35");
        ctx.font = "bold 24px Arial";
        ctx.fillStyle = "#1ed760";
        ctx.fillText(contactSender.pushname || "Kamu", 160, 230);
        ctx.font = "22px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(replyText, 160, 265);

        const now = new Date();
        const jam = now.getHours().toString().padStart(2, "0");
        const menit = now.getMinutes().toString().padStart(2, "0");
        ctx.font = "18px Arial";
        ctx.fillStyle = "#a5a5a5";
        ctx.fillText(`${jam}.${menit}`, 700, 320);

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
