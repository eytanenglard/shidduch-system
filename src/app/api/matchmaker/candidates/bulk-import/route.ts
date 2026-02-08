// =============================================================================
// File: src/app/api/matchmaker/candidates/bulk-import/route.ts
// Description: API route for bulk importing candidates
//   - Flow A: POST multipart with images → AI extracts → returns for review
//   - Flow B: POST multipart with chat .txt + optional images → parse + AI → review
//   - Confirm: POST JSON with reviewed candidates → create in DB
// =============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { UserRole, UserStatus, UserSource, Gender, Prisma } from '@prisma/client';
import { createId } from '@paralleldrive/cuid2';
import { v2 as cloudinary } from 'cloudinary';
import { updateUserAiProfile } from '@/lib/services/profileAiService';
import {
  extractCandidatesFromImages,
  extractCandidatesFromChat,
  extractCandidatesFromChatImages,
  parseWhatsAppExport,
  groupIntoCandidateBlocks,
  buildManualEntryText,
  type ExtractedCandidate,
} from '@/lib/services/bulkImportService';

export const dynamic = 'force-dynamic';
// Allow longer execution for AI processing
export const maxDuration = 120; // 2 minutes

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------------------------------------------------------
// Helper: Upload buffer to Cloudinary
// ---------------------------------------------------------------------------
async function uploadBufferToCloudinary(
  buffer: Buffer,
  userId: string
): Promise<{ url: string; publicId: string }> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `shidduch-system/candidates/${userId}`,
        resource_type: 'image',
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
          { quality: 'auto' },
          { fetch_format: 'auto' },
        ],
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    uploadStream.end(buffer);
  });
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  try {
    // Auth
    const session = await getServerSession(authOptions);
    if (
      !session?.user?.id ||
      (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)
    ) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    const matchmakerId = session.user.id;
    const contentType = req.headers.get('content-type') || '';

    // =====================================================================
    // ANALYZE MODE (multipart/form-data)
    // =====================================================================
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const mode = (formData.get('mode') as string) || 'images'; // 'images' | 'chat'
      const limitStr = formData.get('limit') as string | null;
      const limit = limitStr ? parseInt(limitStr, 10) : null; // null = no limit

      // =================================================================
      // FLOW A: Images only
      // =================================================================
      if (mode === 'images') {
        const imageFiles = formData.getAll('images') as File[];
        if (!imageFiles?.length) {
          return NextResponse.json({ success: false, error: 'No images' }, { status: 400 });
        }
        if (imageFiles.length > 30) {
          return NextResponse.json({ success: false, error: 'Max 30 images per batch' }, { status: 400 });
        }

        console.log(`[BulkImport] Flow A: ${imageFiles.length} images from ${matchmakerId}`);

        const imageBuffers = await Promise.all(
          imageFiles.map(async (file, index) => ({
            buffer: Buffer.from(await file.arrayBuffer()),
            mimeType: file.type || 'image/jpeg',
            originalName: file.name,
            index,
          }))
        );

        const result = await extractCandidatesFromImages(imageBuffers);

        // Apply limit if set (test mode)
        if (limit && limit > 0) {
          result.candidates = result.candidates.slice(0, limit);
          console.log(`[BulkImport] Limit applied: showing ${result.candidates.length} candidates (limit=${limit})`);
        }

        return NextResponse.json({ success: true, mode: 'analyze', flow: 'A', data: result });
      }

      // =================================================================
      // FLOW B: WhatsApp chat export
      // =================================================================
      if (mode === 'chat') {
        const chatFile = formData.get('chatFile') as File | null;
        const imageFiles = formData.getAll('images') as File[];

        if (!chatFile && imageFiles.length === 0) {
          return NextResponse.json(
            { success: false, error: 'Provide a chat file (.txt) and/or images' },
            { status: 400 }
          );
        }

        console.log(
          `[BulkImport] Flow B: chat=${!!chatFile}, images=${imageFiles.length}, from ${matchmakerId}`
        );

        // --- B.1: Parse chat text if provided ---
        let chatCandidatesResult: any = null;
        if (chatFile) {
          const chatText = await chatFile.text();
          const messages = parseWhatsAppExport(chatText);
          console.log(`[BulkImport] Parsed ${messages.length} WhatsApp messages`);

          if (messages.length === 0) {
            return NextResponse.json(
              { success: false, error: 'Could not parse WhatsApp chat. Make sure it is a valid export.' },
              { status: 400 }
            );
          }

          const blocks = groupIntoCandidateBlocks(messages);
          console.log(`[BulkImport] Grouped into ${blocks.length} candidate blocks`);

          // Build image map from uploaded images (keyed by filename)
          const imagesByName = new Map<string, { buffer: Buffer; mimeType: string }>();
          for (const file of imageFiles) {
            imagesByName.set(file.name, {
              buffer: Buffer.from(await file.arrayBuffer()),
              mimeType: file.type || 'image/jpeg',
            });
          }

          chatCandidatesResult = await extractCandidatesFromChat(blocks, imagesByName);
        }

        // --- B.2: Process images that have text inside them ---
        let imageCandidatesResult: any = null;
        if (imageFiles.length > 0 && !chatFile) {
          // If no chat file, treat images as forms (like Flow A but through Flow B UI)
          const imageBuffers = await Promise.all(
            imageFiles.map(async (file) => ({
              buffer: Buffer.from(await file.arrayBuffer()),
              mimeType: file.type || 'image/jpeg',
              originalName: file.name,
            }))
          );
          imageCandidatesResult = await extractCandidatesFromChatImages(imageBuffers);
        }

        // --- B.3: Merge results ---
        const allCandidates = [
          ...(chatCandidatesResult?.candidates || []),
          ...(imageCandidatesResult?.candidates || []),
        ];
        const allWarnings = [
          ...(chatCandidatesResult?.warnings || []),
          ...(imageCandidatesResult?.warnings || []),
        ];

        // Deduplicate by name similarity
        let deduped = deduplicateCandidates(allCandidates);

        // Apply limit if set (test mode)
        if (limit && limit > 0) {
          deduped = deduped.slice(0, limit);
          console.log(`[BulkImport] Limit applied: showing ${deduped.length} candidates (limit=${limit})`);
        }

        return NextResponse.json({
          success: true,
          mode: 'analyze',
          flow: 'B',
          data: {
            candidates: deduped,
            warnings: allWarnings,
            totalProcessed:
              (chatCandidatesResult?.totalProcessed || 0) +
              (imageCandidatesResult?.totalProcessed || 0),
            unmatchedImages: imageCandidatesResult?.unmatchedImages || [],
            unmatchedFileNames: chatCandidatesResult?.unmatchedFileNames || [],
            stats: {
              chatMessages: chatCandidatesResult ? 'parsed' : 'none',
              chatBlocks: chatCandidatesResult?.totalProcessed || 0,
              imagesProcessed: imageCandidatesResult?.totalProcessed || 0,
              candidatesFromChat: chatCandidatesResult?.candidates?.length || 0,
              candidatesFromImages: imageCandidatesResult?.candidates?.length || 0,
              afterDedup: deduped.length,
            },
          },
        });
      }

      return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });
    }

    // =====================================================================
    // CONFIRM MODE (application/json) — shared by both flows
    // =====================================================================
    if (contentType.includes('application/json')) {
      const body = await req.json();
      const { candidates, imageDataMap } = body as {
        candidates: ExtractedCandidate[];
        imageDataMap?: Record<string, string>; // tempId → base64 image
      };

      if (!candidates?.length) {
        return NextResponse.json({ success: false, error: 'No candidates' }, { status: 400 });
      }

      console.log(`[BulkImport] Confirm: creating ${candidates.length} candidates...`);

      const results: { tempId: string; userId: string; success: boolean; error?: string }[] = [];

      for (const candidate of candidates) {
        try {
          const email = `manual_${createId()}@shidduch.placeholder.com`;

          // Birth date
          let birthDate: Date;
          if (candidate.birthDate) {
            birthDate = new Date(candidate.birthDate);
          } else if (candidate.age) {
            birthDate = new Date(new Date().getFullYear() - candidate.age, 0, 1);
          } else {
            birthDate = new Date(new Date().getFullYear() - 30, 0, 1);
          }

          const manualEntryText = buildManualEntryText(candidate);

          const profileData: Prisma.ProfileCreateWithoutUserInput = {
            gender: candidate.gender as Gender,
            birthDate,
            birthDateIsApproximate: candidate.birthDateIsApproximate,
            manualEntryText,
            availabilityStatus: 'AVAILABLE',
            isProfileVisible: true,
            height: candidate.height,
            maritalStatus: candidate.maritalStatus,
            religiousLevel: candidate.religiousLevel,
            origin: candidate.origin,
            city: candidate.city,
            occupation: candidate.occupation,
            education: candidate.education,
            educationLevel: candidate.educationLevel,
            nativeLanguage: candidate.languages?.[0] || null,
            additionalLanguages: candidate.languages?.slice(1) || [],
            serviceDetails: candidate.militaryService,
            about: candidate.personality,
            matchingNotes: candidate.lookingFor,
            contentUpdatedAt: new Date(),
          };

          if (candidate.referredBy) profileData.referredBy = candidate.referredBy;
          if (candidate.contactPhone) {
            profileData.internalMatchmakerNotes = `טלפון ליצירת קשר: ${candidate.contactPhone}`;
          }

          // Create user + profile
          const newUser = await prisma.user.create({
            data: {
              firstName: candidate.firstName || 'לא ידוע',
              lastName: candidate.lastName || '',
              email,
              password: null,
              role: UserRole.CANDIDATE,
              status: UserStatus.PENDING_EMAIL_VERIFICATION,
              isVerified: false,
              isProfileComplete: false,
              source: UserSource.MANUAL_ENTRY,
              addedByMatchmakerId: matchmakerId,
              profile: { create: profileData },
            },
            include: { profile: true },
          });

          // Upload photo
          const imgBase64 = imageDataMap?.[candidate.tempId];
          if (imgBase64) {
            try {
              const buf = Buffer.from(imgBase64, 'base64');
              const { url, publicId } = await uploadBufferToCloudinary(buf, newUser.id);
              await prisma.userImage.create({
                data: { userId: newUser.id, url, cloudinaryPublicId: publicId, isMain: true },
              });
            } catch (imgErr) {
              console.error(`[BulkImport] Image upload failed for ${candidate.firstName}:`, imgErr);
            }
          }

          // AI profile (fire & forget)
          updateUserAiProfile(newUser.id).catch((e) =>
            console.error(`[BulkImport] AI profile err ${newUser.id}:`, e)
          );

          results.push({ tempId: candidate.tempId, userId: newUser.id, success: true });
          console.log(`[BulkImport] ✅ ${candidate.firstName} ${candidate.lastName} → ${newUser.id}`);
        } catch (err) {
          console.error(`[BulkImport] ❌ ${candidate.firstName}:`, err);
          results.push({ tempId: candidate.tempId, userId: '', success: false, error: (err as Error).message });
        }
      }

      const created = results.filter((r) => r.success).length;
      return NextResponse.json({
        success: true,
        mode: 'confirm',
        results,
        summary: { total: candidates.length, created, failed: candidates.length - created },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid content type' }, { status: 400 });
  } catch (error) {
    console.error('[BulkImport] Error:', error);
    return NextResponse.json(
      { success: false, error: (error as Error).message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// Dedup helper: merge candidates with same/similar name
// ---------------------------------------------------------------------------
function deduplicateCandidates(candidates: ExtractedCandidate[]): ExtractedCandidate[] {
  const seen = new Map<string, ExtractedCandidate>();

  for (const c of candidates) {
    const key = `${c.firstName}_${c.lastName}`.trim().toLowerCase();
    if (!key || key === '_') {
      seen.set(`unknown_${Math.random()}`, c);
      continue;
    }

    const existing = seen.get(key);
    if (existing) {
      // Merge: keep richer data
      if (!existing.age && c.age) existing.age = c.age;
      if (!existing.height && c.height) existing.height = c.height;
      if (!existing.city && c.city) existing.city = c.city;
      if (!existing.occupation && c.occupation) existing.occupation = c.occupation;
      if (!existing.religiousLevel && c.religiousLevel) existing.religiousLevel = c.religiousLevel;
      if (!existing.maritalStatus && c.maritalStatus) existing.maritalStatus = c.maritalStatus;
      if (!existing.origin && c.origin) existing.origin = c.origin;
      if (!existing.contactPhone && c.contactPhone) existing.contactPhone = c.contactPhone;
      if (!existing.personality && c.personality) existing.personality = c.personality;
      if (!existing.lookingFor && c.lookingFor) existing.lookingFor = c.lookingFor;
      if (c.photoFileNames?.length) existing.photoFileNames.push(...c.photoFileNames);
      if (c.photoImageIndices?.length) existing.photoImageIndices.push(...c.photoImageIndices);
      if (c.rawFormText && c.rawFormText.length > existing.rawFormText.length) {
        existing.rawFormText = c.rawFormText;
      }
      existing.notes = [existing.notes, c.notes, '(merged duplicate)'].filter(Boolean).join(' | ');
    } else {
      seen.set(key, { ...c });
    }
  }

  return Array.from(seen.values());
}