// src/app/api/ai/matchmaker/prepare-feedback-email/route.ts

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { getDictionary, getQuestionnaireQuestionsDictionary } from "@/lib/dictionaries";
import { profileFeedbackService } from "@/lib/services/profileFeedbackService";
import type { ProfileFeedbackTemplateContext } from "@/lib/email/templates/emailTemplates";

import fs from 'fs';
import path from 'path';
import Handlebars from 'handlebars';

// רישום helpers של Handlebars
Handlebars.registerHelper('eq', function (a, b) {
  return a === b;
});

Handlebars.registerHelper('replace', function (str, searchValue, replaceValue) {
  if (typeof str !== 'string') return str;
  return str.replace(new RegExp(searchValue, 'g'), replaceValue);
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
    
    // טעינת המילונים
    const [dictionary, questionnaireQuestionsDict] = await Promise.all([
      getDictionary(locale),
      getQuestionnaireQuestionsDictionary(locale)
    ]);
    
    const emailDict = dictionary.email;

    // בדיקה שמילון המייל קיים
    if (!emailDict?.profileFeedback || !emailDict?.shared) {
        console.error("Dictionary is missing 'email.profileFeedback' or 'email.shared' section.");
        return NextResponse.json({ success: false, error: "Server configuration error: Email dictionary is incomplete." }, { status: 500 });
    }

    // יצירת הדוח עם הטיפוס המתוקן
    const report = await profileFeedbackService.compileFeedbackReport(
      userId, 
      locale, 
      questionnaireQuestionsDict // זה כבר הטיפוס הנכון
    );

    // הכנת הקונטקסט לתבנית
    const context: ProfileFeedbackTemplateContext = {
      locale: locale as any,
      dict: emailDict.profileFeedback,
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

    // טעינת תבנית ה-Handlebars
    const templatePath = path.resolve(process.cwd(), 'src/lib/email/templates/profile-feedback.hbs');
    
    if (!fs.existsSync(templatePath)) {
      console.error(`Template file not found: ${templatePath}`);
      return NextResponse.json({ success: false, error: "Email template not found" }, { status: 500 });
    }

    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const compiledTemplate = Handlebars.compile(templateSource);
    
    // הוספת greeting לקונטקסט
    const contextWithGreeting = {
      ...context,
      greeting: (emailDict.profileFeedback.greeting || "שלום {{name}}").replace('{{name}}', report.name)
    };
    
    const htmlContent = compiledTemplate(contextWithGreeting);

    // החזרת התוכן עם headers נכונים
    return NextResponse.json(
      { 
        success: true, 
        htmlContent,
        locale,
        direction: locale === 'he' ? 'rtl' : 'ltr'
      },
      {
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      }
    );

  } catch (error) {
    console.error("Error in prepare-feedback-email endpoint:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal Server Error", 
        details: errorMessage 
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      }
    );
  }
}