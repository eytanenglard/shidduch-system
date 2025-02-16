import prisma from '@/lib/prisma';
import { Verification, VerificationType, VerificationStatus, UserStatus } from '@prisma/client';
import crypto from 'crypto';

export class VerificationService {
  /**
   * מאמת טוקן ומעדכן את סטטוס המשתמש בהתאם
   */
  static async verifyToken(token: string, type: VerificationType): Promise<Verification> {
    // חיפוש רשומת אימות פעילה
    const verification = await prisma.verification.findFirst({
      where: { 
        token, 
        type,
        status: VerificationStatus.PENDING
      },
      include: {
        user: true
      }
    });

    // אם לא נמצאה רשומה פעילה, בדיקה אם הטוקן כבר נוצל
    if (!verification) {
      const usedToken = await prisma.verification.findFirst({
        where: { 
          token, 
          type,
          status: VerificationStatus.COMPLETED 
        }
      });
      
      if (usedToken) {
        throw new Error('הטוקן כבר נוצל. אנא התחבר למערכת.');
      }
      
      throw new Error('טוקן אימות לא תקין');
    }

    // בדיקת תוקף הטוקן
    if (verification.expiresAt < new Date()) {
      throw new Error('תוקף הטוקן פג');
    }

    // עדכון סטטוס האימות וסטטוס המשתמש בטרנזקציה אחת
    try {
      const result = await prisma.$transaction(async (tx) => {
        // עדכון רשומת האימות
        const updatedVerification = await tx.verification.update({
          where: { 
            id: verification.id 
          },
          data: {
            status: VerificationStatus.COMPLETED,
            completedAt: new Date(),
            attempts: {
              increment: 1
            }
          }
        });

        // עדכון סטטוס המשתמש
        if (!verification.userId) {
          throw new Error('משתמש לא נמצא');
        }
        
        await tx.user.update({
          where: { 
            id: verification.userId  // עכשיו TypeScript יודע שזה בטוח string
          },
          data: {
            isVerified: true,
            status: UserStatus.ACTIVE
          }
        });
        return updatedVerification;
      });

      return result;

    } catch (error) {
      console.error('Error during verification:', error);
      throw new Error('אירעה שגיאה בתהליך האימות');
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
      // ביטול טוקנים קודמים שעדיין פעילים
      await prisma.verification.updateMany({
        where: {
          userId,
          type,
          status: VerificationStatus.PENDING
        },
        data: {
          status: VerificationStatus.EXPIRED  // שינוי מ-CANCELLED ל-EXPIRED
        }
      });

      // יצירת טוקן חדש
      return await prisma.verification.create({
        data: {
          userId,
          type,
          token: this.generateToken(),
          expiresAt: new Date(Date.now() + expiresInHours * 60 * 60 * 1000),
          status: VerificationStatus.PENDING,
          attempts: 0
        }
      });
    } catch (error) {
      console.error('Error creating verification token:', error);
      throw new Error('אירעה שגיאה ביצירת טוקן אימות');
    }
  }

  /**
   * מייצר טוקן אקראי
   */
  private static generateToken(): string {
    return crypto.randomUUID();
  }

  /**
   * בודק האם למשתמש יש אימות פעיל
   */
  static async hasActiveVerification(userId: string, type: VerificationType): Promise<boolean> {
    const activeVerification = await prisma.verification.findFirst({
      where: {
        userId,
        type,
        status: VerificationStatus.PENDING,
        expiresAt: {
          gt: new Date()
        }
      }
    });

    return !!activeVerification;
  }
}