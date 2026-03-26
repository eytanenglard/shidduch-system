import { describe, it, expect } from 'vitest';
import {
  QUESTION_COUNTS,
  TOTAL_QUESTION_COUNT,
  COMPLETION_THRESHOLD,
  INSIGHT_COOLDOWN_HOURS,
} from '@/lib/constants/questionnaireConfig';

describe('QUESTION_COUNTS', () => {
  it('should have all 5 worlds defined', () => {
    expect(Object.keys(QUESTION_COUNTS)).toHaveLength(5);
    expect(QUESTION_COUNTS).toHaveProperty('PERSONALITY');
    expect(QUESTION_COUNTS).toHaveProperty('VALUES');
    expect(QUESTION_COUNTS).toHaveProperty('RELATIONSHIP');
    expect(QUESTION_COUNTS).toHaveProperty('PARTNER');
    expect(QUESTION_COUNTS).toHaveProperty('RELIGION');
  });

  it('should have correct question counts per world', () => {
    expect(QUESTION_COUNTS.PERSONALITY).toBe(25);
    expect(QUESTION_COUNTS.VALUES).toBe(23);
    expect(QUESTION_COUNTS.RELATIONSHIP).toBe(22);
    expect(QUESTION_COUNTS.PARTNER).toBe(19);
    expect(QUESTION_COUNTS.RELIGION).toBe(20);
  });

  it('should have positive values for all worlds', () => {
    for (const count of Object.values(QUESTION_COUNTS)) {
      expect(count).toBeGreaterThan(0);
    }
  });
});

describe('TOTAL_QUESTION_COUNT', () => {
  it('should equal the sum of all world counts', () => {
    const sum = Object.values(QUESTION_COUNTS).reduce((acc, val) => acc + val, 0);
    expect(TOTAL_QUESTION_COUNT).toBe(sum);
  });

  it('should be 109', () => {
    expect(TOTAL_QUESTION_COUNT).toBe(109);
  });
});

describe('COMPLETION_THRESHOLD', () => {
  it('should be 90', () => {
    expect(COMPLETION_THRESHOLD).toBe(90);
  });
});

describe('INSIGHT_COOLDOWN_HOURS', () => {
  it('should be 168 (7 days)', () => {
    expect(INSIGHT_COOLDOWN_HOURS).toBe(168);
  });
});
