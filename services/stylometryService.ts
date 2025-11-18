
import { StylometricProfile, StylometricMatch } from '../types';

// Helper functions
const tokenize = (text: string): string[] => text.toLowerCase().match(/\b(\w+)\b/g) || [];
const getSentences = (text: string): string[] => text.match(/[^.!?]+[.!?]+/g) || [];
const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 0;
};

export const analyzeText = (text: string): StylometricProfile => {
    const tokens = tokenize(text);
    const sentences = getSentences(text);
    const wordCount = tokens.length;
    const sentenceCount = sentences.length;

    if (wordCount === 0 || sentenceCount === 0) {
        return {
            typeTokenRatio: 0, averageWordLength: 0, sentenceLengthMean: 0,
            sentenceLengthStdDev: 0, punctuationProfile: {}, fleschReadingEase: 0
        };
    }

    // Type-Token Ratio (TTR)
    const uniqueTokens = new Set(tokens);
    const typeTokenRatio = uniqueTokens.size / wordCount;

    // Average Word Length
    const totalWordLength = tokens.reduce((acc, word) => acc + word.length, 0);
    const averageWordLength = totalWordLength / wordCount;

    // Sentence Length Statistics
    const sentenceLengths = sentences.map(s => tokenize(s).length);
    const sentenceLengthMean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceCount;
    const sentenceLengthStdDev = Math.sqrt(
      sentenceLengths.map(x => Math.pow(x - sentenceLengthMean, 2)).reduce((a, b) => a + b, 0) / sentenceCount
    );

    // Punctuation Profile
    const punctuationProfile: Record<string, number> = {
        ',': (text.match(/,/g) || []).length / wordCount * 100,
        '.': (text.match(/\./g) || []).length / wordCount * 100,
        ';': (text.match(/;/g) || []).length / wordCount * 100,
        '-': (text.match(/--|—/g) || []).length / wordCount * 100,
        '?': (text.match(/\?/g) || []).length / wordCount * 100,
    };
    
    // Flesch Reading Ease
    const totalSyllables = tokens.reduce((acc, word) => acc + countSyllables(word), 0);
    const fleschReadingEase = 206.835 - 1.015 * (wordCount / sentenceCount) - 84.6 * (totalSyllables / wordCount);

    return {
        typeTokenRatio,
        averageWordLength,
        sentenceLengthMean,
        sentenceLengthStdDev,
        punctuationProfile,
        fleschReadingEase: Math.max(0, Math.min(100, fleschReadingEase)),
    };
};

export const createCompositeProfile = (texts: string[]): StylometricProfile => {
    const profiles = texts.map(analyzeText);
    const composite: StylometricProfile = {
        typeTokenRatio: profiles.reduce((sum, p) => sum + p.typeTokenRatio, 0) / profiles.length,
        averageWordLength: profiles.reduce((sum, p) => sum + p.averageWordLength, 0) / profiles.length,
        sentenceLengthMean: profiles.reduce((sum, p) => sum + p.sentenceLengthMean, 0) / profiles.length,
        sentenceLengthStdDev: profiles.reduce((sum, p) => sum + p.sentenceLengthStdDev, 0) / profiles.length,
        fleschReadingEase: profiles.reduce((sum, p) => sum + p.fleschReadingEase, 0) / profiles.length,
        punctuationProfile: {},
    };
    
    const allPunctuationKeys = new Set(profiles.flatMap(p => Object.keys(p.punctuationProfile)));
    allPunctuationKeys.forEach(key => {
        composite.punctuationProfile[key] = profiles.reduce((sum, p) => sum + (p.punctuationProfile[key] || 0), 0) / profiles.length;
    });

    return composite;
};


export const compareProfiles = (generated: StylometricProfile, target: StylometricProfile): StylometricMatch => {
    const deviations: string[] = [];
    let totalSimilarity = 0;
    const weights = {
        typeTokenRatio: 0.25,
        sentenceLengthStdDev: 0.35,
        sentenceLengthMean: 0.15,
        fleschReadingEase: 0.15,
        punctuation: 0.10,
    };

    const getMetricSimilarity = (genVal: number, tarVal: number) => {
      if (tarVal === 0) return genVal === 0 ? 1 : 0;
      return 1 - Math.min(1, Math.abs(genVal - tarVal) / tarVal);
    };

    const ttrSim = getMetricSimilarity(generated.typeTokenRatio, target.typeTokenRatio);
    totalSimilarity += ttrSim * weights.typeTokenRatio;
    if (ttrSim < 0.8) deviations.push(`Diversité lexicale (TTR) : ${((generated.typeTokenRatio - target.typeTokenRatio) * 100).toFixed(1)}% d'écart.`);

    const stdDevSim = getMetricSimilarity(generated.sentenceLengthStdDev, target.sentenceLengthStdDev);
    totalSimilarity += stdDevSim * weights.sentenceLengthStdDev;
    if (stdDevSim < 0.8) deviations.push(`Variation des phrases : ${((generated.sentenceLengthStdDev - target.sentenceLengthStdDev)).toFixed(1)} pts d'écart.`);
    
    const meanSim = getMetricSimilarity(generated.sentenceLengthMean, target.sentenceLengthMean);
    totalSimilarity += meanSim * weights.sentenceLengthMean;
    if (meanSim < 0.8) deviations.push(`Longueur de phrase moy. : ${((generated.sentenceLengthMean - target.sentenceLengthMean)).toFixed(1)} mots d'écart.`);

    const fleschSim = getMetricSimilarity(generated.fleschReadingEase, target.fleschReadingEase);
    totalSimilarity += fleschSim * weights.fleschReadingEase;
    if (fleschSim < 0.8) deviations.push(`Lisibilité (Flesch) : ${((generated.fleschReadingEase - target.fleschReadingEase)).toFixed(1)} pts d'écart.`);
    
    // Punctuation similarity
    const allPunctKeys = Object.keys(target.punctuationProfile);
    if(allPunctKeys.length > 0) {
        const punctSim = allPunctKeys.reduce((acc, key) => {
            return acc + getMetricSimilarity(generated.punctuationProfile[key] || 0, target.punctuationProfile[key] || 0);
        }, 0) / allPunctKeys.length;
        totalSimilarity += punctSim * weights.punctuation;
        if (punctSim < 0.8) deviations.push(`Profil de ponctuation global est divergent.`);
    } else {
        totalSimilarity += weights.punctuation; // Add full weight if no punctuation in target
    }


    return {
        similarity: Math.round(totalSimilarity * 100),
        deviations: deviations.slice(0, 3), // Return top 3 deviations
    };
};
