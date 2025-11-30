
import { ZeroGptResult } from '../types';
import { fetchWithTimeout } from '../utils/fetchWithTimeout';

// API Endpoint officiel de ZeroGPT
const API_URL = "https://api.zerogpt.com/api/detect/detectText";

export const detectAI = async (text: string, apiKey?: string): Promise<ZeroGptResult | null> => {
    // ROBUSTESSE: Validation stricte des paramètres
    if (!text || typeof text !== 'string') {
        return null;
    }

    const trimmedText = text.trim();

    // ZeroGPT a une limite minimale ET maximale
    if (trimmedText.length < 50) {
        return null;
    }

    // Limite max ZeroGPT: ~15,000 caractères
    if (trimmedText.length > 15000) {
        console.warn("⚠️ ZeroGPT: Texte tronqué à 15K caractères");
    }

    // Si pas de clé API, on retourne null (mode dégradé)
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim() === '') {
        console.warn("⚠️ ZeroGPT désactivé : Clé API manquante");
        return null;
    }

    try {
        console.log("🔍 Interrogation du Juge ZeroGPT...");

        // Ajout timeout de 30s pour éviter les requêtes bloquées
        const response = await fetchWithTimeout(
            API_URL,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'ApiKey': apiKey
                },
                body: JSON.stringify({
                    input_text: trimmedText.substring(0, 15000)
                })
            },
            30000 // 30s timeout
        );

        if (!response.ok) {
            // Gestion spécifique des erreurs courantes
            if (response.status === 401) throw new Error("Clé API ZeroGPT invalide ou expirée.");
            if (response.status === 403) throw new Error("Accès refusé (CORS ou IP bloquée).");
            throw new Error(`Erreur API ZeroGPT: ${response.statusText}`);
        }

        // FIX CRITIQUE: Parsing JSON sécurisé avec try/catch
        let data: any;
        try {
            data = await response.json();
        } catch (parseError) {
            throw new Error("Réponse ZeroGPT invalide (pas du JSON)");
        }

        // Validation stricte du format de réponse
        if (!data || typeof data !== 'object') {
            throw new Error("Format de réponse ZeroGPT invalide");
        }

        // Structure de réponse ZeroGPT (peut varier selon la version de l'API)
        const fakePercentage = typeof data.data?.fakePercentage === 'number'
            ? Math.max(0, Math.min(100, data.data.fakePercentage))
            : (typeof data.fakePercentage === 'number'
                ? Math.max(0, Math.min(100, data.fakePercentage))
                : null);

        // Si pas de fakePercentage valide, on considère que c'est une erreur
        if (fakePercentage === null) {
            throw new Error("Pas de fakePercentage dans la réponse ZeroGPT");
        }

        const isReal = fakePercentage < 20;

        console.log(`✅ Résultat ZeroGPT : ${fakePercentage}% Fake`);

        return {
            isReal: isReal,
            fakePercentage: fakePercentage,
            aiWords: typeof data.data?.aiWords === 'number' ? data.data.aiWords : 0,
            feedback: typeof data.message === 'string' ? data.message : (isReal ? "Texte validé humain" : "Détection IA forte")
        };

    } catch (error) {
        console.warn("⚠️ Bypass ZeroGPT (Mode Offline/CORS):", error);
        // En cas d'erreur (souvent CORS en local), on retourne une erreur structurée
        // pour ne pas bloquer l'application, mais on signale que la vérification externe a échoué.
        return {
            isReal: false,
            fakePercentage: 0,
            error: error instanceof Error ? error.message : "Erreur de connexion API (CORS)"
        };
    }
};
