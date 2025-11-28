import crypto from 'crypto';

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

/**
 * Verifies the authenticity of Telegram Login Widget data
 * Based on: https://core.telegram.org/widgets/login#checking-authorization
 */
export function verifyTelegramAuth(authData: TelegramAuthData): boolean {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!botToken) {
    console.error('TELEGRAM_BOT_TOKEN not configured');
    return false;
  }

  // Extract hash and create data check string
  const { hash, ...dataToCheck } = authData;
  
  // Sort keys alphabetically and create check string
  const checkString = Object.keys(dataToCheck)
    .sort()
    .map(key => `${key}=${dataToCheck[key as keyof typeof dataToCheck]}`)
    .join('\n');

  // Create secret key from bot token
  const secretKey = crypto
    .createHash('sha256')
    .update(botToken)
    .digest();

  // Calculate hash
  const calculatedHash = crypto
    .createHmac('sha256', secretKey)
    .update(checkString)
    .digest('hex');

  // Compare hashes
  return calculatedHash === hash;
}

/**
 * Dynamically loads the Telegram Login Widget script
 */
export function loadTelegramWidget(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if script already loaded
    if (document.getElementById('telegram-widget-script')) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.id = 'telegram-widget-script';
    script.src = 'https://telegram.org/js/telegram-widget.js?22';
    script.async = true;
    
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Telegram widget script'));
    
    document.body.appendChild(script);
  });
}

/**
 * Client-side type for Telegram user data (without hash verification)
 */
export interface TelegramUser {
  id: number;
  firstName: string;
  lastName?: string;
  username?: string;
  photoUrl?: string;
}
