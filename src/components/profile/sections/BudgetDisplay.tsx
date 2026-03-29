// src/components/profile/sections/BudgetDisplay.tsx
import React from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import type { BudgetDisplayDict } from '@/types/dictionary';

interface BudgetDisplayProps {
  data: Record<string, number>;
  dict: BudgetDisplayDict;
  locale: string;
}

const COLORS = [
  { bar: 'bg-cyan-500', text: 'text-cyan-700', bg: 'bg-cyan-50' },
  { bar: 'bg-teal-500', text: 'text-teal-700', bg: 'bg-teal-50' },
  { bar: 'bg-sky-500', text: 'text-sky-700', bg: 'bg-sky-50' },
  { bar: 'bg-indigo-500', text: 'text-indigo-700', bg: 'bg-indigo-50' },
  { bar: 'bg-purple-500', text: 'text-purple-700', bg: 'bg-purple-50' },
  { bar: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' },
  { bar: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
];

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

  const maxValue = Math.max(...sortedEntries.map(([, v]) => v));

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: direction === 'rtl' ? 15 : -15 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div
      dir={direction}
      className="space-y-2.5 pt-1"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {sortedEntries.map(([label, value], index) => {
        const color = COLORS[index % COLORS.length];
        const widthPct = maxValue > 0 ? (value / maxValue) * 100 : 0;

        return (
          <motion.div key={label} variants={itemVariants} className="group">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-gray-600 flex-1 truncate">{label}</span>
              <span className={cn('text-xs font-bold tabular-nums', color.text)}>{value}</span>
            </div>
            <div className="relative h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                className={cn('absolute inset-y-0 start-0 rounded-full', color.bar)}
                initial={{ width: 0 }}
                animate={{ width: `${widthPct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.08 }}
              />
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default BudgetDisplay;
