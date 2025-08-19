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

  // <<< הוספה: יצירת ID ייחודי עבור התוכן שייפתח >>>
  // זה נחוץ כדי לקשר בין הכפתור לתוכן
  const contentId = `faq-answer-${question.replace(/\s+/g, '-').toLowerCase()}`;

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="flex justify-between items-center w-full py-4 text-right text-gray-800 hover:text-cyan-600 focus:outline-none transition-colors duration-300"
        onClick={() => setIsOpen(!isOpen)}
        // <<< הוספה: תכונות נגישות לכפתור >>>
        aria-expanded={isOpen}
        aria-controls={contentId}
      >
        <span className="font-medium text-lg">{question}</span>
        <span
          className={`transform transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        >
          <ChevronDown />
        </span>
      </button>
      <div
        // <<< הוספה: תכונות נגישות לתוכן >>>
        id={contentId}
        hidden={!isOpen}
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 pb-4' : 'max-h-0'
        }`}
      >
        <p className="text-gray-600">{answer}</p>
      </div>
    </div>
  );
};

export default FAQItem;
