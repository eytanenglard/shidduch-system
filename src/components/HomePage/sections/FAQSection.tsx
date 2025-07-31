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

  const faqData = [
    {
      question: 'מה המחיר של השירות?',
      answer:
        'אנו מציעים מספר תוכניות: רישום בסיסי בחינם הכולל פרופיל ראשוני ו-3 הצעות התאמה. מנוי סטנדרטי ב-95₪ לשנה המעניק גישה להצעות התאמה מתמשכות, ומנוי פרימיום ב-270₪ לשנה הכולל התאמה ותמיכה מועדפת. בנוסף, ישנה עמלת הצלחה של 1,000₪ מכל צד (2,000₪ בסך הכל) במקרה של אירוסין.',
    },
    {
      question: 'האם השירות מתאים לכל הזרמים ביהדות?',
      answer:
        'כן! המערכת שלנו מתוכננת להתאים לכל הקהילות היהודיות, עם אפשרויות להתאמה מדויקת לפי רמת הדתיות והמסורות הספציפיות. אנו משרתים כרגע את הקהילה הדתית-לאומית בישראל, יהדות אורתודוכסית מודרנית בחו״ל, וקהילות חרדיות, עם תוכניות להרחבה לקהילות יהודיות נוספות.',
    },
    {
      question: 'כיצד נשמרת הפרטיות שלי במערכת?',
      answer:
        'פרטיות המשתמשים היא בראש סדר העדיפויות שלנו. הפרופילים נראים רק לשדכנים מורשים ולא לשאר המשתמשים. אנו משתמשים בהצפנה מקצה לקצה וארכיטקטורת אפס-ידע להגנה על המידע האישי שלך. התמונות והפרטים האישיים שלך לעולם לא יהיו חשופים ללא הסכמתך המפורשת.',
    },
    {
      question: 'כמה זמן בממוצע לוקח למצוא התאמה?',
      answer:
        'בעוד שהזמן משתנה בהתאם לגורמים רבים, המשתמשים שלנו מוצאים התאמות משמעותיות בזמן קצר משמעותית מהממוצע בשוק. בעוד הממוצע בשוק עומד על כ-2.5 שנים, מרבית המשתמשים שלנו מוצאים התאמות מוצלחות תוך 6-12 חודשים, הודות לשילוב הייחודי של טכנולוגיה וליווי אישי.',
    },
    {
      question: 'האם יש אירועים או מפגשים קהילתיים?',
      answer:
        'בהחלט! אנו מארגנים מגוון אירועים קהילתיים כולל מפגשים חברתיים, סדנאות, והרצאות. אירועים אלה מספקים הזדמנויות טבעיות להיכרות בסביבה נעימה ותומכת. לחברי המנוי שלנו ניתנת גישה מועדפת לאירועים אלה, עם מחירים הנעים בין 15₪-30₪ למפגשים חברתיים, 30₪-60₪ לסדנאות, ו-300₪-600₪ לסופי שבוע מיוחדים.',
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
            אלו התשובות לשאלות הנפוצות ביותר על שירות Match Point שלנו
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
            לא מצאתם את התשובה?
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
