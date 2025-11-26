
import { ZeroGptResult } from '../types';

// Clé API fournie par l'utilisateur
const USER_API_KEY = "ba51f26b-7e8b-423e-bf2d-6c49e2210840";

// Note: En production réelle, utilisez un Proxy backend pour éviter d'exposer la clé.
// API Endpoint officiel de ZeroGPT
const API_URL = "https://api.zerogpt.com/api/detect/detectText";

export const detectAI = async (text: string): Promise<ZeroGptResult | null> => {
    // ZeroGPT a souvent une limite minimale de caractères
    if (!text || text.trim().length < 50) {
        return null;
    }

    try {
        console.log("🔍 Interrogation du Juge ZeroGPT...");
        
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'ApiKey': USER_API_KEY
            },
            body: JSON.stringify({
                input_text: text
            })
        });

        if (!response.ok) {
            // Gestion spécifique des erreurs courantes
            if (response.status === 401) throw new Error("Clé API ZeroGPT invalide ou expirée.");
            if (response.status === 403) throw new Error("Accès refusé (CORS ou IP bloquée).");
            throw new Error(`Erreur API ZeroGPT: ${response.statusText}`);
        }

        const data = await response.json();
        
        // Structure de réponse ZeroGPT (peut varier selon la version de l'API)
        // On cherche généralement "fakePercentage" ou "data.fakePercentage"
        const fakePercentage = typeof data.data?.fakePercentage === 'number' 
            ? data.data.fakePercentage 
            : (typeof data.fakePercentage === 'number' ? data.fakePercentage : 0);
            
        const isReal = fakePercentage < 20;

        console.log(`✅ Résultat ZeroGPT : ${fakePercentage}% Fake`);

        return {
            isReal: isReal,
            fakePercentage: fakePercentage,
            aiWords: data.data?.aiWords ?? 0,
            feedback: data.message || (isReal ? "Texte validé humain" : "Détection IA forte")
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
