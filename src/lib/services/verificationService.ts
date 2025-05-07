// lib/services/verificationService.ts

import prisma from '@/lib/prisma';
import { Verification, VerificationType, VerificationStatus, UserStatus } from '@prisma/client'; // הוסף Prisma
import crypto from 'crypto';

export class VerificationService {
  /**
   * מאמת טוקן ומעדכן את סטטוס המשתמש בהתאם
   */
  static async verifyToken(token: string, type: VerificationType): Promise<Verification> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // שלב 1: חפש טוקן עם סטטוס PENDING
        const verification = await tx.verification.findFirst({
          where: {
            token,
            type,
            status: VerificationStatus.PENDING
          },
          include: { user: true } // כלול את המשתמש כדי שנוכל לעדכן אותו
        });

        // אם לא נמצא טוקן PENDING
        if (!verification) {
          // שלב 1.1: בדוק אם קיים טוקן COMPLETED (כבר נוצל)
          const usedToken = await tx.verification.findFirst({ // השתמש ב-tx גם כאן
            where: {
              token,
              type,
              status: VerificationStatus.COMPLETED
            }
          });
          if (usedToken) {
            // זרוק שגיאה ספציפית לטוקן שנוצל
             console.warn(`Verification attempt failed: Token ${token} (${type}) already used.`);
            throw new Error('הטוקן כבר נוצל.'); // הודעה קצרה יותר
          } else {
            // אם לא נמצא כלל (לא PENDING ולא COMPLETED) - טוקן לא תקין
             console.warn(`Verification attempt failed: Invalid token ${token} (${type}).`);
            throw new Error('טוקן אימות לא תקין');
          }
        }

        // שלב 2: בדוק אם הטוקן פג תוקף
        if (verification.expiresAt < new Date()) {
           console.warn(`Verification attempt failed: Token ${token} (${type}) expired.`);
          // אופציונלי: עדכן את סטטוס הטוקן ל-EXPIRED לפני זריקת השגיאה
           await tx.verification.update({
               where: { id: verification.id },
               data: { status: VerificationStatus.EXPIRED }
           });
          throw new Error('תוקף הטוקן פג');
        }

        // שלב 3: ודא שיש userId משויך
        if (!verification.userId) {
            console.error(`Verification error: No user ID associated with verification record ${verification.id}`);
            throw new Error('שגיאה פנימית: לא נמצא משתמש משויך לאימות.');
        }

        // שלב 4: עדכן את סטטוס האימות ל-COMPLETED
        const updatedVerification = await tx.verification.update({
          where: {
            id: verification.id
          },
          data: {
            status: VerificationStatus.COMPLETED,
            completedAt: new Date(),
            attempts: { increment: 1 }
          }
        });
         console.info(`Verification record ${verification.id} status updated to COMPLETED.`);

        // שלב 5: עדכן את סטטוס המשתמש
        await tx.user.update({
          where: {
            id: verification.userId
          },
          data: {
            isVerified: true, // סמן שהאימייל אומת (בהנחה שזה תמיד אימות אימייל שמעדכן isVerified)
            // עדכן את הסטטוס ל-ACTIVE רק אם הוא היה PENDING_EMAIL_VERIFICATION
            // אם הוא כבר היה ACTIVE או PENDING_PHONE_VERIFICATION, אל תשנה אותו.
            status: verification.user?.status === UserStatus.PENDING_EMAIL_VERIFICATION
                      ? UserStatus.ACTIVE // אם היה ממתין לאימייל, עכשיו פעיל (אך אולי ממתין לטלפון)
                      : verification.user?.status // אחרת, השאר את הסטטוס הקיים
          }
        });
        console.info(`User ${verification.userId} status updated (isVerified=true).`);


        // החזר את רשומת האימות המעודכנת
        return updatedVerification;

      }, {
        // הגדרות טרנזקציה (למשל, רמת בידוד אם נדרש)
        // isolationLevel: Prisma.TransactionIsolationLevel.Serializable
      }); // סוף הטרנזקציה

      // אם הגענו לכאן, הטרנזקציה הצליחה
      console.info(`Token verification successful for token ${token} (${type}).`);
      return result;

    } catch (error) {
        // אם השגיאה היא אחת מהשגיאות שזרקנו ידנית, העבר אותה הלאה
        if (error instanceof Error && ['הטוקן כבר נוצל.', 'טוקן אימות לא תקין', 'תוקף הטוקן פג', 'שגיאה פנימית: לא נמצא משתמש משויך לאימות.'].includes(error.message)) {
             throw error;
        }
        // עבור שגיאות אחרות (למשל, שגיאות DB בטרנזקציה)
        console.error('Error during verification transaction:', error);
        throw new Error('אירעה שגיאה בתהליך האימות'); // הודעה כללית יותר לקליינט
    }
  }

  /**
   * מייצר טוקן אימות חדש
   */
  static async createVerificationToken(
    userId: string,
    type: VerificationType,
    expiresInHours: number = 24
  ): Promise<Verification> {
    try {
      // ביטול טוקנים קודמים שעדיין פעילים מאותו סוג
      await prisma.verification.updateMany({
        where: {
          userId,
          type,
          status: VerificationStatus.PENDING
        },
        data: {
          status: VerificationStatus.EXPIRED // עדכון סטטוס ל'פג תוקף'
        }
      });
      console.log(`Expired previous PENDING tokens of type ${type} for user ${userId}.`);

      // יצירת טוקן חדש
      const newTokenValue = this.generateToken(); // הפק טוקן חדש
      const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

      const newVerification = await prisma.verification.create({
        data: {
          userId,
          type,
          token: newTokenValue, // השתמש בטוקן החדש שנוצר
          expiresAt: expiresAt,
          status: VerificationStatus.PENDING,
          attempts: 0 // אפס מונה ניסיונות
        }
      });
      console.log(`Created new verification token (ID: ${newVerification.id}) of type ${type} for user ${userId}. Expires at ${expiresAt.toISOString()}.`);
      return newVerification;

    } catch (error) {
      console.error(`Error creating verification token for user ${userId}, type ${type}:`, error);
      throw new Error('אירעה שגיאה ביצירת טוקן אימות');
    }
  }

  /**
   * מייצר טוקן אקראי
   */
  private static generateToken(): string {
    // שימוש ב-crypto.randomUUID() שהוא סטנדרטי ובטוח יותר
    return crypto.randomUUID();
  }

  /**
   * בודק האם למשתמש יש אימות פעיל מסוג מסוים
   */
  static async hasActiveVerification(userId: string, type: VerificationType): Promise<boolean> {
    try {
        const activeVerification = await prisma.verification.findFirst({
          where: {
            userId,
            type,
            status: VerificationStatus.PENDING,
            expiresAt: {
              gt: new Date() // בדוק שהתוקף עתידי
            }
          },
          select: { id: true } // מספיק לבדוק אם קיים ID
        });

        const hasActive = !!activeVerification;
        console.log(`User ${userId} has active verification of type ${type}: ${hasActive}`);
        return hasActive;

    } catch (error) {
        console.error(`Error checking active verification for user ${userId}, type ${type}:`, error);
        // במקרה של שגיאה, החזר false כדי למנוע חסימה לא רצויה
        return false;
    }
  }
}