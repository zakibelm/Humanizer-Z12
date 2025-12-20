
import { GoogleGenAI, Type } from "@google/genai";
import { StyleCategory, StyleDistribution, AnalysisResult, ModelId, StylometricProfile, WorkflowStep } from '../types';
import { analyzeText, compareProfiles } from './stylometryService';
import { detectAI } from './zeroGptService';

export interface GenerationOutput {
    text: string;
    analysis: AnalysisResult;
    logs?: WorkflowStep[];
}

// --- Helpers de Robustesse ---

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const retryWrapper = async <T>(
    fn: () => Promise<T>, 
    retries: number = 3, 
    delay: number = 1000
): Promise<T> => {
    try {
        return await fn();
    } catch (error) {
        if (retries <= 0) throw error;
        console.warn(`API Error, retrying... (${retries} attempts left). Error: ${error}`);
        await sleep(delay);
        return retryWrapper(fn, retries - 1, delay * 2); // Exponential backoff
    }
};

// --- Enriched Prompt Builders (V2) ---

const AI_PATTERNS_TO_AVOID = [
    "En conclusion", "Il est important de noter", "En résumé", "Plongeons dans", 
    "Tapestry", "Delve", "Landscape", "Symphony", "Crucial", "Foster", "Nuance",
    "Dans le monde d'aujourd'hui", "Il convient de souligner", "Globalement", 
    "En somme", "D'une part", "D'autre part"
];

const formatProfileForPrompt = (profile: StylometricProfile): string => {
    return `
    - **Diversité Lexicale (TTR) :** Cible ~${profile.typeTokenRatio.toFixed(3)}. Utilise des synonymes rares.
    - **Longueur Moyenne des Mots :** ~${profile.averageWordLength.toFixed(2)} caractères.
    - **VARIATION DES PHRASES (Burstiness) :**
        - Moyenne : ${profile.sentenceLengthMean.toFixed(2)} mots.
        - **IMPERATIF :** Tu DOIS alterner brutalement entre phrases très courtes (3-5 mots) et phrases complexes. C'est la signature humaine.
    - **Ponctuation :** Utilise environ ${profile.punctuationProfile[','].toFixed(1)} virgules et ${profile.punctuationProfile['.'].toFixed(1)} points par 100 mots.
`;
};

const buildSystemInstructionForGeneration = (styles: StyleCategory[], distribution: StyleDistribution, targetProfile: StylometricProfile, baseSystemPrompt: string): string => {
    let instruction = `**RÔLE:** Tu n'es PAS un rédacteur, tu es un HUMANIZER (Expert en Paraphrase Anti-IA).
**TACHE UNIQUE:** Réécrire le texte fourni pour supprimer la "signature IA" (patterns répétitifs, ton monotone, structure académique) SANS CHANGER LE SENS NI AJOUTER D'INFORMATION.

**RÈGLES D'OR DE LA RÉÉCRITURE :**
1. **CONSERVATION DU SENS :** Ne change pas l'histoire, les faits ou les données. Dis la même chose, mais différemment.
2. **CASSER LES STRUCTURES :** L'IA fait "Sujet + Verbe + Complément". L'humain fait des inversions, des incises, des questions rhétoriques. Utilise-les.
3. **VOCABULAIRE :** Remplace les mots "lisses" par des mots plus "granuleux", familiers ou imagés.
4. **FORMAT :** Renvoie UNIQUEMENT le texte humanisé. Pas d'intro, pas de "Voici la version réécrite".
`;
    
    // Si le prompt utilisateur ne contient pas déjà les instructions vitales, on ajoute les impératifs techniques
    if (!instruction.includes("ANTI-PATTERNS")) {
        instruction += `
**ANTI-PATTERNS (MOTS INTERDITS - SIGNATURES IA) :** ${AI_PATTERNS_TO_AVOID.join(', ')}. Si tu vois ces mots, supprime-les ou remplace-les.`;
    }

    instruction += `

**PROFIL STYLOMÉTRIQUE CIBLE :**
${formatProfileForPrompt(targetProfile)}

**INSPIRATION DE STYLE (TON & VOCABULAIRE) :**
`;

    // Optimization: Only include styles with > 0% distribution
    styles.filter(s => distribution[s.id] > 0).forEach(category => {
        if (category.documents.length > 0) {
            const contextSample = category.documents
                .map(d => d.content.slice(0, 1000)) 
                .join('\n...\n');
                
            instruction += `
---
**COPIE CE STYLE (${category.name} - Poids : ${distribution[category.id]}%)**
${contextSample}
---
`;
        }
    });

    return instruction;
};

