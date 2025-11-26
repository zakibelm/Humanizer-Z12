
import { AppSettings, ModelAssignment } from './types';
import { POPULAR_OPENROUTER_MODELS } from './services/openRouterService';
import { DEFAULT_GENERATION_PROMPT, DEFAULT_REFINEMENT_PROMPT, DEFAULT_ANALYSIS_PROMPT } from './defaultPrompts';

export interface ConfigTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  estimatedCostPer1kWords: number; // USD
  estimatedSpeed: 'Lent' | 'Moyen' | 'Rapide' | 'Ultra-Rapide';
  modelAssignments: Omit<ModelAssignment, 'model'>[];
}

// Helper to find model by ID
const getModel = (id: string) => POPULAR_OPENROUTER_MODELS.find(m => m.id === id)!;

export const CONFIG_TEMPLATES: ConfigTemplate[] = [
  {
    id: 'quality-max',
    name: 'Qualité Maximale',
    description: 'Les meilleurs modèles pour une qualité exceptionnelle. Recommandé pour du contenu critique.',
    icon: '💎',
    estimatedCostPer1kWords: 0.15,
    estimatedSpeed: 'Lent',
    modelAssignments: [
      {
        role: 'generator',
        model: getModel('anthropic/claude-3.5-sonnet'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'refiner',
        model: getModel('anthropic/claude-3-opus'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'analyzer',
        model: getModel('anthropic/claude-3.5-sonnet'),
        temperature: 0.1,
        enabled: true
      }
    ]
  },
  {
    id: 'balanced',
    name: 'Équilibré',
    description: 'Excellent compromis qualité/prix/vitesse. Idéal pour un usage quotidien.',
    icon: '⚖️',
    estimatedCostPer1kWords: 0.05,
    estimatedSpeed: 'Moyen',
    modelAssignments: [
      {
        role: 'generator',
        model: getModel('anthropic/claude-3.5-sonnet'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'refiner',
        model: getModel('openai/gpt-4o'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'analyzer',
        model: getModel('anthropic/claude-3-haiku'),
        temperature: 0.1,
        enabled: true
      }
    ]
  },
  {
    id: 'fast',
    name: 'Rapide',
    description: 'Optimisé pour la vitesse sans sacrifier la qualité. Parfait pour les itérations rapides.',
    icon: '⚡',
    estimatedCostPer1kWords: 0.02,
    estimatedSpeed: 'Rapide',
    modelAssignments: [
      {
        role: 'generator',
        model: getModel('openai/gpt-4o'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'refiner',
        model: getModel('anthropic/claude-3-haiku'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'analyzer',
        model: getModel('anthropic/claude-3-haiku'),
        temperature: 0.1,
        enabled: true
      }
    ]
  },
  {
    id: 'economical',
    name: 'Économique',
    description: 'Minimise les coûts tout en restant efficace. Idéal pour de gros volumes.',
    icon: '💰',
    estimatedCostPer1kWords: 0.01,
    estimatedSpeed: 'Rapide',
    modelAssignments: [
      {
        role: 'generator',
        model: getModel('openai/gpt-3.5-turbo'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'refiner',
        model: getModel('anthropic/claude-3-haiku'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'analyzer',
        model: getModel('anthropic/claude-3-haiku'),
        temperature: 0.1,
        enabled: true
      }
    ]
  },
  {
    id: 'opensource',
    name: 'Open Source',
    description: 'Modèles open source performants. Excellent rapport qualité/prix.',
    icon: '🌟',
    estimatedCostPer1kWords: 0.005,
    estimatedSpeed: 'Moyen',
    modelAssignments: [
      {
        role: 'generator',
        model: getModel('meta-llama/llama-3.1-70b-instruct'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'refiner',
        model: getModel('mistralai/mistral-large'),
        temperature: 1.0,
        enabled: true
      },
      {
        role: 'analyzer',
        model: getModel('meta-llama/llama-3.1-70b-instruct'),
        temperature: 0.1,
        enabled: true
      }
    ]
  }
];

// Helper to apply a template to settings
export const applyTemplate = (templateId: string, currentSettings: AppSettings): AppSettings => {
  const template = CONFIG_TEMPLATES.find(t => t.id === templateId);
  if (!template) return currentSettings;

  return {
    ...currentSettings,
    modelAssignments: template.modelAssignments.map(assignment => ({
      ...assignment,
      model: assignment.model as any
    }))
  };
};

// Helper to calculate estimated cost for a generation
export const estimateGenerationCost = (
  inputWords: number,
  modelAssignments: ModelAssignment[],
  iterations: number = 1
): { total: number; breakdown: { role: string; cost: number }[] } => {
  // Rough estimation: input words + 2x output words per iteration
  const totalWords = inputWords + (inputWords * 2 * iterations);
  const tokensEstimate = totalWords * 1.3; // ~1.3 tokens per word on average

  const breakdown = modelAssignments
    .filter(a => a.enabled)
    .map(assignment => {
      const model = assignment.model;
      const costPer1kTokens = model.costPer1kTokens || 0.001;

      let multiplier = 1;
      if (assignment.role === 'generator') multiplier = 1.5; // More output
      if (assignment.role === 'refiner') multiplier = iterations * 1.2;
      if (assignment.role === 'analyzer') multiplier = 0.5; // Less output

      const cost = (tokensEstimate / 1000) * costPer1kTokens * multiplier;

      return {
        role: assignment.role,
        cost: cost
      };
    });

  const total = breakdown.reduce((sum, item) => sum + item.cost, 0);

  return { total, breakdown };
};
