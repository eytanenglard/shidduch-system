// src/app/api/ai/matchmaker/prepare-feedback-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getDictionary } from "@/lib/dictionaries";
import { profileFeedbackService } from "@/lib/services/profileFeedbackService";
import type { ProfileFeedbackTemplateContext } from "@/lib/email/templates/emailTemplates";
import prisma from "@/lib/prisma";

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { userId, locale, isAutomated } = await req.json();
    if (!userId || !locale) {
      return NextResponse.json({ success: false, error: "Missing userId or locale" }, { status: 400 });
    }
    
    // טוענים את המילון המלא פעם אחת, כולל מודול השאלון
    const dictionary = await getDictionary(locale);
    
    // מעבירים את מודול השאלון כולו לשירות
    const report = await profileFeedbackService.compileFeedbackReport(
        userId, 
        locale,
        dictionary.questionnaire
    );
    
    const emailDict = dictionary.email;

    if (!emailDict?.profileFeedback || !emailDict?.shared) {
        console.error("Dictionary is missing 'email.profileFeedback' or 'email.shared' section.");
        return NextResponse.json({ success: false, error: "Server configuration error: Email dictionary is incomplete." }, { status: 500 });
    }

    const context = {
      locale,
      dict: emailDict.profileFeedback,
      greeting: (emailDict.profileFeedback.greeting || "שלום {{name}}").replace('{{name}}', report.name),
      sharedDict: {
        ...emailDict.shared,
        rightsReserved: (emailDict.shared.rightsReserved || "© {{year}} NeshamaTech").replace('{{year}}', new Date().getFullYear().toString())
      },
      name: report.name,
      report,
      isAutomated: isAutomated || false,
      matchmakerName: session.user.name || "השדכן/ית שלך",
      supportEmail: process.env.SUPPORT_EMAIL || 'support@neshamatech.com',
      companyName: process.env.COMPANY_NAME || 'NeshamaTech',
      currentYear: new Date().getFullYear().toString(),
      baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
    };

    const templatePath = path.resolve(process.cwd(), 'src/lib/email/templates/profile-feedback.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = Handlebars.compile(templateSource);
    const htmlContent = compiledTemplate(context);

    return NextResponse.json({ success: true, htmlContent });

  } catch (error) {
    console.error("Error in prepare-feedback-email endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ success: false, error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}