import { NextRequest, NextResponse } from 'next/server';
import { verifyTelegramAuth, TelegramAuthData } from '@/lib/telegram-auth';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const authData: TelegramAuthData = await request.json();

    // Verify the authentication data
    if (!verifyTelegramAuth(authData)) {
      return NextResponse.json(
        { error: 'Invalid authentication data' },
        { status: 401 }
      );
    }

    // Check auth_date is recent (within 24 hours)
    const authDate = new Date(authData.auth_date * 1000);
    const now = new Date();
    const hoursDiff = (now.getTime() - authDate.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      return NextResponse.json(
        { error: 'Authentication data expired' },
        { status: 401 }
      );
    }

    // Get the current user
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Update user profile with Telegram data
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        telegram_chat_id: authData.id.toString(),
        telegram_username: authData.username || null,
        telegram_first_name: authData.first_name,
        telegram_photo_url: authData.photo_url || null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to update profile:', updateError);
      return NextResponse.json(
        { error: 'Failed to save Telegram connection' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      chatId: authData.id.toString(),
      user: {
        firstName: authData.first_name,
        lastName: authData.last_name,
        username: authData.username,
        photoUrl: authData.photo_url,
      },
    });
  } catch (error) {
    console.error('Telegram connect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Disconnect endpoint
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Clear Telegram data from profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        telegram_chat_id: null,
        telegram_username: null,
        telegram_first_name: null,
        telegram_photo_url: null,
      })
      .eq('id', user.id);

    if (updateError) {
      console.error('Failed to disconnect Telegram:', updateError);
      return NextResponse.json(
        { error: 'Failed to disconnect Telegram' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Telegram disconnect error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
