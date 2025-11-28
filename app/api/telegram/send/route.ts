import { NextRequest, NextResponse } from 'next/server';
import { sendMedicationReminder } from '@/lib/telegram';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { chatId, medicationName, scheduledTime, dosage } = body;

    if (!chatId || !medicationName || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields: chatId, medicationName, scheduledTime' },
        { status: 400 }
      );
    }

    const success = await sendMedicationReminder({
      chatId,
      medicationName,
      scheduledTime,
      dosage,
    });

    if (success) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Failed to send notification. Check server logs.' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Telegram API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
