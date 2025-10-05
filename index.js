require('dotenv').config();
const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ===== SERVER UNTUK UPTIME =====
require('./server');

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
    puppeteer: chromiumPath
        ? {
              executablePath: chromiumPath,
              args: [
                  '--no-sandbox',
                  '--disable-setuid-sandbox',
                  '--disable-dev-shm-usage',
                  '--disable-accelerated-2d-canvas',
                  '--no-first-run',
                  '--no-zygote',
                  '--disable-gpu',
              ],
          }
        : undefined,
});

let botStartTime = null;

// ===== QR CODE =====
client.on('qr', qr => {
    qrcode.generate(qr, { small: true });
    console.log('📱 Scan QR Code untuk login WhatsApp!');
});

client.on('ready', () => {
    botStartTime = new Date();
    console.log('✅ Bot sudah siap dan online!');
});

// ===== IMPORT MODULES =====
const confessModule = require('./confess');
const bratModule = require('./brat'); // sticker text
const ttdlModule = require('./ttdl'); // TikTok downloader
const igdlModule = require('./igdl'); // Instagram downloader
const qcModule = require('./qc'); // .qc
const iqcModule = require('./iqc'); // .iqc

// Inisialisasi confess
confessModule(client);

// ===== HANDLER PESAN =====
client.on('message', async message => {
    const text = message.body?.trim() || '';
    const fromGroup = message.from.includes('@g.us');
    const chat = await message.getChat();

    console.log(`💬 Pesan masuk: ${text}`);

    // ===== AUTO REPLY =====
    if (text.toLowerCase() === '.hai')
        return message.reply(
            'Halo! Aku bot, bisa ubah fotomu jadi stiker, kirim confess, dan bikin bubble chat iPhone juga 😎'
        );

    if (text.toLowerCase() === '.ping') {
        if (botStartTime) {
            const uptime = Math.floor((new Date() - botStartTime) / 1000);
            const hours = Math.floor(uptime / 3600);
            const minutes = Math.floor((uptime % 3600) / 60);
            const seconds = uptime % 60;
            return message.reply(
                `🕒 Bot aktif sejak: ${botStartTime.toLocaleString()}\nUptime: ${hours}h ${minutes}m ${seconds}s`
            );
        } else return message.reply('Bot baru mulai, belum ada data uptime.');
    }

    // ===== BUAT STICKER DARI MEDIA =====
    if (text.toLowerCase() === '.sticker') {
        if (message.hasMedia || message.hasQuotedMsg) {
            let mediaMessage = message;
            if (message.hasQuotedMsg) mediaMessage = await message.getQuotedMessage();

            try {
                await message.reply('⏳ Membuat stiker...');
                const media = await mediaMessage.downloadMedia();

                if (media) {
                    await client.sendMessage(message.from, media, { sendMediaAsSticker: true });
                }
            } catch (err) {
                console.error(err);
                return message.reply('❌ Gagal membuat stiker.');
            }
        } else return message.reply('⚠️ Kirim atau reply ke foto/video untuk membuat stiker.');
    }

    // ===== STICKER TEKS BRAT =====
    if (text.toLowerCase().startsWith('.brat')) {
        await bratModule.createBratSticker(message, client);
    }

    // ===== QC (Single Chat iPhone Style) =====
    if (text.toLowerCase().startsWith('.qc')) {
        await qcModule.handleQC(message, client);
    }

    // ===== IQC (Reply Chat iPhone Style) =====
    if (text.toLowerCase().startsWith('.iqc')) {
        await iqcModule.handleIQC(message, client);
    }

    // ===== TIKTOK DOWNLOADER =====
    if (text.toLowerCase().startsWith('.ttdl')) {
        await ttdlModule.handleTikTokDownload(message, client);
    }

    // ===== INSTAGRAM DOWNLOADER =====
    if (text.toLowerCase().startsWith('.igdl')) {
        await igdlModule.handleInstagramDownload(message, client);
    }

    // ===== MENU =====
    if (text.toLowerCase() === '.menu') {
        const menuText = `*🤖 BOT MENU*

╭─❏ *📌 UMUM*
│ • .hai — Sapaan bot
│ • .ping — Cek uptime bot
│ • .sticker — Ubah media jadi stiker
│ • .brat — Stiker teks hitam
│ • .confess — Kirim pesan anonim
│ • .qc — Buat bubble chat iPhone
│ • .iqc — Buat reply chat iPhone
╰─❏

╭─❏ *📥 DOWNLOADER*
│ • .ttdl <link> — Download video TikTok
│ • .igdl <link> — Download video/story Instagram
╰─❏

╭─❏ *👥 GRUP (Admin Only)*
│ • .h <pesan> — Mention semua anggota
│ • .close — Tutup grup
│ • .open — Buka grup
╰─❏

> Made with ❤️ by Vei`;
        return message.reply(menuText);
    }

    // ===== ADMIN COMMANDS =====
    if (fromGroup) {
        const sender = await message.getContact();
        const isAdmin = chat.participants
            .filter(p => p.isAdmin)
            .some(p => p.id._serialized === sender.id._serialized);

        if (text.toLowerCase().startsWith('.h ') && isAdmin) {
            try {
                const mentions = [];
                for (let participant of chat.participants) {
                    if (participant.id._serialized !== client.info.wid._serialized) {
                        mentions.push(await client.getContactById(participant.id._serialized));
                    }
                }
                const msgText = text.slice(3).trim() || 'Mention all';
                if (mentions.length > 0)
                    await chat.sendMessage(msgText, { mentions });
            } catch (err) {
                console.error(err);
            }
        }

        if (text.toLowerCase() === '.close' && isAdmin) {
            await chat.setMessagesAdminsOnly(true);
            await chat.sendMessage('🔒 Grup ditutup oleh admin!');
        }

        if (text.toLowerCase() === '.open' && isAdmin) {
            await chat.setMessagesAdminsOnly(false);
            await chat.sendMessage('🔓 Grup dibuka oleh admin!');
        }
    }
});

// ===== JALANKAN BOT =====
client.initialize();
