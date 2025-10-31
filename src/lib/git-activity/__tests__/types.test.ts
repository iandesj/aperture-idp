import {
  isStale,
  getDaysSinceLastCommit,
  GitActivityMetrics,
} from '../types';

describe('Git Activity Types', () => {
  describe('isStale', () => {
    it('should return true for null commit date', () => {
      expect(isStale(null)).toBe(true);
    });

    it('should return true for commit older than default threshold (90 days)', () => {
      const oldDate = new Date();
      oldDate.setDate(oldDate.getDate() - 100);
      expect(isStale(oldDate.toISOString())).toBe(true);
    });

    it('should return false for recent commit within default threshold', () => {
      const recentDate = new Date();
      recentDate.setDate(recentDate.getDate() - 30);
      expect(isStale(recentDate.toISOString())).toBe(false);
    });

    it('should respect custom threshold', () => {
      const date = new Date();
      date.setDate(date.getDate() - 60);
      expect(isStale(date.toISOString(), 50)).toBe(true);
      expect(isStale(date.toISOString(), 70)).toBe(false);
    });

    it('should return true for exactly at threshold', () => {
      const date = new Date();
      date.setDate(date.getDate() - 91);
      expect(isStale(date.toISOString(), 90)).toBe(true);
    });
  });

  describe('getDaysSinceLastCommit', () => {
    it('should return null for null commit date', () => {
      expect(getDaysSinceLastCommit(null)).toBeNull();
    });

    it('should calculate days correctly for past date', () => {
      const date = new Date();
      date.setDate(date.getDate() - 5);
      const days = getDaysSinceLastCommit(date.toISOString());
      expect(days).toBe(5);
    });

    it('should return 0 for today', () => {
      const date = new Date();
      const days = getDaysSinceLastCommit(date.toISOString());
      expect(days).toBe(0);
    });

    it('should handle dates in the past correctly', () => {
      const date = new Date();
      date.setDate(date.getDate() - 30);
      const days = getDaysSinceLastCommit(date.toISOString());
      expect(days).toBe(30);
    });
  });
});

