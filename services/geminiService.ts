
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
    "Dans le monde d'aujourd'hui", "Il convient de souligner", "Globalement"
];

const formatProfileForPrompt = (profile: StylometricProfile): string => {
    return `
    - **Diversité Lexicale (TTR) :** Cible ~${profile.typeTokenRatio.toFixed(3)}. Évite les répétitions.
    - **Longueur Moyenne des Mots :** ~${profile.averageWordLength.toFixed(2)} caractères.
    - **VARIATION DES PHRASES (Burstiness) :**
        - Moyenne : ${profile.sentenceLengthMean.toFixed(2)} mots.
        - Écart-Type : ${profile.sentenceLengthStdDev.toFixed(2)} mots.
        - **CRUCIAL :** Tu DOIS alterner entre des phrases très courtes (3-5 mots) et des phrases très longues et complexes (>25 mots). Ne fais pas de phrases de longueur moyenne constante.
    - **Lisibilité (Flesch) :** ~${profile.fleschReadingEase.toFixed(2)}.
    - **Ponctuation :** Utilise environ ${profile.punctuationProfile[','].toFixed(1)} virgules et ${profile.punctuationProfile['.'].toFixed(1)} points par 100 mots.
`;
};

const buildSystemInstructionForGeneration = (styles: StyleCategory[], distribution: StyleDistribution, targetProfile: StylometricProfile): string => {
    let instruction = `**RÔLE:** Tu es Humanizer Z12, un écrivain fantôme expert. Ta tâche est de rédiger un texte au style parfaitement humain et naturel qui doit PASSER LES DÉTECTEURS D'IA (ZeroGPT, Turnitin).

**OBJECTIF:** Score d'humanisation > 95% (Indétectable).
**ANTI-PATTERNS (MOTS INTERDITS) :** N'utilise JAMAIS ces expressions typiques de l'IA : ${AI_PATTERNS_TO_AVOID.join(', ')}.

**PROFIL STYLOMÉTRIQUE STRICT :**
${formatProfileForPrompt(targetProfile)}

**INSPIRATION STYLISTIQUE (TON & VOCABULAIRE) :**
`;

    // Optimization: Only include styles with > 0% distribution to save context window tokens
    styles.filter(s => distribution[s.id] > 0).forEach(category => {
        if (category.documents.length > 0) {
            // Truncate context if too long to ensure scalability
            const contextSample = category.documents
                .map(d => d.content.slice(0, 1500)) 
                .join('\n...\n');
                
            instruction += `
---
**SOURCE : ${category.name} (Poids : ${distribution[category.id]}%)**
${contextSample}
---
`;
        }
    });

    instruction += `
**MÉTHODE DE RÉDACTION "HUMAN TOUCH" :**
1.  **Imperfections :** Introduis 1-2 connecteurs logiques un peu flous ou familiers (ex: "Bon,", "Du coup,", "Bref,").
2.  **Opinion :** Prends position légèrement. L'IA est neutre, l'humain est subjectif.
3.  **Structure :** Évite les structures "Intro - 3 Paragraphes - Conclusion". Sois plus organique. Commence *in media res* si possible.
4.  **OUTPUT :** Renvoie UNIQUEMENT le texte brut. Pas de balises, pas de titres "Introduction".
`;
    return instruction;
};

const buildSystemInstructionForRefinement = (targetProfile: StylometricProfile, deviations: string[], previousAnalysis?: AnalysisResult): string => {
    let instruction = `**RÔLE:** Éditeur impitoyable spécialisé dans l'anti-détection IA.

**PROFIL CIBLE :**
${formatProfileForPrompt(targetProfile)}

**DIAGNOSTIC CRITIQUE :**
`;

    if (previousAnalysis?.zeroGpt && !previousAnalysis.zeroGpt.error) {
        instruction += `⚠️ **ALERTE ZEROGPT :** Le texte actuel est détecté comme **${previousAnalysis.zeroGpt.fakePercentage}% IA**. C'est inacceptable.\n`;
    }

    instruction += `
${deviations.length > 0 ? `Défauts stylistiques : ${deviations.join('; ')}.` : "Le texte manque de 'sel' humain."}

**ACTIONS DE RÉÉCRITURE OBLIGATOIRES :**
1.  **BRISER LES PATTERNS :** Si ZeroGPT a détecté de l'IA, c'est que la syntaxe est trop prévisible. Change l'ordre des mots. Utilise la voix passive ou des incises.
2.  **CASSER LA RYTHMIQUE :** Insère des phrases très courtes (ex: "C'est tout.") au milieu de paragraphes complexes.
3.  **VOCABULAIRE :** Remplace les mots génériques par des idiomes ou des mots rares.
4.  **CONSERVATION :** Garde le sens, change radicalement la forme.

Renvoie UNIQUEMENT le texte amélioré.
`;
    return instruction;
};

