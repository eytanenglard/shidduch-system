'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import {
  HeartHandshake,
  RefreshCw,
  BarChart2,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import BatchScanButtons from '../BatchScanButtons';
import HiddenCandidatesDrawer from '../HiddenCandidatesDrawer';
import type { LastScanInfo } from '../types/potentialMatches';

export interface DashboardHeaderProps {
  activeTab: 'overview' | 'matches' | 'daily';
  onTabChange: (tab: 'overview' | 'matches' | 'daily') => void;
  pendingCount: number | string;
  // Matches tab action props
  isScanning: boolean;
  scanProgress: any;
  scanResult: any;
  onStartScan: (
    method: 'hybrid' | 'algorithmic' | 'vector' | 'metrics_v2',
    skipPreparation: boolean
  ) => void;
  onCancelScan: () => void;
  lastScanInfo: LastScanInfo | null;
  isRefreshing: boolean;
  onRefresh: () => void;
  // Hidden candidates
  hiddenCandidates: any[];
  onUnhide: (id: string) => Promise<boolean>;
  onUpdateReason: (id: string, reason: string) => Promise<boolean>;
  isLoadingHidden: boolean;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  activeTab,
  onTabChange,
  pendingCount,
  isScanning,
  scanProgress,
  scanResult,
  onStartScan,
  onCancelScan,
  lastScanInfo,
  isRefreshing,
  onRefresh,
  hiddenCandidates,
  onUnhide,
  onUpdateReason,
  isLoadingHidden,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-sm border-b shadow-sm">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Title & Tabs */}
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                מערכת השידוכים
              </h1>

              {/* Tabs Navigation */}
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => onTabChange('overview')}
                  className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded transition-all ${activeTab === 'overview' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <BarChart2 className="w-3.5 h-3.5" />
                  מבט על
                </button>
                <button
                  onClick={() => onTabChange('matches')}
                  className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded transition-all ${activeTab === 'matches' ? 'bg-indigo-50 text-indigo-700 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  ניהול התאמות ({pendingCount})
                </button>
                <button
                  onClick={() => onTabChange('daily')}
                  className={`flex items-center gap-1 text-sm px-2 py-0.5 rounded transition-all ${activeTab === 'daily' ? 'bg-violet-50 text-violet-700 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  הצעות יומיות
                </button>
              </div>
            </div>
          </div>

          {/* Actions - Only visible when in Matches tab */}
          {activeTab === 'matches' && (
            <div className="flex items-center gap-3">
              <HiddenCandidatesDrawer
                hiddenCandidates={hiddenCandidates}
                onUnhide={onUnhide}
                onUpdateReason={onUpdateReason}
                isLoading={isLoadingHidden}
              />
              <BatchScanButtons
                isScanning={isScanning}
                scanProgress={scanProgress}
                scanResult={scanResult}
                onStartScan={onStartScan}
                onCancelScan={onCancelScan}
                lastScanInfo={lastScanInfo}
              />

              <Button
                variant="outline"
                onClick={onRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw
                  className={cn(
                    'w-4 h-4 ml-2',
                    isRefreshing && 'animate-spin'
                  )}
                />
                רענן
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
