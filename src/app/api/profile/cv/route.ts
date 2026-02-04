// src/app/api/profile/cv/route.ts

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v2 as cloudinary } from 'cloudinary';
import aiService from '@/lib/services/aiService';
import profileAiService from '@/lib/services/profileAiService';
import mammoth from 'mammoth';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// --- POST Handler for uploading a CV ---
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }
  const userId = session.user.id;
  const userLocale = session.user.language || 'he';

  try {
    const formData = await req.formData();
    const file = formData.get('cv') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 1. Upload file to Cloudinary
    const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                resource_type: 'raw',
                folder: `users/${userId}/cvs`,
                public_id: file.name, 
                overwrite: true, 
            },
            (error, result) => {
                if (error) reject(error);
                resolve(result);
            }
        );
        uploadStream.end(buffer);
    });
    
    if (!uploadResult?.secure_url) {
        throw new Error('Cloudinary upload failed');
    }

    // --- AI DEEP ANALYSIS ---
    let cvSummaryMarkdown: string | null = null;
    try {
        console.log(`[CV Route] Extracting text from CV for user ${userId}. File type: ${file.type}`);
        
        let extractedCvText: string | null = null;

        // Check if file is Word (.docx) - PDF temporarily disabled
        if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
            console.log("[CV Route] Parsing DOCX file.");
            const { value } = await mammoth.extractRawText({ buffer });
            extractedCvText = value;
        } else if (file.type === 'application/pdf') {
            console.log("[CV Route] PDF parsing temporarily disabled. Please upload DOCX for AI analysis.");
            // TODO: Implement PDF parsing with alternative library
        } else {
            console.warn(`[CV Route] Unsupported file type for text extraction: ${file.type}`);
        }

        if (extractedCvText && extractedCvText.trim().length > 50) {
            console.log(`[CV Route] Sending CV text to AI for deep analysis in locale: ${userLocale}.`);
            const analysisResult = await aiService.analyzeCvInDepth(extractedCvText, userLocale);
            
            if (analysisResult) {
                const parts = [
                    `### סיכום מנהלים\n${analysisResult.executiveSummary}`,
                    `### תובנות אישיותיות\n- ${analysisResult.personalityInsights.join('\n- ')}`,
                    `### תובנות ערכיות\n- ${analysisResult.valuesInsights.join('\n- ')}`,
                    `### מסלול קריירה\n**נרטיב:** ${analysisResult.careerTrajectory.narrative}\n\n**אבני דרך:**\n` +
                    analysisResult.careerTrajectory.milestones.map(m => `  - **${m.title} (${m.period}):** ${m.keyLearnings}`).join('\n'),
                ];
                if (analysisResult.redFlags.length > 0) {
                    parts.push(`### נקודות לבירור (שדכן)\n- ${analysisResult.redFlags.join('\n- ')}`);
                }
                cvSummaryMarkdown = parts.join('\n\n');
                console.log(`[CV Route] AI deep analysis generated successfully for user ${userId}.`);
            }
        }
    } catch (aiError) {
        console.error(`[CV Route] AI processing failed for user ${userId}:`, aiError);
    }

    // 3. Update database
    const updatedProfile = await prisma.profile.update({
      where: { userId },
      data: {
        cvUrl: uploadResult.secure_url,
        cvSummary: cvSummaryMarkdown,
        needsAiProfileUpdate: true,
                contentUpdatedAt: new Date(),

      },
    });

    // 4. Trigger background update
    profileAiService.updateUserAiProfile(userId).catch(err => {
        console.error(`[CV Route] Background AI profile vector update failed for user ${userId}:`, err);
    });

    return NextResponse.json({ success: true, profile: updatedProfile });

  } catch (error) {
    console.error('CV Upload API Error:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}

// --- DELETE Handler for deleting a CV ---
export async function DELETE(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }
    const userId = session.user.id;
  
    try {
        const profile = await prisma.profile.findUnique({
            where: { userId },
            select: { cvUrl: true },
        });

        if (profile?.cvUrl) {
            try {
                const urlParts = profile.cvUrl.split('/');
                const fileNameWithExt = urlParts[urlParts.length - 1];
                if (fileNameWithExt) {
                    const publicId = `users/${userId}/cvs/${decodeURIComponent(fileNameWithExt)}`;
                    console.log(`[CV Delete] Attempting to delete from Cloudinary with public_id: ${publicId}`);
                    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
                }
            } catch(e) {
                console.error(`[CV Delete] Could not parse public_id from URL: ${profile.cvUrl}`, e);
            }
        }

        const updatedProfile = await prisma.profile.update({
            where: { userId },
            data: {
                cvUrl: null,
                cvSummary: null,
                needsAiProfileUpdate: true,
                                contentUpdatedAt: new Date(),

            },
        });

        profileAiService.updateUserAiProfile(userId).catch(err => {
            console.error(`[CV Delete] Background AI profile vector update failed for user ${userId}:`, err);
        });

        return NextResponse.json({ success: true, profile: updatedProfile });
    } catch (error) {
        console.error('CV Delete API Error:', error);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}