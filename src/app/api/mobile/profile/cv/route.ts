// src/app/api/mobile/profile/cv/route.ts
// ==========================================
// NeshamaTech Mobile - CV Upload/Delete API
// POST: Upload CV (multipart/form-data)
// DELETE: Remove CV from profile
// ==========================================

import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import {
  verifyMobileToken,
  corsJson,
  corsError,
  corsOptions,
} from "@/lib/mobile-auth";

// Configure Cloudinary (uses env vars: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function OPTIONS(req: NextRequest) {
  return corsOptions(req);
}

// ==========================================
// POST /api/mobile/profile/cv
// Upload CV file (PDF, DOC, DOCX — max 5MB)
// ==========================================
export async function POST(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, "Unauthorized", 401);

    const userId = auth.userId;
    const formData = await req.formData();
    const file = formData.get("cv") as File | null;

    if (!file) {
      return corsError(req, "No file provided", 400);
    }

    // Validate type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];
    if (!validTypes.includes(file.type)) {
      return corsError(req, "Invalid file type. Please upload PDF or Word document.", 400);
    }

    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return corsError(req, "File too large. Maximum size is 5MB.", 400);
    }

    // Convert to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: "cv-documents",
          resource_type: "raw",
          public_id: `cv-${userId}-${Date.now()}`,
          format: file.name.split(".").pop() || "pdf",
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      stream.end(buffer);
    });

    if (!uploadResult?.secure_url) {
      return corsError(req, "Upload failed", 500);
    }

    // Delete old CV from Cloudinary if exists
    const existing = await prisma.profile.findUnique({
      where: { userId },
      select: { cvUrl: true },
    });

    if (existing?.cvUrl) {
      try {
        const match = existing.cvUrl.match(/\/cv-documents\/(.+?)(?:\.\w+)?$/);
        if (match) {
          await cloudinary.uploader.destroy(`cv-documents/${match[1]}`, {
            resource_type: "raw",
          });
        }
      } catch (e) {
        console.warn("[mobile/cv] Failed to delete old CV:", e);
      }
    }

    // Update profile
    const updated = await prisma.profile.update({
      where: { userId },
      data: {
        cvUrl: uploadResult.secure_url,
        contentUpdatedAt: new Date(),
        needsAiProfileUpdate: true,
      },
    });

    console.log(`[mobile/cv] CV uploaded for user ${userId}`);

    return corsJson(req, {
      success: true,
      data: { cvUrl: updated.cvUrl },
    });
  } catch (error) {
    console.error("[mobile/cv] POST Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}

// ==========================================
// DELETE /api/mobile/profile/cv
// Remove CV from profile and Cloudinary
// ==========================================
export async function DELETE(req: NextRequest) {
  try {
    const auth = await verifyMobileToken(req);
    if (!auth) return corsError(req, "Unauthorized", 401);

    const userId = auth.userId;

    const profile = await prisma.profile.findUnique({
      where: { userId },
      select: { cvUrl: true },
    });

    if (!profile?.cvUrl) {
      return corsError(req, "No CV to delete", 404);
    }

    // Delete from Cloudinary
    try {
      const match = profile.cvUrl.match(/\/cv-documents\/(.+?)(?:\.\w+)?$/);
      if (match) {
        await cloudinary.uploader.destroy(`cv-documents/${match[1]}`, {
          resource_type: "raw",
        });
      }
    } catch (e) {
      console.warn("[mobile/cv] Cloudinary delete failed:", e);
    }

    // Clear from DB
    await prisma.profile.update({
      where: { userId },
      data: {
        cvUrl: null,
        cvSummary: null,
        contentUpdatedAt: new Date(),
      },
    });

    console.log(`[mobile/cv] CV deleted for user ${userId}`);
    return corsJson(req, { success: true, message: "CV deleted" });
  } catch (error) {
    console.error("[mobile/cv] DELETE Error:", error);
    return corsError(req, "Internal server error", 500);
  }
}