
import { GoogleGenAI, Type } from "@google/genai";
import { StyleCategory, StyleDistribution, AnalysisResult } from '../types';

export interface GenerationOutput {
    text: string;
    analysis: AnalysisResult;
}

const constructPrompt = (topic: string, styles: StyleCategory[], distribution: StyleDistribution): string => {
  let prompt = `
**CONTEXTE:** Tu es un maître rédacteur, Humanizer Z12. Ta mission est de générer un texte sur un sujet donné qui échappe à la détection par les outils d'IA (comme ZeroGPT). Pour ce faire, tu dois imiter les imperfections et les variations du style d'écriture humain en te basant sur une bibliothèque de styles fournie.

**TA BIBLIOTHÈQUE D'INSPIRATION :**
Voici les styles que tu dois mélanger de manière organique.

`;

  styles.forEach(category => {
    if (category.documents.length > 0) {
      prompt += `
---
**STYLE : ${category.name} (INFLUENCE GUIDANTE : ${distribution[category.id]}%)**
${category.documents.map(doc => `[EXTRAIT]${doc.content.substring(0, 500)}...[/EXTRAIT]`).join('\n')}
---
`;
    }
  });

  prompt += `
**INSTRUCTIONS CRITIQUES :**
1.  **GÉNÈRE LE TEXTE :** Rédige un texte sur le sujet : "${topic}". Ton texte DOIT être varié. Alterne entre des phrases longues et complexes et des phrases courtes et directes. Introduis des tournures de phrases légèrement inhabituelles. Évite la perfection et la prévisibilité robotique.
2.  **AUTO-ANALYSE DE RISQUE (JSON OBLIGATOIRE) :** Après la rédaction, fournis une analyse de risque de détection dans un objet JSON. Ne mélange jamais l'analyse avec le texte.
    *   \`detectionRisk\`: Un objet évaluant le risque global.
        *   \`score\`: Un score numérique de 0 à 100 indiquant la probabilité que le texte soit perçu comme humain (100 = très humain).
        *   \`level\`: Le niveau de risque correspondant ('Faible' pour score > 70, 'Modéré' pour 40-70, 'Élevé' pour < 40).
    *   \`perplexity\`: Un objet analysant la prévisibilité du texte.
        *   \`score\`: Un score numérique de 0 à 100 (100 = très imprévisible, donc plus humain).
        *   \`analysis\`: Explique brièvement l'impact du score.
    *   \`burstiness\`: Un objet analysant la variation des phrases.
        *   \`score\`: Un score de 0 à 100 (100 = grande variation de longueur/structure, donc plus humain).
        *   \`analysis\`: Explique brièvement l'impact du score.
    *   \`flaggedSentences\`: Un tableau listant les 1 à 3 phrases EXACTES du texte qui sont les plus susceptibles d'être détectées.

**TA TÂCHE :**
Génère le texte sur "${topic}", puis fournis l'analyse JSON séparée.
`;

  return prompt;
};

const constructRefinePrompt = (textToRefine: string, flaggedSentences: string[]): string => {
    return `
**CONTEXTE:** Tu es un expert en révision, Humanizer Z12. Ta mission est d'améliorer un texte existant pour qu'il paraisse encore plus humain et échappe à la détection par IA.

**TEXTE À AMÉLIORER:**
"${textToRefine}"

**POINTS FAIBLES IDENTIFIÉS (PHRASES À RISQUE):**
${flaggedSentences.map(s => `- "${s}"`).join('\n')}

**INSTRUCTIONS CRITIQUES:**
1.  **RÉÉCRIS LE TEXTE :** Modifie le texte fourni pour augmenter sa "Perplexité" (le rendre moins prévisible) et sa "Variation" (varier davantage la longueur et la structure des phrases).
2.  **CIBLE LES POINTS FAIBLES :** Concentre tes efforts sur la réécriture des "phrases à risque" identifiées. Remplace-les par des alternatives plus naturelles et moins génériques.
3.  **CONSERVE LE SENS :** Ne modifie pas le message ou les informations clés du texte original. L'objectif est de changer le style, pas le fond.
4.  **FOURNIS UNE NOUVELLE ANALYSE (JSON OBLIGATOIRE) :** Après avoir amélioré le texte, fournis une nouvelle analyse de risque complète et chiffrée, en visant des scores plus élevés. Le format JSON doit être identique à celui de la génération initiale (detectionRisk, perplexity, burstiness, flaggedSentences).

**TA TÂCHE :**
Produis le texte amélioré, puis fournis la nouvelle analyse JSON.
`;
}

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        humanizedText: {
            type: Type.STRING,
            description: "Le texte final généré qui imite l'écriture humaine.",
        },
        analysis: {
            type: Type.OBJECT,
            description: "Une auto-analyse de risque du texte généré.",
            properties: {
                detectionRisk: {
                    type: Type.OBJECT,
                    properties: {
                        level: { type: Type.STRING, description: "Niveau de risque (Faible, Modéré, Élevé)." },
                        score: { type: Type.INTEGER, description: "Score de probabilité humaine (0-100)." },
                    },
                    required: ["level", "score"]
                },
                perplexity: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score de perplexité (0-100)." },
                        analysis: { type: Type.STRING, description: "Analyse de la perplexité/prévisibilité." }
                    },
                    required: ["score", "analysis"]
                },
                burstiness: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER, description: "Score de variation (0-100)." },
                        analysis: { type: Type.STRING, description: "Analyse de la variation/rafale." }
                    },
                     required: ["score", "analysis"]
                },
                flaggedSentences: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Phrases les plus susceptibles d'être détectées."
                }
            },
            required: ["detectionRisk", "perplexity", "burstiness", "flaggedSentences"],
        },
    },
    required: ["humanizedText", "analysis"],
};


const defaultErrorAnalysis: AnalysisResult = {
    detectionRisk: {
        level: "Élevé",
        score: 0,
    },
    perplexity: {
        score: 0,
        analysis: "Impossible d'analyser la perplexité.",
    },
    burstiness: {
        score: 0,
        analysis: "Impossible d'analyser la variation.",
    },
    flaggedSentences: ["Impossible de récupérer les phrases à risque."],
};

const callGemini = async (prompt: string): Promise<GenerationOutput> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
          }
        });
        
        const jsonResponse = JSON.parse(response.text);

        return {
            text: jsonResponse.humanizedText,
            analysis: jsonResponse.analysis,
        };

    } catch (error) {
        console.error("Error calling Gemini:", error);
        if (error instanceof Error) {
            return { text: `Une erreur est survenue : ${error.message}`, analysis: defaultErrorAnalysis };
        }
        return { text: "Une erreur inconnue est survenue.", analysis: defaultErrorAnalysis };
    }
}


export const generateHumanizedText = async (
  topic: string,
  styles: StyleCategory[],
  distribution: StyleDistribution
): Promise<GenerationOutput> => {
  const fullPrompt = constructPrompt(topic, styles, distribution);
  return callGemini(fullPrompt);
};

export const refineHumanizedText = async (
    textToRefine: string,
    flaggedSentences: string[]
): Promise<GenerationOutput> => {
    const refinePrompt = constructRefinePrompt(textToRefine, flaggedSentences);
    return callGemini(refinePrompt);
}
