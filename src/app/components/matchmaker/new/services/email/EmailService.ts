import { MatchSuggestionStatus, User, MatchSuggestion, Profile } from "@prisma/client";
import nodemailer from 'nodemailer';

type UserWithProfile = User & {
  profile: Profile | null;
};

type SuggestionWithParties = MatchSuggestion & {
  firstParty: UserWithProfile;
  secondParty: UserWithProfile;
  matchmaker: User;
};

type EmailTemplate = {
  subject: string;
  body: (data: SuggestionWithParties) => string;
};

// Helper function to format user details with proper RTL support
const formatUserDetails = (user: UserWithProfile) => {
  const details = [
    `שם: ${user.firstName} ${user.lastName}`,
    `אימייל: ${user.email}`,
  ];

  if (user?.phone) {
    details.push(`טלפון: ${user?.phone}`);
  }

  return details.join('\n');
};

// Base HTML template with RTL support
const createHtmlTemplate = (content: string) => `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head>
    <meta charset="UTF-8">
    <style>
        body {
            font-family: Arial, Helvetica, sans-serif;
            direction: rtl;
            text-align: right;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
        }
    </style>
</head>
<body>
    ${content}
</body>
</html>
`;

// Email templates for different statuses
const emailTemplates: Record<MatchSuggestionStatus, EmailTemplate | null> = {
  DRAFT: {
    subject: 'טיוטת הצעת שידוך נשמרה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>טיוטת הצעת השידוך נשמרה בהצלחה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטי ההצעה</a></p>
      </div>
    `)
  },
  
  PENDING_FIRST_PARTY: {
    subject: 'הצעת שידוך חדשה עבורך',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.firstParty.firstName},</h2>
        <p>${data.matchmaker.firstName} ${data.matchmaker.lastName} הציע/ה עבורך הצעת שידוך.</p>
        <p>לצפייה בפרטי ההצעה ומענה, אנא היכנס/י לקישור הבא:</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/suggestions/${data.id}/review">לצפייה בהצעה</a></p>
        <p>בברכה,<br>צוות המערכת</p>
      </div>
    `)
  },

  FIRST_PARTY_APPROVED: {
    subject: 'עדכון סטטוס - הצעת שידוך אושרה על ידי הצד הראשון',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>${data.firstParty.firstName} ${data.firstParty.lastName} אישר/ה את הצעת השידוך.</p>
        <p>ההצעה תועבר כעת באופן אוטומטי לצד השני.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים נוספים</a></p>
      </div>
    `)
  },

  FIRST_PARTY_DECLINED: {
    subject: 'עדכון סטטוס - הצעת שידוך נדחתה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>${data.firstParty.firstName} ${data.firstParty.lastName} דחה/תה את הצעת השידוך.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים נוספים</a></p>
      </div>
    `)
  },

  PENDING_SECOND_PARTY: {
    subject: 'הצעת שידוך חדשה עבורך',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.secondParty.firstName},</h2>
        <p>${data.matchmaker.firstName} ${data.matchmaker.lastName} הציע/ה עבורך הצעת שידוך.</p>
        <p>הצד הראשון כבר אישר את ההצעה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/suggestions/${data.id}/review">לצפייה בפרטי ההצעה ומענה</a></p>
        <p>בברכה,<br>צוות המערכת</p>
      </div>
    `)
  },

  SECOND_PARTY_APPROVED: {
    subject: 'עדכון סטטוס - הצעת שידוך אושרה על ידי הצד השני',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>${data.secondParty.firstName} ${data.secondParty.lastName} אישר/ה את הצעת השידוך.</p>
        <p>שני הצדדים אישרו את ההצעה. ניתן כעת לשתף פרטי קשר.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים נוספים</a></p>
      </div>
    `)
  },

  SECOND_PARTY_DECLINED: {
    subject: 'עדכון סטטוס - הצעת שידוך נדחתה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>${data.secondParty.firstName} ${data.secondParty.lastName} דחה/תה את הצעת השידוך.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים נוספים</a></p>
      </div>
    `)
  },

  AWAITING_MATCHMAKER_APPROVAL: {
    subject: 'נדרש אישור שדכן להצעה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>נדרש אישורך להצעת השידוך בין ${data.firstParty.firstName} ל${data.secondParty.firstName}.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים ואישור</a></p>
      </div>
    `)
  },

  CONTACT_DETAILS_SHARED: {
    subject: 'פרטי קשר להצעת השידוך',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>ברכות! שני הצדדים אישרו את הצעת השידוך.</h2>
        <p>פרטי הקשר של הצד הראשון:</p>
        <pre>${formatUserDetails(data.firstParty)}</pre>
        <p>פרטי הקשר של הצד השני:</p>
        <pre>${formatUserDetails(data.secondParty)}</pre>
        <p>אנא צרו קשר בהקדם לתיאום פגישה ראשונה.</p>
        <p>בהצלחה!</p>
      </div>
    `)
  },

  AWAITING_FIRST_DATE_FEEDBACK: {
    subject: 'בקשה למשוב על הפגישה הראשונה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום,</h2>
        <p>נשמח לקבל את המשוב שלך על הפגישה הראשונה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/suggestions/${data.id}/feedback">לשליחת המשוב</a></p>
      </div>
    `)
  },

  THINKING_AFTER_DATE: {
    subject: 'בקשת זמן למחשבה לאחר הפגישה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>אחד הצדדים ביקש זמן למחשבה לאחר הפגישה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים נוספים</a></p>
      </div>
    `)
  },

  PROCEEDING_TO_SECOND_DATE: {
    subject: 'עדכון סטטוס - ממשיכים לפגישה שנייה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>שני הצדדים הסכימו להמשיך לפגישה שנייה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים</a></p>
      </div>
    `)
  },

  ENDED_AFTER_FIRST_DATE: {
    subject: 'עדכון סטטוס - סיום לאחר פגישה ראשונה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>ההצעה הסתיימה לאחר הפגישה הראשונה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים והמשוב</a></p>
      </div>
    `)
  },

  MEETING_PENDING: {
    subject: 'הצעה לקביעת פגישה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום,</h2>
        <p>התקבלה הצעה לקביעת פגישה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/suggestions/${data.id}/meetings">לצפייה בפרטי ההצעה</a></p>
      </div>
    `)
  },

  MEETING_SCHEDULED: {
    subject: 'פגישה נקבעה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום,</h2>
        <p>אנו שמחים לעדכן שנקבעה פגישה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/suggestions/${data.id}/meetings">לצפייה בפרטי הפגישה</a></p>
      </div>
    `)
  },

  MATCH_APPROVED: {
    subject: 'ההצעה אושרה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>ההצעה אושרה על ידי שני הצדדים.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים</a></p>
      </div>
    `)
  },

  MATCH_DECLINED: {
    subject: 'ההצעה נדחתה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>ההצעה נדחתה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים</a></p>
      </div>
    `)
  },

  DATING: {
    subject: 'עדכון סטטוס - בתהליך היכרות',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>הזוג נמצא בתהליך היכרות.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים</a></p>
      </div>
    `)
  },

  ENGAGED: {
    subject: 'מזל טוב! - אירוסין',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>מזל טוב ${data.firstParty.firstName} ו${data.secondParty.firstName}!</h2>
        <p>אנו שמחים לשמוע על האירוסין ומאחלים לכם המון הצלחה בהמשך הדרך.</p>
        <p>בברכה,<br>צוות המערכת</p>
      </div>
    `)
  },

  MARRIED: {
    subject: 'מזל טוב! - חתונה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>מזל טוב ${data.firstParty.firstName} ו${data.secondParty.firstName}!</h2>
        <p>אנו שמחים לשמוע על החתונה ומאחלים לכם חיים מאושרים יחד.</p>
        <p>בברכה,<br>צוות המערכת</p>
      </div>
    `)
  },

  EXPIRED: {
    subject: 'הצעת השידוך פגה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>הצעת השידוך פגה עקב חוסר מענה במועד.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים</a></p>
      </div>
    `)
  },

  CLOSED: {
    subject: 'הצעת השידוך נסגרה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>הצעת השידוך נסגרה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים</a></p>
      </div>
    `)
  },

  CANCELLED: {
    subject: 'הצעת השידוך בוטלה',
    body: (data) => createHtmlTemplate(`
      <div>
        <h2>שלום ${data.matchmaker.firstName},</h2>
        <p>הצעת השידוך בוטלה.</p>
        <p><a href="${process.env.NEXT_PUBLIC_BASE_URL}/dashboard/suggestions/${data.id}">לצפייה בפרטים</a></p>
      </div>
    `)
  },
};

