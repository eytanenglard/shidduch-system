import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ComparisonItem from '../components/ComparisonItem';
import Link from 'next/link';

const ValuePropositionSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Variants for different animation types
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.7, ease: 'easeOut' },
    },
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 50 },
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
      },
    },
  };

  const listItemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  };

  return (
    <motion.section
      ref={ref}
      className="py-16 md:py-20 pb-0 px-4 bg-cyan-50 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-50 to-white opacity-70"></div>
      <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
        <svg
          className="absolute right-0 top-0 h-full opacity-10"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C40,100 60,100 100,0 L100,100 L0,100 Z"
            fill="url(#grad2)"
          ></path>
          <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#22d3ee" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header with updated content */}
        <motion.div className="text-center mb-12" variants={fadeInUp}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            מה הופך את
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700">
              {' '}
              NeshamaTech{' '}
            </span>
            לייחודית?
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            הגישה שלנו משלבת את העוצמה של טכנולוגיה חכמה עם החום, הניסיון
            והליווי האישי של שדכנות מקצועית.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Left card - Challenge */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 transform md:translate-x-4 relative overflow-hidden"
            variants={fadeInLeft}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-100 to-cyan-50 opacity-50 rounded-full transform translate-x-20 -translate-y-20"></div>

            <h3 className="text-xl font-bold mb-4 text-gray-800 relative">
              האתגרים במסע לזוגיות שכולנו מכירים
            </h3>

            <motion.ul
              className="space-y-3 relative"
              variants={staggeredListVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <motion.div variants={listItemVariants}>
                <ComparisonItem isNegative>
                  תחושת חשיפת יתר ותחושה של ‘סחורה על המדף’ באפליקציות
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem isNegative>
                  פלטפורמות גנריות שלא מבינות את הניואנסים החשובים בעולם הדתי
                  והמסורתי
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem isNegative>
                  בזבוז זמן ואנרגיה על שיחות שטחיות והצעות לא רלוונטיות
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem isNegative>
                  היכרות מוגבלת למעגל החברים הקרוב בלבד
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem isNegative>
                  שדכנות מסורתית שלעיתים מוגבלת במאגר ובתהליכים איטיים
                </ComparisonItem>
              </motion.div>
            </motion.ul>
          </motion.div>

          {/* Right card - Solution */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 transform md:-translate-x-4 relative overflow-hidden"
            variants={fadeInRight}
          >
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-cyan-100 to-cyan-50 opacity-50 rounded-full transform -translate-x-20 translate-y-20"></div>

            <h3 className="text-xl font-bold mb-4 text-gray-800 relative">
              הגישה של NeshamaTech: טכנולוגיה בשירות הלב
            </h3>

            <motion.ul
              className="space-y-3 relative"
              variants={staggeredListVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              <motion.div variants={listItemVariants}>
                <ComparisonItem>
                  <strong>מאגר רחב, חיפוש ממוקד:</strong> המערכת שלנו סורקת מאגר
                  רחב ואיכותי של מועמדים, ומאפשרת לשדכנים להציג בפניך הזדמנויות
                  מדויקות שאולי לא היית פוגש/ת אחרת.
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem>
                  <strong>ליווי אישי חם:</strong> אתם לא לבד. שדכן אישי מלווה
                  אתכם, מכיר אתכם לעומק, ומייעץ בכל שלב במסע.
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem>
                  <>
                    <strong>התאמה עם עומק אמיתי:</strong> אלגוריתם חכם מנתח
                    עשרות ממדי התאמה, המבוססים על תשובותיך ב
                    <Link
                      href="/questionnaire"
                      className="text-cyan-600 hover:underline font-semibold mx-1"
                    >
                      שאלון הייחודי
                    </Link>
                    שלנו, כדי לחשוף חיבורים ברמת הערכים והאישיות.
                  </>
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem>
                  <strong>דיסקרטיות מוחלטת:</strong> הפרופיל שלכם נשאר חסוי
                  ומוצג אך ורק לשדכנים בצוות. אף פרט לא נחשף לצד השני ללא
                  אישורכם המפורש.
                </ComparisonItem>
              </motion.div>
              <motion.div variants={listItemVariants}>
                <ComparisonItem>
                  <strong>כבוד למסורת, כלים של המחר:</strong> פלטפורמה שמבינה
                  ומכבדת את עולם הערכים שלכם, ומשתמשת בטכנולוגיה כדי להפוך את
                  החיפוש ליעיל ומכבד יותר.
                </ComparisonItem>
              </motion.div>
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ValuePropositionSection;
