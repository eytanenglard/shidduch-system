// src/components/HomePage/sections/ValuePropositionSection.tsx

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ComparisonItem from '../components/ComparisonItem';
import Link from 'next/link';
import { usePathname } from 'next/navigation'; // ✨ 1. ייבוא hook נדרש
import type { ValuePropositionDict } from '@/types/dictionary';

interface ValuePropositionProps {
  dict: ValuePropositionDict;
}

const ValuePropositionSection: React.FC<ValuePropositionProps> = ({ dict }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // ✨ 3. קבלת השפה הנוכחית מה-URL
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'he';

  // Animation variants (ללא שינוי)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2, delayChildren: 0.3 },
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
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
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

      <div className="max-w-6xl mx-auto relative">
        {/* ✨ 4. שימוש בתרגומים לכותרות */}
        <motion.div className="text-center mb-12" variants={fadeInUp}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {dict.title_part1}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-cyan-700">
              {' '}
              {dict.title_brand}{' '}
            </span>
            {dict.title_part2}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-cyan-700 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {dict.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {' '}
          {/* items-start במקום items-center */}
          {/* Left card - Challenge */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 transform md:translate-x-4 relative overflow-hidden"
            variants={fadeInLeft}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-cyan-100 to-cyan-50 opacity-50 rounded-full transform translate-x-20 -translate-y-20"></div>
            <h3 className="text-xl font-bold mb-4 text-gray-800 relative">
              {dict.challengeCard.title}
            </h3>
            <motion.ul
              className="space-y-3 relative"
              variants={staggeredListVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              {/* ✨ 5. רינדור דינמי של רשימת האתגרים */}
              {dict.challengeCard.items.map((item, index) => (
                <motion.div key={index} variants={listItemVariants}>
                  <ComparisonItem isNegative>{item}</ComparisonItem>
                </motion.div>
              ))}
            </motion.ul>
          </motion.div>
          {/* Right card - Solution */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 transform md:-translate-x-4 relative overflow-hidden"
            variants={fadeInRight}
          >
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-cyan-100 to-cyan-50 opacity-50 rounded-full transform -translate-x-20 translate-y-20"></div>
            <h3 className="text-xl font-bold mb-4 text-gray-800 relative">
              {dict.solutionCard.title}
            </h3>
            <motion.ul
              className="space-y-3 relative"
              variants={staggeredListVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              {/* ✨ 6. רינדור דינמי של רשימת הפתרונות, כולל טיפול בקישור */}
              {dict.solutionCard.items.map((item, index) => (
                <motion.div key={index} variants={listItemVariants}>
                  <ComparisonItem>
                    <strong>{item.bold}</strong>
                    {item.text && <span>{item.text}</span>}
                    {item.textWithLink && (
                      <span>
                        {item.textWithLink.part1}
                        <Link
                          href={`/${locale}/questionnaire`}
                          className="text-cyan-600 hover:underline font-semibold mx-1"
                        >
                          {item.textWithLink.linkText}
                        </Link>
                        {item.textWithLink.part2}
                      </span>
                    )}
                  </ComparisonItem>
                </motion.div>
              ))}
            </motion.ul>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default ValuePropositionSection;
