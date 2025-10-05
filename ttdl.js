const { MessageMedia } = require('whatsapp-web.js');

async function handleTikTokDownload(message, client) {
    const text = message.body.slice(5).trim();
    
    if (!text) {
        return message.reply('❌ Gunakan: .ttdl <link TikTok>\n\nContoh:\n.ttdl https://www.tiktok.com/@user/video/123456');
    }

    const url = text.split(' ')[0];
    
    if (!url.includes('tiktok.com')) {
        return message.reply('❌ Link tidak valid! Harap kirim link TikTok yang benar.');
    }

    return message.reply(
        '⚠️ *Fitur Download TikTok Sementara Tidak Tersedia*\n\n' +
        'TikTok sering memblokir download otomatis. Gunakan situs web alternatif:\n\n' +
        '📥 *Rekomendasi:*\n' +
        '• https://snaptik.app\n' +
        '• https://tikmate.app\n' +
        '• https://ssstik.io\n' +
        '• https://tikwm.com\n\n' +
        '💡 *Cara pakai:*\n' +
        '1. Copy link TikTok\n' +
        '2. Paste di salah satu situs di atas\n' +
        '3. Download tanpa watermark!'
    );
}

module.exports = { handleTikTokDownload };
