const { fetchVideo } = require('@prevter/tiktok-scraper');
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

    try {
        await message.reply('⏳ Mengunduh video TikTok...');
        
        const video = await fetchVideo(url);
        
        const caption = `✅ *TikTok Download*\n\n` +
                       `👤 *Author:* ${video.author || 'Unknown'}\n` +
                       `📝 *Deskripsi:* ${video.description || 'Tidak ada deskripsi'}\n` +
                       `❤️ *Likes:* ${video.likes || 0}\n` +
                       `💬 *Comments:* ${video.comments || 0}\n` +
                       `🎵 *Music:* ${video.music?.name || 'Unknown'} - ${video.music?.author || ''}`;
        
        const buffer = await video.download();
        const media = new MessageMedia('video/mp4', buffer.toString('base64'), 'tiktok.mp4');
        
        await client.sendMessage(message.from, media, { caption });
        
    } catch (error) {
        console.error('Error downloading TikTok:', error);
        message.reply('❌ Gagal mengunduh video TikTok. Pastikan link benar dan video tidak private.');
    }
}

module.exports = { handleTikTokDownload };
