/**
 * Service d'analyse stylométrique pour mesurer et comparer les styles d'écriture
 * Utilisé pour garantir que le texte généré correspond aux patterns statistiques humains
 */

export interface StylometricProfile {
  // Métriques lexicales
  typeTokenRatio: number;          // Diversité vocabulaire (0-1)
  averageWordLength: number;        // Longueur moyenne des mots
  hapaxLegomenaRatio: number;      // % de mots utilisés une seule fois
  yulesK: number;                   // Richesse lexicale

  // Métriques syntaxiques
  sentenceStats: {
    mean: number;                   // Moyenne mots par phrase
    median: number;                 // Médiane
    stdDev: number;                 // Écart-type (variance)
    min: number;
    max: number;
    shortSentences: number;         // % phrases < 10 mots
    longSentences: number;          // % phrases > 25 mots
  };

  // Métriques de ponctuation
  punctuationProfile: {
    commaRatio: number;             // Virgules par 100 mots
    semicolonRatio: number;         // Points-virgules par 100 mots
    dashRatio: number;              // Tirets par 100 mots
    questionRatio: number;          // Questions par 100 phrases
    exclamationRatio: number;       // Exclamations par 100 phrases
    diversityScore: number;         // Nombre de types de ponctuation différents
  };

  // Métriques de lisibilité
  readability: {
    fleschScore: number;            // 0-100 (plus haut = plus facile)
    averageSyllables: number;       // Syllabes par mot
  };

  // Patterns linguistiques
  patterns: {
    contractionRatio: number;       // % de contractions (c'est, j'ai, etc.)
    startWithConjunction: number;   // % phrases débutant par Et/Mais/Ou
    questionSentences: number;      // % de phrases interrogatives
    passiveVoiceRatio: number;      // % de voix passive (estimation)
  };
}

export interface StylometricComparison {
  similarity: number;               // Score global 0-100
  deviations: {
    metric: string;
    expected: number;
    actual: number;
    deviation: number;              // En %
    severity: 'low' | 'medium' | 'high';
  }[];
  recommendations: string[];
}

/**
 * Analyse un texte et extrait son profil stylométrique
 */
export function analyzeText(text: string): StylometricProfile {
  const words = tokenizeWords(text);
  const sentences = tokenizeSentences(text);

  return {
    typeTokenRatio: calculateTTR(words),
    averageWordLength: calculateAverageWordLength(words),
    hapaxLegomenaRatio: calculateHapaxRatio(words),
    yulesK: calculateYulesK(words),

    sentenceStats: analyzeSentences(sentences),
    punctuationProfile: analyzePunctuation(text, words.length),
    readability: analyzeReadability(text, words, sentences),
    patterns: analyzeLinguisticPatterns(text, sentences),
  };
}

/**
 * Compare deux profils stylométriques et retourne les écarts
 */
export function compareProfiles(
  target: StylometricProfile,
  generated: StylometricProfile
): StylometricComparison {
  const deviations: StylometricComparison['deviations'] = [];

  // Comparer TTR
  addDeviation(deviations, 'Type-Token Ratio', target.typeTokenRatio, generated.typeTokenRatio, 0.10);

  // Comparer variance des phrases
  addDeviation(deviations, 'Sentence Length StdDev', target.sentenceStats.stdDev, generated.sentenceStats.stdDev, 0.20);

  // Comparer Yule's K
  addDeviation(deviations, "Yule's K", target.yulesK, generated.yulesK, 0.15);

  // Comparer hapax
  addDeviation(deviations, 'Hapax Ratio', target.hapaxLegomenaRatio, generated.hapaxLegomenaRatio, 0.15);

  // Comparer ponctuation
  addDeviation(deviations, 'Comma Ratio', target.punctuationProfile.commaRatio, generated.punctuationProfile.commaRatio, 0.25);

  // Calculer similarité globale (100 - moyenne des déviations)
  const avgDeviation = deviations.reduce((sum, d) => sum + Math.abs(d.deviation), 0) / deviations.length;
  const similarity = Math.max(0, 100 - avgDeviation);

  // Générer recommandations
  const recommendations = generateRecommendations(deviations);

  return { similarity, deviations, recommendations };
}

/**
 * Crée un profil composite à partir de plusieurs documents
 */