const buildSystemInstructionForRefinement = (targetProfile: StylometricProfile, deviations: string[], previousAnalysis?: AnalysisResult): string => {
    let instruction = `**RÔLE:** Correcteur Anti-IA.
**TACHE:** Le texte précédent a été détecté comme IA. Tu dois le "salir" pour le rendre humain.

**PROFIL CIBLE :**
${formatProfileForPrompt(targetProfile)}

**DIAGNOSTIC CRITIQUE :**
`;

    if (previousAnalysis?.zeroGpt && !previousAnalysis.zeroGpt.error) {
        instruction += `⚠️ **ALERTE ZEROGPT :** Le texte est détecté à **${previousAnalysis.zeroGpt.fakePercentage}% IA**. Il faut être plus radical dans la réécriture.\n`;
    }

    instruction += `
${deviations.length > 0 ? `Défauts stylistiques identifiés : ${deviations.join('; ')}.` : "Le texte est trop propre."}

**ACTIONS OBLIGATOIRES :**
1.  **SYNTAXE :** Fusionne deux phrases en une complexe, ou coupe une longue phrase en trois morceaux.
2.  **SUBSTITUTION :** Change tous les adjectifs génériques par des synonymes moins courants.
3.  **BRUIT :** Ajoute des connecteurs logiques humains ("Bon,", "En fait,", "Du coup,").

Renvoie UNIQUEMENT le texte corrigé.
`;
    return instruction;
};

const buildSystemInstructionForAnalysis = (): string => {
    return `**RÔLE:** Moteur de détection de style adverse.
**TACHE:** Analyse le texte suivant. Cherche les motifs répétitifs, le manque de profondeur, et la structure trop parfaite typique des LLM.

Renvoie un JSON strict respectant ce schéma :
{
  "detectionRisk": { "level": "Faible"|"Modéré"|"Élevé", "score": number (0-100, 100=Humain) },
  "perplexity": { "score": number, "analysis": string },
  "burstiness": { "score": number, "analysis": string },
  "flaggedSentences": string[] (Top 3 des phrases qui sonnent le plus "IA")
}`;
};

const analysisSchema = {
    type: Type.OBJECT,
    properties: {
        detectionRisk: {
            type: Type.OBJECT,
            properties: {
                level: { type: Type.STRING },
                score: { type: Type.INTEGER },
            },
            required: ["level", "score"]
        },
        perplexity: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER },
                analysis: { type: Type.STRING }
            },
            required: ["score", "analysis"]
        },
        burstiness: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.INTEGER },
                analysis: { type: Type.STRING }
            },
             required: ["score", "analysis"]
        },
        flaggedSentences: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ["detectionRisk", "perplexity", "burstiness", "flaggedSentences"],
};


// --- API Call Wrappers ---

const callGeminiForGeneration = async (userPrompt: string, systemInstruction: string, model: ModelId, apiKey: string): Promise<string> => {
    if (!apiKey) throw new Error("Clé API Google Gemini manquante dans les paramètres.");
    
    const ai = new GoogleGenAI({ apiKey });
    
    return retryWrapper(async () => {
        const response = await ai.models.generateContent({
          model,
          contents: { parts: [{ text: userPrompt }] },
          config: {
            systemInstruction,
            temperature: 0.9, // Légèrement réduit pour éviter les hallucinations hors sujet, mais assez haut pour le style
            topP: 0.95,
            topK: 40,
          }
        });
        
        const text = response.text ? response.text.trim() : "";
        if (text.startsWith('```')) {
            const lines = text.split('\n');
            if (lines[0].startsWith('```')) lines.shift();
            if (lines[lines.length - 1].startsWith('```')) lines.pop();
            return lines.join('\n').trim();
        }
        return text;
    });
};

const callGeminiForAnalysis = async (textToAnalyze: string, systemInstruction: string, model: ModelId, apiKey: string): Promise<AnalysisResult> => {
    if (!apiKey) throw new Error("Clé API Google Gemini manquante dans les paramètres.");
    
    const ai = new GoogleGenAI({ apiKey });
    const userPrompt = `ANALYSE CE TEXTE :\n${textToAnalyze}`;
    
    return retryWrapper(async () => {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: userPrompt }] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.1,
            }
        });
        
        try {
            return JSON.parse(response.text || "{}");
        } catch (e) {
            throw new Error("Échec du parsing de l'analyse JSON.");
        }
    });
};

// --- Main Logic with Agentic Loop ---

