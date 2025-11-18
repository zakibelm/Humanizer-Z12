
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
}