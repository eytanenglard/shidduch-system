'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Eye,
  Send,
  Trash2,
} from 'lucide-react';

export interface BulkActionBarProps {
  showBulkActions: boolean;
  selectedMatchIds: string[];
  isActioning: boolean;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBulkCreate: () => void;
  onBulkReview: (ids: string[]) => void;
  onBulkDismissClick: () => void;
}

const BulkActionBar: React.FC<BulkActionBarProps> = ({
  showBulkActions,
  selectedMatchIds,
  isActioning,
  onSelectAll,
  onClearSelection,
  onBulkCreate,
  onBulkReview,
  onBulkDismissClick,
}) => {
  return (
    <AnimatePresence>
      {showBulkActions && selectedMatchIds.length > 0 && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mt-4 pt-4 border-t"
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-600 font-medium">
              נבחרו{' '}
              <span className="font-bold text-purple-600">
                {selectedMatchIds.length}
              </span>{' '}
              התאמות
            </span>

            <Button size="sm" variant="outline" onClick={onSelectAll}>
              בחר הכל
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onClearSelection}
            >
              בטל בחירה
            </Button>

            <div className="flex-1" />

            {/* Send bulk suggestions */}
            <Button
              size="sm"
              className="bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white shadow-lg"
              onClick={onBulkCreate}
              disabled={isActioning}
            >
              <Send className="w-4 h-4 ml-1" />
              שלח הצעות ({selectedMatchIds.length})
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={() => onBulkReview(selectedMatchIds)}
              disabled={isActioning}
            >
              <Eye className="w-4 h-4 ml-1" />
              סמן כנבדקו
            </Button>

            <Button
              size="sm"
              variant="destructive"
              onClick={onBulkDismissClick}
              disabled={isActioning}
            >
              <Trash2 className="w-4 h-4 ml-1" />
              דחה הכל
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BulkActionBar;
