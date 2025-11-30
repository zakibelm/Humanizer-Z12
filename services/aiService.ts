import { StyleCategory, StyleDistribution, AnalysisResult, StylometricProfile, WorkflowStep, AgenticConfig, AppSettings, AIModel, ModelAssignment } from '../types';
import { analyzeText, compareProfiles } from './stylometryService';
import { detectAI } from './zeroGptService';
import { generateWithOpenRouter, analyzeWithOpenRouter } from './openRouterService';
import { generateUniqueId } from '../utils/idGenerator';
import { promiseWithTimeout } from '../utils/fetchWithTimeout';

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

// --- Prompt Formatters ---

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

const buildPromptFromTemplate = (
    template: string,
    profile: StylometricProfile,
    styles: StyleCategory[],
    distribution: StyleDistribution,
    analysisFeedback?: string
): string => {
    // Replace placeholders
    let prompt = template.replace('{STYLOMETRIC_PROFILE}', formatProfileForPrompt(profile));

    // Build style context - OPTIMISATION: Limiter la taille totale du contexte
    const MAX_CONTEXT_LENGTH = 10000; // Limite en caractères
    const MAX_DOCS_PER_CATEGORY = 3; // Max documents par catégorie

    let totalLength = 0;
    const styleContext = styles
        .filter(s => distribution[s.id] > 0)
        .map(category => {
            if (category.documents.length > 0 && totalLength < MAX_CONTEXT_LENGTH) {
                // Prendre seulement les premiers documents
                const selectedDocs = category.documents.slice(0, MAX_DOCS_PER_CATEGORY);
                const contextSample = selectedDocs
                    .map(d => {
                        const availableLength = MAX_CONTEXT_LENGTH - totalLength;
                        const excerpt = d.content.slice(0, Math.min(1500, availableLength));
                        totalLength += excerpt.length;
                        return excerpt;
                    })
                    .join('\n...\n');

                if (contextSample.length === 0) return '';

                return `---
**SOURCE : ${category.name} (Poids : ${distribution[category.id]}%)**
${contextSample}
---`;
            }
            return '';
        })
        .filter(Boolean)
        .join('\n');

    prompt = prompt.replace('{STYLE_CONTEXT}', styleContext);

    if (analysisFeedback) {
        prompt = prompt.replace('{ANALYSIS_FEEDBACK}', analysisFeedback);
    }

    return prompt;
};

// --- Universal AI Call Wrapper ---

interface AICallOptions {
    model: AIModel;
    systemPrompt: string;
    userPrompt: string;
    temperature?: number;
    apiKeys: AppSettings['apiKeys'];
    expectJSON?: boolean;
}

const callAI = async (options: AICallOptions): Promise<{ text: string; usage?: any }> => {
    const { model, systemPrompt, userPrompt, temperature = 1.0, apiKeys, expectJSON = false } = options;

    if (model.provider === 'openrouter') {
        if (!apiKeys.openrouter) {
            throw new Error("Clé API OpenRouter manquante. Configurez-la dans les Paramètres.");
        }

        if (expectJSON) {
            const result = await analyzeWithOpenRouter(
                apiKeys.openrouter,
                model.id,
                systemPrompt,
                userPrompt,
                temperature
            );
            return { text: JSON.stringify(result) };
        } else {
            return await generateWithOpenRouter(
                apiKeys.openrouter,
                model.id,
                systemPrompt,
                userPrompt,
                temperature
            );
        }
    } else {
        throw new Error(`Provider non supporté : ${model.provider}`);
    }
};

// --- Main Generation Logic ---

