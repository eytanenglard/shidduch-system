// src/components/ui/CookieBanner.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './button';
import { Shield, X, Cookie } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CookieBanner = () => {
  const [consent, setConsent] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const storedConsent = localStorage.getItem('cookie_consent');
    setConsent(storedConsent);

    // הצגת הבאנר עם עיכוב קצר לטעינה חלקה יותר
    if (!storedConsent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setConsent('true');
    localStorage.setItem('cookie_consent', 'true');
    setIsVisible(false);
    window.location.reload();
  };

  const handleDecline = () => {
    setConsent('false');
    localStorage.setItem('cookie_consent', 'false');
    setIsVisible(false);
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // אם המשתמש כבר בחר, אל תציג את הבאנר
  if (consent === 'true' || consent === 'false') {
    return null;
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{
            type: 'spring',
            stiffness: 300,
            damping: 30,
            duration: 0.6,
          }}
          className="fixed bottom-0 left-0 right-0 z-[100] pointer-events-none"
        >
          {/* רקע מטושטש */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/95 via-slate-800/90 to-transparent backdrop-blur-md pointer-events-none" />

          <div className="relative pointer-events-auto">
            <div className="max-w-7xl mx-auto px-4 py-6">
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-6 md:p-8"
              >
                {/* רקע דקורטיבי */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-50/80 via-white/90 to-pink-50/80 rounded-2xl" />
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-200/20 to-transparent rounded-full transform translate-x-16 -translate-y-16" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-pink-200/20 to-transparent rounded-full transform -translate-x-12 translate-y-12" />

                {/* כפתור סגירה */}
                <button
                  onClick={handleDismiss}
                  className="absolute top-4 left-4 p-2 rounded-full bg-gray-100/80 hover:bg-gray-200/80 transition-colors duration-200 group"
                  aria-label="סגור באנר קוקיז"
                >
                  <X className="w-4 h-4 text-gray-600 group-hover:text-gray-800" />
                </button>

                <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
                  {/* אייקון ותוכן */}
                  <div className="lg:col-span-2 flex items-start gap-4">
                    {/* אייקון מעוצב */}
                    <motion.div
                      initial={{ rotate: -10, scale: 0.8 }}
                      animate={{ rotate: 0, scale: 1 }}
                      transition={{
                        delay: 0.3,
                        type: 'spring',
                        stiffness: 200,
                      }}
                      className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-cyan-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg"
                    >
                      <Cookie className="w-6 h-6 text-white" />
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <motion.h3
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-xl font-bold text-gray-800 mb-2 flex items-center gap-2"
                      >
                        <Shield className="w-5 h-5 text-cyan-600" />
                        פרטיות ושקיפות
                      </motion.h3>

                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="text-gray-700 leading-relaxed text-sm md:text-base"
                      >
                        אנו משתמשים ב&quot;עוגיות&quot; (Cookies), כולל אלו של
                        Google Analytics, כדי לשפר את חווית הגלישה שלך ולנתח את
                        תנועת הגולשים באתר. המידע נאסף באופן אנונימי. למידע
                        נוסף, אנא עיין/י ב
                        <Link
                          href="/legal/privacy-policy"
                          className="text-cyan-600 hover:text-cyan-700 font-medium mx-1 underline decoration-2 underline-offset-2 hover:decoration-cyan-700 transition-colors"
                        >
                          מדיניות הפרטיות
                        </Link>
                        שלנו.
                      </motion.p>
                    </div>
                  </div>

                  {/* כפתורי פעולה */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:items-stretch"
                  >
                    <Button
                      onClick={handleAccept}
                      className="relative overflow-hidden bg-gradient-to-r from-cyan-500 to-pink-500 hover:from-cyan-600 hover:to-pink-600 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group flex-1 lg:flex-none"
                    >
                      <span className="relative z-10 font-semibold">
                        מסכים/ה
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Button>

                    <Button
                      onClick={handleDecline}
                      variant="outline"
                      className="border-2 border-gray-300 text-gray-700 bg-white/80 hover:bg-gray-50 hover:border-gray-400 rounded-xl transition-all duration-300 flex-1 lg:flex-none"
                    >
                      <span className="font-medium">מסרב/ת</span>
                    </Button>
                  </motion.div>
                </div>

                {/* קו דקורטיבי תחתון */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-cyan-400 via-pink-400 to-cyan-400 rounded-full" />
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
