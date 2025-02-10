import { 
  QuestionnaireAnswer, 
  WorldId,
  UserTrack,
  AnswerValue,
} from '../components/questionnaire/types/types';

// Interface definitions
interface StorageProgress {
  answers: QuestionnaireAnswer[];
  currentStep: string;
  currentWorld: WorldId;
  userTrack: UserTrack;
  worldsCompleted: WorldId[];
  startedAt: string;
}

interface CompressedAnswer {
  q: string;        // questionId
  w?: WorldId;      // worldId (optional - only if different from previous)
  v: AnswerValue;  // value
  t: number;       // timestamp delta in seconds
}

// Removed unused CompressedProgress interface

interface StorageMetadata {
  chunks: number;
  startTime: string;
  lastSaved: string;
}

// Constants
const STORAGE_KEYS = {
  META: 'questionnaire_meta',
  MINIMAL: 'questionnaire_minimal',
  CHUNK_PREFIX: 'questionnaire_chunk_'
} as const;

const CHUNK_SIZE = 50;
// Removed unused SAVE_DELAY constant

// Main service object
export const storageService = {
  /**
   * Compresses an array of answers
   */
  compressAnswers(answers: QuestionnaireAnswer[], startTime: string): CompressedAnswer[] {
    const lastWorld: WorldId | undefined = undefined;
    const baseTime = new Date(startTime).getTime();
    
    return answers.map(answer => {
      const compressed: CompressedAnswer = {
        q: answer.questionId,
        v: answer.value,
        t: Math.floor((new Date(answer.answeredAt).getTime() - baseTime) / 1000)
      };

      // Only store worldId if it changed
      if (answer.worldId !== lastWorld) {
        compressed.w = answer.worldId;
      }

      return compressed;
    });
  },

  /**
   * Decompresses an array of compressed answers
   */
  decompressAnswers(compressed: CompressedAnswer[], startTime: string): QuestionnaireAnswer[] {
    const lastWorld: WorldId = 'VALUES'; // default world
    const baseTime = new Date(startTime).getTime();

    return compressed.map(ans => ({
      questionId: ans.q,
      worldId: (ans.w || lastWorld) as WorldId,
      value: ans.v,
      answeredAt: new Date(baseTime + (ans.t * 1000)).toISOString()
    }));
  },

  /**
   * Saves the complete questionnaire progress
   */
  async saveProgress(progress: StorageProgress): Promise<void> {
    try {
      // Prepare metadata
      const metadata: StorageMetadata = {
        startTime: progress.startedAt,
        lastSaved: new Date().toISOString(),
        chunks: 0
      };

      // Compress answers
      const compressedAnswers = this.compressAnswers(progress.answers, metadata.startTime);
      
      // Split into chunks
      const chunks: CompressedAnswer[][] = [];
      for (let i = 0; i < compressedAnswers.length; i += CHUNK_SIZE) {
        chunks.push(compressedAnswers.slice(i, i + CHUNK_SIZE));
      }

      metadata.chunks = chunks.length;

      // Save metadata
      localStorage.setItem(STORAGE_KEYS.META, JSON.stringify({
        metadata,
        currentStep: progress.currentStep,
        currentWorld: progress.currentWorld,
        userTrack: progress.userTrack,
        worldsCompleted: progress.worldsCompleted
      }));

      // Save each chunk separately
      chunks.forEach((chunk, index) => {
        localStorage.setItem(
          `${STORAGE_KEYS.CHUNK_PREFIX}${index}`, 
          JSON.stringify(chunk)
        );
      });

    } catch (error) {
      console.error('Error saving progress:', error);
      // Fallback to minimal save
      this.saveMinimal(progress);
    }
  },

  /**
   * Saves minimal progress information (fallback)
   */
  saveMinimal(progress: Partial<StorageProgress>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.MINIMAL, JSON.stringify({
        currentStep: progress.currentStep,
        currentWorld: progress.currentWorld,
        worldsCompleted: progress.worldsCompleted
      }));
    } catch (error) {
      console.error('Failed to save minimal progress:', error);
    }
  },

  /**
   * Loads complete questionnaire progress
   */
  loadProgress(): StorageProgress | null {
    try {
      // Try loading full progress first
      const metaString = localStorage.getItem(STORAGE_KEYS.META);
      if (!metaString) {
        return this.loadMinimal();
      }

      const meta = JSON.parse(metaString);
      const allAnswers: CompressedAnswer[] = [];

      // Load all chunks
      for (let i = 0; i < meta.metadata.chunks; i++) {
        const chunkString = localStorage.getItem(`${STORAGE_KEYS.CHUNK_PREFIX}${i}`);
        if (chunkString) {
          allAnswers.push(...JSON.parse(chunkString));
        }
      }

      return {
        answers: this.decompressAnswers(allAnswers, meta.metadata.startTime),
        currentStep: meta.currentStep,
        currentWorld: meta.currentWorld as WorldId,
        userTrack: meta.userTrack as UserTrack,
        worldsCompleted: meta.worldsCompleted as WorldId[],
        startedAt: meta.metadata.startTime
      };

    } catch (error) {
      console.error('Error loading progress:', error);
      return this.loadMinimal();
    }
  },

  /**
   * Loads minimal progress information
   */
  loadMinimal(): StorageProgress | null {
    try {
      const minimal = localStorage.getItem(STORAGE_KEYS.MINIMAL);
      if (!minimal) return null;

      const parsed = JSON.parse(minimal);
      
      // Return full object with default values
      return {
        currentStep: parsed.currentStep,
        currentWorld: parsed.currentWorld as WorldId,
        worldsCompleted: parsed.worldsCompleted as WorldId[],
        // Default values for missing fields
        answers: [],
        userTrack: 'SECULAR' as UserTrack,
        startedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error loading minimal progress:', error);
      return null;
    }
  },

  /**
   * Clears all stored progress data
   */
  clearProgress(): void {
    try {
      const keys = [];
      // Find all questionnaire-related keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('questionnaire_')) {
          keys.push(key);
        }
      }
      // Remove all found keys
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing progress:', error);
    }
  }
};