// src/lib/mobile-auth.ts
// פונקציות עזר לאימות מובייל + CORS

import jwt from "jsonwebtoken";
import { NextRequest, NextResponse } from "next/server";
import type { User } from "@prisma/client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
const MOBILE_JWT_EXPIRES_IN = "30d";

// 🔴 הוסף: רשימת Origins מותרים
const ALLOWED_ORIGINS = [
  'https://www.neshamatech.com',
  'https://neshamatech.com',
  'http://localhost:8081',
  'http://localhost:3000',
  'http://localhost:19006',
];

export interface MobileJWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ==================== CORS HELPERS ====================

/**
 * 🔴 חדש: קבלת CORS headers לפי ה-request
 */
export function getCorsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get('origin') || '';
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.startsWith('exp://');
  
  return {
    'Access-Control-Allow-Origin': isAllowed ? origin : ALLOWED_ORIGINS[0],
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
  };
}

/**
 * 🔴 חדש: תגובת JSON עם CORS headers
 */
export function corsJson(
  req: NextRequest, 
  data: any, 
  options: { status?: number } = {}
): NextResponse {
  return NextResponse.json(data, {
    status: options.status || 200,
    headers: getCorsHeaders(req),
  });
}

/**
 * 🔴 חדש: תגובת שגיאה עם CORS headers
 */
export function corsError(
  req: NextRequest, 
  error: string, 
  status: number = 400
): NextResponse {
  return NextResponse.json(
    { success: false, error },
    { status, headers: getCorsHeaders(req) }
  );
}

/**
 * 🔴 חדש: תגובה ל-OPTIONS preflight
 */
export function corsOptions(req: NextRequest): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: {
      ...getCorsHeaders(req),
      'Access-Control-Max-Age': '86400',
    },
  });
}

// ==================== AUTH HELPERS ====================

/**
 * יצירת JWT token למובייל
 */
export function createMobileToken(user: User): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  
  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: MOBILE_JWT_EXPIRES_IN }
  );

  return { token, expiresAt };
}

/**
 * אימות Bearer token מ-request
 */
export async function verifyMobileToken(req: NextRequest): Promise<MobileJWTPayload | null> {
  try {
    const authHeader = req.headers.get("authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null;
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as MobileJWTPayload;
    
    return decoded;
  } catch (error) {
    console.error("[verifyMobileToken] Error:", error);
    return null;
  }
}

/**
 * המרת User לפורמט תגובה למובייל
 */
export function formatUserForMobile(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    status: user.status,
    isVerified: user.isVerified,
    isPhoneVerified: user.isPhoneVerified,
    isProfileComplete: user.isProfileComplete,
    language: user.language,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}