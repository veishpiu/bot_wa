const { createCanvas, loadImage } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');

// Fungsi buat sticker teks hitam
async function generateBratSticker(text) {
    const width = 512;
    const height = 512;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background putih
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, width, height);

    // Atur teks
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Wrap text sederhana
    const lines = text.split('\n');
    let y = height / 2 - (lines.length-1)*24; // tengah
    for(const line of lines){
        ctx.fillText(line, width/2, y);
        y += 60; // jarak antar line
    }

    // Ubah jadi buffer PNG
    const buffer = canvas.toBuffer('image/png');
    return new MessageMedia('image/png', buffer.toString('base64'));
}

// Wrapper untuk handle message
async function createBratSticker(message, client) {
    const text = message.body.slice(5).trim(); // ambil text setelah ".brat"
    if(!text) return message.reply('Gunakan: .brat <teks>');
    
    try {
        const stickerMedia = await generateBratSticker(text);
        await client.sendMessage(message.from, stickerMedia, { sendMediaAsSticker: true });
    } catch(err) {
        console.error('Error brat sticker:', err);
        message.reply('Gagal membuat sticker brat');
    }
}

module.exports = { generateBratSticker, createBratSticker };
