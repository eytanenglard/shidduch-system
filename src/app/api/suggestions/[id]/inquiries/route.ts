// src/app/api/suggestions/[id]/inquiries/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { InquiryStatus, UserRole } from "@prisma/client";
import type { Session } from "next-auth"; // --- START OF FIX: Import the Session type ---

// --- START OF FIX: Define a specific type for the session parameter ---
type AuthSession = Session | null;
// --- END OF FIX ---

// Helper function for authorization check
// --- START OF FIX: Use the specific type for the session parameter ---
async function checkPermissions(suggestionId: string, session: AuthSession) {
// --- END OF FIX ---
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const suggestion = await prisma.matchSuggestion.findUnique({
    where: { id: suggestionId },
    select: { firstPartyId: true, secondPartyId: true, matchmakerId: true },
  });

  if (!suggestion) {
    throw new Error("Suggestion not found");
  }

  const isAuthorized =
    session.user.id === suggestion.firstPartyId ||
    session.user.id === suggestion.secondPartyId ||
    session.user.id === suggestion.matchmakerId ||
    session.user.role === UserRole.ADMIN;

  if (!isAuthorized) {
    throw new Error("Forbidden");
  }

  return { suggestion, userId: session.user.id, userRole: session.user.role as UserRole };
}

/**
 * GET: Fetch all inquiries for a specific suggestion.
 * Users can only see inquiries for suggestions they are a part of.
 */
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    await checkPermissions(params.id, session);

    const inquiries = await prisma.suggestionInquiry.findMany({
      where: { suggestionId: params.id },
      include: {
        fromUser: { select: { id: true, firstName: true, lastName: true } },
        toUser: { select: { id: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json({ success: true, inquiries });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (error.message === "Suggestion not found") return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    console.error("Error fetching inquiries:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST: Create a new inquiry (question) for a suggestion.
 * A user (candidate) sends a question to the matchmaker.
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { suggestion, userId } = await checkPermissions(params.id, session);

    const { question } = await req.json();
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return NextResponse.json({ error: "Question content is required" }, { status: 400 });
    }

    const inquiry = await prisma.suggestionInquiry.create({
      data: {
        suggestionId: params.id,
        fromUserId: userId,
        toUserId: suggestion.matchmakerId, // Questions always go to the matchmaker
        question,
        status: InquiryStatus.PENDING,
      },
    });
    
    // TODO: Add notification to matchmaker about the new question

    return NextResponse.json({ success: true, inquiry });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (error.message === "Suggestion not found") return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    console.error("Error creating inquiry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH: Answer an inquiry.
 * Only the matchmaker (or an admin) can answer an inquiry.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const { userRole, userId } = await checkPermissions(params.id, session); // params.id is suggestionId

    if (userRole !== UserRole.MATCHMAKER && userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden: Only matchmakers or admins can answer inquiries." }, { status: 403 });
    }

    const { inquiryId, answer } = await req.json();
    if (!inquiryId || !answer || typeof answer !== 'string' || answer.trim().length === 0) {
      return NextResponse.json({ error: "Inquiry ID and answer content are required" }, { status: 400 });
    }

    const inquiryToUpdate = await prisma.suggestionInquiry.findUnique({
        where: { id: inquiryId },
    });

    if (!inquiryToUpdate) {
        return NextResponse.json({ error: "Inquiry not found." }, { status: 404 });
    }

    // Security check: Make sure the matchmaker answering is the one the question was sent to.
    if (inquiryToUpdate.toUserId !== userId && userRole !== UserRole.ADMIN) {
        return NextResponse.json({ error: "Forbidden: You are not the recipient of this inquiry." }, { status: 403 });
    }

    const updatedInquiry = await prisma.suggestionInquiry.update({
      where: { id: inquiryId },
      data: {
        answer,
        status: InquiryStatus.ANSWERED,
        answeredAt: new Date(),
      },
    });
    
    // TODO: Add notification to the user who asked the question

    return NextResponse.json({ success: true, inquiry: updatedInquiry });
  } catch (error) {
     if (error instanceof Error) {
      if (error.message === "Unauthorized") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      if (error.message === "Forbidden") return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (error.message === "Suggestion not found") return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }
    console.error("Error answering inquiry:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}