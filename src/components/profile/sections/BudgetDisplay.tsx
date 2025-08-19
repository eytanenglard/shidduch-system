// src/app/components/profile/sections/BudgetDisplay.tsx

import React from 'react';
import { Progress } from "@/components/ui/progress";
import { motion } from 'framer-motion';

interface BudgetDisplayProps {
  // הקומפוננטה מקבלת את הנתונים הגולמיים של התשובה
  data: Record<string, number>;
}

const BudgetDisplay: React.FC<BudgetDisplayProps> = ({ data }) => {
  // בדיקה שהנתונים תקינים
  if (!data || typeof data !== 'object' || Array.isArray(data)) {
    return <p className="text-sm text-red-500">שגיאה: נתונים לא תקינים לתצוגה.</p>;
  }

  // 1. המרת האובייקט למערך, סינון ערכים ריקים, ומיון מהגבוה לנמוך
  const sortedEntries = Object.entries(data)
    .filter(([_, value]) => typeof value === 'number' && value > 0)
    .sort(([, a], [, b]) => b - a);
  
  // אם אין נתונים להצגה אחרי הסינון
  if (sortedEntries.length === 0) {
    return <p className="text-sm text-gray-500 italic">לא הוקצו ערכים.</p>;
  }

  // 2. פלטת צבעים דינמית להמחשה ויזואלית
  const colors = [
    'bg-cyan-500',
    'bg-teal-500',
    'bg-sky-500',
    'bg-indigo-500',
    'bg-purple-500',
    'bg-gray-400',
  ];

  // 3. הגדרות אנימציה
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1, // כל פריט יופיע בעיכוב קל
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  return (
    <motion.div 
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
            indicatorClassName={colors[index % colors.length]} // בחירת צבע מהפלטה
          />
        </motion.div>
      ))}
    </motion.div>
  );
};

export default BudgetDisplay;