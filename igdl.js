const { instagramDl } = require('@sasmeee/igdl');
const { MessageMedia } = require('whatsapp-web.js');

async function handleInstagramDownload(message, client) {
    const text = message.body.slice(5).trim();
    
    if (!text) {
        return message.reply('❌ Gunakan: .igdl <link Instagram>\n\nContoh:\n.igdl https://www.instagram.com/p/ABC123/ (post)\n.igdl https://www.instagram.com/reel/ABC123/ (reel)\n.igdl https://www.instagram.com/stories/username/123456 (story)');
    }

    const url = text.split(' ')[0];
    
    if (!url.includes('instagram.com')) {
        return message.reply('❌ Link tidak valid! Harap kirim link Instagram yang benar.');
    }

    try {
        await message.reply('⏳ Mengunduh dari Instagram...');
        
        const dataList = await instagramDl(url);
        
        if (!dataList || dataList.length === 0) {
            return message.reply('❌ Tidak dapat mengunduh. Pastikan link benar dan konten tidak private.');
        }

        for (let i = 0; i < dataList.length; i++) {
            const data = dataList[i];
            
            if (data.download_link) {
                const response = await fetch(data.download_link);
                const buffer = await response.arrayBuffer();
                
                const mimeType = data.download_link.includes('.mp4') ? 'video/mp4' : 'image/jpeg';
                const extension = mimeType.includes('video') ? 'mp4' : 'jpg';
                
                const media = new MessageMedia(
                    mimeType,
                    Buffer.from(buffer).toString('base64'),
                    `instagram.${extension}`
                );
                
                const caption = i === 0 ? '✅ *Instagram Download*\n\n' + 
                               (dataList.length > 1 ? `📦 Total: ${dataList.length} file` : '') : '';
                
                await client.sendMessage(message.from, media, caption ? { caption } : {});
                
                if (dataList.length > 1 && i < dataList.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
    } catch (error) {
        console.error('Error downloading Instagram:', error);
        message.reply('❌ Gagal mengunduh dari Instagram. Pastikan link benar dan konten tidak private.');
    }
}

module.exports = { handleInstagramDownload };
