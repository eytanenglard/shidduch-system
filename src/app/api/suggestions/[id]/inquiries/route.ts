// src/app/api/suggestions/[id]/inquiries/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
/* import { EmailService } from "@/app/components/matchmaker/suggestions/services/email/EmailService";
 */
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { question } = await req.json();

    // Fetch the suggestion to get matchmaker details
    const suggestion = await prisma.matchSuggestion.findUnique({
      where: { id: params.id },
      include: {
        matchmaker: true,
        firstParty: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
        secondParty: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          }
        },
      },
    });

    if (!suggestion) {
      return NextResponse.json({ error: "Suggestion not found" }, { status: 404 });
    }

    // Verify user is authorized to send inquiries for this suggestion
    if (suggestion.firstPartyId !== session.user.id && 
        suggestion.secondPartyId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Create the inquiry record
   // בקובץ src/app/api/suggestions/[id]/inquiries/route.ts נעדכן את היחסים:

const inquiry = await prisma.suggestionInquiry.create({
    data: {
      suggestionId: params.id,
      fromUserId: session.user.id,
      toUserId: suggestion.matchmakerId,
      question,
      status: "PENDING",
    },
    include: {
      fromUser: true,
      toUser: true,
      suggestion: true,
    }
  });

    // Send email notification to matchmaker
    const emailTemplate = {
      subject: `שאלה חדשה על הצעת שידוך`,
      body: `
        <div dir="rtl">
          <h2>שלום ${suggestion.matchmaker.firstName},</h2>
          <p>התקבלה שאלה חדשה על הצעת השידוך בין ${suggestion.firstParty.firstName} ל${suggestion.secondParty.firstName}.</p>
          <div style="background: #f5f5f5; padding: 15px; margin: 15px 0; border-radius: 5px;">
            <p style="margin: 0;">${question}</p>
          </div>
          <p>לצפייה בפרטים נוספים ומענה, היכנס/י למערכת.</p>
        </div>
      `,
    };

/*     await EmailService.getInstance().sendEmail({
      to: suggestion.matchmaker.email,
      subject: emailTemplate.subject,
      html: emailTemplate.body,
    }); */

    return NextResponse.json({
      success: true,
      inquiry,
    });

  } catch (error) {
    console.error("Error creating inquiry:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}