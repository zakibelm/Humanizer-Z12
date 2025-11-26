
export interface Document {
  id: string;
  name: string;
  content: string;
}

export type StyleCategoryId = 'user' | 'journalistic' | 'academic' | 'conversational' | 'creative';
export type ModelId = 'gemini-2.5-pro' | 'gemini-2.5-flash';

export interface StyleCategory {
  id: StyleCategoryId;
  name: string;
  description: string;
  documents: Document[];
  keywords: string[];
}

export interface StyleDistribution {
  user: number;
  journalistic: number;
  academic: number;
  conversational: number;
  creative: number;
}

export interface StylometricProfile {
  typeTokenRatio: number;
  averageWordLength: number;
  sentenceLengthMean: number;
  sentenceLengthStdDev: number;
  punctuationProfile: Record<string, number>;
  fleschReadingEase: number;
  sentenceLengths?: number[]; // Pour le graphique Burstiness
}

export interface StylometricMatch {
  similarity: number; // 0-100%
  deviations: string[];
}

export interface ZeroGptResult {
  isReal: boolean;
  fakePercentage: number;
  aiWords?: number;
  feedback?: string;
  error?: string;
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
  stylometricMatch?: StylometricMatch;
  zeroGpt?: ZeroGptResult; // Nouveau champ pour le résultat externe
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  details?: string;
}

export interface AgenticConfig {
  enabled: boolean;
  targetScore: number;
  maxIterations: number;
}
