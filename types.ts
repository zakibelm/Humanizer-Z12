
export interface Document {
  id: string;
  name: string;
  content: string;
}

export type StyleCategoryId = 'user' | 'journalistic' | 'academic' | 'conversational' | 'creative';

// AI Provider Types
export type AIProvider = 'openrouter' | 'gemini';

export interface AIModel {
  id: string;
  name: string;
  provider: AIProvider;
  contextWindow?: number;
  costPer1kTokens?: number;
}

export type WorkflowRole = 'generator' | 'refiner' | 'analyzer';

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

// Advanced Multi-Model Configuration
export interface ModelAssignment {
  role: WorkflowRole;
  model: AIModel;
  systemPrompt?: string; // Custom system prompt override
  temperature?: number;
  enabled: boolean;
}

export interface AppSettings {
  apiKeys: {
    openrouter?: string;
    gemini?: string;
    zerogpt?: string;
  };
  modelAssignments: ModelAssignment[];
  defaultPrompts: {
    generation: string;
    refinement: string;
    analysis: string;
  };
}

export interface WorkflowStepExtended extends WorkflowStep {
  modelUsed?: string;
  tokensUsed?: number;
  duration?: number;
}

// History System
export interface GenerationHistoryItem {
  id: string;
  timestamp: number;
  inputText: string;
  outputText: string;
  analysis: AnalysisResult;
  modelAssignments: ModelAssignment[];
  agenticConfig: AgenticConfig;
  workflowLogs: WorkflowStep[];
  estimatedCost?: number;
  favorite?: boolean;
  tags?: string[];
}

export interface ComparisonMode {
  enabled: boolean;
  configA: {
    modelAssignments: ModelAssignment[];
    label: string;
  };
  configB: {
    modelAssignments: ModelAssignment[];
    label: string;
  };
}
