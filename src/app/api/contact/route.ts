// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { applyRateLimitWithRoleCheck } from '@/lib/rate-limiter';
import nodemailer from 'nodemailer';
import { z } from 'zod';

// Zod schema for validating the contact form data
const contactSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters long" }),
});

export async function POST(req: NextRequest) {
  // Apply rate limiting: 5 contact form submissions per IP per hour (prevents spam)
const rateLimitResponse = await applyRateLimitWithRoleCheck(req, { requests: 15, window: '1 h' });  if (rateLimitResponse) {
    return rateLimitResponse;
  }
  try {
    const body = await req.json();

    // Validate the request body
    const validationResult = contactSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: "Invalid input", details: validationResult.error.flatten() },
        { status: 400 }
      );
    }

    const { name, email, message } = validationResult.data;

    // Configure the email transporter using environment variables
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.GMAIL_USER || process.env.EMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD || process.env.EMAIL_PASS,
      },
      tls: {
        rejectUnauthorized: process.env.NODE_ENV === 'production',
      }
    });

    // Define the email options
    const mailOptions = {
      from: `"${process.env.EMAIL_FROM_NAME || 'Match Point Contact Form'}" <${process.env.GMAIL_USER || process.env.EMAIL_USER}>`,
      to: "jewish.matchpoint@gmail.com", // Your support/admin email address
      subject: `פנייה חדשה מאתר Match Point - ${name}`,
      replyTo: email, // This allows you to reply directly to the user
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; text-align: right; line-height: 1.6;">
          <h2 style="color: #0891b2;">התקבלה הודעה חדשה מטופס יצירת הקשר באתר:</h2>
          <p><strong>מאת:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <h3 style="color: #333;">תוכן ההודעה:</h3>
          <div style="background-color: #f8f9fa; border-right: 4px solid #06b6d4; padding: 15px; border-radius: 5px; margin-top: 10px;">
            <p style="margin: 0; white-space: pre-wrap;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          <p style="font-size: 12px; color: #6c757d; margin-top: 20px;">
            זוהי הודעה אוטומטית. ניתן להשיב למייל זה ישירות כדי לענות לפונה.
          </p>
        </div>
      `,
    };

    // Send the email
    await transporter.sendMail(mailOptions);

    // Return a success response
    return NextResponse.json({ success: true, message: "ההודעה נשלחה בהצלחה." });

  } catch (error) {
    console.error("Error in /api/contact route:", error);
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ success: false, error: "Internal Server Error", details: errorMessage }, { status: 500 });
  }
}