export function createCompositeProfile(texts: string[]): StylometricProfile {
  const profiles = texts.map(analyzeText);

  // Moyenne des métriques
  return {
    typeTokenRatio: average(profiles.map(p => p.typeTokenRatio)),
    averageWordLength: average(profiles.map(p => p.averageWordLength)),
    hapaxLegomenaRatio: average(profiles.map(p => p.hapaxLegomenaRatio)),
    yulesK: average(profiles.map(p => p.yulesK)),

    sentenceStats: {
      mean: average(profiles.map(p => p.sentenceStats.mean)),
      median: average(profiles.map(p => p.sentenceStats.median)),
      stdDev: average(profiles.map(p => p.sentenceStats.stdDev)),
      min: Math.min(...profiles.map(p => p.sentenceStats.min)),
      max: Math.max(...profiles.map(p => p.sentenceStats.max)),
      shortSentences: average(profiles.map(p => p.sentenceStats.shortSentences)),
      longSentences: average(profiles.map(p => p.sentenceStats.longSentences)),
    },

    punctuationProfile: {
      commaRatio: average(profiles.map(p => p.punctuationProfile.commaRatio)),
      semicolonRatio: average(profiles.map(p => p.punctuationProfile.semicolonRatio)),
      dashRatio: average(profiles.map(p => p.punctuationProfile.dashRatio)),
      questionRatio: average(profiles.map(p => p.punctuationProfile.questionRatio)),
      exclamationRatio: average(profiles.map(p => p.punctuationProfile.exclamationRatio)),
      diversityScore: average(profiles.map(p => p.punctuationProfile.diversityScore)),
    },

    readability: {
      fleschScore: average(profiles.map(p => p.readability.fleschScore)),
      averageSyllables: average(profiles.map(p => p.readability.averageSyllables)),
    },

    patterns: {
      contractionRatio: average(profiles.map(p => p.patterns.contractionRatio)),
      startWithConjunction: average(profiles.map(p => p.patterns.startWithConjunction)),
      questionSentences: average(profiles.map(p => p.patterns.questionSentences)),
      passiveVoiceRatio: average(profiles.map(p => p.patterns.passiveVoiceRatio)),
    },
  };
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zàâäéèêëïîôùûüÿæœç\s'-]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 0);
}

function tokenizeSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);
}

function calculateTTR(words: string[]): number {
  const uniqueWords = new Set(words);
  return words.length > 0 ? uniqueWords.size / words.length : 0;
}

function calculateAverageWordLength(words: string[]): number {
  if (words.length === 0) return 0;
  const totalLength = words.reduce((sum, word) => sum + word.length, 0);
  return totalLength / words.length;
}

function calculateHapaxRatio(words: string[]): number {
  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  const hapaxCount = Array.from(frequency.values()).filter(count => count === 1).length;
  return words.length > 0 ? hapaxCount / frequency.size : 0;
}

function calculateYulesK(words: string[]): number {
  const frequency = new Map<string, number>();
  words.forEach(word => {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  });

  const freqOfFreq = new Map<number, number>();
  frequency.forEach(count => {
    freqOfFreq.set(count, (freqOfFreq.get(count) || 0) + 1);
  });

  const N = words.length;
  let sum = 0;
  freqOfFreq.forEach((m, i) => {
    sum += m * Math.pow(i / N, 2);
  });

  const M1 = frequency.size;
  const K = 10000 * (sum - 1 / N) / (M1 - 1 / N);

  return K;
}

function analyzeSentences(sentences: string[]): StylometricProfile['sentenceStats'] {
  const lengths = sentences.map(s => s.split(/\s+/).length);

  if (lengths.length === 0) {
    return {
      mean: 0,
      median: 0,
      stdDev: 0,
      min: 0,
      max: 0,
      shortSentences: 0,
      longSentences: 0,
    };
  }

  const mean = average(lengths);
  const sorted = [...lengths].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
  const stdDev = Math.sqrt(variance);

  const shortSentences = (lengths.filter(l => l < 10).length / lengths.length) * 100;
  const longSentences = (lengths.filter(l => l > 25).length / lengths.length) * 100;

  return {
    mean,
    median,
    stdDev,
    min: Math.min(...lengths),
    max: Math.max(...lengths),
    shortSentences,
    longSentences,
  };
}

