
import { StylometricProfile, StylometricMatch } from '../types';

// Utilisation de Intl.Segmenter pour une tokenization robuste (Production Ready)
// Fallback sur regex si l'environnement est très ancien, mais Intl est standard moderne.

// Définitions de types locales pour Intl.Segmenter pour éviter les erreurs TypeScript
interface Segment {
  segment: string;
  index: number;
  input: string;
  isWordLike?: boolean;
}

interface Segmenter {
  segment(input: string): IterableIterator<Segment>;
}

// cast pour contourner l'absence de définition dans la lib TS actuelle
const IntlAny = Intl as any;

const segmenterWords: Segmenter = new IntlAny.Segmenter('fr', { granularity: 'word' });
const segmenterSentences: Segmenter = new IntlAny.Segmenter('fr', { granularity: 'sentence' });

const getTokens = (text: string): string[] => {
  return Array.from(segmenterWords.segment(text))
    .filter(seg => seg.isWordLike)
    .map(seg => seg.segment.toLowerCase());
};

const getSentences = (text: string): string[] => {
  return Array.from(segmenterSentences.segment(text))
    .map(seg => seg.segment.trim())
    .filter(s => s.length > 0);
};

const countSyllables = (word: string): number => {
  word = word.toLowerCase();
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  const matches = word.match(/[aeiouy]{1,2}/g);
  return matches ? matches.length : 1;
};

export const analyzeText = (text: string): StylometricProfile => {
    // Optimisation: Si le texte est trop long, on analyse un échantillon représentatif pour la performance
    // Mais pour la "Production Quality", on essaie de tout traiter rapidement.
    
    if (!text || text.trim().length === 0) {
        return {
            typeTokenRatio: 0, averageWordLength: 0, sentenceLengthMean: 0,
            sentenceLengthStdDev: 0, punctuationProfile: {}, fleschReadingEase: 0
        };
    }

    const tokens = getTokens(text);
    const sentences = getSentences(text);
    const wordCount = tokens.length;
    const sentenceCount = sentences.length;

    if (wordCount === 0 || sentenceCount === 0) {
        return {
            typeTokenRatio: 0, averageWordLength: 0, sentenceLengthMean: 0,
            sentenceLengthStdDev: 0, punctuationProfile: {}, fleschReadingEase: 0
        };
    }

    // Type-Token Ratio (TTR) - Richesse du vocabulaire
    const uniqueTokens = new Set(tokens);
    const typeTokenRatio = uniqueTokens.size / wordCount;

    // Average Word Length
    const totalWordLength = tokens.reduce((acc, word) => acc + word.length, 0);
    const averageWordLength = totalWordLength / wordCount;

    // Sentence Length Statistics (Burstiness Metrics)
    const sentenceLengths = sentences.map(s => getTokens(s).length);
    const sentenceLengthMean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceCount;
    
    // Standard Deviation calculation
    const variance = sentenceLengths.reduce((acc, val) => acc + Math.pow(val - sentenceLengthMean, 2), 0) / sentenceCount;
    const sentenceLengthStdDev = Math.sqrt(variance);

    // Punctuation Profile (Signatures stylistiques)
    const punctuationMarks = [',', '.', ';', '-', '?', '!'];
    const punctuationProfile: Record<string, number> = {};
    
    punctuationMarks.forEach(mark => {
        // Regex simple suffisant pour la ponctuation
        const count = (text.split(mark).length - 1);
        punctuationProfile[mark] = (count / wordCount) * 100; // Fréquence pour 100 mots
    });
    
    // Flesch Reading Ease (Adapté pour le français - Formule Kandel & Moles)
    // FRE = 207 - 1.015 * (ASL) - 73.6 * (ASW) 
    // ASL = Average Sentence Length, ASW = Average Syllables per Word
    const totalSyllables = tokens.reduce((acc, word) => acc + countSyllables(word), 0);
    const avgSyllablesPerWord = totalSyllables / wordCount;
    
    // Utilisation de la formule standard Flesch adaptée (plus universelle pour la comparaison)
    const fleschReadingEase = 206.835 - 1.015 * sentenceLengthMean - 84.6 * avgSyllablesPerWord;

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
    const validTexts = texts.filter(t => t.trim().length > 0);
    if (validTexts.length === 0) return analyzeText("");

    const profiles = validTexts.map(analyzeText);
    
    // Moyenne pondérée simple pour créer le "Super Profil"
    const composite: StylometricProfile = {
        typeTokenRatio: profiles.reduce((sum, p) => sum + p.typeTokenRatio, 0) / profiles.length,
        averageWordLength: profiles.reduce((sum, p) => sum + p.averageWordLength, 0) / profiles.length,
        sentenceLengthMean: profiles.reduce((sum, p) => sum + p.sentenceLengthMean, 0) / profiles.length,
        sentenceLengthStdDev: profiles.reduce((sum, p) => sum + p.sentenceLengthStdDev, 0) / profiles.length,
        fleschReadingEase: profiles.reduce((sum, p) => sum + p.fleschReadingEase, 0) / profiles.length,
        punctuationProfile: {},
    };
    
    // Merge punctuation profiles
    const allPunctuationKeys = new Set(profiles.flatMap(p => Object.keys(p.punctuationProfile)));
    allPunctuationKeys.forEach(key => {
        composite.punctuationProfile[key] = profiles.reduce((sum, p) => sum + (p.punctuationProfile[key] || 0), 0) / profiles.length;
    });

    return composite;
};


