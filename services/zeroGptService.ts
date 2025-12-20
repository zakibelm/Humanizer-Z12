
import { ZeroGptResult } from '../types';

const API_URL = "https://api.zerogpt.com/api/detect/detectText";

export const detectAI = async (text: string, apiKey: string): Promise<ZeroGptResult | null> => {
    if (!text || text.trim().length < 50 || !apiKey) {
        return { isReal: false, fakePercentage: 0, error: "Critères non remplis" };
    }

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'ApiKey': apiKey
            },
            body: JSON.stringify({ input_text: text })
        });

        if (!response.ok) return { isReal: false, fakePercentage: 0, error: "Erreur API" };

        const data = await response.json();
        const fakePercentage = data.data?.fakePercentage || 0;
            
        return {
            isReal: fakePercentage < 20,
            fakePercentage: fakePercentage,
            aiWords: data.data?.aiWords ?? 0,
            feedback: data.message || "Analyse terminée"
        };
    } catch (error) {
        return { isReal: false, fakePercentage: 0, error: "Erreur réseau" };
    }
};
