// src/components/HomePage/sections/FAQSection.tsx

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import FAQItem from '../components/FAQItem';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sparkles, MessageCircle, Shield, Clock, Users, HelpCircle } from 'lucide-react';

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
        'אנחנו מאמינים במודל הוגן ושקוף, שבו ההצלחה שלכם היא גם ההצלחה שלנו. ההרשמה למאגר והיכרות ראשונית עם שדכן הן ללא עלות. עבור שירותי ליווי והתאמה אקטיביים, אנו מציעים מסלולי מנוי. בנוסף, רק כאשר המסע מצליח ואתם מתארסים, אנו גובים דמי הצלחה. הגישה הזו מבטיחה שאנחנו מחויבים ב-100% למצוא לכם את החיבור הנכון.',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'from-amber-500 to-orange-500'
    },
    {
      question: 'האם השירות מתאים לכל הזרמים?',
      answer:
        'בהחלט. הגישה שלנו מבוססת על הבנת הניואנסים הדקים של עולם הערכים והאמונה. המערכת שלנו בנויה להתאים למגוון רחב של קהילות בתוך העולם היהודי. כרגע, המומחיות העיקרית שלנו היא בקהילה הדתית-לאומית והמודרן-אורתודוקס, ואנו פועלים כל הזמן להרחיב את מעגלי ההיכרות.',
      icon: <Users className="w-5 h-5" />,
      color: 'from-purple-500 to-indigo-500'
    },
    {
      question: 'כיצד נשמרת הפרטיות שלי?',
      answer:
        'הסיפור שלכם שייך לכם. פרטיות היא ערך עליון עבורנו, ולכן: הפרופיל שלכם גלוי אך ורק לצוות השדכנים המצומצם שמטפל בכם. פרטים אישיים ותמונות נחשפים לצד השני רק לאחר שקיבלנו את אישורכם המפורש לכל הצעה והצעה. המידע שלכם מאובטח בטכנולוגיות המתקדמות ביותר.',
      icon: <Shield className="w-5 h-5" />,
      color: 'from-cyan-500 to-blue-500'
    },
    {
      question: 'כמה זמן לוקח למצוא התאמה?',
      answer:
        'זו השאלה החשובה ביותר, והתשובה הכנה היא שאין לוח זמנים לאהבה. אבל מה אנחנו כן יכולים להבטיח? תהליך יעיל וממוקד שיחסוך לכם זמן יקר ואנרגיה. במקום אינסוף דייטים לא רלוונטיים, תקבלו מספר מצומצם של הצעות איכותיות ומנומקות. המטרה שלנו היא שהמסע יהיה משמעותי, ולא ארוך מהנדרש.',
      icon: <Clock className="w-5 h-5" />,
      color: 'from-emerald-500 to-teal-500'
    },
    {
      question: 'האם אתם מארגנים גם אירועים קהילתיים?',
      answer:
        'בהחלט. אנחנו מאמינים שלפעמים הקסם קורה גם מחוץ למסך. אנו מארגנים מפגשי איכות וסדנאות באווירה נעימה, המהווים הזדמנות נוספת להיכרויות טבעיות ובלתי אמצעיות. חברי המערכת שלנו תמיד מקבלים עדכונים והטבות.',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'from-pink-500 to-rose-500'
    },
  ];

  return (
    <motion.section
      ref={ref}
      id="faq"
      className="py-16 md:py-20 px-4 bg-gradient-to-br from-slate-50 via-white to-cyan-50/30 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* רקע דקורטיבי מתקדם */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 bg-gradient-to-br from-cyan-200/30 to-blue-300/20 rounded-full blur-3xl animate-float-slow"></div>
        <div className="absolute top-60 right-20 w-40 h-40 bg-gradient-to-br from-purple-200/25 to-pink-300/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '2s' }}></div>
        <div className="absolute bottom-40 left-1/3 w-36 h-36 bg-gradient-to-br from-emerald-200/20 to-teal-300/15 rounded-full blur-3xl animate-float-slow" style={{ animationDelay: '4s' }}></div>
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:30px_30px]"></div>
        
        {/* גלים דקורטיביים */} 
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="waveGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <path d="M0,200 C300,100 700,300 1000,200 L1000,0 L0,0 Z" fill="url(#waveGrad1)" className="animate-pulse-slow" />
          <path d="M0,800 C300,700 700,900 1000,800 L1000,1000 L0,1000 Z" fill="url(#waveGrad1)" className="animate-pulse-slow" style={{ animationDelay: '3s' }} />
        </svg>
      </div>

      <div className="max-w-4xl mx-auto relative">
        {/* כותרת מעוצבת */}
        <motion.div className="text-center mb-16" variants={headerVariants}>
          {/* Badge מעוצב */}
          <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-8 py-4 shadow-lg border border-white/60 mb-8">
            <HelpCircle className="w-6 h-6 text-cyan-600" />
            <span className="text-cyan-700 font-semibold text-lg">מידע חשוב עבורכם</span>
          </div>
          
          <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-800 mb-6 leading-tight">
            כל מה ש
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600">
              חשוב לדעת
            </span>
          </h2>
          
          <div className="flex items-center justify-center gap-2 mb-8">
            <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></div>
            <div className="w-3 h-3 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full"></div>
            <div className="w-16 h-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
            שקיפות היא הבסיס לאמון. ריכזנו כאן תשובות לשאלות הנפוצות ביותר, 
            כדי שתוכלו להתחיל את המסע בלב שקט ועם כל המידע.
          </p>
        </motion.div>

        {/* FAQ Items עם עיצוב מתקדם */}
        <motion.div
          className="relative mb-16"
          variants={faqContainerVariants}
        >
          {/* רקע לכרטיס */}
          <div className="absolute inset-0 -m-4 bg-white/60 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40"></div>
          
          <div className="relative p-8 md:p-12">
            <div className="space-y-1">
              {faqData.map((item, index) => (
                <motion.div
                  key={index}
                  variants={faqItemVariants}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                  className="group"
                >
                  {/* כרטיס FAQ מעוצב */}
                  <div className="bg-white/70 backdrop-blur-sm rounded-2xl border border-gray-100/80 hover:border-gray-200 transition-all duration-300 hover:shadow-lg overflow-hidden">
                    <div className="relative">
                      {/* סרט צבעוני בחלק העליון */}
                      <div className={`h-1 bg-gradient-to-r ${item.color} opacity-60 group-hover:opacity-100 transition-opacity duration-300`}></div>
                      
                      {/* האייקון והשאלה */}
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                          <div className={`p-3 rounded-full bg-gradient-to-r ${item.color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                            {item.icon}
                          </div>
                          <h3 className="text-xl font-bold text-gray-800 flex-1">
                            {item.question}
                          </h3>
                        </div>
                        
                        {/* התשובה */}
                        <div className="relative">
                          <FAQItem question="" answer={item.answer} />
                        </div>
                      </div>
                      
                      {/* עיטור תחתון */}
                      <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
                        <div className={`w-full h-full bg-gradient-to-tl ${item.color} rounded-full transform translate-x-16 translate-y-16`}></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Contact Block מעוצב */}
        <motion.div
          className="relative text-center"
          variants={contactBlockVariants}
        >
          {/* רקע גרדיאנט */}
          <div className="absolute inset-0 -m-8 bg-gradient-to-br from-cyan-500/10 via-purple-500/5 to-pink-500/10 rounded-3xl backdrop-blur-sm border border-white/30"></div>
          
          <div className="relative max-w-2xl mx-auto p-12">
            {/* אייקון מרכזי */}
            <motion.div 
              className="inline-block mb-6 p-4 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full shadow-xl"
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.1 }}
              transition={{ duration: 0.6 }}
            >
              <MessageCircle className="w-8 h-8 text-white" />
            </motion.div>
            
            <h3 className="text-3xl font-bold text-gray-800 mb-4">
              עדיין יש לכם
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-purple-600"> שאלה?</span>
            </h3>
            
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              אנחנו כאן כדי לעזור. צוות השדכנים שלנו ישמח לענות על כל שאלה באופן אישי ולהכיר אתכם טוב יותר.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/contact">
                <motion.div
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-2xl px-8 py-4 text-lg font-semibold group"
                  >
                    <span className="flex items-center gap-3">
                      בואו נכיר
                      <ArrowLeft className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </span>
                  </Button>
                </motion.div>
              </Link>
              
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="font-medium">זמינים עבורכם • תגובה מהירה</span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style jsx>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.8; }
          50% { opacity: 1; }
        }
        .animate-float-slow {
          animation: float-slow 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }
      `}</style>
    </motion.section>
  );
};

export default FAQSection;