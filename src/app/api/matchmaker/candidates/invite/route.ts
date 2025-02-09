// src/app/api/matchmaker/candidates/invite/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Gender, InvitationStatus, UserStatus } from "@prisma/client";
import { emailService } from '@/lib/email/emailService';
import type { CustomSession } from "@/types/next-auth";
import crypto from 'crypto';

interface CreateCandidateData {
  firstName: string;
  lastName: string;
  email: string;
  gender: Gender;
  birthDate: string;
  personalInfo?: {
    height?: number;
    maritalStatus?: string;
    occupation?: string;
    education?: string;
    religiousLevel?: string;
    city?: string;
  };
  matchingNotes?: string;
}

export async function POST(req: Request) {
  try {
    // Session validation
    const session = await getServerSession(authOptions) as CustomSession | null;

    if (!session?.user?.id || session.user.role !== 'MATCHMAKER') {
      console.log('Unauthorized attempt:', { session });
      return NextResponse.json({ error: "Unauthorized - Matchmaker access only" }, { status: 401 });
    }

    // Parse and validate request data
    const data: CreateCandidateData = await req.json();
    console.log('Received data:', { ...data, password: '[REDACTED]' });

    // Validate required fields
    if (!data.firstName || !data.lastName || !data.gender || !data.birthDate) {
      console.log('Missing required fields:', { data });
      return NextResponse.json({ 
        error: "Missing required fields", 
        details: {
          firstName: !data.firstName,
          lastName: !data.lastName,
          gender: !data.gender,
          birthDate: !data.birthDate
        }
      }, { status: 400 });
    }

    // Email validation if provided
    if (data.email && !data.email.includes('@')) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    // Check for existing user with same email
    if (data.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email }
      });

      if (existingUser) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }
    }

    // Generate temporary email if not provided
    const userEmail = data.email || `pending_${crypto.randomUUID()}@pending.com`;

    // Generate invitation token
    const invitationToken = crypto.randomUUID();

    // Create metadata object
    const metadataObject = {
      firstName: data.firstName,
      lastName: data.lastName,
      gender: data.gender,
      birthDate: data.birthDate,
      personalInfo: data.personalInfo || {},
      matchingNotes: data.matchingNotes
    };

    // Start transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          email: userEmail,
          password: crypto.randomBytes(32).toString('hex'), // temporary password
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          birthDate: new Date(data.birthDate),
          status: UserStatus.PENDING,
          isVerified: false
        }
      });

      // Create profile
      await tx.profile.create({
        data: {
          userId: user.id,
          height: data.personalInfo?.height || null,
          maritalStatus: data.personalInfo?.maritalStatus || null,
          occupation: data.personalInfo?.occupation || null,
          education: data.personalInfo?.education || null,
          religiousLevel: data.personalInfo?.religiousLevel || null,
          city: data.personalInfo?.city || null,
          isProfileVisible: true,
          allowDirectMessages: true
        }
      });

      // Create invitation
      const invitation = await tx.invitation.create({
        data: {
          matchmakerId: session.user.id,
          email: data.email || '',
          token: invitationToken,
          status: InvitationStatus.PENDING,
          expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          metadata: metadataObject,
          userId: user.id // Link to the created user
        }
      });

      return { user, invitation };
    });

    // Send invitation email if email provided
    if (data.email) {
      try {
        await emailService.sendInvitation({
          email: data.email,
          invitationLink: invitationToken, // שולחים רק את הטוקן
          matchmakerName: `${session.user.firstName} ${session.user.lastName}`,
          expiresIn: '7 ימים'
        });
      } catch (emailError) {
        console.error('Failed to send invitation email:', emailError);
        // Continue with success response even if email fails
        return NextResponse.json({
          success: true,
          warning: "User created but failed to send invitation email",
          data: {
            user: {
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName
            },
            invitation: {
              id: result.invitation.id,
              token: result.invitation.token,
              email: result.invitation.email,
              expires: result.invitation.expires
            }
          }
        }, { status: 201 });
      }
    }


    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName
        },
        invitation: {
          id: result.invitation.id,
          token: result.invitation.token,
          email: result.invitation.email,
          expires: result.invitation.expires
        }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({
      error: "Failed to create invitation",
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}