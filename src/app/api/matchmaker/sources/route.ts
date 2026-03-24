// src/app/api/matchmaker/sources/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== UserRole.MATCHMAKER &&
        session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sources = await prisma.customSource.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true },
    });

    return NextResponse.json({ sources });
  } catch (error) {
    console.error('Error fetching custom sources:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (
      !session?.user ||
      (session.user.role !== UserRole.MATCHMAKER &&
        session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const name = (body.name as string)?.trim();

    if (!name) {
      return NextResponse.json(
        { error: 'Source name is required' },
        { status: 400 }
      );
    }

    // Upsert — if already exists, just return it
    const source = await prisma.customSource.upsert({
      where: { name },
      update: {},
      create: {
        name,
        createdBy: session.user.id,
      },
      select: { id: true, name: true },
    });

    return NextResponse.json({ source });
  } catch (error) {
    console.error('Error creating custom source:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