export const generateHumanizedText = async (
  inputText: string,
  styles: StyleCategory[],
  distribution: StyleDistribution,
  targetProfile: StylometricProfile, 
  agenticConfig: { enabled: boolean; targetScore: number; maxIterations: number },
  settings: { googleApiKey: string; zeroGptApiKey: string; model: ModelId; systemPrompt: string },
  onStepUpdate?: (step: WorkflowStep) => void
): Promise<GenerationOutput> => {
    const logs: WorkflowStep[] = [];
    const addLog = (label: string, status: WorkflowStep['status'], details?: string) => {
        const step = { id: Date.now().toString(), label, status, details };
        logs.push(step);
        if (onStepUpdate) onStepUpdate(step);
    };

    // Step 1: Initial Generation / Paraphrasing
    addLog("Réécriture Humanisée", "running", "Transformation du texte pour supprimer les signatures IA...");
    
    const generationSystemInstruction = buildSystemInstructionForGeneration(styles, distribution, targetProfile, settings.systemPrompt);
    
    // Logique de distinction : Est-ce un sujet ou un texte à réécrire ?
    let generationUserPrompt = "";
    if (inputText.length < 50 && !inputText.includes(" ")) {
        // C'est probablement juste un sujet court
        generationUserPrompt = `Redige un texte humain sur ce sujet : "${inputText}"`;
    } else {
        // C'est un texte à humaniser
        generationUserPrompt = `Voici le texte IA à HUMANISER (Réécriture stricte, garde le sens) :\n\n"${inputText}"`;
    }
    
    let currentText = await callGeminiForGeneration(generationUserPrompt, generationSystemInstruction, settings.model, settings.googleApiKey);
    addLog("Réécriture Humanisée", "success", "Première passe effectuée.");

    // Step 2: Analysis (Internal + External)
    addLog("Audit Détection", "running", "Vérification ZeroGPT + Analyse Stylométrique...");
    const analysisSystemInstruction = buildSystemInstructionForAnalysis();
    
    let [analysisResponse, zeroGptResponse] = await Promise.all([
        callGeminiForAnalysis(currentText, analysisSystemInstruction, settings.model, settings.googleApiKey),
        detectAI(currentText, settings.zeroGptApiKey)
    ]);
    
    let currentAnalysis = analysisResponse;
    if (zeroGptResponse && !zeroGptResponse.error) {
        currentAnalysis.zeroGpt = zeroGptResponse;
        const zeroGptHumanScore = 100 - zeroGptResponse.fakePercentage;
        currentAnalysis.detectionRisk.score = Math.round((currentAnalysis.detectionRisk.score * 0.2) + (zeroGptHumanScore * 0.8));
    }

    const generatedProfile = analyzeText(currentText);
    currentAnalysis.stylometricMatch = compareProfiles(generatedProfile, targetProfile);
    
    addLog("Audit Détection", "success", `Score Actuel : ${currentAnalysis.detectionRisk.score}% ${currentAnalysis.zeroGpt && !currentAnalysis.zeroGpt.error ? `(ZeroGPT: ${currentAnalysis.zeroGpt.fakePercentage}% IA)` : ''}`);

    // Step 3: Agentic Loop
    if (agenticConfig.enabled) {
        let iterations = 0;
        
        while (
            currentAnalysis.detectionRisk.score < agenticConfig.targetScore && 
            iterations < agenticConfig.maxIterations
        ) {
            iterations++;
            
            const reason = currentAnalysis.zeroGpt && currentAnalysis.zeroGpt.fakePercentage > 20 
                ? `ZeroGPT a détecté ${currentAnalysis.zeroGpt.fakePercentage}% IA.`
                : `Score ${currentAnalysis.detectionRisk.score}% insuffisant.`;

            addLog(`Cycle d'Optimisation (${iterations}/${agenticConfig.maxIterations})`, "running", `${reason} Modification structurelle en cours...`);
            
            const deviations = currentAnalysis.stylometricMatch?.deviations || [];
            
            const refinementSystemInstruction = buildSystemInstructionForRefinement(targetProfile, deviations, currentAnalysis);
            const refinementUserPrompt = `HUMANISE ENCORE CE TEXTE (ESSAI ${iterations}) - Il est encore détecté comme IA :\n"${currentText}"`;
            
            const refinedText = await callGeminiForGeneration(refinementUserPrompt, refinementSystemInstruction, settings.model, settings.googleApiKey);
            
            // Sécurité : Si le texte raffiné est étrangement court (erreur), on garde l'ancien
            if (refinedText.length > currentText.length * 0.5) {
                currentText = refinedText;
            }
            
            await sleep(1000); // Pause pour éviter rate limit
            
            const [newInternalAnalysis, newZeroGptResponse] = await Promise.all([
                 callGeminiForAnalysis(currentText, analysisSystemInstruction, settings.model, settings.googleApiKey),
                 detectAI(currentText, settings.zeroGptApiKey)
            ]);

            currentAnalysis = newInternalAnalysis;
            
            if (newZeroGptResponse && !newZeroGptResponse.error) {
                currentAnalysis.zeroGpt = newZeroGptResponse;
                const zScore = 100 - newZeroGptResponse.fakePercentage;
                currentAnalysis.detectionRisk.score = Math.round((currentAnalysis.detectionRisk.score * 0.2) + (zScore * 0.8));
            } else {
                 const oldZScore = zeroGptResponse ? (100 - zeroGptResponse.fakePercentage) : currentAnalysis.detectionRisk.score;
                 currentAnalysis.detectionRisk.score = Math.round((currentAnalysis.detectionRisk.score * 0.4) + (oldZScore * 0.6));
            }

            const newProfile = analyzeText(currentText);
            currentAnalysis.stylometricMatch = compareProfiles(newProfile, targetProfile);

            if (currentAnalysis.detectionRisk.score >= agenticConfig.targetScore) {
                 addLog(`Cycle d'Optimisation (${iterations})`, "success", `Succès ! Score final : ${currentAnalysis.detectionRisk.score}%`);
            } else {
                 const status = iterations === agenticConfig.maxIterations ? "warning" : "pending";
                 addLog(`Cycle d'Optimisation (${iterations})`, status as any, `Nouveau score : ${currentAnalysis.detectionRisk.score}%`);
            }
        }
    }

    return {
        text: currentText,
        analysis: currentAnalysis,
        logs
    };
};

