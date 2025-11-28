# Telegram Bot Setup Guide

## Issue: "Bot domain invalid"

The Telegram Login Widget requires your bot's domain to be configured with BotFather. This is a security feature to prevent unauthorized use of your bot.

## Solution: Configure Bot Domain with BotFather

### For Production (Deployed App)

1. **Open Telegram** and find `@BotFather`
2. **Send the command:** `/setdomain`
3. **Select your bot:** `@medi_remainder_bot`
4. **Enter your domain:** Your production domain (e.g., `yourdomain.com` or `yourapp.vercel.app`)

### For Local Development

Since Telegram requires a public domain, you have **two options** for local development:

#### Option 1: Use ngrok (Recommended for Testing)

1. **Install ngrok:**
   ```bash
   # Download from https://ngrok.com/download
   # Or install via package manager
   brew install ngrok  # macOS
   # or
   snap install ngrok  # Linux
   ```

2. **Start ngrok tunnel:**
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

4. **Configure with BotFather:**
   - Open Telegram and message `@BotFather`
   - Send: `/setdomain`
   - Select: `@medi_remainder_bot`
   - Enter: `abc123.ngrok.io` (without https://)

5. **Access your app** via the ngrok URL instead of localhost

#### Option 2: Skip Widget for Local Dev (Use Manual Chat ID)

For local development, you can temporarily use the manual chat ID input method:

1. **Get your Chat ID:**
   - Open Telegram
   - Message `@userinfobot`
   - Copy your Chat ID

2. **Temporarily modify the code** to allow manual input in development:

Create a development-only component in `components/telegram-connect-dev.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send } from 'lucide-react'

export function TelegramConnectDev({ onAuth, isConnected, onDisconnect }: any) {
  const [chatId, setChatId] = useState('')

  if (isConnected) {
    return (
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <p className="text-sm text-green-700">✓ Telegram Connected (Dev Mode)</p>
        <Button onClick={onDisconnect} variant="outline" size="sm" className="mt-2">
          Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-500">
        Development Mode: Get your Chat ID from @userinfobot on Telegram
      </p>
      <div className="flex gap-2">
        <Input
          value={chatId}
          onChange={(e) => setChatId(e.target.value)}
          placeholder="Enter Chat ID"
        />
        <Button
          onClick={() => {
            if (chatId) {
              onAuth({
                chatId,
                firstName: 'Dev User',
                username: 'devuser',
              })
            }
          }}
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
```

Then in your pages, conditionally use this component:

```tsx
import { TelegramConnect } from '@/components/telegram-connect'
import { TelegramConnectDev } from '@/components/telegram-connect-dev'

// In your component:
const isDev = process.env.NODE_ENV === 'development'
const TelegramWidget = isDev ? TelegramConnectDev : TelegramConnect
```

## Recommended Approach

**For immediate testing:** Use Option 2 (manual Chat ID in dev mode)

**For full testing:** Use Option 1 (ngrok) to test the complete widget flow

**For production:** Configure your production domain with BotFather using the steps above

## Verifying the Setup

After configuring the domain:

1. **Restart your dev server** (if using ngrok)
2. **Navigate to the onboarding or settings page**
3. **Click the Telegram Login button**
4. **You should see the Telegram auth popup**
5. **Authorize the bot**
6. **You should be connected successfully**

## Testing the Integration

Once connected, test the notification system:

1. **Go to Settings**
2. **Click "Send Test Message"**
3. **Check your Telegram** for the test message
4. **If successful,** the integration is working correctly

## Troubleshooting

### "Bot domain invalid" error persists
- Make sure you entered the domain without `https://` or `http://`
- Wait a few minutes for BotFather's changes to propagate
- Clear your browser cache and restart the dev server

### Widget doesn't load
- Check browser console for errors
- Verify `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` is set correctly in `.env`
- Ensure the bot username matches exactly (case-sensitive)

### Authentication fails
- Check that the bot token in `.env` is correct
- Verify the hash validation in the API route is working
- Check server logs for detailed error messages
