// src/lib/services/referralIntegration.ts

/**
 * קובץ זה מכיל פונקציות עזר לאינטגרציה של מערכת הרפרל
 * עם תהליכי הרישום והאימות הקיימים במערכת.
 */

import { cookies } from 'next/headers';
import { 
  linkUserToReferral, 
  updateReferralStatus,
  parseReferralCookie, 
  REFERRAL_COOKIE_NAME,
} from './referralService';

/**
 * טיפול ברפרל בעת רישום משתמש חדש
 */
export async function handleReferralOnRegistration(userId: string): Promise<{
  success: boolean;
  referrerId?: string;
}> {
  try {
    const cookieStore = await cookies(); // 🔴 תיקון: הוספת await
    const refCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    
    if (!refCookie) {
      return { success: false };
    }

    const refData = parseReferralCookie(refCookie);
    
    if (!refData) {
      return { success: false };
    }

    // בדוק שהרפרל לא פג תוקף
    if (new Date(refData.expiresAt) < new Date()) {
      // מחק את הcookie הישן
      cookieStore.delete(REFERRAL_COOKIE_NAME);
      return { success: false };
    }

    // קשר את המשתמש להפניה
    const result = await linkUserToReferral({
      userId,
      referralId: refData.referralId,
    });

    return result;

  } catch (error) {
    console.error('[Referral Integration] Error on registration:', error);
    return { success: false };
  }
}

/**
 * עדכון סטטוס רפרל כשמשתמש מאמת טלפון
 */
export async function handleReferralOnPhoneVerification(userId: string): Promise<{
  success: boolean;
}> {
  try {
    const result = await updateReferralStatus({
      userId,
      newStatus: 'VERIFIED',
    });

    return { success: result.success };

  } catch (error) {
    console.error('[Referral Integration] Error on phone verification:', error);
    return { success: false };
  }
}

/**
 * עדכון סטטוס רפרל כשמשתמש משלים את הפרופיל
 */
export async function handleReferralOnProfileComplete(userId: string): Promise<{
  success: boolean;
}> {
  try {
    const result = await updateReferralStatus({
      userId,
      newStatus: 'COMPLETED',
    });

    return { success: result.success };

  } catch (error) {
    console.error('[Referral Integration] Error on profile complete:', error);
    return { success: false };
  }
}

/**
 * בדוק אם משתמש הגיע מרפרל
 */
export async function checkReferralCookie(): Promise<{
  hasReferral: boolean;
  code?: string;
  referralId?: string;
}> {
  try {
    const cookieStore = await cookies(); // 🔴 תיקון: הוספת await
    const refCookie = cookieStore.get(REFERRAL_COOKIE_NAME)?.value;
    
    if (!refCookie) {
      return { hasReferral: false };
    }

    const refData = parseReferralCookie(refCookie);
    
    if (!refData || new Date(refData.expiresAt) < new Date()) {
      return { hasReferral: false };
    }

    return {
      hasReferral: true,
      code: refData.code,
      referralId: refData.referralId,
    };

  } catch {
    return { hasReferral: false };
  }
}