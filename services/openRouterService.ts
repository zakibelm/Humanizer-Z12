
import { AIModel } from '../types';

// OpenRouter API Documentation: https://openrouter.ai/docs
const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Popular AI Models available on OpenRouter
export const POPULAR_OPENROUTER_MODELS: AIModel[] = [
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    provider: 'openrouter',
    contextWindow: 200000,
    costPer1kTokens: 0.003
  },
  {
    id: 'anthropic/claude-3-opus',
    name: 'Claude 3 Opus',
    provider: 'openrouter',
    contextWindow: 200000,
    costPer1kTokens: 0.015
  },
  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude 3 Haiku',
    provider: 'openrouter',
    contextWindow: 200000,
    costPer1kTokens: 0.00025
  },
  {
    id: 'openai/gpt-4-turbo',
    name: 'GPT-4 Turbo',
    provider: 'openrouter',
    contextWindow: 128000,
    costPer1kTokens: 0.01
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    provider: 'openrouter',
    contextWindow: 128000,
    costPer1kTokens: 0.005
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    provider: 'openrouter',
    contextWindow: 16385,
    costPer1kTokens: 0.0005
  },
  {
    id: 'google/gemini-pro-1.5',
    name: 'Gemini Pro 1.5',
    provider: 'openrouter',
    contextWindow: 1000000,
    costPer1kTokens: 0.00125
  },
  {
    id: 'meta-llama/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B',
    provider: 'openrouter',
    contextWindow: 131072,
    costPer1kTokens: 0.00088
  },
  {
    id: 'mistralai/mistral-large',
    name: 'Mistral Large',
    provider: 'openrouter',
    contextWindow: 128000,
    costPer1kTokens: 0.004
  },
  {
    id: 'cohere/command-r-plus',
    name: 'Command R+',
    provider: 'openrouter',
    contextWindow: 128000,
    costPer1kTokens: 0.003
  }
];

export const callOpenRouter = async (
  apiKey: string,
  modelId: string,
  messages: OpenRouterMessage[],
  temperature: number = 1.0,
  maxTokens: number = 4000
): Promise<{ text: string; usage?: OpenRouterResponse['usage'] }> => {

  if (!apiKey || apiKey.trim() === '') {
    throw new Error("Clé API OpenRouter manquante. Veuillez la configurer dans les paramètres.");
  }

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin, // Required by OpenRouter
        'X-Title': 'Humanizer Z12' // Optional, for rankings
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages,
        temperature: temperature,
        max_tokens: maxTokens,
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      const errorMessage = errorData.error?.message || response.statusText;

      if (response.status === 401) {
        throw new Error("Clé API OpenRouter invalide ou expirée.");
      } else if (response.status === 402) {
        throw new Error("Crédit insuffisant sur votre compte OpenRouter.");
      } else if (response.status === 429) {
        throw new Error("Limite de requêtes atteinte. Veuillez patienter.");
      } else {
        throw new Error(`Erreur OpenRouter (${response.status}): ${errorMessage}`);
      }
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error("Réponse vide de l'API OpenRouter.");
    }

    const text = data.choices[0].message.content.trim();

    // Clean markdown code blocks if present
    let cleanedText = text;
    if (text.startsWith('```')) {
      const lines = text.split('\n');
      if (lines[0].startsWith('```')) lines.shift();
      if (lines[lines.length - 1].startsWith('```')) lines.pop();
      cleanedText = lines.join('\n').trim();
    }

    return {
      text: cleanedText,
      usage: data.usage
    };

  } catch (error) {
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error("Erreur inconnue lors de l'appel à OpenRouter.");
    }
  }
};

// Helper to generate text with OpenRouter
export const generateWithOpenRouter = async (
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  userPrompt: string,
  temperature: number = 1.0
): Promise<{ text: string; usage?: OpenRouterResponse['usage'] }> => {

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt }
  ];

  return callOpenRouter(apiKey, modelId, messages, temperature);
};

// Helper to analyze text with structured JSON output (for analysis tasks)
export const analyzeWithOpenRouter = async (
  apiKey: string,
  modelId: string,
  systemPrompt: string,
  textToAnalyze: string,
  temperature: number = 0.1
): Promise<any> => {

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt + "\n\nRenvoie UNIQUEMENT un JSON valide, sans texte supplémentaire." },
    { role: 'user', content: `ANALYSE CE TEXTE :\n${textToAnalyze}` }
  ];

  const result = await callOpenRouter(apiKey, modelId, messages, temperature, 2000);

  try {
    // Try to parse as JSON
    return JSON.parse(result.text);
  } catch (e) {
    // If not valid JSON, try to extract JSON from markdown code blocks
    const jsonMatch = result.text.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    throw new Error("La réponse du modèle n'est pas un JSON valide.");
  }
};
