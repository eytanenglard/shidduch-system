// src/components/HomePage/sections/FeaturesSection.tsx

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import FeatureCard from '../components/FeatureCard';
import { Shield, Users, Heart, MessageCircle } from 'lucide-react';

const FeaturesSection: React.FC = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.1 });

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
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

  const cardVariants = {
    hidden: { opacity: 0, y: 40, scale: 0.95 },
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

  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'פרטיות ודיסקרטיות',
      description:
        'המסע לזוגיות הוא אישי. אנו מתחייבים לסביבה בטוחה בה פרטיותך נשמרת בקפדנות בכל שלב.',
      color: 'cyan' as const,
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'התאמה עם עומק',
      description:
        'אנו מאמינים שהתאמה אמיתית נבנית על ערכים ושאיפות. הגישה שלנו מחפשת את החיבור שמעבר לפרטים היבשים.',
      color: 'pink' as const,
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'ליווי אישי ואנושי',
      description:
        'אתם לא לבד במסע. צוות השדכנים שלנו כאן כדי להקשיב, לייעץ וללוות אתכם עם חום וניסיון.',
      color: 'green' as const,
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'תקשורת מכבדת',
      description:
        'הקשר הראשוני נעשה תמיד דרך השדכן/ית, בסביבה מכבדת ובטוחה, כדי שתוכלו להתמקד בהיכרות עצמה.',
      color: 'orange' as const,
    },
  ];

  return (
    <motion.section
      ref={ref}
      className="py-16 md:py-20 px-4 bg-white relative"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-6xl mx-auto relative">
        {/* Header - UPDATED */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          variants={headerVariants}
        >
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
            העקרונות
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600 animate-gradient"
              style={{ backgroundSize: '200% 200%' }}
            >
              {' '}
              המנחים{' '}
            </span>
            שלנו
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-teal-600 mx-auto rounded-full" />
        </motion.div>

        {/* Features Grid - UPDATED */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8"
          variants={containerVariants}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              whileHover={{
                y: -5,
                transition: { duration: 0.2 },
              }}
            >
              <FeatureCard
                icon={feature.icon}
                title={feature.title}
                description={feature.description}
                color={feature.color}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
      <style jsx>{`
        @keyframes gradient {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 4s ease-in-out infinite;
        }
      `}</style>
    </motion.section>
  );
};

export default FeaturesSection;
