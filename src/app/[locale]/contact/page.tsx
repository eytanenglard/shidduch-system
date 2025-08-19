'use client';
import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Loader2,
  Send,
  CheckCircle,
  AlertTriangle,
  Heart,
  MessageCircle,
  Phone,
  Mail,
  Clock,
  Shield,
  Users,
  Star,
  Home,
  UserPlus,
  HelpCircle,
  Lightbulb,
  Target,
  HeartHandshake,
} from 'lucide-react';
import { z } from 'zod';
import Image from 'next/image';
import Link from 'next/link';
import { getRelativeCloudinaryPath } from '@/lib/utils';

// ===== SCHEMAS & TYPES =====
const contactSchema = z.object({
  name: z.string().min(2, { message: 'השם חייב להכיל לפחות 2 תווים' }),
  email: z.string().email({ message: 'כתובת מייל לא תקינה' }),
  category: z.string().min(1, { message: 'נא לבחור נושא' }),
  message: z.string().min(10, { message: 'ההודעה חייבת להכיל לפחות 10 תווים' }),
});

// ===== DATA (UPDATED WITH EMPATHETIC & PROFESSIONAL TONE) =====
const contactCategories = [
  { value: 'process', label: 'אשמח להבין יותר על התהליך', icon: HelpCircle },
  {
    value: 'consultation',
    label: 'אני רוצה להתייעץ באופן אישי',
    icon: HeartHandshake,
  },
  { value: 'general', label: 'יש לי שאלה כללית', icon: MessageCircle },
  { value: 'technical', label: 'אני צריך/ה עזרה טכנית', icon: Users },
];
const quickFAQ = [
  {
    question: 'כמה מהר אקבל מענה?',
    answer:
      'אנו מכבדים את זמנכם ומחויבים לחזור לכל פנייה באופן אישי ומקצועי תוך 24 שעות בימי עבודה.',
  },
  {
    question: 'האם שיחת היכרות ראשונית כרוכה בתשלום?',
    answer:
      'בהחלט לא. שיחת ההיכרות נועדה לבניית אמון והבנה הדדית, והיא ניתנת ללא עלות וללא כל התחייבות.',
  },
  {
    question: 'איך הכי נכון להתחיל את המסע?',
    answer:
      'הדרך הטובה ביותר היא דרך מילוי שאלון ההיכרות המעמיק שלנו. לאחר מכן, שדכן אישי ייצור עמכם קשר לשיחה אישית.',
  },
];
const teamMembers = [
  {
    name: 'דינה אנגלרד',
    role: 'שדכנית ראשית',
    image:
      'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700882/dina4_gr0ako.jpg',
    description:
      'מומחית בליווי אישי וחם, מאמינה שהקשבה היא המפתח לחיבור אמיתי.',
  },
  {
    name: 'איתן אנגלרד',
    role: 'מייסד ומנכ״ל',
    image:
      'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753700884/eitan_h9ylkc.jpg',
    description:
      'יזם ומייסד, משלב טכנולוגיה חכמה עם לב אנושי כדי לבנות את הדרך הבטוחה לזוגיות.',
  },
];