export class EmailService {
  private static instance: EmailService;
  private transporter: nodemailer.Transporter;

  private constructor() {
    // Configure nodemailer for Gmail
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      tls: {
        rejectUnauthorized: false
      }
    });

    // Verify email configuration on startup
    this.verifyEmailConfig();
  }

  private async verifyEmailConfig() {
    try {
      await this.transporter.verify();
      console.log('Email configuration verified successfully');
    } catch (error) {
      console.error('Email configuration verification failed:', error);
      // Don't throw - allow the service to continue running even if email verification fails
    }
  }

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async handleSuggestionStatusChange(
    suggestion: SuggestionWithParties,
  
  ): Promise<void> {
    try {
      console.log('email222:------------');
      const template = emailTemplates[suggestion.status];
      if (!template) {
        console.log(`No email template for status: ${suggestion.status}`);
        return;
      }

      const recipients = this.getRecipientsByStatus(suggestion);
      
      console.log(`Preparing to send emails for suggestion ${suggestion.id}`, {
        status: suggestion.status,
        recipientCount: recipients.length
      });

      await Promise.all(
        recipients.map(async (recipient) => {
          await this.sendEmail({
            to: recipient,
            subject: template.subject,
            html: template.body(suggestion),
          });
        })
      );

      console.log(`Successfully sent ${recipients.length} emails for suggestion ${suggestion.id}`);
    } catch (error) {
      console.error('Error sending suggestion emails:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        suggestionId: suggestion.id,
        status: suggestion.status
      });
      throw new Error('Failed to send suggestion emails');
    }
  }

  private getRecipientsByStatus(suggestion: SuggestionWithParties): string[] {
    switch (suggestion.status) {
      case MatchSuggestionStatus.DRAFT:
        return [suggestion.matchmaker.email];
      
      case MatchSuggestionStatus.PENDING_FIRST_PARTY:
        return [suggestion.firstParty.email];
      
      case MatchSuggestionStatus.FIRST_PARTY_APPROVED:
      case MatchSuggestionStatus.FIRST_PARTY_DECLINED:
        return [suggestion.matchmaker.email];
      
      case MatchSuggestionStatus.PENDING_SECOND_PARTY:
        return [suggestion.secondParty.email];
      
      case MatchSuggestionStatus.SECOND_PARTY_APPROVED:
      case MatchSuggestionStatus.SECOND_PARTY_DECLINED:
        return [suggestion.matchmaker.email];
      
      case MatchSuggestionStatus.AWAITING_MATCHMAKER_APPROVAL:
        return [suggestion.matchmaker.email];
      
      case MatchSuggestionStatus.CONTACT_DETAILS_SHARED:
        return [
          suggestion.firstParty.email,
          suggestion.secondParty.email,
          suggestion.matchmaker.email,
        ];
      
      case MatchSuggestionStatus.AWAITING_FIRST_DATE_FEEDBACK:
        return [
          suggestion.firstParty.email,
          suggestion.secondParty.email,
        ];

      case MatchSuggestionStatus.THINKING_AFTER_DATE:
      case MatchSuggestionStatus.PROCEEDING_TO_SECOND_DATE:
      case MatchSuggestionStatus.ENDED_AFTER_FIRST_DATE:
        return [suggestion.matchmaker.email];

      case MatchSuggestionStatus.MEETING_PENDING:
      case MatchSuggestionStatus.MEETING_SCHEDULED:
        return [
          suggestion.firstParty.email,
          suggestion.secondParty.email,
        ];

      case MatchSuggestionStatus.MATCH_APPROVED:
      case MatchSuggestionStatus.MATCH_DECLINED:
      case MatchSuggestionStatus.DATING:
        return [suggestion.matchmaker.email];

      case MatchSuggestionStatus.ENGAGED:
      case MatchSuggestionStatus.MARRIED:
        return [
          suggestion.firstParty.email,
          suggestion.secondParty.email,
          suggestion.matchmaker.email,
        ];
      
      case MatchSuggestionStatus.EXPIRED:
      case MatchSuggestionStatus.CLOSED:
      case MatchSuggestionStatus.CANCELLED:
        return [suggestion.matchmaker.email];
      
      default:
        return [];
    }
  }

  async sendEmail({
    to,
    subject,
    html,
  }: {
    to: string;
    subject: string;
    html: string;
  }): Promise<void> {
    try {
      console.log('Attempting to send email:', {
        to,
        subject,
        fromEmail: process.env.GMAIL_USER,
        fromName: process.env.EMAIL_FROM_NAME,
      });

      const result = await this.transporter.sendMail({
        from: `${process.env.EMAIL_FROM_NAME} <${process.env.GMAIL_USER}>`,
        to,
        subject,
        html,
      });

      console.log('Email sent successfully:', {
        messageId: result.messageId,
        response: result.response,
      });
    } catch (error) {
      console.error('Detailed error sending email:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : error,
        emailConfig: {
          to,
          subject,
          fromEmail: process.env.GMAIL_USER,
          fromName: process.env.EMAIL_FROM_NAME,
        }
      });
      throw error;
    }
  }
}

// Export singleton instance
export const emailService = EmailService.getInstance();