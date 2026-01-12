import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { updateUserAiProfile } from '@/lib/services/profileAiService';

export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

async function runVectorUpdateProcess(usersToUpdate: { id: string, email: string }[]) {
  console.log(`🚀 [Vector Update] Starting process for ${usersToUpdate.length} users...`);
  
  let successCount = 0;
  let failCount = 0;

  for (const user of usersToUpdate) {
    try {
      console.log(`Processing User: ${user.email} (${user.id})...`);
      
      // יצירת הנרטיב, שליחה ל-AI ושמירת הווקטור
      await updateUserAiProfile(user.id);

      console.log(`✅ [Vector Update] Updated vector for: ${user.email}`);
      successCount++;

      // השהייה למניעת חסימה
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`❌ [Vector Update] Error for: ${user.email}`, error);
      failCount++;
    }
  }

  console.log(`\n🏁 [Vector Update] DONE. Success: ${successCount}, Failed: ${failCount}`);
}

// הלוגיקה המרכזית (משותפת ל-POST ול-GET)
async function handler(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // בדיקת אדמין
    if (!session?.user?.id || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 403 });
    }

    console.log(`[Vector Update API] Fetching active candidates...`);

    const users = await prisma.user.findMany({
      where: {
        role: 'CANDIDATE',
        status: 'ACTIVE', 
        isProfileComplete: true,
        profile: {
          isNot: null
        }
      },
      select: {
        id: true,
        email: true
      }
    });

    if (users.length === 0) {
      return NextResponse.json({ success: true, message: "No active users found to update." });
    }

    // הרצה ברקע (ללא await) כדי שהדפדפן לא יתקע ב-Timeout
    runVectorUpdateProcess(users).catch(err => {
      console.error(`[Vector Update API] Background error:`, err);
    });

    return NextResponse.json({ 
      success: true, 
      message: `תהליך העדכון התחיל עבור ${users.length} משתמשים. בדוק את ה-Terminal לראות את ההתקדמות.` 
    });

  } catch (error) {
    console.error('[Vector Update API] Error:', error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// ייצוא גם ל-POST וגם ל-GET
export async function POST(req: NextRequest) {
  return handler(req);
}

export async function GET(req: NextRequest) {
  return handler(req);
}