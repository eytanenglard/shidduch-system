import { NextResponse } from 'next/server';
import { PrismaClient, Gender } from '@prisma/client';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { Session } from 'next-auth';

// מרחיב את הממשק של Session להכיל את השדות החדשים
interface ExtendedSession extends Session {
  redirectUrl?: string;
  newlyCreated?: boolean;
}

const prisma = new PrismaClient();

interface ProfileData {
  email?: string;
  phone: string;
  gender: Gender;
  birthDate: string;
  maritalStatus?: string;
  height?: number;
  occupation?: string;
  education?: string;
  userId?: string;
}

export async function POST(req: Request) {
  try {
    // קבלת סשן עם הגדרות האימות הנכונות
    const session = await getServerSession(authOptions) as ExtendedSession | null;
    console.log("Session in API:", session ? JSON.stringify({
      user: session.user ? {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name
      } : null,
      redirectUrl: session.redirectUrl,
      newlyCreated: session.newlyCreated
    }, null, 2) : "No session");
    
    // בדיקת קוקיז
    const cookieStore = cookies();
    const sessionToken = cookieStore.get('next-auth.session-token')?.value 
      || cookieStore.get('__Secure-next-auth.session-token')?.value;
    
    console.log("Session token from cookies:", sessionToken ? "Found" : "Not found");
    
    // קבלת הנתונים מהבקשה
    const body: ProfileData = await req.json();
    console.log("Complete profile data:", body);
    
    // מציאת המשתמש
    let user;
    
    // ניסיון 1: לפי ID בסשן
    if (session?.user?.id) {
      console.log("Looking for user by ID from session:", session.user.id);
      user = await prisma.user.findUnique({
        where: { id: session.user.id }
      });
      console.log("User found by session ID:", user ? user.id : "Not found");
    }
    
    // ניסיון 2: לפי אימייל בסשן
    if (!user && session?.user?.email) {
      console.log("Looking for user by email from session:", session.user.email);
      user = await prisma.user.findUnique({
        where: { email: session.user.email }
      });
      console.log("User found by session email:", user ? user.id : "Not found");
    }
    
    // ניסיון 3: לפי ID שנשלח מהטופס
    if (!user && body.userId) {
      console.log("Looking for user by ID from form:", body.userId);
      user = await prisma.user.findUnique({
        where: { id: body.userId }
      });
      console.log("User found by form ID:", user ? user.id : "Not found");
    }
    
    // ניסיון 4: לפי אימייל שנשלח מהטופס
    if (!user && body.email) {
      console.log("Looking for user by email from form:", body.email);
      user = await prisma.user.findUnique({
        where: { email: body.email }
      });
      console.log("User found by form email:", user ? user.id : "Not found");
    }
    
    // במצב פיתוח בלבד - ניסיון למצוא משתמש גוגל אחרון
    if (!user && process.env.NODE_ENV === 'development') {
      console.log("Development mode: Looking for most recent Google user");
      const recentGoogleUsers = await prisma.user.findMany({
        where: {
          password: "",  // משתמשי גוגל בדרך כלל אין להם סיסמה
          role: "CANDIDATE"
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      });
      
      if (recentGoogleUsers.length > 0) {
        user = recentGoogleUsers[0];
        console.log("Found most recent Google user:", user.id);
      }
    }
    
    if (!user) {
      console.error("Cannot find user to update");
      return NextResponse.json(
        { error: 'לא נמצא משתמש להשלמת הרשמה. נא להתחבר מחדש או למלא את האימייל שלך.' },
        { status: 404 }
      );
    }
    
    // וידוא תאריך לידה
    const birthDateObj = new Date(body.birthDate);
    const age = Math.floor((new Date().getTime() - birthDateObj.getTime()) / 31557600000);
    if (age < 18) {
      return NextResponse.json(
        { error: 'גיל מינימלי להרשמה הוא 18' },
        { status: 400 }
      );
    }
    
    // בדיקת מספר טלפון
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(body.phone)) {
      return NextResponse.json(
        { error: 'מספר טלפון לא תקין' },
        { status: 400 }
      );
    }
    
    // בדיקת כפילות טלפון
    const existingPhone = await prisma.user.findUnique({
      where: { phone: body.phone }
    });
    
    if (existingPhone && existingPhone.id !== user.id) {
      return NextResponse.json(
        { error: 'מספר הטלפון כבר רשום במערכת' },
        { status: 409 }
      );
    }
    
    console.log("Updating user profile:", {
      userId: user.id,
      gender: body.gender,
      birthDate: birthDateObj.toISOString()
    });
    
    // עדכון פרטי המשתמש - כולל סימון שהפרופיל הושלם
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        phone: body.phone,
        isProfileComplete: true, // כאן מעדכנים את השדה שמסמן שהפרופיל הושלם
        profile: {
          upsert: {
            create: {
              gender: body.gender,
              birthDate: birthDateObj,
              maritalStatus: body.maritalStatus || null,
              height: body.height || null,
              occupation: body.occupation || null,
              education: body.education || null,
              isProfileVisible: true
            },
            update: {
              gender: body.gender,
              birthDate: birthDateObj,
              maritalStatus: body.maritalStatus || null,
              height: body.height || null,
              occupation: body.occupation || null,
              education: body.education || null
            }
          }
        }
      },
      include: {
        profile: true
      }
    });
    
    console.log("User profile updated successfully", {
      userId: user.id,
      isProfileComplete: updatedUser.isProfileComplete // לוג האם השדה עודכן
    });
    
    // שמירת מזהה המשתמש בעוגיה להמשך התהליך (במקרה שאין סשן)
    const headers = new Headers();
    headers.append('Set-Cookie', `user_id=${user.id}; Path=/; HttpOnly; Max-Age=3600`);
    
    return NextResponse.json(
      {
        success: true,
        message: 'פרטי המשתמש נשמרו בהצלחה',
        user: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          phone: updatedUser.phone,
          isProfileComplete: updatedUser.isProfileComplete, // החזרת השדה בתשובה
          profile: updatedUser.profile
        }
      },
      { 
        status: 200,
        headers: headers
      }
    );
    
  } catch (error) {
    console.error('Error in complete-profile:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: 'אירעה שגיאה בהשלמת הפרופיל',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}