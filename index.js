require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== SERVER UNTUK UPTIME =====
require("./server");

// ===== SETUP CHROMIUM =====
let chromiumPath;
try {
    chromiumPath = execSync('which chromium').toString().trim();
} catch (err) {
    chromiumPath = undefined;
}

// ===== INISIALISASI CLIENT =====
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: chromiumPath ? {
        executablePath: chromiumPath,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
        ]
    } : undefined
});

let botStartTime = null;

// ===== QR CODE =====
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('QR Code ter-generate, scan dengan WhatsApp!');
});

client.on('ready', () => {
    botStartTime = new Date();
    console.log('Bot sudah siap dan online');
});

// ===== IMPORT MODULES =====
const confessModule = require('./confess');
const qcModule = require('./qc'); // .qc & .iqc
const bratModule = require('./brat'); // sticker text .brat
confessModule(client);

// ===== MESSAGE HANDLER =====
client.on('message', async message => {
    const text = message.body ? message.body.trim() : '';
    const fromGroup = message.from.includes('@g.us');
    const chat = await message.getChat();

    console.log('Pesan masuk:', text);

    // ===== AUTO REPLY =====
    if(text.toLowerCase() === '.hai') 
        return message.reply('Halo! Aku bot, bisa ubah fotomu jadi stiker & bantu kirim pesan confess!');

    if(text.toLowerCase() === '.ping'){
        if(botStartTime){
            const uptime = Math.floor((new Date() - botStartTime)/1000);
            const hours = Math.floor(uptime/3600);
            const minutes = Math.floor((uptime%3600)/60);
            const seconds = uptime%60;
            return message.reply(`Bot aktif sejak: ${botStartTime.toLocaleString()}\nUptime: ${hours}h ${minutes}m ${seconds}s`);
        } else return message.reply('Bot baru mulai, status uptime belum tersedia');
    }

    // ===== STICKER DARI MEDIA =====
    if(text.toLowerCase() === '.sticker'){
        if(message.hasMedia || message.hasQuotedMsg){
            let mediaMessage = message;
            if(message.hasQuotedMsg) mediaMessage = await message.getQuotedMessage();
            try{
                await message.reply('Prosess...');
                const media = await mediaMessage.downloadMedia();
                if(media){
                    const extension = media.mimetype.split('/')[1];
                    const mediaPath = path.join(__dirname,'media',`foto_${Date.now()}.${extension}`);
                    fs.writeFileSync(mediaPath, media.data,'base64');
                    await client.sendMessage(message.from, media, {sendMediaAsSticker:true});
                }
            } catch(err){ console.error(err); return message.reply('Gagal bikin sticker'); }
        } else return message.reply('Kirim foto atau reply ke media untuk membuat sticker.');
    }

    // ===== STICKER TEXT .BRAT =====
    if(text.toLowerCase().startsWith('.brat')){
        await bratModule.createBratSticker(message, client);
    }

    // ===== .QC SINGLE =====
    if(text.toLowerCase().startsWith('.qc')){
        await qcModule.handleQC(message, client);
    }

    // ===== .IQC MULTI =====
    if(text.toLowerCase().startsWith('.iqc')){
        await qcModule.handleIQC(message, client);
    }

    // ===== MENU =====
    if(text.toLowerCase() === '.menu'){
        const menuText = `*🤖 BOT MENU*

╭─❏ *📌 UMUM*
│ • .hai : Sapaan bot
│ • .ping : Cek uptime bot
│ • .sticker : Ubah gambar/video jadi stiker
│ • .brat : Sticker teks hitam
│ • .confess : Kirim pesan confess
│ • .qc : Buat foto chat (single)
│ • .iqc : Buat foto chat (multi)
╰─❏

╭─❏ *👥 GRUP (Admin Only)*
│ • .h <pesan> : Mention semua anggota
│ • .close : Tutup grup
│ • .open : Buka grup
╰─❏

> Made with ❤️ - By Vei`;
        return message.reply(menuText);
    }

    // ===== ADMIN COMMANDS =====
    if(fromGroup){
        const sender = await message.getContact();
        const isAdmin = chat.participants.filter(p=>p.isAdmin)
            .some(p=>p.id._serialized === sender.id._serialized);

        if(text.toLowerCase().startsWith('.h ') && isAdmin){
            try{
                const mentions = [];
                for(let participant of chat.participants){
                    if(participant.id._serialized !== client.info.wid._serialized){
                        mentions.push(await client.getContactById(participant.id._serialized));
                    }
                }
                const msgText = text.slice(3).trim() || 'Mention all';
                if(mentions.length>0) await chat.sendMessage(msgText,{mentions});
            }catch(err){console.error(err);}
        }

        if(text.toLowerCase() === '.close' && isAdmin){
            await chat.setMessagesAdminsOnly(true);
            await chat.sendMessage('Grup ditutup!');
        }
        if(text.toLowerCase() === '.open' && isAdmin){
            await chat.setMessagesAdminsOnly(false);
            await chat.sendMessage('Grup dibuka!');
        }
    }
});

// ===== INITIALIZE BOT =====
client.initialize();
