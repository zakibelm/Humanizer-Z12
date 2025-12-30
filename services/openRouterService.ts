
import { IterationStepConfig, AnalysisResult } from '../types';

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const AUTH_URL = "https://openrouter.ai/api/v1/auth/key";

export const validateOpenRouterKey = async (apiKey: string): Promise<{ valid: boolean; message: string }> => {
    if (!apiKey) return { valid: false, message: "Aucune clé fournie" };
    try {
        const response = await fetch(AUTH_URL, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
            }
        });

        if (response.ok) {
            const data = await response.json();
            return { valid: true, message: `OK - Limite: ${data.data?.limit || 'N/A'}` };
        } else {
            const error = await response.json();
            return { valid: false, message: error.error?.message || `Erreur ${response.status}` };
        }
    } catch (e) {
        return { valid: false, message: "Erreur réseau" };
    }
};

export const callOpenRouter = async (
    prompt: string, 
    config: IterationStepConfig, 
    apiKey: string,
    temperature: number = 0.8
): Promise<string> => {
    if (!apiKey) throw new Error("Clé API OpenRouter manquante.");

    const response = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Humanizer Z12",
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: config.model,
            messages: [
                { role: "system", content: config.systemPrompt },
                { role: "user", content: prompt }
            ],
            temperature: temperature
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `Erreur OpenRouter ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
};

export const runAnalysis = async (text: string, apiKey: string): Promise<AnalysisResult> => {
    const systemPrompt = `Analyze the human-likeness of this text. Return a JSON object ONLY: 
    { "detectionRisk": { "level": "Faible"|"Modéré"|"Élevé", "score": 0-100 }, "perplexity": { "score": 0-100, "analysis": "string" }, "burstiness": { "score": 0-100, "analysis": "string" }, "flaggedSentences": [] }`;
    
    const config: IterationStepConfig = {
        id: 'analysis',
        active: true,
        agentName: 'Analyst',
        model: 'openai/gpt-4o-mini',
        systemPrompt: systemPrompt
    };

    const resultStr = await callOpenRouter(`Analyze this: ${text}`, config, apiKey, 0.1);
    try {
        return JSON.parse(resultStr);
    } catch (e) {
        console.error("Analysis Parse Error:", e, resultStr);
        return {
            detectionRisk: { level: 'Modéré', score: 50 },
            perplexity: { score: 50, analysis: 'Analyse indisponible' },
            burstiness: { score: 50, analysis: 'Analyse indisponible' },
            flaggedSentences: []
        };
    }
};
