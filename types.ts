
export interface Document {
  id: string;
  name: string;
  content: string;
}

export type StyleCategoryId = 'user' | 'journalistic' | 'academic' | 'conversational' | 'creative' | 'marketing';

export interface StyleCategory {
  id: StyleCategoryId;
  name: string;
  description: string;
  documents: Document[];
  keywords: string[];
}

export interface WritingConfig {
  temperature: number;
  formality: number;
  professionalism: 'startup' | 'corporate' | 'academic' | 'creative' | 'friendly' | 'marketing';
  empathy: number;
  humor: number;
}

export interface StyleDistribution {
  user: number;
  journalistic: number;
  academic: number;
  conversational: number;
  creative: number;
  marketing: number;
}

export interface StylometricProfile {
  typeTokenRatio: number;
  averageWordLength: number;
  sentenceLengthMean: number;
  sentenceLengthStdDev: number;
  punctuationProfile: Record<string, number>;
  fleschReadingEase: number;
}

export interface StylometricMatch {
  similarity: number;
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
    level: 'Faible' | 'Modéré' | 'Élevé' | 'Excellent';
    score: number;
  };
  perplexity: { score: number; analysis: string; };
  burstiness: { score: number; analysis: string; };
  flaggedSentences: string[];
  zeroGpt?: ZeroGptResult;
  stylometricMatch?: StylometricMatch;
}

export interface WorkflowStep {
  id: string;
  label: string;
  status: 'pending' | 'running' | 'success' | 'warning' | 'error';
  details?: string;
}

export interface IterationStepConfig {
  id: string;
  active: boolean;
  agentName: string;
  model: string;
  systemPrompt: string;
}

export interface GlobalSettings {
  openRouterApiKey: string;
  zeroGptApiKey: string;
}

export interface AgenticConfig {
  enabled: boolean;
  targetScore: number;
  maxIterations: number;
}

export type ModelId = string;
