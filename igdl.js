const instagramGetUrl = require('instagram-url-direct');
const { MessageMedia } = require('whatsapp-web.js');
const fetch = require('node-fetch');

async function handleInstagramDownload(message, client) {
    const text = message.body.slice(5).trim();
    
    if (!text) {
        return message.reply('❌ Gunakan: .igdl <link Instagram>\n\nContoh:\n.igdl https://www.instagram.com/p/ABC123/ (post)\n.igdl https://www.instagram.com/reel/ABC123/ (reel)');
    }

    const url = text.split(' ')[0];
    
    if (!url.includes('instagram.com')) {
        return message.reply('❌ Link tidak valid! Harap kirim link Instagram yang benar.');
    }

    try {
        await message.reply('⏳ Mengunduh dari Instagram...');
        
        const links = await instagramGetUrl(url);
        
        if (!links || !links.url_list || links.url_list.length === 0) {
            return message.reply('❌ Tidak dapat mengunduh. Pastikan link benar dan konten tidak private.');
        }

        for (let i = 0; i < links.url_list.length; i++) {
            const downloadUrl = links.url_list[i];
            
            const response = await fetch(downloadUrl);
            const buffer = await response.buffer();
            
            const mimeType = downloadUrl.includes('.mp4') ? 'video/mp4' : 'image/jpeg';
            const extension = mimeType.includes('video') ? 'mp4' : 'jpg';
            
            const media = new MessageMedia(
                mimeType,
                buffer.toString('base64'),
                `instagram.${extension}`
            );
            
            const caption = i === 0 ? '✅ *Instagram Download*\n\n' + 
                           (links.url_list.length > 1 ? `📦 Total: ${links.url_list.length} file` : '') : '';
            
            await client.sendMessage(message.from, media, caption ? { caption } : {});
            
            if (links.url_list.length > 1 && i < links.url_list.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }
        
    } catch (error) {
        console.error('Error downloading Instagram:', error);
        message.reply('❌ Gagal mengunduh dari Instagram. Pastikan link benar dan konten tidak private.');
    }
}

module.exports = { handleInstagramDownload };
