
import { GoogleGenAI, Type } from "@google/genai";
import { StyleCategory, StyleDistribution, AnalysisResult, ModelId, StylometricProfile } from '../types';
import { analyzeText, createCompositeProfile, compareProfiles } from './stylometryService';

export interface GenerationOutput {
    text: string;
    analysis: AnalysisResult;
}

const formatProfileForPrompt = (profile: StylometricProfile): string => {
    return `
    - **Diversité Lexicale (Type-Token Ratio) :** Vise un score autour de ${profile.typeTokenRatio.toFixed(3)}.
    - **Longueur Moyenne des Mots :** Cible une moyenne de ${profile.averageWordLength.toFixed(2)} caractères.
    - **Statistiques des Phrases :**
        - Longueur Moyenne : ${profile.sentenceLengthMean.toFixed(2)} mots.
        - Écart-Type (VARIATION) : ${profile.sentenceLengthStdDev.toFixed(2)} mots. C'est crucial, varie tes phrases !
    - **Lisibilité (Flesch Score) :** Le texte doit avoir un score de lisibilité proche de ${profile.fleschReadingEase.toFixed(2)}.
    - **Ponctuation (pour 100 mots) :**
        - Virgules (,) : ~${profile.punctuationProfile[','].toFixed(1)}
        - Points (.) : ~${profile.punctuationProfile['.'].toFixed(1)}
        - Tirets (—) : ~${profile.punctuationProfile['-'].toFixed(1)}
`;
};

const constructPrompt = (topic: string, styles: StyleCategory[], distribution: StyleDistribution, targetProfile: StylometricProfile): string => {
  let prompt = `
**CONTEXTE:** Tu es un maître rédacteur, Humanizer Z12. Ta mission est de générer un texte sur un sujet donné qui obtient un score de plus de 92% sur les détecteurs d'IA. Pour ce faire, tu dois suivre un profil stylométrique précis tout en intégrant des "imperfections" humaines.

**PROFIL STYLOMÉTRIQUE CIBLE (CONTRAINTES NUMÉRIQUES OBLIGATOIRES) :**
Tu DOIS générer un texte dont les statistiques correspondent au profil suivant :
${formatProfileForPrompt(targetProfile)}

**TA BIBLIOTHÈQUE D'INSPIRATION (POUR LE TON ET LE VOCABULAIRE) :**
Voici les styles que tu dois mélanger de manière organique.

`;

  styles.forEach(category => {
    if (category.documents.length > 0) {
      prompt += `
---
**STYLE : ${category.name} (INFLUENCE GUIDANTE : ${distribution[category.id]}%)**
${category.documents.map(doc => `[EXTRAIT COMPLET]${doc.content}[/EXTRAIT COMPLET]`).join('\n')}
---
`;
    }
  });

  prompt += `
**INSTRUCTIONS CRITIQUES & TECHNIQUES D'HUMANISATION OBLIGATOIRES :**

1.  **GÉNÈRE LE TEXTE :** Rédige un texte sur le sujet : "${topic}".
2.  **RESPECTE LE PROFIL :** La priorité absolue est de respecter les contraintes du profil stylométrique ci-dessus.
3.  **IMPERFECTIONS NATURELLES :** En respectant le profil, introduis 1 ou 2 phrases légèrement maladroites, une idée reformulée, des transitions parfois abruptes, et des contractions ("c'est", "y'a").
4.  **AUTO-ANALYSE DE RISQUE (JSON OBLIGATOIRE) :** Sois très critique.
    *   \`detectionRisk\`: Score de 0 à 100 (100 = très humain).
    *   \`perplexity\`: Score de 0 à 100 (100 = très imprévisible).
    *   \`burstiness\`: Score de 0 à 100 (100 = grande variation).
    *   \`flaggedSentences\`: Tableau des 1-3 phrases les plus risquées.

**TA TÂCHE :**
Génère le texte sur "${topic}" en respectant le profil cible, puis fournis l'analyse JSON.
`;

  return prompt;
};

