// src/components/HomePage/sections/SuccessStoriesSection.tsx
'use client';

import React, { useRef, useState } from 'react';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import TestimonialCard from '../components/TestimonialCard';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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
      // Updated Background: Consistent with Hero/Insight (Subtle Slate/Teal/Orange)
      className="pt-16 md:pt-20 px-4 bg-gradient-to-b from-white via-teal-50/20 to-orange-50/10 relative overflow-hidden"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Background Orbs to match other sections */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-teal-200/10 rounded-full blur-3xl animate-float-slow pointer-events-none"></div>
      <div 
        className="absolute bottom-20 right-10 w-80 h-80 bg-orange-200/10 rounded-full blur-3xl animate-float-slow pointer-events-none"
        style={{ animationDelay: '2.5s' }}
      ></div>

      {/* Radial Pattern - Updated color to Teal */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          className="text-center mb-12 md:mb-16"
          variants={headerVariants}
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-4">
            {dict.title_part1}
            {/* Updated Title Gradient (Teal -> Orange -> Amber) */}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-orange-500 to-amber-500">
              {' '}
              {dict.title_highlight}
            </span>
          </h2>
          {/* Updated Divider Line */}
          <div className="w-24 h-1.5 bg-gradient-to-r from-teal-400 to-orange-500 mx-auto rounded-full mb-6 shadow-sm" />
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
          {dict.stories.map((testimonial) => (
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
              // Updated Button Styles (Teal/Orange Theme)
              className="border-2 border-teal-200 text-teal-700 hover:bg-white hover:border-teal-400 hover:text-teal-800 hover:shadow-lg hover:shadow-teal-100 transition-all duration-300 rounded-xl group"
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
                  // Updated Text Color
                  className="text-teal-600 font-medium bg-teal-50 inline-block px-4 py-1 rounded-full text-sm"
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

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0) translateX(0); }
          50% { transform: translateY(-20px) translateX(10px); }
        }
        .animate-float-slow {
          animation: float-slow 10s ease-in-out infinite;
        }
      `}</style>
    </motion.section>
  );
};

export default SuccessStoriesSection;