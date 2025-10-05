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
        
        const apiUrl = 'https://v3.saveig.app/api/ajaxSearch';
        
        const formData = new URLSearchParams();
        formData.append('q', url);
        formData.append('t', 'media');
        formData.append('lang', 'en');
        
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*',
                'Origin': 'https://saveig.app',
                'Referer': 'https://saveig.app/en'
            },
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.data || data.status !== 'ok') {
            throw new Error('Video/foto tidak ditemukan');
        }
        
        const html = data.data;
        
        const urlMatches = html.match(/href="([^"]+)"[^>]*download/gi);
        
        if (!urlMatches || urlMatches.length === 0) {
            throw new Error('Tidak dapat menemukan URL download');
        }
        
        const downloadUrls = [];
        for (const match of urlMatches) {
            const urlMatch = match.match(/href="([^"]+)"/);
            if (urlMatch && urlMatch[1]) {
                downloadUrls.push(urlMatch[1]);
            }
        }
        
        if (downloadUrls.length === 0) {
            throw new Error('Tidak dapat menemukan URL download');
        }
        
        for (let i = 0; i < Math.min(downloadUrls.length, 5); i++) {
            const downloadUrl = downloadUrls[i];
            
            try {
                const mediaResponse = await fetch(downloadUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });
                
                if (!mediaResponse.ok) {
                    console.error('Failed to download media:', mediaResponse.status);
                    continue;
                }
                
                const buffer = await mediaResponse.buffer();
                const contentType = mediaResponse.headers.get('content-type') || '';
                
                let mimeType, extension;
                if (contentType.includes('video') || downloadUrl.includes('.mp4')) {
                    mimeType = 'video/mp4';
                    extension = 'mp4';
                } else {
                    mimeType = 'image/jpeg';
                    extension = 'jpg';
                }
                
                const media = new MessageMedia(
                    mimeType,
                    buffer.toString('base64'),
                    `instagram.${extension}`
                );
                
                const caption = i === 0 ? '✅ *Instagram Download*\n\n' + 
                               (downloadUrls.length > 1 ? `📦 Total: ${Math.min(downloadUrls.length, 5)} file` : '') : '';
                
                await client.sendMessage(message.from, media, caption ? { caption } : {});
                
                if (downloadUrls.length > 1 && i < Math.min(downloadUrls.length, 5) - 1) {
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            } catch (err) {
                console.error('Error downloading individual media:', err);
                continue;
            }
        }
        
    } catch (error) {
        console.error('Error downloading Instagram:', error.message || error);
        message.reply(
            '❌ *Gagal mengunduh dari Instagram*\n\n' +
            'Kemungkinan penyebab:\n' +
            '• Post bersifat private\n' +
            '• Link tidak valid\n' +
            '• API sedang down\n\n' +
            '💡 *Alternatif:* Gunakan situs web:\n' +
            '• https://snapinsta.app\n' +
            '• https://igram.io\n' +
            '• https://saveig.app'
        );
    }
}

module.exports = { handleInstagramDownload };
