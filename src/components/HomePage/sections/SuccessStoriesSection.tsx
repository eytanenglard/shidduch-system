// src/components/HomePage/sections/SuccessStoriesSection.tsx

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import TestimonialCard from '../components/TestimonialCard';

const SuccessStoriesSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
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

  const headerVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 40 },
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

  // --- START: DATA REMAINS UNCHANGED ---
  const testimonials = [
    {
      text: 'תמיד חלמתי על שותף לחיים עם שאיפות ערכיות דומות – להקים בית של חסד, ציונות ותורה. NeshamaTech חיברו אותי לאדם שחולם בדיוק את אותו החלום. זה חיבור של נשמה ומטרה.',
      author: 'שרה, ירושלים',
      result: 'נשואים + 1',
      color: 'green' as const,
    },
    {
      text: 'הקסם של NeshamaTech הוא ביכולת לראות מעבר לפרטים היבשים. איתן והמערכת זיהו את החיבור העמוק בערכי המשפחה ובווייב הכללי שלנו. זו התאמה שמרגישה כמו בית מהרגע הראשון.',
      author: 'מרים, ירוחם',
      result: 'נשואים',
      color: 'orange' as const,
    },
  ];
  // --- END: DATA REMAINS UNCHANGED ---

  return (
    <motion.section
      ref={ref}
      id="success-stories"
      className="py-16 md:py-20 px-4 bg-white relative" // Changed background to white for cleaner look
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-6xl mx-auto relative">
        {/* --- START: UPDATED HEADER SECTION --- */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          variants={headerVariants}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            סיפורים שמתחילים
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600"
            >
              {' '}
              בנשמה
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-teal-600 mx-auto rounded-full mb-6" />
          <motion.p 
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            variants={headerVariants} // re-using variant for simplicity
          >
            התיאוריה נהדרת, אבל התוצאות מדברות בעד עצמן. אלו לא רק סיסמאות, אלו חיים שהשתנו. כמה מילים מהזוגות שמצאו אהבה דרך הגישה המעמיקה שלנו.
          </motion.p>
        </motion.div>
        {/* --- END: UPDATED HEADER SECTION --- */}

        {/* Testimonials Grid - UNCHANGED LOGIC */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          variants={containerVariants}
        >
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{
                y: -8,
                transition: { duration: 0.2 },
              }}
            >
              <TestimonialCard
                text={testimonial.text}
                author={testimonial.author}
                result={testimonial.result}
                color={testimonial.color}
              />
            </motion.div>
          ))}
        </motion.div>

        {/* --- START: NEW OPTIONAL CLOSING TEXT --- */}
        <motion.div 
          className="mt-12 text-center"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut", delay: 0.5 } // Delay after cards appear
            }
          }}
        >
          <p className="text-base text-gray-500">
            אנו מכבדים את פרטיות הזוגות שלנו, ומשתפים סיפורים רק בהסכמתם המלאה.
          </p>
        </motion.div>
        {/* --- END: NEW OPTIONAL CLOSING TEXT --- */}
      </div>
    </motion.section>
  );
};

export default SuccessStoriesSection;