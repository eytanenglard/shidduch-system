import React, { useState } from "react";
import { ChevronDown } from "lucide-react";

export interface FAQItemProps {
  question: string;
  answer: string;
}

// FAQ Item Component
const FAQItem: React.FC<FAQItemProps> = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border-b border-gray-200 last:border-0">
      <button
        className="flex justify-between items-center w-full py-4 text-right text-gray-800 hover:text-blue-600 focus:outline-none transition-colors duration-300"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-medium text-lg">{question}</span>
        <span
          className={`transform transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <ChevronDown />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96 pb-4" : "max-h-0"
        }`}
      >
        <p className="text-gray-600">{answer}</p>
      </div>
    </div>
  );
};

export default FAQItem;
