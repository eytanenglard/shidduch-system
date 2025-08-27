// src/components/profile/sections/BudgetDisplay.tsx
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { motion } from 'framer-motion';
import type { BudgetDisplayDict } from '@/types/dictionary';

interface BudgetDisplayProps {
  data: Record<string, number>;
  dict: BudgetDisplayDict;
  locale: string; // Added locale prop
}

const BudgetDisplay: React.FC<BudgetDisplayProps> = ({
  data,
  dict,
  locale,
}) => {
  const direction = locale === 'he' ? 'rtl' : 'ltr';

  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return <p className="text-sm text-red-500">{dict.errorInvalidData}</p>;
  }

  const sortedEntries = Object.entries(data)
    .filter(([_, value]) => typeof value === 'number' && value > 0)
    .sort(([, a], [, b]) => b - a);

  if (sortedEntries.length === 0) {
    return (
      <p className="text-sm text-gray-500 italic">{dict.noValuesAllocated}</p>
    );
  }

  const colors = [
    'bg-cyan-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-gray-400',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  // Adjust animation based on direction
  const itemVariants = {
    hidden: { opacity: 0, x: direction === 'rtl' ? 20 : -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      dir={direction} // Set direction for the whole component
      className="space-y-3 pt-2"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {sortedEntries.map(([label, value], index) => (
        <motion.div key={label} variants={itemVariants}>
          <div className="flex justify-between items-center mb-1 text-sm">
            <span className="font-medium text-gray-700">{label}</span>
            <span className="font-semibold text-cyan-700">{value}%</span>
          </div>
          <Progress
            value={value}
            className="h-2.5 rounded-full bg-gray-200/70"
            indicatorClassName={colors[index % colors.length]}
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default BudgetDisplay;
