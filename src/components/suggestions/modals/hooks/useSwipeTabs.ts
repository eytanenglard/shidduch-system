import { useRef, useCallback } from 'react';

const TAB_ORDER = ['presentation', 'profile', 'compatibility', 'details'];

export const useSwipeTabs = (
  activeTab: string,
  onTabChange: (tab: string) => void,
  enabled: boolean,
  isRtl: boolean
) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled) return;
      touchStart.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    },
    [enabled]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!enabled || !touchStart.current) return;

      const dx = e.changedTouches[0].clientX - touchStart.current.x;
      const dy = e.changedTouches[0].clientY - touchStart.current.y;
      touchStart.current = null;

      // Only register horizontal swipes (|dx| > 50px and more horizontal than vertical)
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy) * 1.5) return;

      const currentIdx = TAB_ORDER.indexOf(activeTab);
      // In RTL: swipe right = next, swipe left = prev (opposite of LTR)
      const direction = isRtl ? (dx > 0 ? 1 : -1) : (dx > 0 ? -1 : 1);
      const nextIdx = currentIdx + direction;

      if (nextIdx >= 0 && nextIdx < TAB_ORDER.length) {
        onTabChange(TAB_ORDER[nextIdx]);
      }
    },
    [enabled, activeTab, onTabChange, isRtl]
  );

  return { handleTouchStart, handleTouchEnd };
};