const buildSystemInstructionForAnalysis = (): string => {
    return `**RÔLE:** Tu es un moteur de détection de style adverse.
**TACHE:** Analyse le texte suivant et sois SÉVÈRE. Cherche les motifs répétitifs, le manque de profondeur, et la structure trop parfaite.

Renvoie un JSON strict respectant ce schéma :
{
  "detectionRisk": { "level": "Faible"|"Modéré"|"Élevé", "score": number (0-100, 100=Humain) },
  "perplexity": { "score": number, "analysis": string },
  "burstiness": { "score": number, "analysis": string },
  "flaggedSentences": string[] (Top 3 des phrases qui font "le moins naturel")
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

const callGeminiForGeneration = async (userPrompt: string, systemInstruction: string, model: ModelId): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    
    return retryWrapper(async () => {
        const response = await ai.models.generateContent({
          model,
          contents: { parts: [{ text: userPrompt }] },
          config: {
            systemInstruction,
            temperature: 1.0, // High temp for maximum human-like variance
            topP: 0.95,
            topK: 40,
          }
        });
        
        const text = response.text ? response.text.trim() : "";
        // Clean markdown code blocks if present
        if (text.startsWith('```')) {
            const lines = text.split('\n');
            if (lines[0].startsWith('```')) lines.shift();
            if (lines[lines.length - 1].startsWith('```')) lines.pop();
            return lines.join('\n').trim();
        }
        return text;
    });
};

