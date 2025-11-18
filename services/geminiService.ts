
import { GoogleGenAI, Type } from "@google/genai";
import { StyleCategory, StyleDistribution, AnalysisResult, StylometricProfile } from '../types';
import { analyzeText, compareProfiles, createCompositeProfile } from './stylometryService';

export interface GenerationOutput {
    text: string;
    analysis: AnalysisResult;
}

const constructPrompt = (topic: string, styles: StyleCategory[], distribution: StyleDistribution, targetProfile?: StylometricProfile): string => {
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
${category.documents.map(doc => `[EXTRAIT]${doc.content}[/EXTRAIT]`).join('\n')}
---
`;
    }
  });

  // Ajouter contraintes stylométriques si disponibles
  if (targetProfile) {
    prompt += `
**CONTRAINTES STYLOMÉTRIQUES STRICTES (RESPECTE CES MÉTRIQUES) :**
Tu DOIS générer un texte qui correspond aux paramètres statistiques suivants :

📊 **STRUCTURE DES PHRASES :**
- Longueur moyenne : ${targetProfile.sentenceStats.mean.toFixed(1)} mots par phrase
- Variation (écart-type) : ${targetProfile.sentenceStats.stdDev.toFixed(1)} (CRUCIAL : varie beaucoup les longueurs)
- Phrases courtes (<10 mots) : ${targetProfile.sentenceStats.shortSentences.toFixed(0)}% du total
- Phrases longues (>25 mots) : ${targetProfile.sentenceStats.longSentences.toFixed(0)}% du total
- Plage : entre ${targetProfile.sentenceStats.min} et ${targetProfile.sentenceStats.max} mots

📚 **RICHESSE LEXICALE :**
- Diversité vocabulaire (TTR) : ${targetProfile.typeTokenRatio.toFixed(2)} (ne répète pas trop les mots)
- Mots uniques : ${(targetProfile.hapaxLegomenaRatio * 100).toFixed(0)}% du vocabulaire utilisé une seule fois
- Longueur moyenne des mots : ${targetProfile.averageWordLength.toFixed(1)} lettres

✍️ **PONCTUATION :**
- Virgules : ~${targetProfile.punctuationProfile.commaRatio.toFixed(1)} par 100 mots
- Points-virgules : ~${targetProfile.punctuationProfile.semicolonRatio.toFixed(1)} par 100 mots
- Tirets/traits d'union : ~${targetProfile.punctuationProfile.dashRatio.toFixed(1)} par 100 mots
- Questions : ${targetProfile.punctuationProfile.questionRatio.toFixed(1)}% des phrases
- Exclamations : ${targetProfile.punctuationProfile.exclamationRatio.toFixed(1)}% des phrases

🗣️ **PATTERNS LINGUISTIQUES :**
- Contractions (c'est, j'ai, etc.) : ${targetProfile.patterns.contractionRatio.toFixed(1)}% des mots
- Phrases commençant par conjonction (Et, Mais...) : ${targetProfile.patterns.startWithConjunction.toFixed(0)}%
- Lisibilité (Flesch) : ${targetProfile.readability.fleschScore.toFixed(0)}/100

`;
  }

  prompt += `
**INSTRUCTIONS CRITIQUES :**

1.  **GÉNÈRE LE TEXTE :** Rédige un texte sur le sujet : "${topic}".

2.  **TECHNIQUES OBLIGATOIRES POUR HUMANISATION :**

    a) **VARIATION EXTRÊME DES PHRASES :**
       - Alterne phrases ultra-courtes (3-7 mots) et phrases complexes (25-40 mots)
       - Exemple : "C'est simple. Mais quand on creuse et qu'on analyse les données de près, en tenant compte des multiples variables contextuelles et des nuances qui échappent souvent à une première lecture superficielle, la réalité s'avère bien plus complexe."

    b) **IMPERFECTIONS NATURELLES :**
       - Inclus 1-2 phrases légèrement maladroites ou redondantes (comme si tu hésites)
       - Reformule une même idée sous deux angles différents
       - Ajoute des transitions parfois abruptes entre paragraphes
       - Une phrase peut occasionnellement être légèrement bancale grammaticalement (sans être incorrecte)

    c) **LANGAGE AUTHENTIQUE :**
       - Utilise des contractions informelles : "c'est", "j'ai", "l'on", "qu'on"
       - Intègre expressions familières : "en gros", "du coup", "en fait", "plutôt", "assez"
       - Pose 1-2 questions rhétoriques au lecteur
       - Utilise "Et" ou "Mais" pour débuter certaines phrases (10-15%)

    d) **PONCTUATION VARIÉE :**
       - Utilise des tirets — pour les apartés
       - Quelques points-virgules pour relier des idées
       - Une ou deux phrases avec points de suspension... (hésitation)

    e) **VOCABULAIRE HUMAIN :**
       - Mélange registres formel/informel dans le même texte
       - Utilise des métaphores quotidiennes
       - Évite les formulations trop "parfaites" ou académiques systématiques
       - Insère des mots de liaison naturels ("d'ailleurs", "en revanche", "cela dit")

