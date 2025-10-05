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
  // pilih font; kalau registerFont dipakai, ganti family di sini
  ctx.font = '700 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // simple wrap: split lines by \n. Jika baris panjang, kita memecah secara manual.
  const rawLines = text.split('\n');

  // function simple to split long lines into smaller pieces using char length heuristic
  function splitLongLine(line, maxChars = 12) {
    if (line.length <= maxChars) return [line];
    const words = line.split(' ');
    const lines = [];
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length <= maxChars) {
        cur = (cur + ' ' + w).trim();
      } else {
        if (cur) lines.push(cur);
        cur = w;
      }
    }
    if (cur) lines.push(cur);
    // if still too long (no spaces), break by chars
    return lines.flatMap(l => l.length <= maxChars ? [l] : l.match(new RegExp('.{1,'+maxChars+'}', 'g')));
  }

  const lines = rawLines.flatMap(line => splitLongLine(line, 12));

  // Calculate vertical start so text center vertically
  const lineHeight = 60; // jarak antar line
  const totalHeight = lines.length * lineHeight;
  let y = (size - totalHeight) / 2 + lineHeight / 2;

  for (const line of lines) {
    ctx.fillText(line, size / 2, y);
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

module.exports = { generateBratSticker, imageToSticker };
