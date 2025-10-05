// sticker.js
const { createCanvas, registerFont, loadImage } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');

// Jika mau pakai font custom, uncomment dan sesuaikan path:
// registerFont(path.join(__dirname, 'fonts', 'YourFont.ttf'), { family: 'YourFont' });

/**
 * Buat sticker teks seperti contoh (white bg, black bold text).
 * @param {string} text - teks, bisa multi-line dengan \n
 * @returns {MessageMedia} - MessageMedia berisi PNG base64
 */
async function generateBratSticker(text) {
  const size = 512; // sticker size
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // background putih
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // teks hitam
  ctx.fillStyle = '#000000';
  // font besar dan tebal seperti contoh
  ctx.font = 'bold 80px Arial';
  ctx.textAlign = 'left'; // rata kiri seperti contoh
  ctx.textBaseline = 'top';

  // split by newline, atau jika user pakai spasi, split by space juga
  const rawLines = text.split('\n');
  const lines = [];
  
  for (const line of rawLines) {
    // jika baris kosong, skip
    if (line.trim() === '') continue;
    // split by spaces untuk multi-word
    const words = line.trim().split(/\s+/);
    lines.push(...words);
  }

  // Calculate vertical start
  const lineHeight = 90; // jarak antar line
  const totalHeight = lines.length * lineHeight;
  const startY = (size - totalHeight) / 2;
  const startX = 30; // padding dari kiri

  let y = startY;
  for (const line of lines) {
    ctx.fillText(line.toLowerCase(), startX, y); // lowercase seperti contoh
    y += lineHeight;
  }

  const buffer = canvas.toBuffer('image/png');
  return new MessageMedia('image/png', buffer.toString('base64'));
}

/**
 * Convert image buffer (jpg/png) menjadi sticker (resize ke 512x512 preserving aspect)
 * Mengembalikan MessageMedia PNG 512x512 dengan background putih jika perlu.
 * @param {Buffer} imageBuffer
 */
async function imageToSticker(imageBuffer) {
  const size = 512;
  const img = await loadImage(imageBuffer);
  const canvas = createCanvas(size, size);
  const ctx = canvas.getContext('2d');

  // fill white background (helps with transparency)
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, size, size);

  // calculate fit
  let iw = img.width, ih = img.height;
  const scale = Math.min(size / iw, size / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (size - dw) / 2;
  const dy = (size - dh) / 2;

  ctx.drawImage(img, dx, dy, dw, dh);

  const buffer = canvas.toBuffer('image/png');
  return new MessageMedia('image/png', buffer.toString('base64'));
}

async function createBratSticker(message, client) {
    try {
        const text = message.body.replace(/^\.brat\s*/i, '').trim();
        if (!text) return message.reply('⚠️ Gunakan format: *.brat <teks>*\n\nContoh: .brat Hello World');

        await message.reply('⏳ Membuat stiker teks...');
        const media = await generateBratSticker(text);
        await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
    } catch (err) {
        console.error(err);
        message.reply('❌ Gagal membuat stiker teks.');
    }
}

module.exports = { generateBratSticker, imageToSticker, createBratSticker };
