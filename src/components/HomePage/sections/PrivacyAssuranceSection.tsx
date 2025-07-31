import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, Lock } from 'lucide-react';

const PrivacyAssuranceSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.3,
        delayChildren: 0.2,
      },
    },
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 60 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  const staggeredListVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.4,
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.9, y: 30 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        scale: {
          type: 'spring',
          stiffness: 260,
          damping: 20,
        },
      },
    },
  };

  const privacyFeatures = [
    'פרופילים גלויים רק לשדכנים מורשים, מבטיחים דיסקרטיות מלאה',
    'הצפנת מידע מקצה לקצה להגנה על כל הנתונים האישיים',
    'בדיקות אבטחה קבועות וביקורות חיצוניות לוודא עמידה בסטנדרטים המחמירים ביותר',
    'מדיניות אפס-שיתוף - המידע שלך לעולם לא נמכר או משותף עם צדדים שלישיים',
    'יכולת שליטה מלאה בנתונים שלך בכל עת',
  ];

  return (
    <motion.section
      ref={ref}
      className="py-16 md:py-20 px-4 bg-gradient-to-br from-cyan-600 to-cyan-700 text-white relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+')]"></div>

      <div className="absolute top-0 left-0 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-white/10 rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left Content */}
          <motion.div variants={fadeInLeft}>
            <div className="mb-8 text-center md:text-right">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                הפרטיות שלך חשובה לנו
              </h2>
              <div className="w-24 h-1 bg-white/30 rounded-full mb-6 mx-auto md:mr-0"></div>
              <p className="text-lg text-white/90 mb-6 mx-auto md:mx-0 max-w-md">
                בעולם השידוכים, הדיסקרטיות והפרטיות הן קריטיות. ב-Match Point
                פיתחנו מערכת שמתעדפת את האבטחה והפרטיות שלך בכל שלב.
              </p>
            </div>

            <motion.div className="space-y-4" variants={staggeredListVariants}>
              {privacyFeatures.map((feature, index) => (
                <motion.div
                  key={index}
                  className="flex items-start"
                  variants={listItemVariants}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white/20 rounded-full p-2 mr-3 mt-1 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-white" />
                  </div>
                  <p className="text-white/90">{feature}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Card */}
          <motion.div className="flex justify-center" variants={fadeInRight}>
            <div className="relative max-w-sm w-full">
              {/* Background decoration */}
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-lg transform rotate-6"></div>

              {/* Main card */}
              <motion.div
                className="relative bg-white/20 backdrop-blur-sm p-8 rounded-2xl border border-white/30"
                variants={cardVariants}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
              >
                {/* Lock icon */}
                <motion.div
                  className="w-16 h-16 mx-auto mb-6 bg-white/30 rounded-full flex items-center justify-center"
                  whileHover={{
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.6 },
                  }}
                >
                  <Lock className="w-8 h-8 text-white" />
                </motion.div>

                <h3 className="text-xl font-bold mb-4 text-center">
                  הבטחת הפרטיות שלנו
                </h3>

                <p className="text-white/90 text-center mb-6">
                  אנו מתחייבים לשמור על הפרטיות והכבוד של כל משתמש במערכת שלנו,
                  תוך יצירת סביבה בטוחה ומכבדת למציאת הזיווג המושלם
                </p>

                <div className="text-center">
                  <Link href="/privacy">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="border-2 border-white/50 bg-white text-cyan-600 hover:bg-white/90 transition-all duration-300 rounded-xl"
                      >
                        קראו את מדיניות הפרטיות
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default PrivacyAssuranceSection;
