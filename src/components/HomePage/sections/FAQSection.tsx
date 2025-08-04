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

  // Animation variants (Unchanged)
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

  // --- START: UPDATED FAQ DATA ---
  const faqData = [
    {
      question: 'מה המחיר של השירות?',
      answer:
        'אנחנו מאמינים במודל הוגן ושקוף, שבו ההצלחה שלכם היא גם ההצלחה שלנו. ההרשמה למאגר והיכרות ראשונית עם שדכן הן ללא עלות. עבור שירותי ליווי והתאמה אקטיביים, אנו מציעים מסלולי מנוי. בנוסף, רק כאשר המסע מצליח ואתם מתארסים, אנו גובים דמי הצלחה. הגישה הזו מבטיחה שאנחנו מחויבים ב-100% למצוא לכם את החיבור הנכון.',
    },
    {
      question: 'האם השירות מתאים לכל הזרמים?',
      answer:
        'בהחלט. הגישה שלנו מבוססת על הבנת הניואנסים הדקים של עולם הערכים והאמונה. המערכת שלנו בנויה להתאים למגוון רחב של קהילות בתוך העולם היהודי. כרגע, המומחיות העיקרית שלנו היא בקהילה הדתית-לאומית והמודרן-אורתודוקס, ואנו פועלים כל הזמן להרחיב את מעגלי ההיכרות.',
    },
    {
      question: 'כיצד נשמרת הפרטיות שלי?',
      answer:
        'הסיפור שלכם שייך לכם. פרטיות היא ערך עליון עבורנו, ולכן: הפרופיל שלכם גלוי אך ורק לצוות השדכנים המצומצם שמטפל בכם. פרטים אישיים ותמונות נחשפים לצד השני רק לאחר שקיבלנו את אישורכם המפורש לכל הצעה והצעה. המידע שלכם מאובטח בטכנולוגיות המתקדמות ביותר.',
    },
    {
      question: 'כמה זמן לוקח למצוא התאמה?',
      answer:
        'זו השאלה החשובה ביותר, והתשובה הכנה היא שאין לוח זמנים לאהבה. אבל מה אנחנו כן יכולים להבטיח? תהליך יעיל וממוקד שיחסוך לכם זמן יקר ואנרגיה. במקום אינסוף דייטים לא רלוונטיים, תקבלו מספר מצומצם של הצעות איכותיות ומנומקות. המטרה שלנו היא שהמסע יהיה משמעותי, ולא ארוך מהנדרש.',
    },
    {
      question: 'האם אתם מארגנים גם אירועים קהילתיים?',
      answer:
        'בהחלט. אנחנו מאמינים שלפעמים הקסם קורה גם מחוץ למסך. אנו מארגנים מפגשי איכות וסדנאות באווירה נעימה, המהווים הזדמנות נוספת להיכרויות טבעיות ובלתי אמצעיות. חברי המערכת שלנו תמיד מקבלים עדכונים והטבות.',
    },
  ];
  // --- END: UPDATED FAQ DATA ---

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
        {/* --- START: UPDATED HEADER --- */}
        <motion.div className="text-center mb-12" variants={headerVariants}>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            כל מה שחשוב לדעת
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto mb-8">
            שקיפות היא הבסיס לאמון. ריכזנו כאן תשובות לשאלות הנפוצות ביותר, כדי
            שתוכלו להתחיל את המסע בלב שקט ועם כל המידע.
          </p>
        </motion.div>
        {/* --- END: UPDATED HEADER --- */}

        {/* FAQ Items */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-12"
          variants={faqContainerVariants}
        >
          <div className="space-y-2">
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
          </div>
        </motion.div>

        {/* Contact Block (Unchanged) */}
        <motion.div
          className="text-center bg-gray-50 p-8 rounded-lg border border-gray-100"
          variants={contactBlockVariants}
        >
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            עדיין יש לכם שאלה?
          </h3>
          <p className="text-gray-600 mb-6">
            אנחנו כאן כדי לעזור. צוות השדכנים שלנו ישמח לענות על כל שאלה באופן
            אישי.
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
