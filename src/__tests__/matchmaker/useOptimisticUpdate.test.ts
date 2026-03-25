import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

/**
 * Tests for useOptimisticUpdate hook logic.
 *
 * Since we're in a node environment without JSDOM/react-testing-library,
 * we test the core logic by simulating the hook's behavior directly.
 * Each operation follows the same pattern:
 *   1. Save rollback snapshot
 *   2. Optimistically update items
 *   3. Call API
 *   4. On failure: rollback + toast error
 */

interface TestItem {
  id: string;
  name: string;
  status?: string;
}

// Simulate the optimistic operations as pure functions matching the hook logic

async function optimisticRemove<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  id: string,
  apiCall: () => Promise<void>
): Promise<void> {
  const rollback = [...items];
  setItems(items.filter((item) => item.id !== id));

  try {
    await apiCall();
  } catch (error) {
    setItems(rollback);
    const { toast } = await import('sonner');
    toast.error('הפעולה נכשלה, חוזר למצב הקודם');
    throw error;
  }
}

async function optimisticUpdate<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  id: string,
  updates: Partial<T>,
  apiCall: () => Promise<void>
): Promise<void> {
  const rollback = [...items];
  setItems(
    items.map((item) =>
      item.id === id ? { ...item, ...updates } : item
    )
  );

  try {
    await apiCall();
  } catch (error) {
    setItems(rollback);
    const { toast } = await import('sonner');
    toast.error('הפעולה נכשלה, חוזר למצב הקודם');
    throw error;
  }
}

async function optimisticAdd<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void,
  newItem: T,
  apiCall: () => Promise<void>
): Promise<void> {
  const rollback = [...items];
  setItems([newItem, ...items]);

  try {
    await apiCall();
  } catch (error) {
    setItems(rollback);
    const { toast } = await import('sonner');
    toast.error('הפעולה נכשלה, חוזר למצב הקודם');
    throw error;
  }
}

// ---- Tests ----

