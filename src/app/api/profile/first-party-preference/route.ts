import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import  prisma  from '@/lib/prisma';

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { wantsToBeFirstParty } = await req.json();

    if (typeof wantsToBeFirstParty !== 'boolean') {
      return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
    }

    await prisma.profile.update({
      where: { userId: session.user.id },
      data: { wantsToBeFirstParty },
    });

    return NextResponse.json({ success: true, wantsToBeFirstParty });
  } catch (error) {
    console.error('[first-party-preference] Error:', error);
    return NextResponse.json({ error: 'Failed to update preference' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
      where: { userId: session.user.id },
      select: { wantsToBeFirstParty: true },
    });

    return NextResponse.json({ wantsToBeFirstParty: profile?.wantsToBeFirstParty ?? true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get preference' }, { status: 500 });
  }
}