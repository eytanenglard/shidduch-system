import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, ChevronUp, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import type { ProfileChecklistDict } from '@/types/dictionary';

const WORLD_NAMES_MAP = {
  values: 'ערכים',
  personality: 'אישיות',
  relationship: 'זוגיות',
  partner: 'פרטנר',
  religion: 'דת ומסורת',
} as const;

type WorldKey = keyof typeof WORLD_NAMES_MAP;

export interface ChecklistItemProps {
  id: string;
  isCompleted: boolean;
  title: string;
  description: string;
  link?: string;
  onClick?: () => void;
  icon: React.ElementType;
  missingItems?: string[];
  worldProgress?: {
    world: string;
    completed: number;
    total: number;
    isDone: boolean;
  }[];
  isActive: boolean;
  setActiveItemId: React.Dispatch<React.SetStateAction<string | null>>;
  dict: ProfileChecklistDict;
}

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  isCompleted,
  title,
  description,
  link,
  onClick,
  icon: Icon,
  missingItems,
  worldProgress,
  isActive,
  setActiveItemId,
  dict,
}) => {
  const canExpand =
    (missingItems && missingItems.length > 0) ||
    (worldProgress && worldProgress.length > 0);
  const isExpanded = isActive && canExpand;

  const handleInteraction = (event: React.PointerEvent) => {
    if (isCompleted) return;
    event.preventDefault();
    if (onClick) {
      onClick();
    }
  };

  const cardContent = (
    <>
      <div className="relative w-full flex justify-center mb-3">
        <div
          className={cn(
            'relative flex items-center justify-center w-14 h-14 rounded-2xl transition-all duration-300 transform group-hover:scale-110',
            isCompleted
              ? 'bg-emerald-100 shadow-emerald-500/10'
              : 'bg-gradient-to-br from-teal-50 to-orange-50 shadow-teal-500/10'
          )}
        >
          <Icon
            className={cn(
              'w-7 h-7 transition-colors duration-300',
              isCompleted ? 'text-emerald-500' : 'text-teal-600'
            )}
          />
        </div>
        {isCompleted && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              type: 'spring',
              stiffness: 400,
              damping: 20,
              delay: 0.2,
            }}
            className="absolute -top-1 -end-1"
          >
            <CheckCircle
              className="w-5 h-5 text-emerald-500 bg-white rounded-full p-0.5"
              fill="white"
            />
          </motion.div>
        )}
      </div>
      <h4
        className={cn(
          'font-bold text-sm text-center transition-colors',
          isCompleted ? 'text-gray-400 line-through' : 'text-gray-800'
        )}
      >
        {title}
      </h4>
      {!isCompleted && (
        <p className="text-xs text-center text-gray-500 mt-1 leading-tight h-8">
          {description}
        </p>
      )}
    </>
  );

  const interactiveContent =
    link && !isCompleted ? (
      <Link href={link} passHref legacyBehavior>
        <a className="block h-full w-full">{cardContent}</a>
      </Link>
    ) : (
      <button
        onPointerDown={handleInteraction}
        className="h-full w-full text-start"
        disabled={isCompleted}
      >
        {cardContent}
      </button>
    );

  return (
    <motion.div
      layout
      className={cn(
        'relative flex flex-col rounded-2xl transition-all duration-300 group overflow-hidden',
        isCompleted ? 'bg-white/40' : 'bg-white/70 shadow-md',
        isExpanded && 'shadow-xl bg-white'
      )}
    >
      <div className={cn('p-4 relative', !isCompleted && 'cursor-pointer')}>
        {interactiveContent}
        {canExpand && !isCompleted && (
          <Button
            variant="ghost"
            size="icon"
            onPointerDown={(e) => {
              e.stopPropagation();
              setActiveItemId((prev) => (prev === id ? null : id));
            }}
            className="absolute bottom-1 end-1 w-8 h-8 rounded-full text-gray-500 hover:bg-gray-200/50"
            aria-label={isExpanded ? dict.minimizeLabel : dict.expandLabel}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </Button>
        )}
      </div>
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            layout
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-br from-teal-50/50 via-white to-orange-50/50 border-t border-teal-100 px-4 py-3 text-sm">
              <h4 className="font-semibold text-xs mb-2 text-gray-800">
                {dict.missingItemsTitle}
              </h4>
              {missingItems && (
                <ul className="list-disc ps-4 space-y-1.5 text-gray-600 text-xs">
                  {missingItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {worldProgress && (
                <div className="space-y-2">
                  {worldProgress.map((world) => (
                    <div
                      key={world.world}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className={cn(
                          'font-medium',
                          world.isDone ? 'text-emerald-600' : 'text-gray-700'
                        )}
                      >
                        {WORLD_NAMES_MAP[world.world as WorldKey] ||
                          world.world}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs">
                          {world.completed}/{world.total}
                        </span>
                        {world.isDone && (
                          <CheckCircle className="h-4 w-4 text-emerald-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
