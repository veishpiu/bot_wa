const { MessageMedia } = require('whatsapp-web.js');
const fetch = require('node-fetch');

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
        
        const apiUrl = `https://www.tikwm.com/api/?url=${encodeURIComponent(url)}&hd=1`;
        
        const response = await fetch(apiUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.code !== 0 || !data.data) {
            throw new Error('Video tidak ditemukan atau link tidak valid');
        }
        
        const videoUrl = data.data.hdplay || data.data.play;
        const title = data.data.title || 'TikTok Video';
        const author = data.data.author?.unique_id || 'Unknown';
        
        if (!videoUrl) {
            throw new Error('Tidak dapat menemukan URL video');
        }
        
        const videoResponse = await fetch(videoUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Referer': 'https://www.tikwm.com/'
            }
        });
        
        if (!videoResponse.ok) {
            throw new Error('Gagal mengunduh video');
        }
        
        const buffer = await videoResponse.buffer();
        
        const media = new MessageMedia(
            'video/mp4',
            buffer.toString('base64'),
            'tiktok.mp4'
        );
        
        const caption = `✅ *TikTok Download*\n\n📝 *Title:* ${title}\n👤 *Author:* @${author}\n\n_No Watermark_`;
        
        await client.sendMessage(message.from, media, { caption });
        
    } catch (error) {
        console.error('Error downloading TikTok:', error.message || error);
        message.reply(
            '❌ *Gagal mengunduh video TikTok*\n\n' +
            'Kemungkinan penyebab:\n' +
            '• Video bersifat private\n' +
            '• Link tidak valid\n' +
            '• API sedang down\n\n' +
            '💡 *Alternatif:* Gunakan situs web:\n' +
            '• https://snaptik.app\n' +
            '• https://tikmate.app\n' +
            '• https://ssstik.io'
        );
    }
}

module.exports = { handleTikTokDownload };
