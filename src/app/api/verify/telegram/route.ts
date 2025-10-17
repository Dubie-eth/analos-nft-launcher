import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, groupId, botToken } = await request.json();

    if (!userId || !groupId || !botToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, groupId, botToken' },
        { status: 400 }
      );
    }

    // Get chat member information from Telegram Bot API
    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/getChatMember?chat_id=${groupId}&user_id=${userId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      
      // If user is not found or not a member, return false
      if (errorData.error_code === 400 && errorData.description.includes('user not found')) {
        return NextResponse.json({
          success: true,
          isMember: false,
          groupId,
          userId,
        });
      }
      
      return NextResponse.json(
        { error: 'Failed to verify Telegram membership', details: errorData },
        { status: 400 }
      );
    }

    const memberData = await telegramResponse.json();
    const member = memberData.result;
    
    // Check if user is a member (not left, kicked, or restricted)
    const isMember = member.status === 'member' || 
                     member.status === 'administrator' || 
                     member.status === 'creator';

    return NextResponse.json({
      success: true,
      isMember,
      groupId,
      userId,
      memberStatus: member.status,
    });

  } catch (error) {
    console.error('Telegram verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Telegram verification' },
      { status: 500 }
    );
  }
}
