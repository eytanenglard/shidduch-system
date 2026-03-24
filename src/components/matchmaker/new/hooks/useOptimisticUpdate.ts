import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

/**
 * Hook for optimistic UI updates with automatic rollback on failure.
 * Allows updating the UI immediately while the API call is in progress,
 * and rolls back if the API call fails.
 */
export function useOptimisticUpdate<T extends { id: string }>(
  items: T[],
  setItems: (items: T[]) => void
) {
  const rollbackRef = useRef<T[]>([]);

  /**
   * Optimistically remove an item from the list.
   * If the API call fails, the item is restored.
   */
  const optimisticRemove = useCallback(
    async (id: string, apiCall: () => Promise<void>) => {
      rollbackRef.current = [...items];
      setItems(items.filter((item) => item.id !== id));

      try {
        await apiCall();
      } catch (error) {
        setItems(rollbackRef.current);
        toast.error('הפעולה נכשלה, חוזר למצב הקודם');
        throw error;
      }
    },
    [items, setItems]
  );

  /**
   * Optimistically update an item in the list.
   * If the API call fails, the update is reverted.
   */
  const optimisticUpdate = useCallback(
    async (id: string, updates: Partial<T>, apiCall: () => Promise<void>) => {
      rollbackRef.current = [...items];
      setItems(
        items.map((item) =>
          item.id === id ? { ...item, ...updates } : item
        )
      );

      try {
        await apiCall();
      } catch (error) {
        setItems(rollbackRef.current);
        toast.error('הפעולה נכשלה, חוזר למצב הקודם');
        throw error;
      }
    },
    [items, setItems]
  );

  /**
   * Optimistically add an item to the list.
   * If the API call fails, the item is removed.
   */
  const optimisticAdd = useCallback(
    async (newItem: T, apiCall: () => Promise<void>) => {
      rollbackRef.current = [...items];
      setItems([newItem, ...items]);

      try {
        await apiCall();
      } catch (error) {
        setItems(rollbackRef.current);
        toast.error('הפעולה נכשלה, חוזר למצב הקודם');
        throw error;
      }
    },
    [items, setItems]
  );

  return {
    optimisticRemove,
    optimisticUpdate,
    optimisticAdd,
  };
}