3.  **AUTO-ANALYSE DE RISQUE (JSON OBLIGATOIRE) :** Après la rédaction, fournis une analyse de risque de détection dans un objet JSON. Ne mélange jamais l'analyse avec le texte.
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

**IMPORTANT :** Ne sois PAS parfait. Un vrai humain fait des choix stylistiques discutables, se répète parfois, et n'optimise pas chaque phrase. C'est cette imperfection qui rend le texte authentique.

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

const callGemini = async (prompt: string, targetProfile?: StylometricProfile): Promise<GenerationOutput> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-pro',
          contents: prompt,
          config: {
            responseMimeType: "application/json",
            responseSchema,
            temperature: 1.2,        // ✅ Augmente l'imprévisibilité
            topP: 0.95,             // ✅ Diversité lexicale
            topK: 50,               // ✅ Variété des choix de mots
          }
        });

        const jsonResponse = JSON.parse(response.text);

        // Analyse stylométrique du texte généré
        let stylometricMatch = undefined;
        if (targetProfile && jsonResponse.humanizedText) {
            const generatedProfile = analyzeText(jsonResponse.humanizedText);
            const comparison = compareProfiles(targetProfile, generatedProfile);

            stylometricMatch = {
                similarity: comparison.similarity,
                deviations: comparison.deviations
                    .filter(d => d.severity === 'high' || d.severity === 'medium')
                    .map(d => `${d.metric}: ${d.deviation.toFixed(0)}% d'écart`),
            };
        }

        return {
            text: jsonResponse.humanizedText,
            analysis: {
                ...jsonResponse.analysis,
                stylometricMatch,
            },
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
  // Calculer le profil stylométrique composite des documents de référence
  const allDocumentTexts: string[] = [];
  styles.forEach(category => {
    const weight = distribution[category.id] / 100;
    category.documents.forEach(doc => {
      // Ajouter proportionnellement au poids de distribution
      const repetitions = Math.max(1, Math.round(weight * 3));
      for (let i = 0; i < repetitions; i++) {
        allDocumentTexts.push(doc.content);
      }
    });
  });

  const targetProfile = allDocumentTexts.length > 0
    ? createCompositeProfile(allDocumentTexts)
    : undefined;

  const fullPrompt = constructPrompt(topic, styles, distribution, targetProfile);
  return callGemini(fullPrompt, targetProfile);
};

export const refineHumanizedText = async (
    textToRefine: string,
    flaggedSentences: string[]
): Promise<GenerationOutput> => {
    const refinePrompt = constructRefinePrompt(textToRefine, flaggedSentences);
    return callGemini(refinePrompt);
}

/**
 * Analyse un texte existant sans le modifier
 * Retourne seulement l'analyse de risque
 */
export const analyzeExistingText = async (
    text: string,
    targetProfile?: StylometricProfile
): Promise<GenerationOutput> => {
    const analyzePrompt = `
**CONTEXTE:** Tu es un expert en analyse de texte, Humanizer Z12. Ta mission est d'analyser un texte existant pour déterminer s'il peut être détecté comme généré par IA.

**TEXTE À ANALYSER:**
"${text}"

**INSTRUCTIONS:**
1. NE MODIFIE PAS le texte fourni
2. Retourne le texte EXACTEMENT tel quel dans le champ "humanizedText"
3. Fournis une analyse complète de risque de détection (JSON)

**ANALYSE REQUISE (JSON OBLIGATOIRE):**
*   \`detectionRisk\`: Un objet évaluant le risque global.
    *   \`score\`: Un score numérique de 0 à 100 indiquant la probabilité que le texte soit perçu comme humain (100 = très humain).
    *   \`level\`: Le niveau de risque correspondant ('Faible' pour score > 70, 'Modéré' pour 40-70, 'Élevé' pour < 40).
*   \`perplexity\`: Un objet analysant la prévisibilité du texte.
    *   \`score\`: Un score numérique de 0 à 100 (100 = très imprévisible, donc plus humain).
    *   \`analysis\`: Explique brièvement l'impact du score.
*   \`burstiness\`: Un objet analysant la variation des phrases.
    *   \`score\`: Un score de 0 à 100 (100 = grande variation de longueur/structure, donc plus humain).
    *   \`analysis\`: Explique brièvement l'impact du score.
*   \`flaggedSentences\`: Un tableau listant les 1 à 3 phrases EXACTES du texte qui sont les plus susceptibles d'être détectées comme IA.

**TA TÂCHE:**
Retourne le texte INCHANGÉ et fournis l'analyse JSON.
`;

    return callGemini(analyzePrompt, targetProfile);
}
