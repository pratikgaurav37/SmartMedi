import { NextResponse } from 'next/server';

export async function GET() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  if (!botToken) {
    return NextResponse.json(
      { error: 'TELEGRAM_BOT_TOKEN not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/getUpdates`
    );
    const data = await response.json();

    if (!data.ok) {
      return NextResponse.json(
        { error: 'Failed to get updates from Telegram', details: data },
        { status: 500 }
      );
    }

    // Extract chat IDs from recent messages
    const chatIds = data.result
      .map((update: any) => ({
        chatId: update.message?.chat?.id || update.callback_query?.message?.chat?.id,
        firstName: update.message?.chat?.first_name || update.callback_query?.message?.chat?.first_name,
        username: update.message?.chat?.username || update.callback_query?.message?.chat?.username,
        text: update.message?.text || 'N/A',
        date: update.message?.date || update.callback_query?.message?.date,
      }))
      .filter((item: any) => item.chatId);

    return NextResponse.json({
      success: true,
      updates: data.result,
      chatIds: [...new Map(chatIds.map((item: any) => [item.chatId, item])).values()],
      message: chatIds.length > 0 
        ? 'Found chat IDs! Use one of these to connect your Telegram account.'
        : 'No messages found. Send /start to your bot on Telegram first.',
    });
  } catch (error) {
    console.error('Error fetching Telegram updates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch updates', details: error },
      { status: 500 }
    );
  }
}
