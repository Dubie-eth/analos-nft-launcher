import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { userId, serverId, accessToken } = await request.json();

    if (!userId || !serverId || !accessToken) {
      return NextResponse.json(
        { error: 'Missing required parameters: userId, serverId, accessToken' },
        { status: 400 }
      );
    }

    // Verify user is member of Discord server
    const discordResponse = await fetch(`https://discord.com/api/v10/users/@me/guilds`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!discordResponse.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch Discord guilds', details: await discordResponse.text() },
        { status: 400 }
      );
    }

    const guilds = await discordResponse.json();
    const isMember = guilds.some((guild: any) => guild.id === serverId);

    return NextResponse.json({
      success: true,
      isMember,
      serverId,
      userId,
    });

  } catch (error) {
    console.error('Discord verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error during Discord verification' },
      { status: 500 }
    );
  }
}
