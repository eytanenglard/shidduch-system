// src/components/HomePage/sections/PrivacyAssuranceSection.tsx

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

  // UPDATED Privacy Features
  const privacyFeatures = [
    'הפרופיל שלכם גלוי אך ורק לצוות השדכנים האישי שלכם, מה שמבטיח דיסקרטיות מלאה.',
    'כל שיחה וכל פרט שאתם חולקים איתנו נשמרים בינינו, באמצעות טכנולוגיות אבטחה מתקדמות.',
    'המידע שלכם הוא קודש. הוא לעולם לא יימכר או ישותף עם אף גורם מחוץ למערכת. זו הבטחה.',
    'אתם בשליטה מלאה. שום פרט לא ייחשף בפני הצעה פוטנציאלית ללא אישורכם המפורש.',
  ];

  return (
    <motion.section
      ref={ref}
      className="py-16 md:py-20 px-4 bg-gradient-to-br from-gray-800 to-gray-900 text-white relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgdmlld0JveD0iMCAwIDIwIDIwIj48Y2lyY2xlIGN4PSIxMCIgY3k9IjEwIiByPSIxIiBmaWxsPSIjZmZmZmZmIi8+PC9zdmc+')]"></div>

      <div className="absolute top-0 left-0 w-40 h-40 bg-cyan-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-0 right-0 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <div className="max-w-5xl mx-auto relative">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div variants={fadeInLeft}>
            <div className="mb-8 text-center md:text-right">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4">
                המרחב הבטוח שלכם
              </h2>
              <div className="w-24 h-1 bg-cyan-500/50 rounded-full mb-6 mx-auto md:mr-0"></div>
              <p className="text-lg text-white/80 mb-6 mx-auto md:mx-0 max-w-md">
                בעולם השידוכים, אמון ודיסקרטיות הם הבסיס להכל. בנינו את המערכת
                שלנו סביב העיקרון הזה, כדי שתוכלו להרגיש בטוחים ונינוחים לאורך
                כל הדרך.
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
                  <div className="bg-cyan-500/20 rounded-full p-2 mr-3 mt-1 flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-cyan-400" />
                  </div>
                  <p className="text-white/90">{feature}</p>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Right Card */}
          <motion.div className="flex justify-center" variants={fadeInRight}>
            <div className="relative max-w-sm w-full">
              <div className="absolute inset-0 bg-white/10 rounded-2xl blur-lg transform rotate-6"></div>

              <motion.div
                className="relative bg-white/10 backdrop-blur-sm p-8 rounded-2xl border border-white/20"
                variants={cardVariants}
                whileHover={{
                  scale: 1.02,
                  transition: { duration: 0.2 },
                }}
              >
                <motion.div
                  className="w-16 h-16 mx-auto mb-6 bg-cyan-500/30 rounded-full flex items-center justify-center border border-cyan-400/50"
                  whileHover={{
                    rotate: [0, -10, 10, 0],
                    transition: { duration: 0.6 },
                  }}
                >
                  <Lock className="w-8 h-8 text-cyan-300" />
                </motion.div>

                <h3 className="text-xl font-bold mb-4 text-center text-white">
                  ההבטחה שלנו לפרטיות
                </h3>

                <p className="text-white/80 text-center mb-6">
                  אנו מתחייבים לשמור על כבודכם ועל המידע האישי שלכם, וליצור
                  סביבה בטוחה ומכבדת למציאת הזיווג הנכון.
                </p>

                <div className="text-center">
                  <Link href="/privacy">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button
                        variant="outline"
                        className="border-2 border-cyan-400/50 bg-cyan-500/20 text-white hover:bg-cyan-500/30 transition-all duration-300 rounded-xl"
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
