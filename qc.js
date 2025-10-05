const { createCanvas } = require('canvas');
const { MessageMedia } = require('whatsapp-web.js');

// Fungsi wrap text
function wrapText(ctx, text, maxWidth) {
    const words = text.split(' ');
    let line = '';
    const lines = [];
    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        if(metrics.width > maxWidth && n > 0){
            lines.push(line.trim());
            line = words[n] + ' ';
        } else {
            line = testLine;
        }
    }
    if(line) lines.push(line.trim());
    return lines;
}

// Fungsi generate gambar chat
async function generateChatImage(messages, title='Chat Preview') {
    const width = 900;
    const padding = 30;
    const bubbleMaxWidth = width - 220;
    const lineHeight = 26;

    // Hitung tinggi canvas
    let height = padding*2 + 80;
    const canvasTemp = createCanvas(width, 1000);
    const ctxTemp = canvasTemp.getContext('2d');
    ctxTemp.font = '18px Arial';
    for(const m of messages){
        const lines = wrapText(ctxTemp, m.text, bubbleMaxWidth);
        height += Math.max(60, lines.length * lineHeight + 20);
    }

    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#EDEFF3';
    ctx.fillRect(0,0,width,height);

    // Header
    ctx.fillStyle = '#0b84ff';
    ctx.fillRect(0,0,width,70);
    ctx.font = '24px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(title, 24,44);

    let y = 90;
    for(const m of messages){
        const isMe = m.fromMe;
        const avatarX = isMe ? width-80 : 40;
        const avatarY = y+20;

        // Avatar circle
        ctx.beginPath();
        ctx.fillStyle = '#6c757d';
        ctx.arc(avatarX, avatarY, 28, 0, Math.PI*2);
        ctx.fill();
        ctx.closePath();

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        const initials = (m.name||'U').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase();
        ctx.fillText(initials, avatarX-10, avatarY+6);

        // Bubble
        const bubbleX = isMe ? width-(bubbleMaxWidth+120) : 90;
        const lines = wrapText(ctx, m.text, bubbleMaxWidth-32);
        const bubbleHeight = lines.length*lineHeight + 18;
        ctx.fillStyle = isMe ? '#DCF8C6' : '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(bubbleX,y,bubbleMaxWidth,bubbleHeight,12);
        ctx.fill();

        // Text
        ctx.fillStyle = '#000';
        ctx.font = '16px Arial';
        let textY = y+20;
        for(const line of lines){
            ctx.fillText(line, bubbleX+16, textY);
            textY+=lineHeight;
        }

        // Meta
        ctx.fillStyle = '#555';
        ctx.font = '12px Arial';
        const metaText = `${m.name || (isMe?'You':'User')} • ${m.time || ''}`;
        ctx.fillText(metaText, bubbleX+16, y+bubbleHeight+16);

        y += bubbleHeight + 40;
    }

    return canvas.toBuffer('image/png');
}

// Wrapper untuk .qc (single message)
async function handleQC(message, client) {
    const text = message.body.slice(3).trim(); // ambil text setelah ".qc"
    if(!text) return message.reply('Gunakan: .qc <pesan>');
    
    try {
        const contact = await message.getContact();
        const messages = [{
            fromMe: false,
            name: contact.pushname || contact.number,
            text: text,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }];
        
        const buffer = await generateChatImage(messages, 'Chat Preview');
        const { MessageMedia } = require('whatsapp-web.js');
        const media = new MessageMedia('image/png', buffer.toString('base64'));
        await client.sendMessage(message.from, media);
    } catch(err) {
        console.error('Error QC:', err);
        message.reply('Gagal membuat gambar chat');
    }
}

// Wrapper untuk .iqc (multi message)
async function handleIQC(message, client) {
    const text = message.body.slice(4).trim(); // ambil text setelah ".iqc"
    if(!text) return message.reply('Gunakan: .iqc <pesan1>|<pesan2>|...');
    
    try {
        const contact = await message.getContact();
        const lines = text.split('|').map(t => t.trim()).filter(t => t);
        if(lines.length === 0) return message.reply('Harap pisahkan pesan dengan |');
        
        const messages = lines.map((line, idx) => ({
            fromMe: idx % 2 === 1,
            name: idx % 2 === 0 ? (contact.pushname || contact.number) : 'You',
            text: line,
            time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }));
        
        const buffer = await generateChatImage(messages, 'Chat Preview');
        const { MessageMedia } = require('whatsapp-web.js');
        const media = new MessageMedia('image/png', buffer.toString('base64'));
        await client.sendMessage(message.from, media);
    } catch(err) {
        console.error('Error IQC:', err);
        message.reply('Gagal membuat gambar chat');
    }
}

module.exports = { generateChatImage, wrapText, handleQC, handleIQC };
