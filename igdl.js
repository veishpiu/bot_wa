const { MessageMedia } = require('whatsapp-web.js');
const fetch = require('node-fetch');

async function downloadFromAPI1(url) {
    const apiUrl = 'https://api.saveig.app/api/v1/media-info';
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        body: JSON.stringify({ url })
    });
    
    if (!response.ok) throw new Error('API1 failed');
    const data = await response.json();
    if (!data.data || !data.data.media) throw new Error('No media found');
    return data.data.media;
}

async function downloadFromAPI2(url) {
    const apiUrl = `https://api.downloadgram.org/media?url=${encodeURIComponent(url)}`;
    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    if (!response.ok) throw new Error('API2 failed');
    const data = await response.json();
    if (!data.media || data.media.length === 0) throw new Error('No media found');
    return data.media;
}

async function downloadFromAPI3(url) {
    const shortcode = url.match(/\/(p|reel)\/([^\/\?]+)/)?.[2];
    if (!shortcode) throw new Error('Invalid URL format');
    
    const apiUrl = `https://igram.io/api/ig/post/${shortcode}`;
    const response = await fetch(apiUrl, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'application/json'
        }
    });
    
    if (!response.ok) throw new Error('API3 failed');
    const data = await response.json();
    if (!data.result || !data.result.download) throw new Error('No media found');
    
    return Array.isArray(data.result.download) ? data.result.download : [data.result.download];
}

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
        
        let mediaUrls = null;
        let apiUsed = null;
        
        const apis = [
            { name: 'API1', func: downloadFromAPI1 },
            { name: 'API2', func: downloadFromAPI2 },
            { name: 'API3', func: downloadFromAPI3 }
        ];
        
        for (const api of apis) {
            try {
                console.log(`Trying ${api.name}...`);
                mediaUrls = await api.func(url);
                apiUsed = api.name;
                console.log(`${api.name} succeeded!`);
                break;
            } catch (err) {
                console.log(`${api.name} failed:`, err.message);
                continue;
            }
        }
        
        if (!mediaUrls || mediaUrls.length === 0) {
            throw new Error('Semua API gagal');
        }
        
        const urlsToDownload = Array.isArray(mediaUrls) ? mediaUrls : [mediaUrls];
        
        for (let i = 0; i < Math.min(urlsToDownload.length, 5); i++) {
            const mediaItem = urlsToDownload[i];
            const downloadUrl = typeof mediaItem === 'string' ? mediaItem : (mediaItem.url || mediaItem.download_url || mediaItem.video_url || mediaItem.image_url);
            
            if (!downloadUrl) {
                console.error('No download URL found in media item:', mediaItem);
                continue;
            }
            
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
                               (urlsToDownload.length > 1 ? `📦 Total: ${Math.min(urlsToDownload.length, 5)} file` : '') : '';
                
                await client.sendMessage(message.from, media, caption ? { caption } : {});
                
                if (urlsToDownload.length > 1 && i < Math.min(urlsToDownload.length, 5) - 1) {
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
            '• Semua API sedang down\n\n' +
            '💡 *Alternatif:* Gunakan situs web:\n' +
            '• https://snapinsta.app\n' +
            '• https://igram.io\n' +
            '• https://saveig.app'
        );
    }
}

module.exports = { handleInstagramDownload };
