"use strict";
// src/lib/rate-limiter.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyRateLimit = applyRateLimit;
exports.applyRateLimitWithRoleCheck = applyRateLimitWithRoleCheck;
const ratelimit_1 = require("@upstash/ratelimit");
const redis_1 = require("@upstash/redis");
const server_1 = require("next/server");
const jwt_1 = require("next-auth/jwt");
const client_1 = require("@prisma/client");
// Initialize Redis client only once
let redis = null;
if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = new redis_1.Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
}
else {
    console.warn('Upstash Redis credentials are not configured. Rate limiting will be disabled.');
}
/**
 * Applies rate limiting to an API endpoint.
 *
 * @param req The NextRequest object.
 * @param config The rate limit configuration.
 * @returns A NextResponse object if rate-limited, otherwise null.
 */
async function applyRateLimit(req, config) {
    var _a, _b, _c;
    if (!redis || process.env.NODE_ENV === 'development') {
        return null;
    }
    const token = await (0, jwt_1.getToken)({ req, secret: process.env.NEXTAUTH_SECRET });
    // FIX: Use 'x-forwarded-for' header to get the IP address
    const ip = (_b = (_a = req.headers.get('x-forwarded-for')) === null || _a === void 0 ? void 0 : _a.split(',')[0].trim()) !== null && _b !== void 0 ? _b : '127.0.0.1';
    const identifier = (_c = token === null || token === void 0 ? void 0 : token.sub) !== null && _c !== void 0 ? _c : ip;
    const ratelimit = new ratelimit_1.Ratelimit({
        redis: redis,
        limiter: ratelimit_1.Ratelimit.slidingWindow(config.requests, config.window),
        analytics: true,
        prefix: `ratelimit:${req.nextUrl.pathname}`,
    });
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
    if (!success) {
        return new server_1.NextResponse('Too many requests. Please try again later.', {
            status: 429,
            headers: {
                'X-RateLimit-Limit': limit.toString(),
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': reset.toString(),
            },
        });
    }
    return null;
}
/**
 * Applies rate limiting with role-based exemptions.
 * MATCHMAKER and ADMIN roles are exempt from rate limiting.
 *
 * @param req The NextRequest object.
 * @param config The rate limit configuration (applied only to regular users).
 * @returns A NextResponse object if rate-limited, otherwise null.
 */
async function applyRateLimitWithRoleCheck(req, config) {
    const token = await (0, jwt_1.getToken)({ req, secret: process.env.NEXTAUTH_SECRET });
    // שדכנים ואדמינים פטורים לחלוטין מהגבלות
    if ((token === null || token === void 0 ? void 0 : token.role) === client_1.UserRole.MATCHMAKER || (token === null || token === void 0 ? void 0 : token.role) === client_1.UserRole.ADMIN) {
        console.log(`[Rate Limiter] Skipping rate limit for ${token.role}: ${token.sub}`);
        return null;
    }
    // משתמשים רגילים כפופים להגבלה
    return applyRateLimit(req, config);
}
