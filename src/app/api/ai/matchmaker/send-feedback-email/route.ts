// src/app/api/ai/matchmaker/send-feedback-email/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { emailService } from "@/lib/email/emailService";
import { UserRole } from "@prisma/client";
export async function POST(req: NextRequest) {
try {
const session = await getServerSession(authOptions);
if (!session?.user?.id || (session.user.role !== UserRole.MATCHMAKER && session.user.role !== UserRole.ADMIN)) {
return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

const { userEmail, subject, htmlContent } = await req.json();
if (!userEmail || !subject || !htmlContent) {
  return NextResponse.json({ success: false, error: "Missing parameters" }, { status: 400 });
}

// קריאה לשירות המייל עם התוכן הערוך
await emailService.sendRawEmail({
  to: userEmail,
  subject: subject,
  html: htmlContent,
});

return NextResponse.json({ success: true, message: "Email sent successfully" });
} catch (error) {
console.error("Error sending feedback email:", error);
return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
}
}