// ===== MAIN COMPONENT =====
export default function ContactPage() {
  const router = useRouter();
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [category, setCategory] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<
    string,
    string[] | undefined
  > | null>(null);

  // Animation refs
  const heroRef = useRef(null);
  const formRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: true });
  const isFormInView = useInView(formRef, { once: true });

  // Form handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);
    setValidationErrors(null);
    const validationResult = contactSchema.safeParse({
      name,
      email,
      category,
      message,
    });
    if (!validationResult.success) {
      setValidationErrors(validationResult.error.flatten().fieldErrors);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: validationResult.data.name,
          email: validationResult.data.email,
          category: validationResult.data.category,
          message: validationResult.data.message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'אירעה שגיאה בשליחת ההודעה');
      }

      setSuccess(true);
      setName('');
      setEmail('');
      setCategory('');
      setMessage('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה לא צפויה');
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-pink-50">
      {/* ===== BACK TO HOME BUTTON ===== */}
      <div className="fixed top-4 left-4 rtl:right-4 rtl:left-auto z-50">
        <Button
          onClick={() => router.push('/')}
          variant="outline"
          size="sm"
          className="bg-white/90 backdrop-blur-sm border-white/60 shadow-lg hover:shadow-xl transition-all duration-300 group"
        >
          <Home className="h-4 w-4 ml-2 group-hover:scale-110 transition-transform" />
          דף הבית
        </Button>
      </div>

      {/* ===== HERO SECTION (UPDATED) ===== */}
      <motion.section
        ref={heroRef}
        className="relative pt-20 pb-12 px-4 text-center overflow-hidden"
        initial={{ opacity: 0 }}
        animate={isHeroInView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.8 }}
      >
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-400/20 to-blue-500/20 rounded-full blur-2xl animate-pulse-slow" />
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-gradient-to-br from-pink-400/20 to-purple-500/20 rounded-full blur-2xl animate-float-slow" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={
              isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.8, delay: 0.2 }}
            className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 shadow-lg border border-white/60 mb-8"
          >
            <HeartHandshake className="w-6 h-6 text-cyan-500" />
            <span className="text-cyan-700 font-semibold">
              שיחה שמתחילה מהלב
            </span>
          </motion.div>

          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight"
            initial={{ opacity: 0, y: 50 }}
            animate={
              isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }
            }
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            מאחורי כל שאלה, יש סיפור.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-pink-600">
              אנחנו כאן כדי להקשיב.
            </span>
          </motion.h1>

          <motion.p
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={
              isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }
            }
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            המסע לזוגיות מעלה התלבטויות רבות. בדיוק בשביל זה אנחנו כאן – להעניק
            ליווי מקצועי, מענה אישי ומרחב בטוח להתייעצות.
            <br />
            <span className="font-semibold text-cyan-700">
              הדלת שלנו פתוחה והדיסקרטיות שלכם מובטחת.
            </span>
          </motion.p>
        </div>
      </motion.section>

      {/* ===== MAIN CONTENT ===== */}
      <div className="max-w-7xl mx-auto px-4 pb-20 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* ===== CONTACT FORM (UPDATED) ===== */}
          <motion.div
            ref={formRef}
            className="lg:col-span-2"
            initial={{ opacity: 0, x: -50 }}
            animate={
              isFormInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -50 }
            }
            transition={{ duration: 0.8 }}
          >
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-100/50 to-pink-100/50 rounded-full transform translate-x-16 -translate-y-16" />
                <div className="relative">
                  <div className="inline-block mx-auto mb-4 p-3 bg-gradient-to-r from-cyan-100 to-pink-100 rounded-full">
                    <Mail className="w-8 h-8 text-cyan-600" />
                  </div>
                  <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
                    נשמח להכיר, לייעץ ולעזור
                  </CardTitle>
                  <CardDescription className="text-lg text-gray-600">
                    כל פנייה נענית באופן אישי, מקצועי ומתוך מחשבה עמוקה.
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="p-8">
                {success ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <AlertTitle className="font-semibold">
                        פנייתכם התקבלה, תודה רבה!
                      </AlertTitle>
                      <AlertDescription className="mt-2">
                        עשיתם צעד משמעותי במסע שלכם. אנו רואים את האמון שנתתם
                        בנו ומתייחסים לכך בכובד הראש. שדכן אישי מצוות
                        NeshamaTech יקרא את פנייתכם ויחזור אליכם תוך 24 שעות.
                        <div className="mt-4 flex gap-3">
                          <Link href="/auth/register">
                            <Button
                              size="sm"
                              className="bg-cyan-600 hover:bg-cyan-700"
                            >
                              <UserPlus className="w-4 h-4 ml-2" />
                              להרשמה והתחלת המסע
                            </Button>
                          </Link>
                          <Link href="/questionnaire">
                            <Button variant="outline" size="sm">
                              לשאלון ההיכרות המעמיק
                            </Button>
                          </Link>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Name and Email */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="name"
                          className="text-sm font-medium text-gray-700"
                        >
                          שם מלא *
                        </label>
                        <Input
                          id="name"
                          type="text"
                          placeholder="השם הפרטי והמשפחה"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          disabled={isLoading}
                          className={`transition-all duration-300 focus:border-cyan-500 focus:ring-cyan-500 ${validationErrors?.name ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {validationErrors?.name && (
                          <p className="text-xs text-red-600 mt-1">
                            {validationErrors.name[0]}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="text-sm font-medium text-gray-700"
                        >
                          כתובת אימייל *
                        </label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="your.email@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          disabled={isLoading}
                          className={`transition-all duration-300 focus:border-cyan-500 focus:ring-cyan-500 ${validationErrors?.email ? 'border-red-500 focus:border-red-500' : ''}`}
                        />
                        {validationErrors?.email && (
                          <p className="text-xs text-red-600 mt-1">
                            {validationErrors.email[0]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Category Selection */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium text-gray-700">
                        נושא הפנייה *
                      </label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {contactCategories.map((cat) => (
                          <label
                            key={cat.value}
                            className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                              category === cat.value
                                ? 'border-cyan-500 bg-cyan-50'
                                : 'border-gray-200 hover:border-cyan-300 hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="radio"
                              name="category"
                              value={cat.value}
                              checked={category === cat.value}
                              onChange={(e) => setCategory(e.target.value)}
                              className="sr-only"
                            />
                            <cat.icon
                              className={`w-5 h-5 ${category === cat.value ? 'text-cyan-600' : 'text-gray-400'}`}
                            />
                            <span
                              className={`font-medium ${category === cat.value ? 'text-cyan-800' : 'text-gray-700'}`}
                            >
                              {cat.label}
                            </span>
                          </label>
                        ))}
                      </div>
                      {validationErrors?.category && (
                        <p className="text-xs text-red-600">
                          {validationErrors.category[0]}
                        </p>
                      )}
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                      <label
                        htmlFor="message"
                        className="text-sm font-medium text-gray-700"
                      >
                        ההודעה שלכם *
                      </label>
                      <Textarea
                        id="message"
                        placeholder="שתפו אותנו במה שעל הלב... כל פרט יעזור לנו לתת לכם את המענה הטוב ביותר"
                        rows={6}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        disabled={isLoading}
                        className={`transition-all duration-300 focus:border-cyan-500 focus:ring-cyan-500 resize-none ${validationErrors?.message ? 'border-red-500 focus:border-red-500' : ''}`}
                      />
                      {validationErrors?.message && (
                        <p className="text-xs text-red-600 mt-1">
                          {validationErrors.message[0]}
                        </p>
                      )}
                    </div>

                    {/* Error Alert */}
                    {error && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertTitle>שגיאה</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}

                    {/* Submit Button */}
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 rounded-xl py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group relative overflow-hidden"
                      disabled={isLoading}
                    >
                      <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -translate-x-full group-hover:animate-shimmer"></span>
                      <span className="relative z-10 flex items-center justify-center">
                        {isLoading ? (
                          <>
                            <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                            שולחים...
                          </>
                        ) : (
                          <>
                            <Send className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            שליחת פנייה
                          </>
                        )}
                      </span>
                    </Button>

                    <div className="text-center text-sm text-gray-500 mt-4">
                      <Shield className="w-4 h-4 inline ml-2" />
                      המידע שלכם מטופל בדיסקרטיות מוחלטת ובמקצועיות. זו
                      ההתחייבות שלנו.
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* ===== SIDEBAR (REORDERED & UPDATED) ===== */}
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            animate={
              isFormInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }
            }
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            {/* Team Section (Moved Up) */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Users className="w-6 h-6 text-cyan-500" />
                  הצוות שלכם, כאן בשבילכם
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {teamMembers.map((member, index) => (
                    <motion.div
                      key={index}
                      className="flex items-center gap-4 p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl"
                      initial={{ opacity: 0, x: 20 }}
                      animate={
                        isFormInView
                          ? { opacity: 1, x: 0 }
                          : { opacity: 0, x: 20 }
                      }
                      transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
                    >
                      <div className="relative w-16 h-16 rounded-full overflow-hidden shadow-md">
                        <Image
                          src={getRelativeCloudinaryPath(member.image)}
                          alt={member.name}
                          fill
                          sizes="64px"
                          className="object-cover object-center"
                        />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800">
                          {member.name}
                        </h4>
                        <p className="text-sm text-cyan-600 font-medium">
                          {member.role}
                        </p>
                        <p className="text-xs text-gray-500">
                          {member.description}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick FAQ */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Lightbulb className="w-6 h-6 text-orange-500" />
                  תשובות מהירות לשאלות חשובות
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {quickFAQ.map((item, index) => (
                  <motion.div
                    key={index}
                    className="p-4 bg-gray-50 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={
                      isFormInView
                        ? { opacity: 1, y: 0 }
                        : { opacity: 0, y: 20 }
                    }
                    transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
                  >
                    <h4 className="font-semibold text-gray-800 mb-2">
                      {item.question}
                    </h4>
                    <p className="text-sm text-gray-600">{item.answer}</p>
                  </motion.div>
                ))}
              </CardContent>
            </Card>

            {/* Contact Info */}
            <Card className="shadow-xl border-0 bg-gradient-to-br from-cyan-600 to-pink-600 text-white">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Phone className="w-6 h-6" />
                  דרכים נוספות ליצירת קשר
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5" />
                    <span>054-321-0040</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5" />
                    <span>jewish.matchpoint@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5" />
                    <span>א-ה 9:00-18:00, ו 9:00-13:00</span>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white/20 rounded-xl backdrop-blur-sm">
                  <p className="text-sm">
                    <strong>התחייבות למענה:</strong> אנו מבינים את חשיבות
                    פנייתכם ומבטיחים מענה אישי ומקצועי.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CTA Section */}
            <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <Target className="w-12 h-12 mx-auto mb-4 text-pink-500" />
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  מוכנים לצעד הבא במסע?
                </h3>
                <p className="text-gray-600 mb-6 text-sm">
                  שאלון ההיכרות המעמיק שלנו הוא הדרך הטובה ביותר עבורנו להבין
                  אתכם, ועבורכם להתחיל את התהליך בביטחון.
                </p>
                <div className="space-y-3">
                  <Link href="/auth/register">
                    <Button className="w-full bg-gradient-to-r from-cyan-600 to-pink-600 hover:from-cyan-700 hover:to-pink-700 rounded-xl">
                      <UserPlus className="w-4 h-4 ml-2" />
                      הרשמה ראשונית (ללא עלות)
                    </Button>
                  </Link>
                  <Link href="/questionnaire">
                    <Button variant="outline" className="w-full rounded-xl">
                      לשאלון ההיכרות שלנו
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      {/* ===== FOOTER ===== */}
      <footer className="bg-gray-800 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="relative w-8 h-8">
              <Image
                src={getRelativeCloudinaryPath(
                  'https://res.cloudinary.com/dmfxoi6g0/image/upload/v1753713907/ChatGPT_Image_Jul_28_2025_05_45_00_PM_zueqou.png'
                )}
                alt="NeshamaTech Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-400">
              NeshamaTech
            </span>
          </div>
          <p className="text-gray-400 mb-4">זוגיות שמתחילה מהנשמה</p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} NeshamaTech. כל הזכויות שמורות.
          </p>
        </div>
      </footer>

      {/* ===== CUSTOM STYLES ===== */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        @keyframes pulse-slow {
          0%,
          100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.6;
          }
        }
        @keyframes float-slow {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-20px);
          }
        }
        .animate-shimmer {
          animation: shimmer 1.5s ease-in-out;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
