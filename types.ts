
export interface Document {
  id: string;
  name: string;
  content: string;
}

export type StyleCategoryId = 'user' | 'journalistic' | 'academic' | 'conversational' | 'creative';

export interface StyleCategory {
  id: StyleCategoryId;
  name: string;
  description: string;
  documents: Document[];
  keywords: string[];
  stylometricProfile?: StylometricProfile; // Profil stylométrique calculé
}

export interface StylometricProfile {
  typeTokenRatio: number;
  averageWordLength: number;
  hapaxLegomenaRatio: number;
  yulesK: number;
  sentenceStats: {
    mean: number;
    median: number;
    stdDev: number;
    min: number;
    max: number;
    shortSentences: number;
    longSentences: number;
  };
  punctuationProfile: {
    commaRatio: number;
    semicolonRatio: number;
    dashRatio: number;
    questionRatio: number;
    exclamationRatio: number;
    diversityScore: number;
  };
  readability: {
    fleschScore: number;
    averageSyllables: number;
  };
  patterns: {
    contractionRatio: number;
    startWithConjunction: number;
    questionSentences: number;
    passiveVoiceRatio: number;
  };
}

export interface StyleDistribution {
  user: number;
  journalistic: number;
  academic: number;
  conversational: number;
  creative: number;
}

export interface AnalysisResult {
  detectionRisk: {
    level: 'Faible' | 'Modéré' | 'Élevé';
    score: number; // Overall human-likeness score 0-100
  };
  perplexity: {
    score: number; // 0-100
    analysis: string;
  };
  burstiness: {
    score: number; // 0-100
    analysis: string;
  };
  flaggedSentences: string[];
  stylometricMatch?: {
    similarity: number; // 0-100
    deviations: string[]; // Liste des écarts significatifs
  };
}