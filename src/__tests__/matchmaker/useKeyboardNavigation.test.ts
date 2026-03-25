import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * Tests for useKeyboardNavigation hook logic.
 *
 * Since we're in a node environment without JSDOM/react-testing-library,
 * we extract and test the keyboard handling logic directly by simulating
 * what the hook does internally.
 */

// ---- Helpers ----

interface KeyboardNavOptions {
  totalItems: number;
  columns: number;
  isRTL?: boolean;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  onSuggest?: (index: number) => void;
  onEdit?: (index: number) => void;
  enabled?: boolean;
}

/**
 * Simulates the keyboard navigation logic from the hook.
 * Returns the new focused index and whether the event was handled.
 */
function simulateKeyDown(
  key: string,
  focusedIndex: number,
  options: KeyboardNavOptions,
  targetTagName: string = 'DIV',
  isContentEditable: boolean = false
): { newFocusedIndex: number; handled: boolean } {
  const {
    totalItems,
    columns,
    isRTL = true,
    onSelect,
    onEscape,
    onSuggest,
    onEdit,
    enabled = true,
  } = options;

  if (!enabled || totalItems === 0) {
    return { newFocusedIndex: focusedIndex, handled: false };
  }

  // Skip input elements
  if (
    targetTagName === 'INPUT' ||
    targetTagName === 'TEXTAREA' ||
    targetTagName === 'SELECT' ||
    isContentEditable
  ) {
    return { newFocusedIndex: focusedIndex, handled: false };
  }

  let newIndex = focusedIndex;
  let handled = false;

  switch (key) {
    case 'ArrowRight':
      newIndex = isRTL
        ? Math.max(0, focusedIndex - 1)
        : Math.min(totalItems - 1, focusedIndex + 1);
      handled = true;
      break;

    case 'ArrowLeft':
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
        newIndex = -1;
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

  // The hook only updates focusedIndex if newIndex !== focusedIndex && newIndex >= 0
  if (newIndex !== focusedIndex && newIndex >= 0) {
    return { newFocusedIndex: newIndex, handled };
  }

  // Special case: Escape sets to -1 explicitly
  if (key === 'Escape' && focusedIndex >= 0) {
    return { newFocusedIndex: -1, handled: true };
  }

  return { newFocusedIndex: focusedIndex, handled };
}

// ---- Tests ----

describe('useKeyboardNavigation', () => {
  const defaultOptions: KeyboardNavOptions = {
    totalItems: 10,
    columns: 3,
    isRTL: true,
    enabled: true,
  };

  describe('RTL arrow key mapping', () => {
    it('ArrowLeft moves to next item (higher index) in RTL', () => {
      const result = simulateKeyDown('ArrowLeft', 2, {
        ...defaultOptions,
        isRTL: true,
      });
      expect(result.newFocusedIndex).toBe(3);
      expect(result.handled).toBe(true);
    });

    it('ArrowRight moves to previous item (lower index) in RTL', () => {
      const result = simulateKeyDown('ArrowRight', 3, {
        ...defaultOptions,
        isRTL: true,
      });
      expect(result.newFocusedIndex).toBe(2);
      expect(result.handled).toBe(true);
    });

    it('ArrowLeft at last item stays at last item in RTL', () => {
      const result = simulateKeyDown('ArrowLeft', 9, {
        ...defaultOptions,
        isRTL: true,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(9);
    });

    it('ArrowRight at first item stays at first item in RTL', () => {
      const result = simulateKeyDown('ArrowRight', 0, {
        ...defaultOptions,
        isRTL: true,
      });
      expect(result.newFocusedIndex).toBe(0);
    });
  });

  describe('LTR arrow key mapping', () => {
    it('ArrowRight moves to next item (higher index) in LTR', () => {
      const result = simulateKeyDown('ArrowRight', 2, {
        ...defaultOptions,
        isRTL: false,
      });
      expect(result.newFocusedIndex).toBe(3);
      expect(result.handled).toBe(true);
    });

    it('ArrowLeft moves to previous item (lower index) in LTR', () => {
      const result = simulateKeyDown('ArrowLeft', 3, {
        ...defaultOptions,
        isRTL: false,
      });
      expect(result.newFocusedIndex).toBe(2);
      expect(result.handled).toBe(true);
    });

    it('ArrowRight at last item stays at last item in LTR', () => {
      const result = simulateKeyDown('ArrowRight', 9, {
        ...defaultOptions,
        isRTL: false,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(9);
    });

    it('ArrowLeft at first item stays at first item in LTR', () => {
      const result = simulateKeyDown('ArrowLeft', 0, {
        ...defaultOptions,
        isRTL: false,
      });
      expect(result.newFocusedIndex).toBe(0);
    });
  });

  describe('Up/Down navigation with columns', () => {
    it('ArrowDown moves down by number of columns', () => {
      const result = simulateKeyDown('ArrowDown', 1, {
        ...defaultOptions,
        columns: 3,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(4); // 1 + 3
    });

    it('ArrowUp moves up by number of columns', () => {
      const result = simulateKeyDown('ArrowUp', 4, {
        ...defaultOptions,
        columns: 3,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(1); // 4 - 3
    });

    it('ArrowDown at bottom row stays clamped to last item', () => {
      const result = simulateKeyDown('ArrowDown', 8, {
        ...defaultOptions,
        columns: 3,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(9); // min(9, 8+3=11) = 9
    });

    it('ArrowUp at top row stays clamped to 0', () => {
      const result = simulateKeyDown('ArrowUp', 1, {
        ...defaultOptions,
        columns: 3,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(0); // max(0, 1-3=-2) = 0
    });

    it('ArrowDown in single-column list moves one item', () => {
      const result = simulateKeyDown('ArrowDown', 2, {
        ...defaultOptions,
        columns: 1,
        totalItems: 5,
      });
      expect(result.newFocusedIndex).toBe(3);
    });
  });

  describe('Enter key', () => {
    it('calls onSelect with focusedIndex when focused', () => {
      const onSelect = vi.fn();
      const result = simulateKeyDown('Enter', 5, {
        ...defaultOptions,
        onSelect,
      });
      expect(onSelect).toHaveBeenCalledWith(5);
      expect(result.handled).toBe(true);
    });

    it('does not call onSelect when focusedIndex is -1', () => {
      const onSelect = vi.fn();
      simulateKeyDown('Enter', -1, {
        ...defaultOptions,
        onSelect,
      });
      expect(onSelect).not.toHaveBeenCalled();
    });

    it('does not call onSelect when callback is not provided', () => {
      const result = simulateKeyDown('Enter', 5, defaultOptions);
      expect(result.handled).toBe(false);
    });
  });

  describe('Escape key', () => {
    it('resets focusedIndex to -1 when something is focused', () => {
      const result = simulateKeyDown('Escape', 3, defaultOptions);
      expect(result.newFocusedIndex).toBe(-1);
      expect(result.handled).toBe(true);
    });

    it('calls onEscape when nothing is focused', () => {
      const onEscape = vi.fn();
      const result = simulateKeyDown('Escape', -1, {
        ...defaultOptions,
        onEscape,
      });
      expect(onEscape).toHaveBeenCalled();
      expect(result.handled).toBe(true);
    });

    it('does not call onEscape when something is focused (just resets focus)', () => {
      const onEscape = vi.fn();
      simulateKeyDown('Escape', 3, {
        ...defaultOptions,
        onEscape,
      });
      expect(onEscape).not.toHaveBeenCalled();
    });
  });

  describe('S key (suggest shortcut)', () => {
    it('calls onSuggest with focusedIndex when focused', () => {
      const onSuggest = vi.fn();
      simulateKeyDown('s', 4, {
        ...defaultOptions,
        onSuggest,
      });
      expect(onSuggest).toHaveBeenCalledWith(4);
    });

    it('works with uppercase S', () => {
      const onSuggest = vi.fn();
      simulateKeyDown('S', 4, {
        ...defaultOptions,
        onSuggest,
      });
      expect(onSuggest).toHaveBeenCalledWith(4);
    });

    it('does not call onSuggest when focusedIndex is -1', () => {
      const onSuggest = vi.fn();
      simulateKeyDown('s', -1, {
        ...defaultOptions,
        onSuggest,
      });
      expect(onSuggest).not.toHaveBeenCalled();
    });
  });

  describe('E key (edit shortcut)', () => {
    it('calls onEdit with focusedIndex when focused', () => {
      const onEdit = vi.fn();
      simulateKeyDown('e', 2, {
        ...defaultOptions,
        onEdit,
      });
      expect(onEdit).toHaveBeenCalledWith(2);
    });

    it('works with uppercase E', () => {
      const onEdit = vi.fn();
      simulateKeyDown('E', 2, {
        ...defaultOptions,
        onEdit,
      });
      expect(onEdit).toHaveBeenCalledWith(2);
    });

    it('does not call onEdit when focusedIndex is -1', () => {
      const onEdit = vi.fn();
      simulateKeyDown('e', -1, {
        ...defaultOptions,
        onEdit,
      });
      expect(onEdit).not.toHaveBeenCalled();
    });
  });

  describe('input/textarea/select elements are skipped', () => {
    it('skips when target is INPUT', () => {
      const onSelect = vi.fn();
      const result = simulateKeyDown('Enter', 3, {
        ...defaultOptions,
        onSelect,
      }, 'INPUT');
      expect(onSelect).not.toHaveBeenCalled();
      expect(result.handled).toBe(false);
    });

    it('skips when target is TEXTAREA', () => {
      const result = simulateKeyDown('ArrowLeft', 3, defaultOptions, 'TEXTAREA');
      expect(result.newFocusedIndex).toBe(3); // unchanged
      expect(result.handled).toBe(false);
    });

    it('skips when target is SELECT', () => {
      const result = simulateKeyDown('ArrowDown', 3, defaultOptions, 'SELECT');
      expect(result.newFocusedIndex).toBe(3);
      expect(result.handled).toBe(false);
    });

    it('skips when target is contentEditable', () => {
      const result = simulateKeyDown('ArrowDown', 3, defaultOptions, 'DIV', true);
      expect(result.newFocusedIndex).toBe(3);
      expect(result.handled).toBe(false);
    });
  });

  describe('enabled=false disables keyboard handling', () => {
    it('does nothing when enabled is false', () => {
      const onSelect = vi.fn();
      const result = simulateKeyDown('Enter', 3, {
        ...defaultOptions,
        onSelect,
        enabled: false,
      });
      expect(onSelect).not.toHaveBeenCalled();
      expect(result.handled).toBe(false);
      expect(result.newFocusedIndex).toBe(3);
    });

    it('does not navigate when disabled', () => {
      const result = simulateKeyDown('ArrowLeft', 2, {
        ...defaultOptions,
        enabled: false,
      });
      expect(result.newFocusedIndex).toBe(2);
    });
  });

  describe('boundary handling', () => {
    it('cannot go below 0 with ArrowRight in RTL', () => {
      const result = simulateKeyDown('ArrowRight', 0, {
        ...defaultOptions,
        isRTL: true,
      });
      expect(result.newFocusedIndex).toBe(0);
    });

    it('cannot go above totalItems-1 with ArrowLeft in RTL', () => {
      const result = simulateKeyDown('ArrowLeft', 9, {
        ...defaultOptions,
        isRTL: true,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(9);
    });

    it('cannot go below 0 with ArrowUp', () => {
      const result = simulateKeyDown('ArrowUp', 0, {
        ...defaultOptions,
        columns: 3,
      });
      expect(result.newFocusedIndex).toBe(0);
    });

    it('cannot go above totalItems-1 with ArrowDown', () => {
      const result = simulateKeyDown('ArrowDown', 9, {
        ...defaultOptions,
        columns: 3,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(9);
    });

    it('does nothing with 0 total items', () => {
      const result = simulateKeyDown('ArrowDown', -1, {
        ...defaultOptions,
        totalItems: 0,
      });
      expect(result.newFocusedIndex).toBe(-1);
      expect(result.handled).toBe(false);
    });
  });

  describe('Home and End keys', () => {
    it('Home goes to first item', () => {
      const result = simulateKeyDown('Home', 7, {
        ...defaultOptions,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(0);
    });

    it('End goes to last item', () => {
      const result = simulateKeyDown('End', 2, {
        ...defaultOptions,
        totalItems: 10,
      });
      expect(result.newFocusedIndex).toBe(9);
    });
  });
});
