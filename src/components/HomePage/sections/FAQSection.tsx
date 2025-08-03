// src/components/HomePage/sections/FAQSection.tsx

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import FAQItem from '../components/FAQItem';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const FAQSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const faqContainerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
        staggerChildren: 0.1,
        delayChildren: 0.3,
      },
    },
  };

  const faqItemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  };

  const contactBlockVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
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

  // UPDATED FAQ Data
  const faqData = [
    {
      question: 'מה המחיר של השירות?',
      answer:
        'אנו מציעים מספר מסלולים: רישום ראשוני למערכת הוא ללא עלות. מסלול מנוי שנתי, בעלות של 95₪, מאפשר קבלת הצעות באופן שוטף. בנוסף, אנו גובים דמי הצלחה סמליים של 1,000₪ מכל צד רק במקרה של אירוסין. אנו מאמינים במודל זה כי הוא הופך את ההצלחה שלכם להצלחה המשותפת שלנו, ומבטיח שאנו מחויבים למסע שלכם עד הסוף הטוב.',
    },
    {
      question: 'האם השירות מתאים לכל הזרמים?',
      answer:
        'בהחלט. המערכת שלנו בנויה להתאים למגוון רחב של קהילות וזרמים בעולם היהודי, תוך מתן דגש על התאמה מדויקת לרמת הדתיות ולאורח החיים. כרגע, עיקר הפעילות שלנו מתמקדת בקהילה הדתית-לאומית בישראל וביהדות האורתודוקסית-מודרנית בחו"ל, ואנו פועלים להתרחב לקהילות נוספות.',
    },
    {
      question: 'כיצד נשמרת הפרטיות שלי?',
      answer:
        'פרטיות היא ערך עליון עבורנו. הפרופיל שלכם נגיש אך ורק לצוות השדכנים המצומצם שמטפל בכם. פרטים ותמונות נחשפים לצד השני רק לאחר קבלת הסכמתכם המפורשת לכל הצעה והצעה. אנו משתמשים בטכנולוגיות אבטחה מתקדמות כדי להבטיח שהמידע שלכם תמיד יהיה מוגן ובטוח.',
    },
    {
      question: 'כמה זמן לוקח למצוא התאמה?',
      answer:
        'אי אפשר להבטיח זמנים במציאת זוגיות, שכן זהו תהליך אישי ועדין. מה שאנו כן יכולים להבטיח הוא תהליך יעיל וממוקד. המטרה שלנו היא לחסוך לכם זמן יקר ואנרגיה על ידי הצגת הצעות רלוונטיות ואיכותיות בלבד, כך שהמסע שלכם יהיה משמעותי יותר, ולא ארוך יותר מהנדרש.',
    },
    {
      question: 'האם אתם מארגנים גם אירועים?',
      answer:
        'כן, אנו מאמינים גם בכוחה של הקהילה. אנו מארגנים מעת לעת מפגשים, סדנאות ואירועים חברתיים באווירה נעימה ותומכת. אירועים אלו מהווים הזדמנות נוספת להיכרויות טבעיות. חברי המנוי שלנו מקבלים גישה והנחות לאירועים אלו.',
    },
  ];

  return (
    <motion.section
      ref={ref}
      id="faq"
      className="py-16 md:py-20 px-4 bg-white relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-50"></div>

      <div className="max-w-4xl mx-auto relative">
        {/* Header */}
        <motion.div className="text-center mb-12" variants={headerVariants}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            שאלות
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700">
              {' '}
              נפוצות{' '}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            כמה דברים שחשוב לדעת על הגישה שלנו ב-NeshamaTech.
          </p>
        </motion.div>

        {/* FAQ Items */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-12"
          variants={faqContainerVariants}
        >
          <motion.div className="space-y-2">
            {faqData.map((item, index) => (
              <motion.div
                key={index}
                variants={faqItemVariants}
                whileHover={{ x: 4 }}
                transition={{ duration: 0.2 }}
              >
                <FAQItem question={item.question} answer={item.answer} />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Contact Block */}
        <motion.div
          className="text-center bg-gray-50 p-6 rounded-lg border border-gray-100"
          variants={contactBlockVariants}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            יש לכם שאלה נוספת?
          </h3>
          <p className="text-gray-600 mb-6">
            אנחנו כאן כדי לעזור. צרו איתנו קשר ונשמח לענות על כל שאלה.
          </p>
          <Link href="/contact">
            <Button
              variant="outline"
              size="lg"
              className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 rounded-xl group"
            >
              <span>ליצירת קשר</span>
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
      </div>
    </motion.section>
  );
};

export default FAQSection;
