// src/app/api/preferences/route.ts
import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { CustomSession } from '@/types/next-auth';

// טיפוסים
interface PrioritiesObject {
  [key: string]: number;
}

interface FormattedPreferences {
  ageRange: {
    min: number;
    max: number;
  };
  heightRange: {
    min: number;
    max: number;
  };
  religiousLevels: string[];
  locations: string[];
  maritalStatuses: string[];
  preferences: Array<{
    criteria: string;
    importance: number;
    isRequired: boolean;
  }>;
  dealBreakers: string[];
  origins: string[];
}

interface PreferencesData extends Omit<Prisma.MatchPreferencesCreateInput, 'user'> {
  ageRange: number[];
  heightRange: number[];
  religiousLevel: string[];
  location: string[];
  origin: string[];
  maritalStatus: string[];
  priorities: PrioritiesObject;
  dealBreakers: string[];
}

export async function GET(req: Request) {
  try {
    // בדיקת הרשאות
    const session = await getServerSession(authOptions) as CustomSession | null;
    
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // שליפת ההעדפות מה-database
    const preferences = await prisma.matchPreferences.findUnique({
      where: {
        userId: session.user.id,
      },
    });

    if (!preferences) {
      return new NextResponse(
        JSON.stringify({ 
          message: 'No preferences found',
          preferences: null 
        }),
        { 
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // המרת ה-priorities ל-object תקין
    const priorities = preferences.priorities as PrioritiesObject;
    const dealBreakers = Array.isArray(preferences.dealBreakers) 
      ? preferences.dealBreakers 
      : [];

    // המרת הנתונים לפורמט המתאים לממשק המשתמש
    const formattedPreferences: FormattedPreferences = {
      ageRange: {
        min: preferences.ageRange[0],
        max: preferences.ageRange[1],
      },
      heightRange: {
        min: preferences.heightRange[0],
        max: preferences.heightRange[1],
      },
      religiousLevels: preferences.religiousLevel,
      locations: preferences.location,
      maritalStatuses: preferences.maritalStatus,
      preferences: Object.entries(priorities).map(([criteria, importance]) => ({
        criteria,
        importance: Number(importance),
        isRequired: dealBreakers.includes(criteria),
      })),
      dealBreakers: preferences.dealBreakers,
      origins: preferences.origin,
    };

    return new NextResponse(
      JSON.stringify(formattedPreferences),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error fetching preferences:', error);
    return new NextResponse(
      JSON.stringify({ error: 'שגיאה בטעינת ההעדפות' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function PUT(req: Request) {
  try {
    // בדיקת הרשאות
    const session = await getServerSession(authOptions) as CustomSession | null;
    
    if (!session?.user?.id) {
      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const data = await req.json();

    // וולידציה של הנתונים
    if (!data.ageRange || !data.heightRange) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // בדיקת תקינות טווחי גיל וגובה
    if (
      data.ageRange.min < 18 || 
      data.ageRange.max > 120 || 
      data.ageRange.min > data.ageRange.max
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid age range' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    if (
      data.heightRange.min < 140 || 
      data.heightRange.max > 220 || 
      data.heightRange.min > data.heightRange.max
    ) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid height range' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // המרת הנתונים לפורמט המתאים ל-database
    const preferencesData: PreferencesData = {
      ageRange: [data.ageRange.min, data.ageRange.max],
      heightRange: [data.heightRange.min, data.heightRange.max],
      religiousLevel: data.religiousLevels || [],
      location: data.locations || [],
      origin: data.origins || [],
      maritalStatus: data.maritalStatuses || [],
      priorities: data.preferences.reduce((acc: PrioritiesObject, pref: any) => {
        acc[pref.criteria] = pref.importance;
        return acc;
      }, {}),
      dealBreakers: data.preferences
        .filter((pref: any) => pref.isRequired)
        .map((pref: any) => pref.criteria)
    };

    // עדכון או יצירת העדפות
    const updatedPreferences = await prisma.matchPreferences.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        ...preferencesData,
        user: {
          connect: {
            id: session.user.id
          }
        }
      },
      update: preferencesData,
    });

    return new NextResponse(
      JSON.stringify({
        message: 'Preferences updated successfully',
        preferences: updatedPreferences
      }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('Error updating preferences:', error);
    return new NextResponse(
      JSON.stringify({ error: 'שגיאה בעדכון ההעדפות' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}