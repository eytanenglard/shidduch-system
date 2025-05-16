"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  CheckCircle,
  Mail,
  User,
  Phone,
  ShieldQuestion,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";
// ודא שהנתיב לייבוא נכון. יכול להיות שזה ישירות מ-@prisma/client אם ייצאת אותו משם
import { UserStatus } from "@prisma/client"; // אם זה הנתיב שבו UserStatus מוגדר
import type { User as SessionUserType } from "@/types/next-auth"; // ... (variants נשארים אותו דבר) ...
const containerVariants = {
  /* ... */
};
const itemVariants = {
  /* ... */
};
const circleVariants = {
  /* ... */
};

const CompleteStep: React.FC = () => {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const navigateToProfile = () => router.push("/profile/me");
  const navigateToQuestionnaire = () => router.push("/questionnaire");
  const navigateToVerifyPhone = () => router.push("/auth/verify-phone");
  const navigateToCompleteProfile = () => router.push("/auth/complete-profile");

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center items-center h-40">
        <p className="text-lg text-gray-600">טוען נתונים...</p>
      </div>
    );
  }

  if (!session?.user) {
    router.push("/auth/signin");
    return null;
  }

  const user = session.user as SessionUserType; // ודא ש-SessionUserType מיובא נכון

  // תרחיש 1: צריך לאמת אימייל (ורק אם ההרשמה היא עם אימייל/סיסמה)
  // נניח ש-user.accounts הוא מערך של PrismaAccount
  const isCredentialsUser = user.accounts?.every(
    (acc) => acc.provider === "credentials"
  );

  // *******************************************************************
  // כאן השינוי: השתמש בערכים מה-enum UserStatus שלך
  // *******************************************************************
  if (
    !user.isVerified &&
    isCredentialsUser &&
    user.status === UserStatus.PENDING_EMAIL_VERIFICATION
  ) {
    return (
      <motion.div
        className="space-y-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ... תוכן לאימות מייל ... */}
        <motion.div
          className="flex justify-center mb-6"
          variants={circleVariants}
        >
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 flex items-center justify-center">
            <motion.div
              className="absolute inset-1 bg-white rounded-full flex items-center justify-center"
              animate={{ scale: [0.6, 1] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Mail className="h-14 w-14 text-cyan-500" />
            </motion.div>
          </div>
        </motion.div>
        <motion.h2
          className="text-2xl font-bold text-gray-800"
          variants={itemVariants}
        >
          אימות כתובת המייל
        </motion.h2>
        <motion.div variants={itemVariants}>
          <div className="p-4 bg-cyan-50 rounded-lg mb-5">
            <div className="flex items-center gap-2 text-cyan-700 mb-2 justify-center">
              <Mail className="h-5 w-5" />
              <h3 className="font-medium">אנא אמת את כתובת המייל שלך</h3>
            </div>
            <p className="text-sm text-cyan-600">
              שלחנו לך מייל לכתובת{" "}
              <span className="font-bold">{user.email}</span>.
              <br />
              אנא לחץ על הקישור במייל כדי להשלים את תהליך האימות.
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  // תרחיש 2: צריך להשלים פרופיל
  if (user.isVerified && !user.isProfileComplete) {
    return (
      <motion.div
        className="space-y-6 text-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* ... תוכן להשלמת פרופיל ... */}
        <motion.div
          className="flex justify-center mb-6"
          variants={circleVariants}
        >
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 flex items-center justify-center">
            <motion.div
              className="absolute inset-1 bg-white rounded-full flex items-center justify-center"
              animate={{ scale: [0.6, 1] }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <User className="h-14 w-14 text-cyan-500" />
            </motion.div>
          </div>
        </motion.div>
        <motion.h2
          className="text-2xl font-bold text-gray-800"
          variants={itemVariants}
        >
          השלמת פרטי פרופיל
        </motion.h2>
        <motion.p className="text-gray-600 mb-6" variants={itemVariants}>
          כדי שנוכל להתאים לך את השידוכים הטובים ביותר, אנא השלם את פרטי הפרופיל
          שלך.
        </motion.p>
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <Button
            onClick={navigateToCompleteProfile}
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-lg shadow-lg flex items-center justify-center gap-2"
          >
            <User className="h-5 w-5 text-white" />
            <span className="text-white">להשלמת הפרופיל</span>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // תרחיש 3: צריך לאמת טלפון
  // *******************************************************************
  // כאן השינוי: השתמש בערכים מה-enum UserStatus שלך
  // יכול להיות שגם תרצה לבדוק user.status === UserStatus.PENDING_PHONE_VERIFICATION
  // *******************************************************************
  if (
    user.isVerified &&
    user.isProfileComplete &&
    !user.isPhoneVerified &&
    user.status === UserStatus.PENDING_PHONE_VERIFICATION
  ) {
    return (
      <motion.div /* ... */>
        {/* ... הצגת אייקון, כותרת, וטקסט ... */}
        <motion.div variants={itemVariants} className="flex flex-col gap-4">
          <Button
            onClick={navigateToVerifyPhone} // הפונקציה הזו עושה router.push('/auth/verify-phone')
            className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-lg shadow-lg flex items-center justify-center gap-2"
          >
            <Phone className="h-5 w-5 text-white" />
            <span className="text-white">לאימות מספר הטלפון</span>
          </Button>
        </motion.div>
      </motion.div>
    );
  }

  // תרחיש 4: הכל הושלם! (או user.status === UserStatus.ACTIVE)
  return (
    <motion.div
      className="space-y-6 text-center"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* ... תוכן להכל הושלם ... */}
      <motion.div
        className="flex justify-center mb-6"
        variants={circleVariants}
      >
        <div className="relative w-28 h-28 rounded-full bg-gradient-to-r from-cyan-500 to-pink-500 flex items-center justify-center">
          <motion.div
            className="absolute inset-1 bg-white rounded-full flex items-center justify-center"
            animate={{ scale: [0.6, 1] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <CheckCircle className="h-14 w-14 text-green-500" />
          </motion.div>
        </div>
      </motion.div>
      <motion.h2
        className="text-2xl font-bold text-gray-800"
        variants={itemVariants}
      >
        ההרשמה והפרופיל הושלמו בהצלחה!
      </motion.h2>
      <motion.div variants={itemVariants}>
        <p className="text-gray-600 mb-6">
          מעולה! כל הפרטים שלך מאומתים ומוכנים.
          <br />
          עכשיו תוכל להתחיל בתהליך מציאת השידוך.
        </p>
      </motion.div>
      <motion.div variants={itemVariants} className="flex flex-col gap-4">
        <Button
          onClick={navigateToProfile}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 rounded-lg shadow-lg flex items-center justify-center gap-2 group relative overflow-hidden"
        >
          <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/30 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
          <User className="h-5 w-5 text-white" />
          <span className="text-white">לפרופיל שלי</span>
          <ArrowLeft className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300" />
        </Button>
        <Button
          onClick={navigateToQuestionnaire}
          variant="outline"
          className="w-full py-3 border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 flex items-center justify-center gap-2"
        >
          <ShieldQuestion className="h-5 w-5" />
          <span>למילוי שאלון התאמה</span>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Link
          href="/"
          className="text-sm text-gray-500 hover:text-gray-700 hover:underline mt-2"
        >
          חזרה לדף הבית
        </Link>
      </motion.div>
    </motion.div>
  );
};

export default CompleteStep;
