// src/lib/engagement/emailService.ts

import nodemailer from 'nodemailer';
import Handlebars from 'handlebars';
import fs from 'fs';
import path from 'path';

/**
 * 📧 שירות מיילים משופר עם תמיכה בתבניות Handlebars
 */

interface EmailData {
  to: string;
  subject: string;
  templateName: string;
  context: Record<string, any>;
  locale?: 'he' | 'en'; // הוספת פרמטר שפה אופציונלי
}

class EmailService {
  private transporter: nodemailer.Transporter;
  private templatesCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ Email service initialization failed:', error);
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  private loadTemplate(templateName: string): HandlebarsTemplateDelegate {
    if (this.templatesCache.has(templateName)) {
      return this.templatesCache.get(templateName)!;
    }

    const templatePath = path.join(
      process.cwd(),
      'src',
      'lib',
      'engagement', // <-- הנתיב הנכון לתבניות
      'templates',
      'email',
      `${templateName}.hbs`
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found: ${templateName} at ${templatePath}`);
    }

    const source = fs.readFileSync(templatePath, 'utf-8');
    const template = Handlebars.compile(source);
    this.templatesCache.set(templateName, template);
    return template;
  }

  async sendTemplateEmail(data: EmailData): Promise<boolean> {
    try {
      const enhancedContext = {
        ...data.context,
        baseUrl: process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        currentYear: new Date().getFullYear(),
        locale: data.locale || 'he', // הוספת השפה לקונטקסט של התבנית
      };

      const template = this.loadTemplate(data.templateName);
      const htmlContent = template(enhancedContext);

      const info = await this.transporter.sendMail({
        from: `NeshamaTech <${process.env.GMAIL_USER}>`,
        to: data.to,
        subject: data.subject,
        html: htmlContent,
      });

      console.log(`✅ Email sent to ${data.to} | Template: ${data.templateName} | Lang: ${enhancedContext.locale} | ID: ${info.messageId}`);
      return true;

    } catch (error) {
      console.error(`❌ Failed to send email to ${data.to}:`, error);
      return false;
    }
  }

  async sendOnboardingDay1(user: {
    locale: 'he' | 'en'; // פרמטר חובה
    email: string;
    firstName: string;
    completionData: {
      progressPercentage: number;
      completedItems: string[];
      missingItemsCount: number;
      nextAction: string;
      aiInsight?: string;
    };
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: user.email,
      subject: user.locale === 'he' 
        ? `${user.firstName}, ברוך הבא ל-NeshamaTech! 🎉` 
        : `Welcome to NeshamaTech, ${user.firstName}! 🎉`,
      templateName: 'onboardingDay1',
      context: {
        firstName: user.firstName,
        ...user.completionData,
      },
      locale: user.locale,
    });
  }

  async sendProgressUpdate(user: {
    locale: 'he' | 'en';
    email: string;
    firstName: string;
    progressData: {
      progressPercentage: number;
      aiLearning: string;
      photosCount: number;
      photosComplete: boolean;
      photosPercent: number;
      personalComplete: boolean;
      personalMissingCount: number;
      personalPercent: number;
      questionnaireComplete: boolean;
      questionnairePercent: number;
      preferencesComplete: boolean;
      preferencesMissingCount: number;
      preferencesPercent: number;
      nextAction: string;
      estimatedTime: string;
      nextMilestone: number;
      aiPersonalInsight?: string;
      ctaLink: string;
      ctaText: string;
    };
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: user.email,
      subject: user.locale === 'he' 
        ? `${user.firstName}, איך מתקדמים? 📊` 
        : `How's it going, ${user.firstName}? 📊`,
      templateName: 'progressUpdate',
      context: {
        firstName: user.firstName,
        ...user.progressData,
      },
      locale: user.locale,
    });
  }

  async sendAlmostDone(user: {
    locale: 'he' | 'en';
    email: string;
    firstName: string;
    celebrationData: {
      progressPercentage: number;
      remainingItem: string;
      estimatedTime: string;
      aiSummary?: string;
      ctaLink: string;
    };
  }): Promise<boolean> {
    return this.sendTemplateEmail({
      to: user.email,
      subject: user.locale === 'he' 
        ? `${user.firstName}, את/ה כמעט שם! 🎊` 
        : `You're almost there, ${user.firstName}! 🎊`,
      templateName: 'almostDone',
      context: {
        firstName: user.firstName,
        ...user.celebrationData,
      },
      locale: user.locale,
    });
  }

  async sendCustomEmail(
    to: string,
    subject: string,
    templateName: string,
    context: Record<string, any>,
    locale: 'he' | 'en' = 'he' // פרמטר locale בסוף עם ערך ברירת מחדל
  ): Promise<boolean> {
    return this.sendTemplateEmail({
      to,
      subject,
      templateName,
      context,
      locale,
    });
  }

  clearTemplateCache(): void {
    this.templatesCache.clear();
    console.log('📦 Template cache cleared');
  }
}

export const emailService = new EmailService();
export default emailService;