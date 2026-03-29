import { useCallback } from 'react';
import { toast } from 'sonner';

interface BulkUpdateToasts {
  bulkUpdateSuccess: string;
  bulkUpdateError: string;
}

export function useBulkProfileUpdate(
  refresh: () => void,
  setIsBulkUpdating: (v: boolean) => void,
  t: BulkUpdateToasts,
) {
  const MAX_ITERATIONS = 500;

  const handleUpdateAllProfiles = useCallback(async () => {
    setIsBulkUpdating(true);
    const toastId = toast.loading('מאתחל תהליך עדכון...', {
      duration: Infinity,
    });

    try {
      const resetRes = await fetch('/api/ai/matchmaker/batch-process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESET_FLAGS' }),
      });

      if (!resetRes.ok) throw new Error('Failed to start process');
      const resetData = await resetRes.json();
      const totalToProcess = resetData.count;
      let processedSoFar = 0;

      toast.message(
        `נמצאו ${totalToProcess} פרופילים לעדכון. מתחיל עיבוד...`,
        { id: toastId }
      );

      let completed = false;
      let iterations = 0;

      while (!completed && iterations < MAX_ITERATIONS) {
        iterations++;
        const batchRes = await fetch('/api/ai/matchmaker/batch-process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'PROCESS_BATCH', batchSize: 4 }),
        });

        if (!batchRes.ok) throw new Error('Error during batch processing');

        const batchData = await batchRes.json();
        processedSoFar += batchData.processed;
        const percent = Math.round((processedSoFar / totalToProcess) * 100);

        toast.loading(
          `מעבד פרופילים... ${percent}% (${processedSoFar}/${totalToProcess})`,
          { id: toastId }
        );

        if (batchData.completed || batchData.remaining === 0) {
          completed = true;
        }
      }

      if (!completed) {
        toast.warning('העיבוד הופסק — חריגה ממגבלת איטרציות. נא לנסות שוב.', {
          id: toastId,
          duration: 5000,
        });
      } else {
        toast.success(t.bulkUpdateSuccess, {
          id: toastId,
          duration: 4000,
        });
      }
      refresh();
    } catch {
      toast.error(t.bulkUpdateError, {
        id: toastId,
        duration: 4000,
      });
    } finally {
      setIsBulkUpdating(false);
    }
  }, [refresh, setIsBulkUpdating, t]);

  return { handleUpdateAllProfiles };
}
