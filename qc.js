const { MessageMedia } = require("whatsapp-web.js");
const { createCanvas, loadImage } = require("canvas");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");

module.exports.handleQC = async (message, client) => {
    try {
        const text = message.body.replace(/^\.qc\s*/i, "").trim();
        if (!text) return message.reply("⚠️ Gunakan format: *.qc <pesan>*");

        const contact = await message.getContact();
        const pfp = await contact.getProfilePicUrl();

        const username = contact.pushname || contact.number || "Anonim";
        const canvas = createCanvas(800, 350);
        const ctx = canvas.getContext("2d");

        // Latar belakang dark mode (lebih gelap seperti WhatsApp)
        ctx.fillStyle = "#0d1418";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Avatar
        let avatar;
        if (pfp) {
            const buffer = await (await fetch(pfp)).arrayBuffer();
            const img = await loadImage(Buffer.from(buffer));
            avatar = img;
        } else {
            // Create default avatar if none exists
            const defaultCanvas = createCanvas(80, 80);
            const defaultCtx = defaultCanvas.getContext("2d");
            defaultCtx.fillStyle = "#666666";
            defaultCtx.fillRect(0, 0, 80, 80);
            defaultCtx.fillStyle = "#ffffff";
            defaultCtx.font = "bold 40px Arial";
            defaultCtx.textAlign = "center";
            defaultCtx.textBaseline = "middle";
            defaultCtx.fillText(username.charAt(0).toUpperCase(), 40, 40);
            avatar = await loadImage(defaultCanvas.toBuffer("image/png"));
        }

        const bubbleX = 150;
        const bubbleY = 110;
        const bubbleWidth = 600;
        const bubbleHeight = 140;

        // Bubble putih modern (seperti iPhone / WhatsApp)
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

        // Avatar (lebih besar dan bulat sempurna)
        ctx.save();
        ctx.beginPath();
        ctx.arc(85, 180, 45, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 40, 135, 90, 90);
        ctx.restore();

        // Nama user di dalam bubble (warna orange seperti gambar)
        ctx.font = "bold 30px Arial";
        ctx.fillStyle = "#ff8800";
        ctx.fillText(username, 175, 150);

        // Pesan teks di dalam bubble (hitam karena bubble putih)
        ctx.font = "26px Arial";
        ctx.fillStyle = "#000000";
        ctx.fillText(text, 175, 195);

        // Timestamp di pojok kanan bawah bubble
        const now = new Date();
        const jam = now.getHours().toString().padStart(2, "0");
        const menit = now.getMinutes().toString().padStart(2, "0");
        ctx.font = "16px Arial";
        ctx.fillStyle = "#999999";
        ctx.fillText(`${jam}.${menit}`, 680, 235);

        // Simpan & kirim
        const outPath = path.join(__dirname, "qc_result.png");
        const buffer = canvas.toBuffer("image/png");
        fs.writeFileSync(outPath, buffer);
        const media = MessageMedia.fromFilePath(outPath);
        await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
    } catch (err) {
        console.error(err);
        message.reply("❌ Gagal membuat QC bubble chat.");
    }
};
