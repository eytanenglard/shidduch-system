
// src/components/HomePage/components/FAQItem.tsx

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export interface FAQItemProps {
  question: string;
  answer: string;
}

// FAQ Item Component
const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  // יצירת ID ייחודי עבור התוכן שייפתח
  const contentId = `faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className={`border-b border-gray-100 last:border-0 transition-colors duration-300 ${isOpen ? 'bg-orange-50/30' : 'bg-transparent'}`}>
      <button
        className={`flex justify-between items-center w-full py-5 px-2 text-right focus:outline-none transition-all duration-300 rounded-lg ${
          isOpen ? 'text-teal-700' : 'text-gray-700 hover:text-teal-600 hover:bg-gray-50'
        }`}
        onPointerDown={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className={`font-bold text-lg ${isOpen ? 'text-teal-700' : ''}`}>
          {question}
        </span>
        <span
          className={`transform transition-transform duration-300 p-1 rounded-full ${
            isOpen ? 'rotate-180 text-orange-500 bg-orange-100' : 'text-gray-400'
          }`}
        >
          <ChevronDown className="w-5 h-5" />
        </span>
      </button>
      <div
        id={contentId}
        hidden={!isOpen}
        className={`overflow-hidden transition-all duration-500 ease-in-out px-2 ${
          isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <p className="text-gray-600 leading-relaxed border-t border-dashed border-teal-100 pt-3 mt-1">
          {answer}
        </p>
      </div>
    </div>
  );
};

export default FAQItem;