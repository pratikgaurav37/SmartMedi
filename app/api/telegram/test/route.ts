import { NextRequest, NextResponse } from 'next/server';
import { sendTestMessage } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const { chatId } = await request.json();

    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }

    const result = await sendTestMessage(chatId);

    if (result.success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: result.error || 'Failed to send test message' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Test message error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