const constructRefinePrompt = (textToRefine: string, flaggedSentences: string[], targetProfile: StylometricProfile, deviations: string[]): string => {
    return `
**CONTEXTE:** Tu es un expert en révision, Humanizer Z12. Ta mission est d'améliorer un texte pour qu'il corresponde parfaitement à un profil stylométrique cible.

**TEXTE À AMÉLIORER:**
"${textToRefine}"

**PROFIL STYLOMÉTRIQUE CIBLE (À ATTEINDRE IMPÉRATIVEMENT) :**
${formatProfileForPrompt(targetProfile)}

**POINTS FAIBLES IDENTIFIÉS :**
- **Phrases à risque :** ${flaggedSentences.map(s => `"${s}"`).join(', ')}
- **Écarts statistiques à corriger :** ${deviations.join('; ')}

**INSTRUCTIONS CRITIQUES DE RÉÉCRITURE :**
1.  **CORRIGE LES ÉCARTS :** Modifie le texte pour qu'il corresponde aux métriques du profil cible. Si la "Variation des phrases" est trop faible, réécris des passages pour inclure des phrases plus courtes et plus longues. Si le "TTR" est bas, remplace des mots pour diversifier le vocabulaire.
2.  **CONSERVE LE SENS :** Ne modifie pas le message ou les informations clés du texte.
3.  **FOURNIS UNE NOUVELLE ANALYSE (JSON OBLIGATOIRE) :** Après amélioration, fournis une nouvelle analyse de risque complète.

**TA TÂCHE :**
Produis le texte amélioré en corrigeant les écarts stylométriques, puis fournis la nouvelle analyse JSON.
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

const callGemini = async (prompt: string, model: ModelId, targetProfile?: StylometricProfile): Promise<GenerationOutput> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 1.2,
            topP: 0.95,
            topK: 50,
          }
        });
        
        const jsonResponse = JSON.parse(response.text);

        let finalAnalysis = jsonResponse.analysis;

        if (targetProfile) {
            const generatedProfile = analyzeText(jsonResponse.humanizedText);
            const stylometricMatch = compareProfiles(generatedProfile, targetProfile);
            finalAnalysis.stylometricMatch = stylometricMatch;
        }

        return {
            text: jsonResponse.humanizedText,
            analysis: finalAnalysis,
        };

    } catch (error) {
        console.error("Error calling Gemini:", error);
        if (error instanceof Error) {
            throw new Error(`Erreur de l'API Gemini : ${error.message}`);
        }
        throw new Error("Une erreur inconnue est survenue lors de l'appel à l'API.");
    }
}


export const generateHumanizedText = async (
  topic: string,
  styles: StyleCategory[],
  distribution: StyleDistribution,
  model: ModelId
): Promise<GenerationOutput> => {
    const allDocumentTexts = styles.flatMap(category => category.documents.map(doc => doc.content));
    if (allDocumentTexts.length === 0) {
        throw new Error("La bibliothèque de styles est vide. Veuillez ajouter des documents de référence.");
    }
    const targetProfile = createCompositeProfile(allDocumentTexts);
    const fullPrompt = constructPrompt(topic, styles, distribution, targetProfile);
    return callGemini(fullPrompt, model, targetProfile);
};

export const refineHumanizedText = async (
    textToRefine: string,
    analysis: AnalysisResult,
    styles: StyleCategory[],
    model: ModelId
): Promise<GenerationOutput> => {
    const allDocumentTexts = styles.flatMap(category => category.documents.map(doc => doc.content));
    if (allDocumentTexts.length === 0) {
        throw new Error("La bibliothèque de styles est vide pour le raffinement.");
    }
    const targetProfile = createCompositeProfile(allDocumentTexts);
    const deviations = analysis.stylometricMatch?.deviations || [];
    const refinePrompt = constructRefinePrompt(textToRefine, analysis.flaggedSentences, targetProfile, deviations);
    return callGemini(refinePrompt, model, targetProfile);
};

export const analyzeExistingText = async (
    text: string,
    styles: StyleCategory[],
    model: ModelId
): Promise<GenerationOutput> => {
    const allDocumentTexts = styles.flatMap(category => category.documents.map(doc => doc.content));
    if (allDocumentTexts.length === 0) {
        throw new Error("La bibliothèque de styles est vide. Impossible de comparer le style.");
    }
    const targetProfile = createCompositeProfile(allDocumentTexts);
    
    const analyzePrompt = `
**CONTEXTE:** Tu es un expert en analyse de texte, Humanizer Z12. Ta mission est d'analyser un texte existant pour déterminer s'il peut être détecté comme généré par IA.

**TEXTE À ANALYSER:**
"${text}"

**INSTRUCTIONS:**
1. NE MODIFIE PAS le texte fourni. Le champ 'humanizedText' dans ta réponse JSON DOIT contenir le texte original fourni ci-dessus, sans aucune altération.
2. ANALYSE le texte pour le risque de détection, la perplexité, et la variation (burstiness).
3. IDENTIFIE les 1-3 phrases les plus risquées.
4. FOURNIS L'ANALYSE (JSON OBLIGATOIRE) : Remplis tous les champs de l'objet d'analyse.

**TA TÂCHE :**
Analyse le texte et fournis le JSON complet avec le texte original intact dans le champ 'humanizedText'.
`;
    
    const result = await callGemini(analyzePrompt, model, targetProfile);
    
    // Renvoyer le texte original pour garantir qu'il n'a pas été modifié par l'IA
    return {
        text: text,
        analysis: result.analysis
    };
};
