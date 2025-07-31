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

  const testimonials = [
    {
      text: 'תמיד חלמתי על שותף לחיים עם שאיפות ערכיות דומות – להקים בית של חסד, ציונות ותורה. Match Point חיברו אותי לאדם שחולם בדיוק את אותו החלום. זה חיבור של נשמה ומטרה.',
      author: 'שרה, ירושלים',
      result: 'נשואים + 1',
      color: 'green' as const,
    },
    {
      text: 'הקסם של Match Point הוא ביכולת לראות מעבר לפרטים היבשים. איתן והמערכת זיהו את החיבור העמוק בערכי המשפחה ובווייב הכללי שלנו. זו התאמה שמרגישה כמו בית מהרגע הראשון.',
      author: 'מרים, ירוחם',
      result: 'נשואים',
      color: 'orange' as const,
    },
  ];

  return (
    <motion.section
      ref={ref}
      id="success-stories"
      className="py-16 md:py-20 px-4 relative"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          variants={headerVariants}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            סיפורי
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700 animate-gradient"
              style={{ backgroundSize: '200% 200%' }}
            >
              {' '}
              הצלחה{' '}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full" />
        </motion.div>

        {/* Testimonials Grid */}
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

        {/* Future: Add button when more testimonials are available */}
        {/* 
        <motion.div 
          className="mt-12 text-center"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: "easeOut" }
            }
          }}
        >
          <Link href="/success-stories">
            <Button
              variant="outline"
              className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 rounded-xl group"
            >
              <span>לעוד סיפורי הצלחה</span>
              <ArrowLeft className="mr-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </motion.div>
        */}
      </div>
    </motion.section>
  );
};

export default SuccessStoriesSection;
