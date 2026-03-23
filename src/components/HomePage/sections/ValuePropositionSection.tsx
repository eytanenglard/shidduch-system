// src/components/HomePage/sections/ValuePropositionSection.tsx
// Improvements: #38 bg-teal-50, #39 teal gradient, #40 teal/orange divider, #42 teal decorative circles

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import ComparisonItem from '../components/ComparisonItem';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ValuePropositionDict } from '@/types/dictionary';

interface ValuePropositionProps {
  dict: ValuePropositionDict;
}

const ValuePropositionSection: React.FC<ValuePropositionProps> = ({ dict }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'he';

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
      // #38: Updated from bg-cyan-50 to bg-teal-50
      className="py-16 md:py-24 pb-0 px-4 bg-teal-50 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-white opacity-70" />

      <div className="max-w-6xl mx-auto relative">
        <motion.div className="text-center mb-12" variants={fadeInUp}>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            {dict.title_part1}
            {/* #39: Updated from cyan to teal */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-teal-700">
              {' '}
              {dict.title_brand}{' '}
            </span>
            {dict.title_part2}
          </h2>
          {/* #40: Updated divider to teal/orange */}
          <div className="w-24 h-1 bg-gradient-to-r from-teal-500 to-orange-400 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            {dict.subtitle}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left card - Challenge */}
          <motion.div
            className="bg-white rounded-2xl shadow-xl p-8 transform md:translate-x-4 relative overflow-hidden"
            variants={fadeInLeft}
          >
            {/* #42: Updated decorative circle from cyan to teal */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-teal-100 to-teal-50 opacity-50 rounded-full transform translate-x-20 -translate-y-20" />
            <h3 className="text-xl font-bold mb-4 text-rose-800 relative">
              {' '}
              {dict.challengeCard.title}
            </h3>
            <motion.ul
              className="space-y-3 relative"
              variants={staggeredListVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
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
            {/* #42: Updated decorative circle */}
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-teal-100 to-teal-50 opacity-50 rounded-full transform -translate-x-20 translate-y-20" />
            <h3 className="text-xl font-bold mb-4 text-gray-800 relative">
              {dict.solutionCard.title}
            </h3>
            <motion.ul
              className="space-y-3 relative"
              variants={staggeredListVariants}
              initial="hidden"
              animate={isInView ? 'visible' : 'hidden'}
            >
              {dict.solutionCard.items.map((item, index) => (
                <motion.div key={index} variants={listItemVariants}>
                  <ComparisonItem>
                    <strong>{item.bold}</strong>
                    {item.text && <span>{item.text}</span>}
                    {item.textWithLink && (
                      <span>
                        {item.textWithLink.part1}
                        <Link
                          href={`/${locale}/soul-fingerprint`}
                          className="text-teal-600 hover:underline font-semibold mx-1"
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
