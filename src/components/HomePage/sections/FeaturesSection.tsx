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

  // --- START: UPDATED FEATURE DATA ---
  const features = [
    {
      icon: <Shield className="w-8 h-8" />,
      title: 'פרטיות וביטחון',
      description:
        'הפרופיל שלכם נשאר חסוי לחלוטין. אנו חושפים פרטים רק בהסכמתכם המפורשת, כדי שתוכלו לחפש בביטחון ובשקט נפשי.',
      color: 'cyan' as const,
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: 'התאמה עם עומק',
      description:
        'אנחנו מסתכלים מעבר לנתונים. השיטה שלנו נועדה לזהות חיבורים אמיתיים ברמת הערכים והאישיות, כי שם מתחילה זוגיות יציבה.',
      color: 'pink' as const,
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: 'ליווי אישי וחם',
      description:
        'מהרגע הראשון, שדכן אישי מלווה אתכם. הוא שם כדי להקשיב, לייעץ ולתת לכם רוח גבית לאורך כל הדרך.',
      color: 'green' as const,
    },
    {
      icon: <MessageCircle className="w-8 h-8" />,
      title: 'תקשורת מכבדת',
      description:
        'הקשר הראשוני נעשה תמיד דרכנו, בסביבה בטוחה ומכבדת. זה מוריד את הלחץ ומאפשר לכם להגיע להיכרות עצמה נינוחים ובטוחים.',
      color: 'orange' as const,
    },
  ];
  // --- END: UPDATED FEATURE DATA ---

  return (
    <motion.section
      ref={ref}
      className="py-16 md:py-20 px-4 bg-white relative"
      variants={containerVariants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
    >
      <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:20px_20px]"></div>

      <div className="max-w-6xl mx-auto relative">
        {/* --- START: UPDATED HEADER --- */}
        <motion.div
          className="text-center mb-12 md:mb-16"
          variants={headerVariants}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-4">
            ההבטחה שלנו
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
              {' '}
              אליכם{' '}
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-600 to-teal-600 mx-auto rounded-full mb-6" />
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            המסע לזוגיות הוא אישי ורגיש. לכן, בנינו את הגישה שלנו על ארבעה
            יסודות שמבטיחים לכם שקט נפשי, כבוד ותהליך משמעותי.
          </p>
        </motion.div>
        {/* --- END: UPDATED HEADER --- */}

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
    </motion.section>
  );
};

export default FeaturesSection;
