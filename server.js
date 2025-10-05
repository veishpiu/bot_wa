const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("Bot is running!");
});

// Pakai port dari Replit atau default 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🌐 Server aktif di port ${PORT}`);
});
