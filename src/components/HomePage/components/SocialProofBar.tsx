// src/components/HomePage/components/SocialProofBar.tsx
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { SocialProofDict } from '@/types/dictionary';

interface SocialProofBarProps {
  dict: SocialProofDict;
}

const STAT_COLORS = [
  'text-teal-600',
  'text-orange-600',
  'text-rose-600',
  'text-amber-600',
];

const SocialProofBar: React.FC<SocialProofBarProps> = ({ dict }) => {
  return (
    <div className="relative bg-white/70 backdrop-blur-sm border-y border-gray-100">
      <div className="max-w-5xl mx-auto px-4 py-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8"
        >
          {dict.stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div
                className={`text-2xl md:text-3xl font-extrabold ${STAT_COLORS[index]} mb-1`}
              >
                {stat.value}
              </div>
              <div className="text-sm text-gray-500 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};

export default SocialProofBar;
