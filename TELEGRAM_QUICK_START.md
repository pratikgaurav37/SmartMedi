# Quick Telegram Setup Guide

## The Error You're Seeing

**Error:** `"Chat not found. Please start a conversation with the bot by sending /start on Telegram first."`

This means the Telegram bot cannot send messages to you because you haven't initiated a conversation with it yet.

## How to Fix It (3 Easy Steps)

### Step 1: Find Your Bot on Telegram

1. Open Telegram (mobile app or desktop)
2. In the search bar, type your bot's username
   - Check your `.env` file for `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`
   - It should be something like `@medi_remainder_bot` or similar
3. Click on the bot to open a chat

### Step 2: Start the Conversation

1. In the chat with your bot, type: `/start`
2. Press Send
3. The bot should respond (if configured with a webhook or polling)

### Step 3: Get Your Chat ID

You have two options:

#### Option A: Use @userinfobot (Easiest)
1. Search for `@userinfobot` on Telegram
2. Start a chat with it
3. It will immediately send you your user information
4. Copy your **ID** number (this is your chat ID)
5. Use this ID in your app's Telegram settings

#### Option B: Use the Helper Endpoint (Developer Method)
1. After sending `/start` to your bot, visit:
   ```
   http://localhost:3000/api/telegram/get-updates
   ```
2. Look for the `chatIds` array in the response
3. Copy your `chatId` from there

### Step 4: Connect in Your App

1. Go to your app's Settings page
2. Find the Telegram section
3. Enter your Chat ID
4. Click "Send Test Message"
5. You should receive a test message on Telegram! 🎉

## Troubleshooting

### "Bot was blocked"
- You previously blocked the bot on Telegram
- **Fix:** Go to the bot chat → Settings → Unblock

### "Bot token is invalid"
- Your `TELEGRAM_BOT_TOKEN` in `.env` is incorrect
- **Fix:** Get a new token from @BotFather on Telegram

### "Unauthorized"
- The bot token doesn't match the bot username
- **Fix:** Verify both values in your `.env` file

### Still not working?
1. Make sure your dev server is running (`pnpm dev`)
2. Check the server console for detailed error messages
3. Verify your `.env` file has both:
   - `TELEGRAM_BOT_TOKEN=your_bot_token`
   - `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username`

## For Production Deployment

When deploying to production, you'll also need to:
1. Set up a webhook for your bot (optional but recommended)
2. Configure the bot domain with @BotFather
3. Use the Telegram Login Widget for authentication

See `TELEGRAM_SETUP.md` for detailed production setup instructions.
