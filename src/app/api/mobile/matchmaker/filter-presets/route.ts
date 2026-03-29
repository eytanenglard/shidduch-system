// =============================================================================
// src/app/api/mobile/matchmaker/filter-presets/route.ts
// =============================================================================
// Matchmaker filter presets via Redis (Mobile JWT)
// =============================================================================

import { NextRequest } from 'next/server';
import { UserRole } from '@prisma/client';
import { Redis } from '@upstash/redis';
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from '@/lib/mobile-auth';

export const dynamic = 'force-dynamic';

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

// ─── OPTIONS ──────────────────────────────────────────────────────────────────

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ─── GET — Retrieve all saved presets for current matchmaker ─────────────────

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const redis = getRedis();
    if (!redis) {
      return corsJson(req, { presets: [], source: 'none' });
    }

    const key = `${REDIS_KEY_PREFIX}${auth.userId}`;
    const data = await redis.get<string>(key);
    const presets = data ? (typeof data === 'string' ? JSON.parse(data) : data) : [];

    return corsJson(req, { presets, source: 'redis' });
  } catch (error) {
    console.error('[Mobile Filter Presets API] GET Error:', error);
    return corsJson(req, { presets: [], error: 'Failed to load' });
  }
}

// ─── PUT — Save all presets (full replacement) ───────────────────────────────

export async function PUT(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, 'Unauthorized', 401);

    if (auth.role !== UserRole.MATCHMAKER && auth.role !== UserRole.ADMIN) {
      return corsError(req, 'Insufficient permissions', 403);
    }

    const redis = getRedis();
    if (!redis) {
      return corsError(req, 'Redis not configured', 503, 'SERVICE_UNAVAILABLE');
    }

    const { presets } = await req.json();
    if (!Array.isArray(presets)) {
      return corsError(req, 'Invalid presets format', 400, 'VALIDATION_ERROR');
    }

    const key = `${REDIS_KEY_PREFIX}${auth.userId}`;
    // Store with 90 day TTL
    await redis.set(key, JSON.stringify(presets), { ex: 90 * 24 * 60 * 60 });

    return corsJson(req, { success: true, count: presets.length });
  } catch (error) {
    console.error('[Mobile Filter Presets API] PUT Error:', error);
    return corsError(req, 'Failed to save presets', 500);
  }
}