function analyzePunctuation(text: string, wordCount: number): StylometricProfile['punctuationProfile'] {
  const commas = (text.match(/,/g) || []).length;
  const semicolons = (text.match(/;/g) || []).length;
  const dashes = (text.match(/[—–-]/g) || []).length;
  const questions = (text.match(/\?/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;

  const sentenceCount = (text.match(/[.!?]+/g) || []).length || 1;
  const per100Words = wordCount > 0 ? 100 / wordCount : 0;
  const per100Sentences = sentenceCount > 0 ? 100 / sentenceCount : 0;

  const types = [
    commas > 0,
    semicolons > 0,
    dashes > 0,
    questions > 0,
    exclamations > 0,
    (text.match(/:/g) || []).length > 0,
    (text.match(/\.\.\./g) || []).length > 0,
  ].filter(Boolean).length;

  return {
    commaRatio: commas * per100Words,
    semicolonRatio: semicolons * per100Words,
    dashRatio: dashes * per100Words,
    questionRatio: questions * per100Sentences,
    exclamationRatio: exclamations * per100Sentences,
    diversityScore: types,
  };
}

function analyzeLinguisticPatterns(text: string, sentences: string[]): StylometricProfile['patterns'] {
  const contractionPattern = /\b(c'est|j'ai|n'est|d'un|l'on|qu'il|s'il|j'suis|y'a)\b/gi;
  const contractions = (text.match(contractionPattern) || []).length;
  const wordCount = text.split(/\s+/).length;

  const startWithConjunction = sentences.filter(s =>
    /^\s*(et|mais|or|donc|car|puis)\s+/i.test(s)
  ).length;

  const questionSentences = sentences.filter(s => s.includes('?')).length;

  // Estimation voix passive (simplifié)
  const passiveIndicators = (text.match(/\b(été|être|est|sont|était|étaient)\s+\w+(é|ée|és|ées)\b/gi) || []).length;

  return {
    contractionRatio: wordCount > 0 ? (contractions / wordCount) * 100 : 0,
    startWithConjunction: sentences.length > 0 ? (startWithConjunction / sentences.length) * 100 : 0,
    questionSentences: sentences.length > 0 ? (questionSentences / sentences.length) * 100 : 0,
    passiveVoiceRatio: sentences.length > 0 ? (passiveIndicators / sentences.length) * 100 : 0,
  };
}

function analyzeReadability(text: string, words: string[], sentences: string[]): StylometricProfile['readability'] {
  const syllableCount = words.reduce((sum, word) => sum + estimateSyllables(word), 0);
  const averageSyllables = words.length > 0 ? syllableCount / words.length : 0;

  // Flesch Reading Ease (adapté pour le français)
  const wordsPerSentence = sentences.length > 0 ? words.length / sentences.length : 0;
  const fleschScore = 206.835 - 1.015 * wordsPerSentence - 84.6 * averageSyllables;

  return {
    fleschScore: Math.max(0, Math.min(100, fleschScore)),
    averageSyllables,
  };
}

function estimateSyllables(word: string): number {
  // Estimation simplifiée pour le français
  const vowels = word.match(/[aeiouyàâäéèêëïîôùûüÿ]+/gi);
  return vowels ? vowels.length : 1;
}

function addDeviation(
  deviations: StylometricComparison['deviations'],
  metric: string,
  expected: number,
  actual: number,
  tolerance: number
): void {
  const deviation = expected !== 0 ? ((actual - expected) / expected) * 100 : 0;
  const absDeviation = Math.abs(deviation);

  let severity: 'low' | 'medium' | 'high' = 'low';
  if (absDeviation > tolerance * 100) severity = 'high';
  else if (absDeviation > tolerance * 50) severity = 'medium';

  deviations.push({ metric, expected, actual, deviation, severity });
}

function generateRecommendations(deviations: StylometricComparison['deviations']): string[] {
  const recommendations: string[] = [];

  deviations.forEach(d => {
    if (d.severity === 'high') {
      if (d.metric === 'Type-Token Ratio' && d.actual < d.expected) {
        recommendations.push('Augmentez la diversité lexicale : utilisez plus de synonymes et variez le vocabulaire.');
      }
      if (d.metric === 'Sentence Length StdDev' && d.actual < d.expected) {
        recommendations.push('Variez davantage la longueur des phrases : alternez phrases courtes et longues.');
      }
      if (d.metric === 'Comma Ratio' && Math.abs(d.deviation) > 30) {
        recommendations.push(d.actual > d.expected
          ? 'Réduisez le nombre de virgules pour un style plus fluide.'
          : 'Ajoutez des virgules pour des phrases plus nuancées.');
      }
    }
  });

  if (recommendations.length === 0) {
    recommendations.push('Le profil stylométrique correspond bien aux attentes.');
  }

  return recommendations;
}

function average(numbers: number[]): number {
  return numbers.length > 0 ? numbers.reduce((sum, n) => sum + n, 0) / numbers.length : 0;
}
