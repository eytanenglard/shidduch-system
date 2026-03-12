// src/components/HomePage/components/ComparisonItem.tsx
// Improvements: #10 RTL fix (me-3), #11 differentiated text colors, #12 lucide icons, #41 teal palette

import React from 'react';
import { Check, X } from 'lucide-react';

export interface ComparisonItemProps {
  children: React.ReactNode;
  isNegative?: boolean;
}

const ComparisonItem: React.FC<ComparisonItemProps> = ({
  children,
  isNegative = false,
}) => (
  <li className="flex items-start">
    <div
      aria-hidden="true"
      className={`p-1 rounded-full ${
        isNegative ? 'bg-red-100 text-red-600' : 'bg-teal-100 text-teal-600'
      } me-3 mt-1 flex-shrink-0`}
    >
      {isNegative ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
    </div>
    <span
      className={`text-sm ${isNegative ? 'text-gray-500' : 'text-gray-700'}`}
    >
      {children}
    </span>
  </li>
);

export default ComparisonItem;
