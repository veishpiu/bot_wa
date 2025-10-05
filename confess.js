module.exports = function (client) {
  const userState = {};

  client.on("message", async (message) => {
    const chatId = message.from;
    const text = message.body ? message.body.trim() : "";

    // ===== Batalkan flow =====
    if (text.toLowerCase() === "batal" && userState[chatId]) {
      delete userState[chatId];
      return message.reply("❌ Proses confess dibatalkan.");
    }

    // ===== Command .confess =====
    if (text.toLowerCase() === ".confess") {
      // Cek chat pribadi
      if (chatId.includes("@g.us")) {
        return message.reply(
          "⚠️ Command .confess hanya bisa digunakan di chat pribadi!"
        );
      }

      // Mulai flow
      userState[chatId] = { step: 1 };
      return message.reply(
        "Silakan tulis *Nomor tujuan* (contoh: +628123456789) atau ketik *Batal* untuk membatalkan:"
      );
    }

    // ===== Lanjut flow jika userState ada =====
    if (userState[chatId]) {
      const state = userState[chatId];

      // Step 1: nomor tujuan
      if (state.step === 1) {
        const nomor = text.replace(/\D/g, "");
        if (!nomor || nomor.length < 9)
          return message.reply("Nomor tidak valid 😔. Contoh: +628123456789");

        state.nomor = nomor;
        state.step = 2;
        return message.reply(
          "Sekarang tulis pesan yang ingin dikirim atau ketik *Batal* untuk membatalkan:"
        );
      }

      // Step 2: pesan
      if (state.step === 2) {
        const pesan = text;
        if (!pesan) return message.reply("Pesan tidak boleh kosong 😔");

        try {
          const pesanAnonim = `${pesan}\n\n> Pesan ini dikirim secara anonim`;
          await client.sendMessage(`${state.nomor}@c.us`, pesanAnonim);
          message.reply("✅ Pesan berhasil dikirim secara anonim!");
        } catch (err) {
          console.error("Gagal kirim pesan:", err);
          message.reply("⚠️ Gagal mengirim pesan. Periksa nomor tujuan.");
        }

        delete userState[chatId]; // selesai
      }
    }
  });
};
