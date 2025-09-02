// src/components/HomePage/sections/SuccessStoriesSection.tsx
'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import TestimonialCard from '../components/TestimonialCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft , ArrowRight} from 'lucide-react';
import type { SuccessStoriesDict } from '@/types/dictionary';

// --- Type Definition for Component Props ---
interface SuccessStoriesProps {
  dict: SuccessStoriesDict;
  locale: 'he' | 'en';
}

const SuccessStoriesSection: React.FC<SuccessStoriesProps> = ({
  dict,
  locale,
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.01 });

  const [showComingSoon, setShowComingSoon] = useState(false);

  const handleMoreStoriesClick = () => {
    setShowComingSoon(true);
    setTimeout(() => {
      setShowComingSoon(false);
    }, 3500);
  };

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

  return (
    <motion.section
      ref={ref}
      id="success-stories"
      className="pt-16 md:pt-20 px-4 bg-white relative"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-6xl mx-auto relative">
        <motion.div
          className="text-center mb-12 md:mb-16"
          variants={headerVariants}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {dict.title_part1}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
              {' '}
              {dict.title_highlight}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-teal-600 mx-auto rounded-full mb-6" />
          <motion.p
            className="text-lg text-gray-600 max-w-3xl mx-auto"
            variants={headerVariants}
          >
            {dict.subtitle}
          </motion.p>
        </motion.div>

        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
          variants={containerVariants}
        >
          {dict.stories.map((testimonial, index) => (
            <motion.div
              key={testimonial.author}
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
                color={
                  testimonial.color as 'cyan' | 'green' | 'orange' | 'pink'
                }
              />
            </motion.div>
          ))}
        </motion.div>

        <div className="mt-16 text-center">
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: {
                opacity: 1,
                y: 0,
                transition: { duration: 0.6, ease: 'easeOut', delay: 0.4 },
              },
            }}
          >
            <Button
              onClick={handleMoreStoriesClick}
              variant="outline"
              size="lg"
              className="border-2 border-cyan-200 text-cyan-600 hover:bg-cyan-50 hover:border-cyan-300 transition-all duration-300 rounded-xl group"
            >
              <span>{dict.more_stories_button}</span>
              {locale === 'he' ? (
                <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" />
              ) : (
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              )}{' '}
            </Button>
          </motion.div>

          <div className="mt-4 h-6">
            <AnimatePresence>
              {showComingSoon && (
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="text-cyan-700 font-medium"
                >
                  {dict.coming_soon_message}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>

        <motion.div
          className="mt-8 text-center"
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: {
              opacity: 1,
              y: 0,
              transition: { duration: 0.6, ease: 'easeOut', delay: 0.5 },
            },
          }}
        ></motion.div>
      </div>
    </motion.section>
  );
};

export default SuccessStoriesSection;