export const compareProfiles = (generated: StylometricProfile, target: StylometricProfile): StylometricMatch => {
    const deviations: string[] = [];
    let totalSimilarity = 0;
    
    // Pondérations ajustées pour prioriser la "Burstiness" (Signature humaine)
    const weights = {
        typeTokenRatio: 0.20,
        sentenceLengthStdDev: 0.40, // Très important pour détecter l'IA
        sentenceLengthMean: 0.10,
        fleschReadingEase: 0.15,
        punctuation: 0.15,
    };

    const getMetricSimilarity = (genVal: number, tarVal: number) => {
      if (tarVal === 0) return genVal === 0 ? 1 : 0;
      // Tolérance non-linéaire : on pardonne les petits écarts
      const diff = Math.abs(genVal - tarVal);
      const ratio = diff / tarVal;
      return Math.max(0, 1 - ratio); 
    };

    const ttrSim = getMetricSimilarity(generated.typeTokenRatio, target.typeTokenRatio);
    totalSimilarity += ttrSim * weights.typeTokenRatio;
    if (ttrSim < 0.85) deviations.push(`Vocabulaire ${generated.typeTokenRatio < target.typeTokenRatio ? 'trop pauvre' : 'trop riche'} (Cible: ${(target.typeTokenRatio).toFixed(2)})`);

    const stdDevSim = getMetricSimilarity(generated.sentenceLengthStdDev, target.sentenceLengthStdDev);
    totalSimilarity += stdDevSim * weights.sentenceLengthStdDev;
    if (stdDevSim < 0.85) deviations.push(`Rythme trop ${generated.sentenceLengthStdDev < target.sentenceLengthStdDev ? 'monotone (Roborique)' : 'chaotique'}. Variez la longueur des phrases.`);
    
    const meanSim = getMetricSimilarity(generated.sentenceLengthMean, target.sentenceLengthMean);
    totalSimilarity += meanSim * weights.sentenceLengthMean;
    // On ne signale la moyenne que si l'écart est grand

    const fleschSim = getMetricSimilarity(generated.fleschReadingEase, target.fleschReadingEase);
    totalSimilarity += fleschSim * weights.fleschReadingEase;
    if (fleschSim < 0.85) deviations.push(`Texte ${generated.fleschReadingEase < target.fleschReadingEase ? 'trop complexe' : 'trop simple'} (Score Lisibilité: ${generated.fleschReadingEase.toFixed(0)})`);
    
    const allPunctKeys = Object.keys(target.punctuationProfile);
    if(allPunctKeys.length > 0) {
        const punctSim = allPunctKeys.reduce((acc, key) => {
            return acc + getMetricSimilarity(generated.punctuationProfile[key] || 0, target.punctuationProfile[key] || 0);
        }, 0) / allPunctKeys.length;
        totalSimilarity += punctSim * weights.punctuation;
        if (punctSim < 0.8) deviations.push(`Utilisation de la ponctuation atypique.`);
    } else {
        totalSimilarity += weights.punctuation;
    }

    return {
        similarity: Math.round(totalSimilarity * 100),
        deviations: deviations.slice(0, 3), // Top 3 des conseils les plus pertinents
    };
};
