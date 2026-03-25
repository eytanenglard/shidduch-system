'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Download,
  CheckSquare,
  Tag,
  Users,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkExport?: () => void;
  onBulkStatusChange?: () => void;
  onBulkTag?: () => void;
  className?: string;
}

const BulkActionToolbar: React.FC<BulkActionToolbarProps> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBulkExport,
  onBulkStatusChange,
  onBulkTag,
  className,
}) => {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className={cn(
            'fixed bottom-6 left-1/2 -translate-x-1/2 z-50',
            'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600',
            'text-white rounded-2xl shadow-2xl px-3 py-2 md:px-6 md:py-3',
            'flex items-center gap-2 md:gap-4 w-[calc(100%-2rem)] md:w-auto md:min-w-[400px]',
            'border border-white/20 backdrop-blur-sm',
            className
          )}
        >
          {/* Selected count */}
          <div className="flex items-center gap-2 border-l border-white/30 pl-4">
            <Users className="w-4 h-4" />
            <Badge className="bg-white/20 text-white border-white/30 text-sm">
              {selectedCount}
            </Badge>
            <span className="text-sm font-medium">מועמדים נבחרו</span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mr-auto">
            {selectedCount < totalCount && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onSelectAll}
                className="text-white hover:bg-white/20 rounded-xl text-xs min-h-[44px]"
              >
                <CheckSquare className="w-3.5 h-3.5 mr-1" />
                בחר הכל ({totalCount})
              </Button>
            )}

            {onBulkExport && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkExport}
                className="text-white hover:bg-white/20 rounded-xl text-xs min-h-[44px]"
              >
                <Download className="w-3.5 h-3.5 mr-1" />
                ייצוא
              </Button>
            )}

            {onBulkStatusChange && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkStatusChange}
                className="text-white hover:bg-white/20 rounded-xl text-xs min-h-[44px]"
              >
                <RefreshCw className="w-3.5 h-3.5 mr-1" />
                שנה סטטוס
              </Button>
            )}

            {onBulkTag && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onBulkTag}
                className="text-white hover:bg-white/20 rounded-xl text-xs min-h-[44px]"
              >
                <Tag className="w-3.5 h-3.5 mr-1" />
                הוסף תגית
              </Button>
            )}
          </div>

          {/* Close */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="text-white hover:bg-white/20 rounded-full h-8 w-8 min-h-[44px] min-w-[44px] p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionToolbar;