export const refineHumanizedText = async (
    textToRefine: string,
    analysis: AnalysisResult,
    styles: StyleCategory[],
    targetProfile: StylometricProfile,
    settings: { googleApiKey: string; zeroGptApiKey: string; model: ModelId }
): Promise<GenerationOutput> => {
    const deviations = analysis.stylometricMatch?.deviations || [];

    const refinementSystemInstruction = buildSystemInstructionForRefinement(targetProfile, deviations, analysis);
    const refinementUserPrompt = `CORRIGE CES PHRASES POUR QU'ELLES SOIENT HUMAINES :\n"${textToRefine}"\n\nConcentre-toi sur les passages marqués comme artificiels : ${analysis.flaggedSentences.join(', ')}`;
    
    const refinedText = await callGeminiForGeneration(refinementUserPrompt, refinementSystemInstruction, settings.model, settings.googleApiKey);
    
    const analysisSystemInstruction = buildSystemInstructionForAnalysis();
    
    const [newAnalysis, zeroGptResponse] = await Promise.all([
        callGeminiForAnalysis(refinedText, analysisSystemInstruction, settings.model, settings.googleApiKey),
        detectAI(refinedText, settings.zeroGptApiKey)
    ]);

    if (zeroGptResponse && !zeroGptResponse.error) {
        newAnalysis.zeroGpt = zeroGptResponse;
        const zScore = 100 - zeroGptResponse.fakePercentage;
        newAnalysis.detectionRisk.score = Math.round((newAnalysis.detectionRisk.score * 0.2) + (zScore * 0.8));
    }

    const generatedProfile = analyzeText(refinedText);
    newAnalysis.stylometricMatch = compareProfiles(generatedProfile, targetProfile);
    
    return {
        text: refinedText,
        analysis: newAnalysis,
    };
};

export const analyzeExistingText = async (
    text: string,
    targetProfile: StylometricProfile,
    settings: { googleApiKey: string; zeroGptApiKey: string; model: ModelId }
): Promise<GenerationOutput> => {
    const analysisSystemInstruction = buildSystemInstructionForAnalysis();
    
    const [analysis, zeroGptResponse] = await Promise.all([
        callGeminiForAnalysis(text, analysisSystemInstruction, settings.model, settings.googleApiKey),
        detectAI(text, settings.zeroGptApiKey)
    ]);

    if (zeroGptResponse && !zeroGptResponse.error) {
        analysis.zeroGpt = zeroGptResponse;
        const zScore = 100 - zeroGptResponse.fakePercentage;
        analysis.detectionRisk.score = Math.round((analysis.detectionRisk.score * 0.2) + (zScore * 0.8));
    }

    const generatedProfile = analyzeText(text);
    analysis.stylometricMatch = compareProfiles(generatedProfile, targetProfile);

    return {
        text: text,
        analysis,
    };
};
