# WhatsApp Bot - Confession & Sticker Bot

## Overview
This is a WhatsApp bot application built with Node.js that provides automated features including:
- Auto-reply commands (.hai, .ping)
- Image/video to sticker conversion
- Anonymous confession messaging system
- Group admin commands (hidetag, open/close group)

The bot runs as a console application and uses WhatsApp Web.js to interact with WhatsApp.

## Project Architecture

### Main Files
- **index.js** - Main entry point, initializes WhatsApp client and handles message commands
- **confess.js** - Module for anonymous confession messaging with multi-step conversation flow
- **package.json** - Dependencies configuration

### Dependencies
- `whatsapp-web.js` - WhatsApp Web API wrapper
- `qrcode-terminal` - QR code display in terminal for authentication
- `dotenv` - Environment variable management
- `puppeteer` - Browser automation for WhatsApp Web
- `openai` - OpenAI API client (if AI features are added)
- `node-fetch` - HTTP requests
- `tiktok-scraper` - TikTok content scraper

### Features
1. **Sticker Creation** (.sticker) - Converts images/videos to WhatsApp stickers
2. **Anonymous Confessions** (.confess) - Two-step process to send anonymous messages
3. **Bot Status** (.ping) - Shows bot uptime and status
4. **Group Admin Commands** (.h, .close, .open) - For group management
5. **Menu** (.menu) - Displays all available commands

### Storage
- `media/` - Temporary storage for media files during sticker creation
- `.wwebjs_auth/` - WhatsApp authentication session data
- `.wwebjs_cache/` - WhatsApp Web cache

## Recent Changes
- 2025-10-05: Initial import and Replit environment setup
- Added comprehensive .gitignore for WhatsApp auth, cache, and media files
- Created .env file for environment variables
- Configured console workflow for bot operation

## How to Use
1. Run the bot using the configured workflow
2. Scan the QR code that appears in the console with your WhatsApp mobile app
3. Once authenticated, the bot will be ready to receive commands
4. Send commands like `.menu` to see available features

## Environment Variables
This project uses a `.env` file for configuration. Currently no specific environment variables are required, but the file is ready for future use (e.g., API keys, configuration values).

## User Preferences
None configured yet.