export const generateHumanizedText = async (
    topic: string,
    styles: StyleCategory[],
    distribution: StyleDistribution,
    targetProfile: StylometricProfile,
    agenticConfig: AgenticConfig,
    settings: AppSettings,
    onStepUpdate?: (step: WorkflowStep) => void
): Promise<GenerationOutput> => {
    const logs: WorkflowStep[] = [];
    const addLog = (label: string, status: WorkflowStep['status'], details?: string, modelUsed?: string) => {
        const step: any = { id: generateUniqueId(), label, status, details };
        if (modelUsed) step.modelUsed = modelUsed;
        logs.push(step);
        if (onStepUpdate) onStepUpdate(step);
    };

    // Get model assignments avec validation stricte
    const generatorAssignment = settings.modelAssignments.find(a => a.role === 'generator' && a.enabled);
    const refinerAssignment = settings.modelAssignments.find(a => a.role === 'refiner' && a.enabled);
    const analyzerAssignment = settings.modelAssignments.find(a => a.role === 'analyzer' && a.enabled);

    // ROBUSTESSE: Validation stricte des assignments
    if (!generatorAssignment || !generatorAssignment.model || !generatorAssignment.model.id) {
        throw new Error("Aucun modèle assigné au rôle Générateur. Configurez les modèles dans les Paramètres.");
    }
    if (agenticConfig.enabled && refinerAssignment && (!refinerAssignment.model || !refinerAssignment.model.id)) {
        throw new Error("Le modèle assigné au Raffineur est invalide. Vérifiez la configuration.");
    }
    if (analyzerAssignment && (!analyzerAssignment.model || !analyzerAssignment.model.id)) {
        throw new Error("Le modèle assigné à l'Analyseur est invalide. Vérifiez la configuration.");
    }

    // Step 1: Initial Generation
    addLog("Génération (Brouillon)", "running", "Rédaction avec contraintes stylométriques...", generatorAssignment.model.name);

    const generationSystemPrompt = buildPromptFromTemplate(
        settings.defaultPrompts.generation,
        targetProfile,
        styles,
        distribution
    );

    const generationUserPrompt = `Sujet: "${topic}"`;

    const generationResult = await callAI({
        model: generatorAssignment.model,
        systemPrompt: generationSystemPrompt,
        userPrompt: generationUserPrompt,
        temperature: generatorAssignment.temperature ?? 1.0,
        apiKeys: settings.apiKeys
    });

    let currentText = generationResult.text;
    addLog("Génération (Brouillon)", "success", "Texte initial généré.", generatorAssignment.model.name);

    // Step 2: Analysis (Internal + External)
    const analyzerModel = analyzerAssignment?.model || generatorAssignment.model;
    addLog("Analyse & Détection", "running", "Interrogation de ZeroGPT API + Analyse Stylométrique...", analyzerModel.name);

    const analysisSystemPrompt = settings.defaultPrompts.analysis;

    // ROBUSTESSE: Parallel execution avec Promise.allSettled pour ne pas perdre les résultats partiels
    const results = await promiseWithTimeout(
        Promise.allSettled([
            analyzerAssignment && analyzerAssignment.enabled
                ? callAI({
                    model: analyzerAssignment.model,
                    systemPrompt: analysisSystemPrompt,
                    userPrompt: currentText,
                    temperature: analyzerAssignment.temperature ?? 0.1,
                    apiKeys: settings.apiKeys,
                    expectJSON: true
                }).then(r => JSON.parse(r.text))
                : Promise.resolve({
                    detectionRisk: { level: 'Modéré', score: 70 },
                    perplexity: { score: 70, analysis: 'Analyse désactivée' },
                    burstiness: { score: 70, analysis: 'Analyse désactivée' },
                    flaggedSentences: []
                }),
            settings.apiKeys.zerogpt ? detectAI(currentText, settings.apiKeys.zerogpt) : Promise.resolve(null)
        ]),
        90000, // 90s timeout pour l'analyse parallèle
        "L'analyse a pris trop de temps. Veuillez réessayer."
    );

    // Extraire les résultats avec fallback
    const analysisResponse = results[0].status === 'fulfilled' ? results[0].value : {
        detectionRisk: { level: 'Modéré' as const, score: 70 },
        perplexity: { score: 70, analysis: 'Erreur d\'analyse' },
        burstiness: { score: 70, analysis: 'Erreur d\'analyse' },
        flaggedSentences: []
    };
    const zeroGptResponse = results[1].status === 'fulfilled' ? results[1].value : null;

    let currentAnalysis = analysisResponse as AnalysisResult;
    if (zeroGptResponse && !zeroGptResponse.error) {
        currentAnalysis.zeroGpt = zeroGptResponse;
        const zeroGptHumanScore = 100 - zeroGptResponse.fakePercentage;
        // La "Vérité Terrain" ZeroGPT a un poids très fort (80%)
        currentAnalysis.detectionRisk.score = Math.round((currentAnalysis.detectionRisk.score * 0.2) + (zeroGptHumanScore * 0.8));
    }

    const generatedProfile = analyzeText(currentText);
    currentAnalysis.stylometricMatch = compareProfiles(generatedProfile, targetProfile);

    addLog("Analyse & Détection", "success", `Score Global : ${currentAnalysis.detectionRisk.score}% ${currentAnalysis.zeroGpt && !currentAnalysis.zeroGpt.error ? `(ZeroGPT: ${currentAnalysis.zeroGpt.fakePercentage}% Fake)` : ''}`, analyzerModel.name);

    // Step 3: Agentic Loop (Observe-Execute)
    if (agenticConfig.enabled && refinerAssignment && refinerAssignment.enabled) {
        let iterations = 0;

        while (
            currentAnalysis.detectionRisk.score < agenticConfig.targetScore &&
            iterations < agenticConfig.maxIterations
        ) {
            iterations++;

            const reason = currentAnalysis.zeroGpt && currentAnalysis.zeroGpt.fakePercentage > 20
                ? `ZeroGPT a détecté ${currentAnalysis.zeroGpt.fakePercentage}% IA.`
                : `Score ${currentAnalysis.detectionRisk.score}% insuffisant.`;

            addLog(`Optimisation Agentique (${iterations}/${agenticConfig.maxIterations})`, "running", `${reason} Réécriture intelligente...`, refinerAssignment.model.name);

            const deviations = currentAnalysis.stylometricMatch?.deviations || [];
            const analysisFeedback = `
${currentAnalysis.zeroGpt && !currentAnalysis.zeroGpt.error ? `⚠️ **ALERTE ZEROGPT :** Le texte actuel est détecté comme **${currentAnalysis.zeroGpt.fakePercentage}% IA**. C'est inacceptable.\n` : ''}
${deviations.length > 0 ? `Défauts stylistiques : ${deviations.join('; ')}.` : "Le texte manque de 'sel' humain."}
            `.trim();

            const refinementSystemPrompt = buildPromptFromTemplate(
                settings.defaultPrompts.refinement,
                targetProfile,
                styles,
                distribution,
                analysisFeedback
            );

            const refinementUserPrompt = `AMÉLIORE CE TEXTE (ESSAI ${iterations}) pour tromper le détecteur :\n"${currentText}"`;

            const refinedResult = await callAI({
                model: refinerAssignment.model,
                systemPrompt: refinementSystemPrompt,
                userPrompt: refinementUserPrompt,
                temperature: refinerAssignment.temperature ?? 1.0,
                apiKeys: settings.apiKeys
            });

            const refinedText = refinedResult.text;

            if (refinedText.length > currentText.length * 0.5) {
                currentText = refinedText;
            }

            // Re-Check ZeroGPT - OPTIMISATION: Sleep réduit de 1000ms à 500ms
            await sleep(500);

            const reAnalysisResults = await promiseWithTimeout(
                Promise.allSettled([
                    analyzerAssignment && analyzerAssignment.enabled
                        ? callAI({
                            model: analyzerAssignment.model,
                            systemPrompt: analysisSystemPrompt,
                            userPrompt: currentText,
                            temperature: analyzerAssignment.temperature ?? 0.1,
                            apiKeys: settings.apiKeys,
                            expectJSON: true
                        }).then(r => JSON.parse(r.text))
                        : Promise.resolve(currentAnalysis),
                    settings.apiKeys.zerogpt ? detectAI(currentText, settings.apiKeys.zerogpt) : Promise.resolve(null)
                ]),
                90000, // 90s timeout
                "La ré-analyse a pris trop de temps."
            );

            const newInternalAnalysis = reAnalysisResults[0].status === 'fulfilled' ? reAnalysisResults[0].value : currentAnalysis;
            const newZeroGptResponse = reAnalysisResults[1].status === 'fulfilled' ? reAnalysisResults[1].value : null;

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
                addLog(`Optimisation Agentique (${iterations})`, "success", `Cible atteinte ! Score : ${currentAnalysis.detectionRisk.score}%`, refinerAssignment.model.name);
            } else {
                const status = iterations === agenticConfig.maxIterations ? "warning" : "pending";
                addLog(`Optimisation Agentique (${iterations})`, status as any, `Nouveau score : ${currentAnalysis.detectionRisk.score}%`, refinerAssignment.model.name);
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
    distribution: StyleDistribution,
    targetProfile: StylometricProfile,
    settings: AppSettings
): Promise<GenerationOutput> => {
    const refinerAssignment = settings.modelAssignments.find(a => a.role === 'refiner' && a.enabled);
    const analyzerAssignment = settings.modelAssignments.find(a => a.role === 'analyzer' && a.enabled);

    if (!refinerAssignment) {
        throw new Error("Aucun modèle assigné au rôle Raffineur.");
    }

    const deviations = analysis.stylometricMatch?.deviations || [];
    const analysisFeedback = `
${analysis.zeroGpt && !analysis.zeroGpt.error ? `⚠️ **ALERTE ZEROGPT :** ${analysis.zeroGpt.fakePercentage}% IA détecté.\n` : ''}
Phrases problématiques : ${analysis.flaggedSentences.join(', ')}
${deviations.join('; ')}
    `.trim();

    const refinementSystemPrompt = buildPromptFromTemplate(
        settings.defaultPrompts.refinement,
        targetProfile,
        styles,
        distribution,
        analysisFeedback
    );

    const refinementUserPrompt = `AMÉLIORE CE TEXTE :\n"${textToRefine}"`;

    const refinedResult = await callAI({
        model: refinerAssignment.model,
        systemPrompt: refinementSystemPrompt,
        userPrompt: refinementUserPrompt,
        temperature: refinerAssignment.temperature ?? 1.0,
        apiKeys: settings.apiKeys
    });

    const refinedText = refinedResult.text;

    const analysisSystemPrompt = settings.defaultPrompts.analysis;

    const refineResults = await promiseWithTimeout(
        Promise.allSettled([
            analyzerAssignment && analyzerAssignment.enabled
                ? callAI({
                    model: analyzerAssignment.model,
                    systemPrompt: analysisSystemPrompt,
                    userPrompt: refinedText,
                    temperature: analyzerAssignment.temperature ?? 0.1,
                    apiKeys: settings.apiKeys,
                    expectJSON: true
                }).then(r => JSON.parse(r.text))
                : Promise.resolve(analysis),
            settings.apiKeys.zerogpt ? detectAI(refinedText, settings.apiKeys.zerogpt) : Promise.resolve(null)
        ]),
        90000,
        "L'analyse du texte raffiné a pris trop de temps."
    );

    const newAnalysis = refineResults[0].status === 'fulfilled' ? refineResults[0].value : analysis;
    const zeroGptResponse = refineResults[1].status === 'fulfilled' ? refineResults[1].value : null;

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
    settings: AppSettings
): Promise<GenerationOutput> => {
    const analyzerAssignment = settings.modelAssignments.find(a => a.role === 'analyzer' && a.enabled);

    if (!analyzerAssignment) {
        throw new Error("Aucun modèle assigné au rôle Analyseur.");
    }

    const analysisSystemPrompt = settings.defaultPrompts.analysis;

    const existingTextResults = await promiseWithTimeout(
        Promise.allSettled([
            callAI({
                model: analyzerAssignment.model,
                systemPrompt: analysisSystemPrompt,
                userPrompt: text,
                temperature: analyzerAssignment.temperature ?? 0.1,
                apiKeys: settings.apiKeys,
                expectJSON: true
            }).then(r => JSON.parse(r.text)),
            settings.apiKeys.zerogpt ? detectAI(text, settings.apiKeys.zerogpt) : Promise.resolve(null)
        ]),
        90000,
        "L'analyse du texte a pris trop de temps."
    );

    const analysis = existingTextResults[0].status === 'fulfilled' ? existingTextResults[0].value : {
        detectionRisk: { level: 'Modéré' as const, score: 70 },
        perplexity: { score: 70, analysis: 'Erreur d\'analyse' },
        burstiness: { score: 70, analysis: 'Erreur d\'analyse' },
        flaggedSentences: []
    };
    const zeroGptResponse = existingTextResults[1].status === 'fulfilled' ? existingTextResults[1].value : null;

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
