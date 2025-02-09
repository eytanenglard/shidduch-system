import { getServerSession } from 'next-auth/next';
import { NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { CustomSession } from '@/types/next-auth';
import { Prisma } from '@prisma/client';

// Types
interface PrioritiesObject {
  [key: string]: number;
}

interface PreferencesData {
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
  origins?: string[];
}

export async function PUT(req: Request) {
  try {
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

    const data = await req.json() as PreferencesData;

    // Validate age range
    if (data.ageRange.min < 18 || data.ageRange.max > 80 || data.ageRange.min > data.ageRange.max) {
      return new NextResponse(
        JSON.stringify({ error: 'טווח גילאים לא תקין' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Validate height range
    if (data.heightRange.min < 140 || data.heightRange.max > 200 || data.heightRange.min > data.heightRange.max) {
      return new NextResponse(
        JSON.stringify({ error: 'טווח גבהים לא תקין' }),
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Create or update match preferences
    const updatedPreferences = await prisma.matchPreferences.upsert({
      where: {
        userId: session.user.id,
      },
      create: {
        userId: session.user.id,
        ageRange: [data.ageRange.min, data.ageRange.max],
        heightRange: [data.heightRange.min, data.heightRange.max],
        religiousLevel: data.religiousLevels,
        location: data.locations,
        maritalStatus: data.maritalStatuses,
        priorities: data.preferences.reduce((acc: PrioritiesObject, pref) => {
          acc[pref.criteria] = pref.importance;
          return acc;
        }, {}),
        dealBreakers: data.preferences
          .filter(pref => pref.isRequired)
          .map(pref => pref.criteria),
        origin: data.origins || [],
        updatedAt: new Date()
      },
      update: {
        ageRange: [data.ageRange.min, data.ageRange.max],
        heightRange: [data.heightRange.min, data.heightRange.max],
        religiousLevel: data.religiousLevels,
        location: data.locations,
        maritalStatus: data.maritalStatuses,
        priorities: data.preferences.reduce((acc: PrioritiesObject, pref) => {
          acc[pref.criteria] = pref.importance;
          return acc;
        }, {}),
        dealBreakers: data.preferences
          .filter(pref => pref.isRequired)
          .map(pref => pref.criteria),
        origin: data.origins || [],
        updatedAt: new Date()
      },
    });

    return new NextResponse(
      JSON.stringify({ 
        message: 'העדפות נשמרו בהצלחה',
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
      JSON.stringify({ error: 'שגיאה בשמירת ההעדפות' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function GET(req: Request) {
  try {
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

    // Type assertion for priorities
    const priorities = preferences.priorities as PrioritiesObject;

    // Transform the data back to the format expected by the frontend
    const formattedPreferences = {
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
        importance,
        isRequired: preferences.dealBreakers.includes(criteria),
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