const callGeminiForAnalysis = async (textToAnalyze: string, systemInstruction: string, model: ModelId): Promise<AnalysisResult> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
    const userPrompt = `ANALYSE CE TEXTE :\n${textToAnalyze}`;
    
    return retryWrapper(async () => {
        const response = await ai.models.generateContent({
            model,
            contents: { parts: [{ text: userPrompt }] },
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema: analysisSchema,
                temperature: 0.1, // Low temp for analytical precision
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
  topic: string,
  styles: StyleCategory[],
  distribution: StyleDistribution,
  model: ModelId,
  targetProfile: StylometricProfile, 
  agenticConfig: { enabled: boolean; targetScore: number; maxIterations: number },
  onStepUpdate?: (step: WorkflowStep) => void
): Promise<GenerationOutput> => {
    const logs: WorkflowStep[] = [];
    const addLog = (label: string, status: WorkflowStep['status'], details?: string) => {
        const step = { id: Date.now().toString(), label, status, details };
        logs.push(step);
        if (onStepUpdate) onStepUpdate(step);
    };

    // Step 1: Initial Generation
    addLog("Génération (Brouillon)", "running", "Rédaction avec contraintes stylométriques...");
    const generationSystemInstruction = buildSystemInstructionForGeneration(styles, distribution, targetProfile);
    const generationUserPrompt = `Sujet: "${topic}"`;
    
    let currentText = await callGeminiForGeneration(generationUserPrompt, generationSystemInstruction, model);
    addLog("Génération (Brouillon)", "success", "Texte initial généré.");

    // Step 2: Analysis (Internal + External)
    addLog("Analyse & Détection", "running", "Interrogation de ZeroGPT API + Analyse Stylométrique...");
    const analysisSystemInstruction = buildSystemInstructionForAnalysis();
    
    // Parallel execution for speed
    let [analysisResponse, zeroGptResponse] = await Promise.all([
        callGeminiForAnalysis(currentText, analysisSystemInstruction, model),
        detectAI(currentText)
    ]);
    
    let currentAnalysis = analysisResponse;
    if (zeroGptResponse && !zeroGptResponse.error) {
        currentAnalysis.zeroGpt = zeroGptResponse;
        const zeroGptHumanScore = 100 - zeroGptResponse.fakePercentage;
        // La "Vérité Terrain" ZeroGPT a un poids très fort (80%)
        currentAnalysis.detectionRisk.score = Math.round((currentAnalysis.detectionRisk.score * 0.2) + (zeroGptHumanScore * 0.8));
    }

    const generatedProfile = analyzeText(currentText);
    currentAnalysis.stylometricMatch = compareProfiles(generatedProfile, targetProfile);
    
    addLog("Analyse & Détection", "success", `Score Global : ${currentAnalysis.detectionRisk.score}% ${currentAnalysis.zeroGpt && !currentAnalysis.zeroGpt.error ? `(ZeroGPT: ${currentAnalysis.zeroGpt.fakePercentage}% Fake)` : ''}`);

    // Step 3: Agentic Loop (Observe-Execute)
    if (agenticConfig.enabled) {
        let iterations = 0;
        
        while (
            currentAnalysis.detectionRisk.score < agenticConfig.targetScore && 
            iterations < agenticConfig.maxIterations
        ) {
            iterations++;
            
            // Message de log spécifique si c'est ZeroGPT qui bloque
            const reason = currentAnalysis.zeroGpt && currentAnalysis.zeroGpt.fakePercentage > 20 
                ? `ZeroGPT a détecté ${currentAnalysis.zeroGpt.fakePercentage}% IA.`
                : `Score ${currentAnalysis.detectionRisk.score}% insuffisant.`;

            addLog(`Optimisation Agentique (${iterations}/${agenticConfig.maxIterations})`, "running", `${reason} Réécriture intelligente...`);
            
            const deviations = currentAnalysis.stylometricMatch?.deviations || [];
            
            // Refine avec connaissance du résultat ZeroGPT
            const refinementSystemInstruction = buildSystemInstructionForRefinement(targetProfile, deviations, currentAnalysis);
            const refinementUserPrompt = `AMÉLIORE CE TEXTE (ESSAI ${iterations}) pour tromper le détecteur :\n"${currentText}"`;
            
            const refinedText = await callGeminiForGeneration(refinementUserPrompt, refinementSystemInstruction, model);
            
            if (refinedText.length > currentText.length * 0.5) {
                currentText = refinedText;
            }
            
            // Re-Check ZeroGPT (Crucial dans la boucle pour voir si on s'améliore)
            // On temporise légèrement pour ne pas spammer l'API
            await sleep(1000); 
            
            const [newInternalAnalysis, newZeroGptResponse] = await Promise.all([
                 callGeminiForAnalysis(currentText, analysisSystemInstruction, model),
                 detectAI(currentText)
            ]);

            currentAnalysis = newInternalAnalysis;
            
            if (newZeroGptResponse && !newZeroGptResponse.error) {
                currentAnalysis.zeroGpt = newZeroGptResponse;
                const zScore = 100 - newZeroGptResponse.fakePercentage;
                currentAnalysis.detectionRisk.score = Math.round((currentAnalysis.detectionRisk.score * 0.2) + (zScore * 0.8));
            } else {
                 // Fallback si ZeroGPT rate dans la boucle
                 const oldZScore = zeroGptResponse ? (100 - zeroGptResponse.fakePercentage) : currentAnalysis.detectionRisk.score;
                 currentAnalysis.detectionRisk.score = Math.round((currentAnalysis.detectionRisk.score * 0.4) + (oldZScore * 0.6));
            }

            const newProfile = analyzeText(currentText);
            currentAnalysis.stylometricMatch = compareProfiles(newProfile, targetProfile);

            if (currentAnalysis.detectionRisk.score >= agenticConfig.targetScore) {
                 addLog(`Optimisation Agentique (${iterations})`, "success", `Cible atteinte ! Score : ${currentAnalysis.detectionRisk.score}%`);
            } else {
                 const status = iterations === agenticConfig.maxIterations ? "warning" : "pending";
                 addLog(`Optimisation Agentique (${iterations})`, status as any, `Nouveau score : ${currentAnalysis.detectionRisk.score}%`);
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
    model: ModelId,
    targetProfile: StylometricProfile
): Promise<GenerationOutput> => {
    const deviations = analysis.stylometricMatch?.deviations || [];

    const refinementSystemInstruction = buildSystemInstructionForRefinement(targetProfile, deviations, analysis);
    const refinementUserPrompt = `AMÉLIORE CE TEXTE :\n"${textToRefine}"\n\nConcentre-toi sur les phrases marquées : ${analysis.flaggedSentences.join(', ')}`;
    
    const refinedText = await callGeminiForGeneration(refinementUserPrompt, refinementSystemInstruction, model);
    
    const analysisSystemInstruction = buildSystemInstructionForAnalysis();
    
    const [newAnalysis, zeroGptResponse] = await Promise.all([
        callGeminiForAnalysis(refinedText, analysisSystemInstruction, model),
        detectAI(refinedText)
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
    model: ModelId
): Promise<GenerationOutput> => {
    const analysisSystemInstruction = buildSystemInstructionForAnalysis();
    
    const [analysis, zeroGptResponse] = await Promise.all([
        callGeminiForAnalysis(text, analysisSystemInstruction, model),
        detectAI(text)
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
