import { useState, useEffect, useCallback } from 'react';

export const useFullscreenModal = (isOpen: boolean) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const toggleFullscreen = useCallback(() => {
    setIsTransitioning(true);
    setIsFullscreen((prev) => !prev);
    setTimeout(() => setIsTransitioning(false), 300);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setIsFullscreen(false);
      setIsTransitioning(false);
    }
  }, [isOpen]);

  return { isFullscreen, isTransitioning, toggleFullscreen };
};
