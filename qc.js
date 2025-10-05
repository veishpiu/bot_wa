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
        const canvas = createCanvas(800, 300);
        const ctx = canvas.getContext("2d");

        // Latar belakang dark mode
        ctx.fillStyle = "#0b141a";
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
        const bubbleY = 90;
        const bubbleWidth = 580;
        const bubbleHeight = 120;

        // Bubble putih (seperti iPhone)
        ctx.fillStyle = "#202c33";
        ctx.beginPath();
        ctx.moveTo(bubbleX + 20, bubbleY);
        ctx.lineTo(bubbleX + bubbleWidth - 20, bubbleY);
        ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY, bubbleX + bubbleWidth, bubbleY + 20);
        ctx.lineTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight - 20);
        ctx.quadraticCurveTo(bubbleX + bubbleWidth, bubbleY + bubbleHeight, bubbleX + bubbleWidth - 20, bubbleY + bubbleHeight);
        ctx.lineTo(bubbleX + 20, bubbleY + bubbleHeight);
        ctx.quadraticCurveTo(bubbleX, bubbleY + bubbleHeight, bubbleX, bubbleY + bubbleHeight - 20);
        ctx.lineTo(bubbleX, bubbleY + 20);
        ctx.quadraticCurveTo(bubbleX, bubbleY, bubbleX + 20, bubbleY);
        ctx.fill();

        // Avatar
        ctx.save();
        ctx.beginPath();
        ctx.arc(90, 150, 40, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        ctx.drawImage(avatar, 50, 110, 80, 80);
        ctx.restore();

        // Nama user
        ctx.font = "bold 28px Arial";
        ctx.fillStyle = "#f8cb6f";
        ctx.fillText(username, 160, 120);

        // Pesan teks
        ctx.font = "24px Arial";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(text, 160, 160);

        // Timestamp
        const now = new Date();
        const jam = now.getHours().toString().padStart(2, "0");
        const menit = now.getMinutes().toString().padStart(2, "0");
        ctx.font = "18px Arial";
        ctx.fillStyle = "#a5a5a5";
        ctx.fillText(`${jam}.${menit}`, 700, 200);

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
