import { describe, it, expect, beforeEach } from 'vitest';
import { analyzeText, createCompositeProfile, compareProfiles } from '../services/stylometryService';
import { profileCache } from '../utils/profileCache';

describe('stylometryService', () => {
  beforeEach(() => {
    profileCache.clear();
  });

  describe('analyzeText', () => {
    it('should analyze simple text correctly', () => {
      const text = 'Hello world. This is a test.';
      const profile = analyzeText(text);

      expect(profile.typeTokenRatio).toBeGreaterThan(0);
      expect(profile.averageWordLength).toBeGreaterThan(0);
      expect(profile.sentenceLengthMean).toBeGreaterThan(0);
      expect(profile.fleschReadingEase).toBeGreaterThanOrEqual(0);
      expect(profile.fleschReadingEase).toBeLessThanOrEqual(100);
    });

    it('should return zero profile for empty text', () => {
      const profile = analyzeText('');

      expect(profile.typeTokenRatio).toBe(0);
      expect(profile.averageWordLength).toBe(0);
      expect(profile.sentenceLengthMean).toBe(0);
      expect(profile.sentenceLengthStdDev).toBe(0);
    });

    it('should handle text with varied sentence lengths (burstiness)', () => {
      const text = 'Hi. This is a medium sentence. This is a very long sentence with many words to test burstiness calculation and variance.';
      const profile = analyzeText(text);

      expect(profile.sentenceLengthStdDev).toBeGreaterThan(0);
      expect(profile.sentenceLengthMean).toBeGreaterThan(0);
    });

    it('should use cache for identical texts', () => {
      const text = 'Cache test. This is cached.';

      const profile1 = analyzeText(text);
      const profile2 = analyzeText(text);

      // Should return same reference from cache
      expect(profile1).toBe(profile2);
      expect(profileCache.getSize()).toBe(1);
    });

    it('should handle punctuation correctly', () => {
      const text = 'Hello, world! How are you? Fine; thanks.';
      const profile = analyzeText(text);

      expect(profile.punctuationProfile[',']).toBeGreaterThan(0);
      expect(profile.punctuationProfile['!']).toBeGreaterThan(0);
      expect(profile.punctuationProfile['?']).toBeGreaterThan(0);
      expect(profile.punctuationProfile[';']).toBeGreaterThan(0);
    });

    it('should not crash on edge cases', () => {
      const edgeCases = [
        '',
        '   ',
        'A',
        'A.',
        '.',
        '!!!',
        'A B C D E',
        'The the the the.',
      ];

      edgeCases.forEach(text => {
        expect(() => analyzeText(text)).not.toThrow();
      });
    });

    it('should not produce NaN values', () => {
      const text = 'Test. Multiple. Short. Sentences.';
      const profile = analyzeText(text);

      expect(Number.isNaN(profile.typeTokenRatio)).toBe(false);
      expect(Number.isNaN(profile.averageWordLength)).toBe(false);
      expect(Number.isNaN(profile.sentenceLengthMean)).toBe(false);
      expect(Number.isNaN(profile.sentenceLengthStdDev)).toBe(false);
      expect(Number.isNaN(profile.fleschReadingEase)).toBe(false);
    });
  });

  describe('createCompositeProfile', () => {
    it('should create composite from multiple texts', () => {
      const texts = [
        'First document with some text.',
        'Second document with different style and longer sentences.',
        'Third short.',
      ];

      const composite = createCompositeProfile(texts);

      expect(composite.typeTokenRatio).toBeGreaterThan(0);
      expect(composite.sentenceLengthMean).toBeGreaterThan(0);
    });

    it('should handle empty array', () => {
      const composite = createCompositeProfile([]);

      expect(composite.typeTokenRatio).toBe(0);
      expect(composite.averageWordLength).toBe(0);
    });

    it('should handle array with empty strings', () => {
      const composite = createCompositeProfile(['', '   ', '']);

      expect(composite.typeTokenRatio).toBe(0);
      expect(composite.averageWordLength).toBe(0);
    });

    it('should average profiles correctly', () => {
      const texts = [
        'Short.',
        'This is a much longer sentence with many more words to analyze properly.',
      ];

      const composite = createCompositeProfile(texts);

      // Mean should be between the two extremes
      expect(composite.sentenceLengthMean).toBeGreaterThan(1);
      expect(composite.sentenceLengthMean).toBeLessThan(15);
    });
  });

  describe('compareProfiles', () => {
    it('should return high similarity for identical profiles', () => {
      const text = 'Test sentence for comparison.';
      const profile1 = analyzeText(text);
      const profile2 = analyzeText(text);

      const match = compareProfiles(profile1, profile2);

      expect(match.similarity).toBe(100);
      expect(match.deviations).toHaveLength(0);
    });

    it('should return low similarity for very different profiles', () => {
      const text1 = 'Hi.';
      const text2 = 'This is a completely different text with very long sentences and different vocabulary and structure for testing purposes.';

      const profile1 = analyzeText(text1);
      const profile2 = analyzeText(text2);

      const match = compareProfiles(profile1, profile2);

      expect(match.similarity).toBeLessThan(80);
      expect(match.deviations.length).toBeGreaterThan(0);
    });

    it('should provide deviation messages', () => {
      const text1 = 'Short.';
      const text2 = 'This is much longer with different characteristics.';

      const profile1 = analyzeText(text1);
      const profile2 = analyzeText(text2);

      const match = compareProfiles(profile1, profile2);

      expect(match.deviations.length).toBeGreaterThan(0);
      expect(typeof match.deviations[0]).toBe('string');
    });

    it('should limit deviations to top 3', () => {
      const text1 = 'A.';
      const text2 = 'This is completely different in every possible metric we can measure, including length, vocabulary, punctuation, and readability.';

      const profile1 = analyzeText(text1);
      const profile2 = analyzeText(text2);

      const match = compareProfiles(profile1, profile2);

      expect(match.deviations.length).toBeLessThanOrEqual(3);
    });
  });
});
