'use client';

import React from 'react';
import { Brain, Zap, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SearchMethod } from '@/app/[locale]/contexts/MatchingJobContext';

interface SearchMethodTabsProps {
  activeMethod: SearchMethod;
  onMethodChange: (method: SearchMethod) => void;
  algorithmicCount: number;
  vectorCount: number;
  hybridCount: number;
  isLoading: boolean;
}

const SearchMethodTabs: React.FC<SearchMethodTabsProps> = ({
  activeMethod,
  onMethodChange,
  algorithmicCount,
  vectorCount,
  hybridCount,
  isLoading,
}) => {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
      <button
        onClick={() => onMethodChange('algorithmic')}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          activeMethod === 'algorithmic'
            ? 'bg-white shadow-sm text-purple-700'
            : 'text-gray-600 hover:text-gray-800'
        )}
      >
        <Brain className="w-4 h-4" />
        <span>AI</span>
        {algorithmicCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {algorithmicCount}
          </Badge>
        )}
      </button>

      <button
        onClick={() => onMethodChange('vector')}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          activeMethod === 'vector'
            ? 'bg-white shadow-sm text-blue-700'
            : 'text-gray-600 hover:text-gray-800'
        )}
      >
        <Zap className="w-4 h-4" />
        <span>מהיר</span>
        {vectorCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {vectorCount}
          </Badge>
        )}
      </button>

      {/* Tab היברידי */}
      <button
        onClick={() => onMethodChange('hybrid')}
        disabled={isLoading}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
          activeMethod === 'hybrid'
            ? 'bg-white shadow-sm text-emerald-700'
            : 'text-gray-600 hover:text-gray-800'
        )}
      >
        <Users className="w-4 h-4" />
        <span>היברידי</span>
        {hybridCount > 0 && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0">
            {hybridCount}
          </Badge>
        )}
      </button>
    </div>
  );
};

export default SearchMethodTabs;
