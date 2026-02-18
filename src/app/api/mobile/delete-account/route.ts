// src/app/api/mobile/delete-account/route.ts
// ==========================================
// NeshamaTech Mobile - Delete Account API
// Mirrors /api/user/delete but uses JWT auth
// ==========================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

export async function DELETE(req: NextRequest) {
  try {
    // 1. אימות המשתמש באמצעות JWT
    const auth = await verifyMobileToken(req);

    if (!auth) {
      console.error("[mobile/delete-account] Unauthorized access attempt");
      return corsError(req, "Unauthorized", 401);
    }

    const userId = auth.userId;
    const userEmail = auth.email;

    console.log(
      `[mobile/delete-account] Delete initiated by user: ${userId} (${userEmail})`
    );

    // 2. מחיקת המשתמש מהדאטאבייס (cascade delete)
    await prisma.user.delete({
      where: { id: userId },
    });

    console.log(
      `[mobile/delete-account] ✅ User ${userId} (${userEmail}) deleted successfully`
    );

    // 3. החזרת תשובת הצלחה
    return corsJson(req, {
      success: true,
      message: "החשבון נמחק בהצלחה.",
    });
  } catch (error: unknown) {
    console.error("[mobile/delete-account] ❌ Error:", error);

    // טיפול במקרה שהמשתמש כבר לא קיים
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return corsError(req, "המשתמש המבוקש למחיקה לא נמצא.", 404);
    }

    const errorMessage =
      error instanceof Error
        ? error.message
        : "אירעה שגיאה בלתי צפויה במחיקת החשבון.";

    return corsError(req, errorMessage, 500);
  }
}