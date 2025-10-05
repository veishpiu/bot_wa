require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');

const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || require('child_process').execSync('which chromium').toString().trim(),
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

let botStartTime = null; // simpan waktu bot aktif

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
confessModule(client); // initialize module confess

// ===== MESSAGE HANDLER =====
client.on('message', async message => {
    const text = message.body ? message.body.trim() : '';
    const fromGroup = message.from.includes('@g.us');
    const chat = await message.getChat();

    console.log('Pesan masuk:', text);

    // ===== AUTO REPLY =====
    if(text.toLowerCase() === '.hai') message.reply('Halo! Aku bot, kamu Bisa ubah fotomu jadi stiker dan bantu kirim pesan confess ke Siapapun!');
    if(text.toLowerCase() === '.ping') {
        if(botStartTime) {
            const uptime = Math.floor((new Date() - botStartTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            message.reply(`Bot aktif sejak: ${botStartTime.toLocaleString()}\nUptime: ${hours}h ${minutes}m ${seconds}s`);
        } else {
            message.reply('Bot baru mulai, status uptime belum tersedia');
        }
    }

   // ===== STICKER =====
if(text.toLowerCase() === '.sticker') {
    if(message.hasMedia || message.hasQuotedMsg) {
        let mediaMessage = message;
        if(message.hasQuotedMsg) mediaMessage = await message.getQuotedMessage();
        try {
            await message.reply('Prosess...');
            const media = await mediaMessage.downloadMedia();
            if(media) {
                const extension = media.mimetype.split('/')[1];
                const mediaPath = path.join(__dirname, 'media', `foto_${Date.now()}.${extension}`);
                fs.writeFileSync(mediaPath, media.data, 'base64');
                await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
            }
        } catch(err) {
            console.error('Gagal bikin sticker:', err);
            message.reply('Gagal bikin sticker');
        }
    } else {
        message.reply('Harap kirim foto terlebih dahulu atau reply ke media untuk membuat sticker.');
    }
}
    // ===== MENU COMMAND =====

  if(text.toLowerCase() === '.menu') {
    const menuText = `*🤖 BOT MENU*

╭─❏ *📌 UMUM*
│ • .hai : Sapaan bot
│ • .ping : Cek uptime bot
│ • .sticker : Ubah gambar/video jadi stiker
│ • .confess : Kirim pesan confess ke target
╰─❏

╭─❏ *👥 GRUP (Admin Only)*
│ • .h <pesan> : Mention semua anggota
│ • .close : Tutup grup
│ • .open : Buka grup
╰─❏

> Made with ❤️ - By Vei
`;
    message.reply(menuText);
}

    // ===== ADMIN COMMANDS =====
    if(fromGroup) {
        const sender = await message.getContact();
        const isAdmin = chat.participants
            .filter(p => p.isAdmin)
            .some(p => p.id._serialized === sender.id._serialized);

        if(text.toLowerCase().startsWith('.h ') && isAdmin) {
            try {
                const mentions = [];
                for (let participant of chat.participants) {
                    if(participant.id._serialized !== client.info.wid._serialized) {
                        mentions.push(await client.getContactById(participant.id._serialized));
                    }
                }
                const msgText = text.slice(3).trim() || 'Mention all';
                if(mentions.length > 0) await chat.sendMessage(msgText, { mentions });
            } catch(err) { console.error('Gagal mention all:', err); }
        }

        if(text.toLowerCase() === '.close' && isAdmin) {
            await chat.setMessagesAdminsOnly(true);
            await chat.sendMessage('Grup tutup wok');
        }
        if(text.toLowerCase() === '.open' && isAdmin) {
            await chat.setMessagesAdminsOnly(false);
            await chat.sendMessage('GEELOK Grup dibuka!');
        }
    }
});

// ===== INITIALIZE BOT =====
client.initialize();
