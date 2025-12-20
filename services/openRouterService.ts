
import { IterationStepConfig, AnalysisResult } from '../types';

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

export const callOpenRouter = async (
    prompt: string, 
    config: IterationStepConfig, 
    apiKey: string
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
            temperature: 0.8
        })
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "Erreur OpenRouter");
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
};

export const runAnalysis = async (text: string, apiKey: string): Promise<AnalysisResult> => {
    // Analyse simplifiée utilisant un modèle rapide pour l'évaluation interne
    const systemPrompt = `Analyze the human-likeness of this text. Return a JSON object: 
    { "detectionRisk": { "level": "Faible"|"Modéré"|"Élevé", "score": 0-100 }, "perplexity": { "score": 0-100, "analysis": "string" }, "burstiness": { "score": 0-100, "analysis": "string" }, "flaggedSentences": [] }`;
    
    const config: IterationStepConfig = {
        id: 'analysis',
        active: true,
        agentName: 'Analyst',
        model: 'openai/gpt-3.5-turbo', // Modèle léger pour l'analyse
        systemPrompt: systemPrompt
    };

    const resultStr = await callOpenRouter(`Analyze this: ${text}`, config, apiKey);
    try {
        return JSON.parse(resultStr);
    } catch (e) {
        return {
            detectionRisk: { level: 'Modéré', score: 50 },
            perplexity: { score: 50, analysis: 'Analyse indisponible' },
            burstiness: { score: 50, analysis: 'Analyse indisponible' },
            flaggedSentences: []
        };
    }
};
