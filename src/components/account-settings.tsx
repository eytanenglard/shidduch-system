'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch'; // Import the Switch component
import {
  User,
  Mail,
  Key,
  Shield,
  Clock,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  ArrowRight,
  Calendar,
  Bell,
  Settings,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSession, signOut } from 'next-auth/react';
import { UserRole, UserStatus } from '@prisma/client';

interface AccountSettingsProps {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    status: UserStatus;
    isVerified: boolean;
    lastLogin: Date | null;
    createdAt: Date;
    marketingConsent?: boolean; // Add marketingConsent to the user prop type
  };
}

const PASSWORD_MIN_LENGTH = 8;
const DELETE_CONFIRMATION_PHRASE = 'אני מאשר מחיקה';

const AccountSettings: React.FC<AccountSettingsProps> = ({
  user: propUser,
}) => {
  const {
    data: session,
    status: sessionStatus,
    update: updateSession,
  } = useSession();

  // States for UI control
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Form states for password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password change flow states
  const [passwordChangeStep, setPasswordChangeStep] = useState(1);
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [passwordRequirements, setPasswordRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
  });

  // Animations and effects
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // --- START OF NEW CODE ---
  // State for marketing consent
  const [marketingConsent, setMarketingConsent] = useState(
    propUser.marketingConsent || false
  );
  const [isMarketingLoading, setIsMarketingLoading] = useState(false);
  // --- END OF NEW CODE ---
  useEffect(() => {
    // בדוק אם הסשן קיים והערך marketingConsent מוגדר בו
    if (session?.user && typeof session.user.marketingConsent === 'boolean') {
      // אם הערך בסשן שונה מהערך במצב המקומי, עדכן את המצב המקומי
      if (session.user.marketingConsent !== marketingConsent) {
        setMarketingConsent(session.user.marketingConsent);
      }
    }
  }, [session?.user?.marketingConsent]); // הפעל את האפקט בכל פעם שהערך בסשן משתנה
  const canChangePassword = useMemo(() => {
    if (sessionStatus === 'authenticated' && session?.user?.accounts) {
      return session.user.accounts.some(
        (acc) => acc.provider === 'credentials'
      );
    }
    return false;
  }, [session, sessionStatus]);

  useEffect(() => {
    if (!newPassword) {
      setPasswordStrength(0);
      setPasswordRequirements({
        length: false,
        uppercase: false,
        lowercase: false,
        number: false,
      });
      return;
    }

    const requirements = {
      length: newPassword.length >= PASSWORD_MIN_LENGTH,
      uppercase: /[A-Z]/.test(newPassword),
      lowercase: /[a-z]/.test(newPassword),
      number: /[0-9]/.test(newPassword),
    };

    setPasswordRequirements(requirements);
    const metRequirements = Object.values(requirements).filter(Boolean).length;
    setPasswordStrength(metRequirements * 25);
  }, [newPassword]);

  const validatePassword = (password: string) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`הסיסמה חייבת להכיל לפחות ${PASSWORD_MIN_LENGTH} תווים`);
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error('הסיסמה חייבת להכיל לפחות אות גדולה באנגלית');
    }
    if (!/[a-z]/.test(password)) {
      throw new Error('הסיסמה חייבת להכיל לפחות אות קטנה באנגלית');
    }
    if (!/[0-9]/.test(password)) {
      throw new Error('הסיסמה חייבת להכיל לפחות ספרה אחת');
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setVerificationCode('');
    setShowVerificationInput(false);
    setIsChangingPassword(false);
    setPasswordChangeStep(1);
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const sendVerificationEmail = async () => {
    setIsSendingVerification(true);
    try {
      const response = await fetch(`/api/auth/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: propUser.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send verification email');
      }

      toast.success('קוד אימות נשלח למייל שלך', {
        description: 'אנא בדוק את תיבת הדואר הנכנס שלך',
        icon: <Mail className="h-5 w-5 text-blue-500" />,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'שגיאה בשליחת קוד אימות',
        {
          description: 'נסה שוב מאוחר יותר או פנה לתמיכה',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        }
      );
    } finally {
      setIsSendingVerification(false);
    }
  };

  const initiatePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('נא למלא את כל השדות', {
        description: 'כל השדות הם שדות חובה לשינוי סיסמה',
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('הסיסמאות אינן תואמות', {
        description: 'אנא ודא שהסיסמה החדשה זהה בשני השדות',
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    try {
      validatePassword(newPassword);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'שגיאה באימות הסיסמה',
        {
          description: 'אנא עקוב אחר כל דרישות הסיסמה',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        }
      );
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/initiate-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: propUser.id,
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to initiate password change');
      }

      setPasswordChangeStep(2);
      setShowVerificationInput(true);
      toast.success('קוד אימות נשלח למייל שלך', {
        description: 'קוד בן 6 ספרות נשלח לכתובת המייל המקושרת לחשבונך',
        icon: <Mail className="h-5 w-5 text-blue-500" />,
      });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'שגיאה באימות הסיסמה',
        {
          description: 'ייתכן שהסיסמה הנוכחית שגויה',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        }
      );
      resetPasswordForm();
    } finally {
      setIsLoading(false);
    }
  };

  const completePasswordChange = async () => {
    if (!verificationCode) {
      toast.error('נא להזין את קוד האימות', {
        description: 'קוד האימות הוא שדה חובה',
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    if (!/^\d{6}$/.test(verificationCode)) {
      toast.error('קוד אימות לא תקין', {
        description: 'קוד האימות חייב להכיל 6 ספרות',
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/complete-password-change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: propUser.id,
          token: verificationCode,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to complete password change');
      }

      toast.success('הסיסמה עודכנה בהצלחה', {
        description: 'הסיסמה החדשה שלך פעילה כעת',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });
      resetPasswordForm();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'שגיאה בעדכון הסיסמה',
        {
          description: 'קוד האימות שגוי או שפג תוקפו',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== DELETE_CONFIRMATION_PHRASE) {
      toast.error('אישור לא תקין', {
        description: `נא להקליד "${DELETE_CONFIRMATION_PHRASE}" בדיוק כדי לאשר מחיקה.`,
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete account');
      }

      toast.success('החשבון נמחק בהצלחה', {
        description: 'אנחנו מקווים לראותך שוב בעתיד. אתה מועבר לדף הבית.',
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      await signOut({ callbackUrl: '/' });
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'שגיאה במחיקת החשבון',
        {
          description: 'נסה שוב מאוחר יותר או פנה לתמיכה',
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        }
      );
    } finally {
      setIsLoading(false);
    }
  };
  // --- START OF NEW CODE ---
  const handleMarketingConsentChange = async (checked: boolean) => {
    setIsMarketingLoading(true);
    setMarketingConsent(checked); // Optimistic UI update

    try {
      const response = await fetch('/api/user/marketing-consent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ marketingConsent: checked }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setMarketingConsent(!checked); // Revert optimistic update on failure
        throw new Error(
          result.error || 'Failed to update marketing preferences.'
        );
      }

      toast.success('העדפות דיוור עודכנו בהצלחה', {
        icon: <CheckCircle className="h-5 w-5 text-green-500" />,
      });

      // === השינוי הקריטי נמצא כאן ===
      // במקום: await updateSession({ marketingConsent: checked });
      // קרא לפונקציה ללא ארגומנט כדי לרענן את הסשן מהשרת
      await updateSession();
      // ==============================
    } catch (error) {
      setMarketingConsent(!checked); // Revert optimistic update on failure
      toast.error(
        error instanceof Error ? error.message : 'שגיאה בעדכון העדפות הדיוור',
        {
          icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        }
      );
    } finally {
      setIsMarketingLoading(false);
    }
  };
  // --- END OF NEW CODE ---
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-gray-200';
    if (passwordStrength <= 25) return 'bg-red-500';
    if (passwordStrength <= 50) return 'bg-orange-500';
    if (passwordStrength <= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return '';
    if (passwordStrength <= 25) return 'חלשה מאוד';
    if (passwordStrength <= 50) return 'חלשה';
    if (passwordStrength <= 75) return 'בינונית';
    return 'חזקה';
  };

  if (!propUser) {
    return <div>טוען פרטי משתמש...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <Card
        className={`shadow-md hover:shadow-lg transition-all duration-300 border-t-4 border-blue-600 overflow-hidden relative`}
        onMouseEnter={() => setActiveSection('main')}
        onMouseLeave={() => setActiveSection(null)}
      >
        <div
          className={`absolute inset-0 bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 transition-opacity duration-500 ${
            activeSection === 'main' ? 'opacity-60' : ''
          }`}
        ></div>

        <CardHeader className="border-b pb-3 relative">
          <CardTitle className="text-xl flex items-center">
            <Settings className="w-5 h-5 text-blue-600 mr-2" />
            הגדרות חשבון
          </CardTitle>
          <CardDescription>נהל את פרטי החשבון והאבטחה שלך</CardDescription>
        </CardHeader>

        <CardContent className="divide-y relative">
          {/* Basic Info Section */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold flex items-center">
                  <User className="w-4 h-4 text-blue-600 mr-2" />
                  פרטים אישיים
                </h3>
                <p className="text-sm text-muted-foreground">
                  השם והמייל המשמשים אותך באתר
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 transition-all hover:bg-gray-100 duration-300">
                <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">שם מלא</p>
                  <p className="text-base text-gray-800">
                    {propUser.firstName || 'לא צוין'}{' '}
                    {propUser.lastName || 'לא צוין'}
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 transition-all hover:bg-gray-100 duration-300">
                <Mail className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between w-full gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      כתובת מייל
                    </p>
                    <p className="text-base text-gray-800">{propUser.email}</p>
                  </div>
                  {!propUser.isVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sendVerificationEmail}
                      disabled={isSendingVerification || isLoading}
                      className="self-start sm:self-center border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300 whitespace-nowrap"
                    >
                      <Mail className="w-4 h-4 mr-2" />
                      שלח קוד אימות
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Status Section */}
          <div className="py-4">
            <h3 className="text-base font-semibold mb-4 flex items-center">
              <Shield className="w-4 h-4 text-blue-600 mr-2" />
              סטטוס חשבון
            </h3>
            <div className="grid gap-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 transition-all hover:bg-gray-100 duration-300">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">הרשאות</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200"
                    >
                      {propUser.role === 'ADMIN'
                        ? 'מנהל'
                        : propUser.role === 'MATCHMAKER'
                          ? 'שדכן'
                          : 'מועמד'}
                    </Badge>
                    <Badge
                      className={
                        propUser.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }
                    >
                      {propUser.status === 'ACTIVE'
                        ? 'פעיל'
                        : propUser.status == 'PENDING_EMAIL_VERIFICATION'
                          ? 'ממתין לאישור אימייל'
                          : propUser.status == 'PENDING_PHONE_VERIFICATION'
                            ? 'ממתין לאישור פלאפון'
                            : propUser.status === 'INACTIVE'
                              ? 'לא פעיל'
                              : 'חסום'}
                    </Badge>
                    <Badge
                      className={
                        propUser.isVerified
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      }
                    >
                      {propUser.isVerified ? 'מאומת' : 'לא מאומת'}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 transition-all hover:bg-gray-100 duration-300">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">פרטי זמן</p>
                  <div className="space-y-1 mt-1">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <p className="text-gray-800">
                        נוצר ב:{' '}
                        {new Date(propUser.createdAt).toLocaleDateString(
                          'he-IL'
                        )}
                      </p>
                    </div>
                    {propUser.lastLogin && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <p className="text-gray-800">
                          התחברות אחרונה:{' '}
                          {new Date(propUser.lastLogin).toLocaleDateString(
                            'he-IL'
                          )}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* --- START OF NEW CODE --- */}
          {/* Marketing Preferences Section */}
          <div className="py-4">
            <h3 className="text-base font-semibold mb-4 flex items-center">
              <Bell className="w-4 h-4 text-blue-600 mr-2" />
              העדפות דיוור
            </h3>
            <div className="bg-gray-50 p-3 rounded-lg flex items-center justify-between transition-all hover:bg-gray-100 duration-300">
              <div>
                <Label
                  htmlFor="marketing-switch"
                  className="text-sm font-medium text-gray-700 cursor-pointer"
                >
                  מידע שיווקי ועדכונים
                </Label>
                <p className="text-xs text-gray-600">
                  קבלת עדכונים על אירועים, מבצעים וחדשות מהחברה.
                </p>
              </div>
              <Switch
                id="marketing-switch"
                checked={marketingConsent}
                onCheckedChange={handleMarketingConsentChange}
                disabled={isMarketingLoading}
                aria-label="Toggle marketing consent"
              />
            </div>
          </div>
          {/* --- END OF NEW CODE --- */}

          {/* Security Section */}
          <div className="py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-semibold flex items-center">
                  <Key className="w-4 h-4 text-blue-600 mr-2" />
                  אבטחה
                </h3>
                <p className="text-sm text-muted-foreground">
                  הגדרות אבטחה וסיסמה
                </p>
              </div>
              {sessionStatus !== 'loading' && canChangePassword && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsChangingPassword(true);
                    setPasswordChangeStep(1);
                  }}
                  disabled={isLoading}
                  className="border-blue-200 hover:bg-blue-50 hover:border-blue-300 transition-all duration-300"
                >
                  <Key className="w-4 h-4 mr-2" />
                  שינוי סיסמה
                </Button>
              )}
            </div>

            <div className="grid gap-3">
              <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 transition-all hover:bg-gray-100 duration-300">
                <Shield className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-700">
                    אימות חשבון
                  </p>
                  <p className="text-base text-gray-800 flex items-center gap-1">
                    {propUser.isVerified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        החשבון מאומת
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4 text-red-600" />
                        החשבון לא מאומת
                      </>
                    )}
                  </p>
                </div>
              </div>
              {sessionStatus !== 'loading' && !canChangePassword && (
                <div className="bg-gray-50 p-3 rounded-lg flex items-start gap-3 transition-all hover:bg-gray-100 duration-300">
                  <Key className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      ניהול סיסמה
                    </p>
                    <p className="text-sm text-gray-600">
                      {session?.user?.accounts &&
                      session.user.accounts.length > 0
                        ? `הסיסמה שלך מנוהלת באמצעות ${session.user.accounts[0].provider}.`
                        : 'הסיסמה שלך מנוהלת באמצעות ספק אימות חיצוני.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Delete Account Section */}
          <div className="py-4 border-t border-dashed border-red-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold flex items-center text-red-600">
                  <Trash2 className="w-4 h-4 mr-2" />
                  מחיקת חשבון
                </h3>
                <p className="text-sm text-muted-foreground">
                  מחיקת החשבון היא פעולה בלתי הפיכה ותסיר את כל הנתונים שלך.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setIsDeletingAccount(true)}
                disabled={isLoading}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                מחק חשבון
              </Button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="bg-gradient-to-r from-gray-50 to-white border-t p-4 text-sm text-gray-500 relative">
          <div className="flex items-center">
            <Bell className="w-4 h-4 text-blue-600 mr-2" />
            <span>פרטי החשבון שלך מוגנים בהתאם למדיניות הפרטיות של האתר</span>
          </div>
        </CardFooter>
      </Card>

      {/* Change Password Dialog */}
      {canChangePassword && (
        <Dialog
          open={isChangingPassword}
          onOpenChange={(open) => {
            if (!open) resetPasswordForm();
            else setIsChangingPassword(true);
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl flex items-center gap-2">
                <Key className="h-5 w-5 text-blue-600" />
                שינוי סיסמה
              </DialogTitle>
              <DialogDescription>עדכן את סיסמת החשבון שלך</DialogDescription>
            </DialogHeader>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <div className="flex items-center gap-1 text-sm font-medium">
                  <div
                    className={`rounded-full h-6 w-6 flex items-center justify-center ${
                      passwordChangeStep >= 1
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    1
                  </div>
                  <span
                    className={
                      passwordChangeStep >= 1
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }
                  >
                    הזנת סיסמאות
                  </span>
                </div>
                <div className="flex-grow border-t border-gray-300 mt-3 mx-2"></div>
                <div className="flex items-center gap-1 text-sm font-medium">
                  <div
                    className={`rounded-full h-6 w-6 flex items-center justify-center ${
                      passwordChangeStep >= 2
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    2
                  </div>
                  <span
                    className={
                      passwordChangeStep >= 2
                        ? 'text-blue-600'
                        : 'text-gray-500'
                    }
                  >
                    אימות
                  </span>
                </div>
              </div>
              <Progress
                value={passwordChangeStep === 1 ? 50 : 100}
                className="h-1"
              />
            </div>

            {!showVerificationInput ? (
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword" className="text-gray-700">
                    סיסמה נוכחית
                  </Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      disabled={isLoading}
                      className="border-gray-300 focus:border-blue-500 pr-10"
                      placeholder="הזן את הסיסמה הנוכחית"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword" className="text-gray-700">
                    סיסמה חדשה
                  </Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isLoading}
                      className="border-gray-300 focus:border-blue-500 pr-10"
                      placeholder="הזן סיסמה חדשה"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {newPassword && (
                    <div className="mt-2">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-600">
                          חוזק הסיסמה:
                        </span>
                        <span
                          className={`text-xs font-medium ${
                            passwordStrength <= 25
                              ? 'text-red-600'
                              : passwordStrength <= 50
                                ? 'text-orange-600'
                                : passwordStrength <= 75
                                  ? 'text-yellow-600'
                                  : 'text-green-600'
                          }`}
                        >
                          {getPasswordStrengthText()}
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrengthColor()} transition-all duration-300`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>

                      <div className="grid grid-cols-2 gap-x-2 gap-y-1 mt-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          {passwordRequirements.length ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <span
                            className={
                              passwordRequirements.length
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }
                          >
                            לפחות {PASSWORD_MIN_LENGTH} תווים
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          {passwordRequirements.uppercase ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <span
                            className={
                              passwordRequirements.uppercase
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }
                          >
                            אות גדולה באנגלית
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          {passwordRequirements.lowercase ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <span
                            className={
                              passwordRequirements.lowercase
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }
                          >
                            אות קטנה באנגלית
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-xs">
                          {passwordRequirements.number ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-gray-400" />
                          )}
                          <span
                            className={
                              passwordRequirements.number
                                ? 'text-green-600'
                                : 'text-gray-500'
                            }
                          >
                            מספר אחד לפחות
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-700">
                    אימות סיסמה חדשה
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isLoading}
                      className={`border-gray-300 focus:border-blue-500 pr-10 ${
                        confirmPassword && newPassword !== confirmPassword
                          ? 'border-red-300 focus:border-red-500'
                          : ''
                      }`}
                      placeholder="הזן שוב את הסיסמה החדשה"
                    />
                    <button
                      type="button"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-600 mt-1">
                      הסיסמאות אינן תואמות
                    </p>
                  )}
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-700 font-medium">
                    שים לב
                  </AlertTitle>
                  <AlertDescription className="text-blue-600">
                    לאחר אימות הסיסמה הנוכחית, יישלח קוד אימות בן 6 ספרות למייל
                    שלך
                  </AlertDescription>
                </Alert>
              </div>
            ) : (
              <div className="grid gap-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-gray-700">
                    קוד אימות
                  </Label>
                  <Input
                    id="verificationCode"
                    value={verificationCode}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, '')
                        .slice(0, 6);
                      setVerificationCode(value);
                    }}
                    placeholder="הזן את הקוד בן 6 הספרות שנשלח למייל"
                    disabled={isLoading}
                    className="text-center text-lg tracking-wider border-gray-300 focus:border-blue-500"
                    maxLength={6}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-center">
                    קוד האימות תקף ל-24 שעות
                  </p>
                </div>

                <Alert className="bg-blue-50 border-blue-200">
                  <Mail className="h-4 w-4 text-blue-600" />
                  <AlertTitle className="text-blue-700 font-medium">
                    לא קיבלת את הקוד?
                  </AlertTitle>
                  <AlertDescription className="text-blue-600">
                    בדוק את תיבת הדואר הנכנס והספאם. אם הקוד לא התקבל, נסה
                    להתחיל את התהליך מחדש.
                  </AlertDescription>
                </Alert>
              </div>
            )}

            <DialogFooter>
              <Button
                variant="outline"
                onClick={resetPasswordForm}
                disabled={isLoading}
                className="border-gray-300"
              >
                ביטול
              </Button>
              <Button
                onClick={
                  showVerificationInput
                    ? completePasswordChange
                    : initiatePasswordChange
                }
                disabled={
                  isLoading ||
                  (showVerificationInput
                    ? !/^\d{6}$/.test(verificationCode)
                    : false)
                }
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    {showVerificationInput ? 'מאמת...' : 'שולח...'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    {showVerificationInput ? 'אישור' : 'המשך'}
                    {!showVerificationInput && (
                      <ArrowRight className="h-4 w-4" />
                    )}
                  </span>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Account Dialog */}
      <Dialog
        open={isDeletingAccount}
        onOpenChange={(open) => {
          if (!open) {
            setIsDeletingAccount(false);
            setDeleteConfirmText('');
          } else {
            setIsDeletingAccount(true);
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              אישור מחיקת חשבון
            </DialogTitle>
            <DialogDescription>
              פעולה זו תמחק את חשבונך לצמיתות, כולל כל הנתונים האישיים, הפרופיל
              וההתאמות שלך. לא ניתן לשחזר חשבון שנמחק.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <Label htmlFor="deleteConfirm" className="text-gray-700">
              לאישור המחיקה, אנא הקלד:{' '}
              <strong className="text-red-700">
                {DELETE_CONFIRMATION_PHRASE}
              </strong>
            </Label>
            <Input
              id="deleteConfirm"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              disabled={isLoading}
              className="border-gray-300 focus:border-red-500"
              placeholder={DELETE_CONFIRMATION_PHRASE}
            />
            {deleteConfirmText &&
              deleteConfirmText !== DELETE_CONFIRMATION_PHRASE && (
                <p className="text-xs text-red-600">הטקסט שהוקלד אינו תואם.</p>
              )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsDeletingAccount(false);
                setDeleteConfirmText('');
              }}
              disabled={isLoading}
              className="border-gray-300"
            >
              ביטול
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={
                isLoading || deleteConfirmText !== DELETE_CONFIRMATION_PHRASE
              }
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  מוחק...
                </span>
              ) : (
                'מחק חשבון לצמיתות'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AccountSettings;
