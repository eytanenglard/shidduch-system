import { useState, useCallback, useEffect } from 'react';

interface UseKeyboardNavigationOptions {
  /** Total number of items in the list */
  totalItems: number;
  /** Number of columns in grid view (1 for list view) */
  columns: number;
  /** Whether the list is in RTL mode */
  isRTL?: boolean;
  /** Callback when Enter is pressed on focused item */
  onSelect?: (index: number) => void;
  /** Callback when Escape is pressed */
  onEscape?: () => void;
  /** Callback when 'S' is pressed (suggest shortcut) */
  onSuggest?: (index: number) => void;
  /** Callback when 'E' is pressed (edit shortcut) */
  onEdit?: (index: number) => void;
  /** Whether keyboard navigation is enabled */
  enabled?: boolean;
}

interface UseKeyboardNavigationReturn {
  /** Currently focused item index (-1 = none) */
  focusedIndex: number;
  /** Set focused index manually */
  setFocusedIndex: (index: number) => void;
  /** Check if a specific index is focused */
  isFocused: (index: number) => boolean;
  /** Reset focus (unfocus all) */
  resetFocus: () => void;
  /** Props to spread on the container element */
  containerProps: {
    tabIndex: number;
    onKeyDown: (e: React.KeyboardEvent) => void;
    role: string;
    'aria-activedescendant': string | undefined;
  };
  /** Get props for an individual item */
  getItemProps: (index: number) => {
    id: string;
    role: string;
    'aria-selected': boolean;
    'data-focused': boolean;
    tabIndex: number;
  };
}

export function useKeyboardNavigation({
  totalItems,
  columns,
  isRTL = true,
  onSelect,
  onEscape,
  onSuggest,
  onEdit,
  enabled = true,
}: UseKeyboardNavigationOptions): UseKeyboardNavigationReturn {
  const [focusedIndex, setFocusedIndex] = useState(-1);

  // Reset focus when total items change
  useEffect(() => {
    if (focusedIndex >= totalItems) {
      setFocusedIndex(-1);
    }
  }, [totalItems, focusedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!enabled || totalItems === 0) return;

      // Don't intercept when typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      let newIndex = focusedIndex;
      let handled = false;

      switch (e.key) {
        case 'ArrowRight':
          // In RTL: Right = previous, in LTR: Right = next
          newIndex = isRTL
            ? Math.max(0, focusedIndex - 1)
            : Math.min(totalItems - 1, focusedIndex + 1);
          handled = true;
          break;

        case 'ArrowLeft':
          // In RTL: Left = next, in LTR: Left = previous
          newIndex = isRTL
            ? Math.min(totalItems - 1, focusedIndex + 1)
            : Math.max(0, focusedIndex - 1);
          handled = true;
          break;

        case 'ArrowDown':
          newIndex = Math.min(totalItems - 1, focusedIndex + columns);
          handled = true;
          break;

        case 'ArrowUp':
          newIndex = Math.max(0, focusedIndex - columns);
          handled = true;
          break;

        case 'Enter':
          if (focusedIndex >= 0 && onSelect) {
            onSelect(focusedIndex);
            handled = true;
          }
          break;

        case 'Escape':
          if (focusedIndex >= 0) {
            setFocusedIndex(-1);
            handled = true;
          } else if (onEscape) {
            onEscape();
            handled = true;
          }
          break;

        case 's':
        case 'S':
          if (focusedIndex >= 0 && onSuggest) {
            onSuggest(focusedIndex);
            handled = true;
          }
          break;

        case 'e':
        case 'E':
          if (focusedIndex >= 0 && onEdit) {
            onEdit(focusedIndex);
            handled = true;
          }
          break;

        case 'Home':
          newIndex = 0;
          handled = true;
          break;

        case 'End':
          newIndex = totalItems - 1;
          handled = true;
          break;
      }

      if (handled) {
        e.preventDefault();
        e.stopPropagation();
      }

      if (newIndex !== focusedIndex && newIndex >= 0) {
        setFocusedIndex(newIndex);
      }
    },
    [enabled, totalItems, focusedIndex, columns, isRTL, onSelect, onEscape, onSuggest, onEdit]
  );

  const isFocused = useCallback(
    (index: number) => focusedIndex === index,
    [focusedIndex]
  );

  const resetFocus = useCallback(() => setFocusedIndex(-1), []);

  const containerProps = {
    tabIndex: 0,
    onKeyDown: handleKeyDown,
    role: 'grid' as const,
    'aria-activedescendant':
      focusedIndex >= 0 ? `candidate-card-${focusedIndex}` : undefined,
  };

  const getItemProps = useCallback(
    (index: number) => ({
      id: `candidate-card-${index}`,
      role: 'gridcell' as const,
      'aria-selected': focusedIndex === index,
      'data-focused': focusedIndex === index,
      tabIndex: focusedIndex === index ? 0 : -1,
    }),
    [focusedIndex]
  );

  return {
    focusedIndex,
    setFocusedIndex,
    isFocused,
    resetFocus,
    containerProps,
    getItemProps,
  };
}
