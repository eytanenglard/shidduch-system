"use client";

import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Mail, Key, Shield, Clock } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { UserRole, UserStatus } from "@prisma/client";

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
  };
}

const PASSWORD_MIN_LENGTH = 8;

const AccountSettings: React.FC<AccountSettingsProps> = ({ user }) => {
  const { update: updateSession } = useSession();

  const [isEditingName, setIsEditingName] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [showVerificationInput, setShowVerificationInput] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validatePassword = (password: string) => {
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new Error(`הסיסמה חייבת להכיל לפחות ${PASSWORD_MIN_LENGTH} תווים`);
    }
    if (!/[A-Z]/.test(password)) {
      throw new Error("הסיסמה חייבת להכיל לפחות אות גדולה באנגלית");
    }
    if (!/[a-z]/.test(password)) {
      throw new Error("הסיסמה חייבת להכיל לפחות אות קטנה באנגלית");
    }
    if (!/[0-9]/.test(password)) {
      throw new Error("הסיסמה חייבת להכיל לפחות ספרה אחת");
    }
  };

  const resetPasswordForm = () => {
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setVerificationCode("");
    setShowVerificationInput(false);
    setIsChangingPassword(false);
  };

  const sendVerificationEmail = async () => {
    setIsSendingVerification(true);
    try {
      const response = await fetch(`/api/auth/send-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: user.email }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to send verification email");
      }

      toast.success("קוד אימות נשלח למייל שלך");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בשליחת קוד אימות");
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handleNameUpdate = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      toast.error("נא למלא את כל השדות");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/profile/${user.id}/name`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to update name");

      await updateSession();
      toast.success("השם עודכן בהצלחה");
      setIsEditingName(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בעדכון השם");
    } finally {
      setIsLoading(false);
    }
  };

  const initiatePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error("נא למלא את כל השדות");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("הסיסמאות אינן תואמות");
      return;
    }

    try {
      validatePassword(newPassword);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה באימות הסיסמה");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/initiate-password-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to initiate password change");
      }

      setShowVerificationInput(true);
      toast.success("קוד אימות נשלח למייל שלך");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה באימות הסיסמה");
      resetPasswordForm();
    } finally {
      setIsLoading(false);
    }
  };

  const completePasswordChange = async () => {
    if (!verificationCode) {
      toast.error("נא להזין את קוד האימות");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/auth/complete-password-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          token: verificationCode,
          newPassword,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to complete password change");
      }

      toast.success("הסיסמה עודכנה בהצלחה");
      resetPasswordForm();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "שגיאה בעדכון הסיסמה");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="shadow-sm">
        <CardHeader className="border-b pb-3">
          <CardTitle className="text-xl">הגדרות חשבון</CardTitle>
          <CardDescription>נהל את פרטי החשבון והאבטחה שלך</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {/* Basic Info Section */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-medium">פרטים בסיסיים</h3>
                <p className="text-sm text-muted-foreground">
                  השם והמייל המשמשים אותך באתר
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditingName(true)}
                disabled={isLoading}
              >
                עריכה
              </Button>
            </div>

            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">שם מלא</p>
                  <p className="text-sm text-muted-foreground">
                    {user.firstName || "לא צוין"} {user.lastName || "לא צוין"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                <div className="flex items-center gap-2">
                  <div>
                    <p className="text-sm font-medium">כתובת מייל</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                  </div>
                  {!user.isVerified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={sendVerificationEmail}
                      disabled={isSendingVerification}
                    >
                      שלח קוד אימות
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Account Status Section */}
          <div className="py-3">
            <h3 className="text-base font-medium mb-2">סטטוס חשבון</h3>
            <div className="grid gap-2">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">הרשאות</p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline">{user.role}</Badge>
                    <Badge variant={user.status === "ACTIVE" ? "success" : "warning"}>
                      {user.status}
                    </Badge>
                    <Badge variant={user.isVerified ? "success" : "destructive"}>
                      {user.isVerified ? "מאומת" : "לא מאומת"}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-sm font-medium">פרטי זמן</p>
                  <p className="text-sm text-muted-foreground">
                    נוצר ב: {new Date(user.createdAt).toLocaleDateString("he-IL")}
                    {user.lastLogin && ` • התחברות אחרונה: ${new Date(user.lastLogin).toLocaleDateString("he-IL")}`}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div className="py-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-base font-medium">אבטחה</h3>
                <p className="text-sm text-muted-foreground">
                  הגדרות אבטחה וסיסמה
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsChangingPassword(true)}
                disabled={isLoading}
              >
                שינוי סיסמה
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-muted-foreground shrink-0" />
              <div>
                <p className="text-sm font-medium">אימות חשבון</p>
                <p className="text-sm text-muted-foreground">
                  {user.isVerified ? "החשבון מאומת" : "החשבון לא מאומת"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Edit Name Dialog */}
      <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>עריכת שם</DialogTitle>
            <DialogDescription>עדכן את שמך כפי שיוצג באתר</DialogDescription>
          </DialogHeader>

          <div className="grid gap-3 py-3">
            <div className="space-y-1">
              <Label>שם פרטי</Label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1">
              <Label>שם משפחה</Label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditingName(false)}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button onClick={handleNameUpdate} disabled={isLoading}>
              שמירה
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog
        open={isChangingPassword}
        onOpenChange={(open) => {
          if (!open) resetPasswordForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>שינוי סיסמה</DialogTitle>
            <DialogDescription>עדכן את סיסמת החשבון שלך</DialogDescription>
          </DialogHeader>

          {!showVerificationInput ? (
            <div className="grid gap-3 py-3">
              <div className="space-y-1">
                <Label>סיסמה נוכחית</Label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label>סיסמה חדשה</Label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-1">
                <Label>אימות סיסמה חדשה</Label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <Alert>
                <AlertDescription>
                  לאחר אימות הסיסמה הנוכחית, יישלח קוד אימות למייל שלך
                </AlertDescription>
              </Alert>
            </div>
          ) : (
            <div className="grid gap-3 py-3">
              <div className="space-y-1">
                <Label>קוד אימות</Label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="הזן את הקוד שנשלח למייל"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={resetPasswordForm}
              disabled={isLoading}
            >
              ביטול
            </Button>
            <Button
              onClick={
                showVerificationInput
                  ? completePasswordChange
                  : initiatePasswordChange
              }
              disabled={isLoading}
            >
              {showVerificationInput ? "אישור" : "המשך"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Password Requirements Alert */}
      {isChangingPassword && (
        <Alert className="mt-4">
          <AlertDescription>
            <h4 className="font-medium mb-1">דרישות הסיסמה:</h4>
            <ul className="text-sm space-y-1">
              <li>• לפחות {PASSWORD_MIN_LENGTH} תווים</li>
              <li>• אות גדולה באנגלית</li>
              <li>• אות קטנה באנגלית</li>
              <li>• מספר אחד לפחות</li>
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default AccountSettings;