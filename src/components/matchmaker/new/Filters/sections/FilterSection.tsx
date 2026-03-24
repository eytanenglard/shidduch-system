'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export interface FilterSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
  badge?: number;
  gradient?: string;
}

const FilterSection: React.FC<FilterSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = false,
  badge,
  gradient = 'from-blue-500 to-cyan-500',
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-4"
    >
      <Collapsible
        open={isOpen}
        onOpenChange={setIsOpen}
        className="rounded-2xl overflow-hidden shadow-xl border-0 bg-gradient-to-br from-white via-gray-50/30 to-white"
      >
        <CollapsibleTrigger asChild>
          <motion.div
            className={cn(
              'flex items-center justify-between p-4 cursor-pointer transition-all duration-300',
              'bg-gradient-to-r',
              gradient,
              'text-white hover:shadow-lg'
            )}
            whileHover={{ scale: 1.02 }}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                {icon}
              </div>
              <span className="font-bold text-lg">{title}</span>
              {badge !== undefined && (
                <Badge className="bg-white/20 text-white border-white/30 shadow-lg">
                  {badge}
                </Badge>
              )}
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.3 }}
            >
              <ChevronDown size={20} className="text-white/80" />
            </motion.div>
          </motion.div>
        </CollapsibleTrigger>
        <CollapsibleContent className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:slide-out-to-top-1 data-[state=open]:slide-in-from-top-1">
          <div className="p-6 bg-gradient-to-br from-white via-gray-50/20 to-white">
            {children}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </motion.div>
  );
};

export default FilterSection;