describe('useOptimisticUpdate', () => {
  let items: TestItem[];
  let setItems: ReturnType<typeof vi.fn> & ((items: TestItem[]) => void);
  let toastError: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    items = [
      { id: '1', name: 'Alice', status: 'active' },
      { id: '2', name: 'Bob', status: 'active' },
      { id: '3', name: 'Charlie', status: 'pending' },
    ];
    setItems = vi.fn() as typeof setItems;
    vi.clearAllMocks();
    const { toast } = await import('sonner');
    toastError = toast.error as ReturnType<typeof vi.fn>;
  });

  describe('optimisticRemove', () => {
    it('removes item immediately and calls API', async () => {
      const apiCall = vi.fn().mockResolvedValue(undefined);

      await optimisticRemove(items, setItems, '2', apiCall);

      // First call: optimistic removal
      expect(setItems).toHaveBeenCalledTimes(1);
      const optimisticResult = setItems.mock.calls[0][0];
      expect(optimisticResult).toHaveLength(2);
      expect(optimisticResult.find((i: TestItem) => i.id === '2')).toBeUndefined();
      expect(optimisticResult.map((i: TestItem) => i.id)).toEqual(['1', '3']);

      // API was called
      expect(apiCall).toHaveBeenCalledOnce();
    });

    it('rolls back on API failure', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('Network error'));

      await expect(
        optimisticRemove(items, setItems, '2', apiCall)
      ).rejects.toThrow('Network error');

      // First call: optimistic removal, second call: rollback
      expect(setItems).toHaveBeenCalledTimes(2);

      // Rollback restores original items
      const rollbackResult = setItems.mock.calls[1][0];
      expect(rollbackResult).toHaveLength(3);
      expect(rollbackResult.map((i: TestItem) => i.id)).toEqual(['1', '2', '3']);

      // Toast error shown
      expect(toastError).toHaveBeenCalledWith('הפעולה נכשלה, חוזר למצב הקודם');
    });

    it('handles removing non-existent item gracefully', async () => {
      const apiCall = vi.fn().mockResolvedValue(undefined);

      await optimisticRemove(items, setItems, 'non-existent', apiCall);

      // All items remain (none matched the ID)
      const result = setItems.mock.calls[0][0];
      expect(result).toHaveLength(3);
      expect(apiCall).toHaveBeenCalledOnce();
    });
  });

  describe('optimisticUpdate', () => {
    it('updates item immediately and calls API', async () => {
      const apiCall = vi.fn().mockResolvedValue(undefined);

      await optimisticUpdate(items, setItems, '2', { name: 'Bobby' }, apiCall);

      // First call: optimistic update
      expect(setItems).toHaveBeenCalledTimes(1);
      const optimisticResult = setItems.mock.calls[0][0];
      expect(optimisticResult).toHaveLength(3);
      expect(optimisticResult[1]).toEqual({ id: '2', name: 'Bobby', status: 'active' });

      // Other items unchanged
      expect(optimisticResult[0]).toEqual(items[0]);
      expect(optimisticResult[2]).toEqual(items[2]);

      expect(apiCall).toHaveBeenCalledOnce();
    });

    it('rolls back on API failure', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('Server error'));

      await expect(
        optimisticUpdate(items, setItems, '2', { name: 'Bobby' }, apiCall)
      ).rejects.toThrow('Server error');

      expect(setItems).toHaveBeenCalledTimes(2);

      // Rollback restores original
      const rollbackResult = setItems.mock.calls[1][0];
      expect(rollbackResult[1]).toEqual({ id: '2', name: 'Bob', status: 'active' });

      expect(toastError).toHaveBeenCalledWith('הפעולה נכשלה, חוזר למצב הקודם');
    });

    it('can update multiple fields at once', async () => {
      const apiCall = vi.fn().mockResolvedValue(undefined);

      await optimisticUpdate(
        items,
        setItems,
        '1',
        { name: 'Alicia', status: 'inactive' },
        apiCall
      );

      const result = setItems.mock.calls[0][0];
      expect(result[0]).toEqual({ id: '1', name: 'Alicia', status: 'inactive' });
    });

    it('does not modify items when ID does not match', async () => {
      const apiCall = vi.fn().mockResolvedValue(undefined);

      await optimisticUpdate(items, setItems, 'non-existent', { name: 'Nobody' }, apiCall);

      const result = setItems.mock.calls[0][0];
      // All items unchanged
      expect(result).toEqual(items);
    });
  });

  describe('optimisticAdd', () => {
    it('adds item to the beginning and calls API', async () => {
      const apiCall = vi.fn().mockResolvedValue(undefined);
      const newItem: TestItem = { id: '4', name: 'Diana', status: 'active' };

      await optimisticAdd(items, setItems, newItem, apiCall);

      expect(setItems).toHaveBeenCalledTimes(1);
      const result = setItems.mock.calls[0][0];
      expect(result).toHaveLength(4);
      expect(result[0]).toEqual(newItem);
      expect(result[1]).toEqual(items[0]);

      expect(apiCall).toHaveBeenCalledOnce();
    });

    it('rolls back on API failure', async () => {
      const apiCall = vi.fn().mockRejectedValue(new Error('Conflict'));
      const newItem: TestItem = { id: '4', name: 'Diana', status: 'active' };

      await expect(
        optimisticAdd(items, setItems, newItem, apiCall)
      ).rejects.toThrow('Conflict');

      expect(setItems).toHaveBeenCalledTimes(2);

      // Rollback restores original (without the new item)
      const rollbackResult = setItems.mock.calls[1][0];
      expect(rollbackResult).toHaveLength(3);
      expect(rollbackResult.map((i: TestItem) => i.id)).toEqual(['1', '2', '3']);

      expect(toastError).toHaveBeenCalledWith('הפעולה נכשלה, חוזר למצב הקודם');
    });

    it('works with empty initial list', async () => {
      const apiCall = vi.fn().mockResolvedValue(undefined);
      const newItem: TestItem = { id: '1', name: 'First', status: 'active' };

      await optimisticAdd([], setItems, newItem, apiCall);

      const result = setItems.mock.calls[0][0];
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(newItem);
    });
  });
});
