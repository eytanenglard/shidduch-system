// API route for matchmaker filter presets (server-side persistence via Redis)
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Redis } from '@upstash/redis';

const REDIS_KEY_PREFIX = 'matchmaker:filter-presets:';

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// GET — Retrieve all saved presets for the current matchmaker
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !['MATCHMAKER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ presets: [], source: 'none' });
    }

    const key = `${REDIS_KEY_PREFIX}${session.user.id}`;
    const data = await redis.get<string>(key);
    const presets = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];

    return NextResponse.json({ presets, source: 'redis' });
  } catch (error) {
    console.error('Failed to load filter presets:', error);
    return NextResponse.json({ presets: [], error: 'Failed to load' });
  }
}

// PUT — Save all presets for the current matchmaker (full replacement)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !['MATCHMAKER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const redis = getRedis();
    if (!redis) {
      return NextResponse.json({ success: false, error: 'Redis not configured' }, { status: 503 });
    }

    const { presets } = await request.json();
    if (!Array.isArray(presets)) {
      return NextResponse.json({ error: 'Invalid presets format' }, { status: 400 });
    }

    const key = `${REDIS_KEY_PREFIX}${session.user.id}`;
    // Store with 90 day TTL
    await redis.set(key, JSON.stringify(presets), { ex: 90 * 24 * 60 * 60 });

    return NextResponse.json({ success: true, count: presets.length });
  } catch (error) {
    console.error('Failed to save filter presets:', error);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}
