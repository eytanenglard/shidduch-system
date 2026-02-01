// src/lib/mobile-auth.ts
// פונקציות עזר לאימות מובייל

import jwt from "jsonwebtoken";
import { NextRequest } from "next/server";
import type { User } from "@prisma/client";

const JWT_SECRET = process.env.NEXTAUTH_SECRET!;
const MOBILE_JWT_EXPIRES_IN = "30d"; // 30 ימים כמו ה-session הרגיל

export interface MobileJWTPayload {
  userId: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

/**
 * יצירת JWT token למובייל
 */
export function createMobileToken(user: User): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 ימים
  
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
 * מחזיר את הפרטים אם תקין, null אם לא
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
