
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import StyleLibrary from './components/StyleLibrary';
import ConfigurationPanel from './components/ConfigurationPanel';
import GenerationEngine from './components/GenerationEngine';
import DocumentationModal from './components/DocumentationModal';
import LoginScreen from './components/LoginScreen';
import SettingsModal from './components/SettingsModal';
import QuestionMarkCircleIcon from './components/icons/QuestionMarkCircleIcon';
import CogIcon from './components/icons/CogIcon';
import { INITIAL_STYLES, INITIAL_DISTRIBUTION, MAX_INPUT_CHARS } from './constants';
import { StyleCategory, StyleDistribution, AnalysisResult, WorkflowStep, AgenticConfig, StylometricProfile, AppSettings } from './types';
import { generateHumanizedText, refineHumanizedText, analyzeExistingText } from './services/aiService';
import { createCompositeProfile } from './services/stylometryService';
import { POPULAR_OPENROUTER_MODELS } from './services/openRouterService';
import { DEFAULT_GENERATION_PROMPT, DEFAULT_REFINEMENT_PROMPT, DEFAULT_ANALYSIS_PROMPT } from './defaultPrompts';
import { analyticsService } from './services/analyticsService';

interface UserSession {
  name: string;
  email: string;
  avatar?: string;
}

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const savedUser = localStorage.getItem('z12_user_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
      console.warn('Failed to load user session from localStorage:', e);
      return null;
    }
  });

  // Analytics - Session ID for tracking
  const [sessionId, setSessionId] = useState<string | null>(null);

  // Initialize state with lazy initializers
  const [styles, setStyles] = useState<StyleCategory[]>(() => {
    try {
        const saved = localStorage.getItem('z12_styles');
        return saved ? JSON.parse(saved) : INITIAL_STYLES;
    } catch (e) {
        console.warn('Failed to load styles from localStorage:', e);
        return INITIAL_STYLES;
    }
  });

  const [distribution, setDistribution] = useState<StyleDistribution>(() => {
    try {
        const saved = localStorage.getItem('z12_distribution');
        return saved ? JSON.parse(saved) : INITIAL_DISTRIBUTION;
    } catch (e) {
        console.warn('Failed to load distribution from localStorage:', e);
        return INITIAL_DISTRIBUTION;
    }
  });

  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isStyleLibraryOpen, setIsStyleLibraryOpen] = useState(true);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasBeenEdited, setHasBeenEdited] = useState<boolean>(false);

  // App Settings State
  const [appSettings, setAppSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem('z12_app_settings');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }

    // Default settings
    return {
      apiKeys: {
        openrouter: '',
        zerogpt: ''
      },
      modelAssignments: [
        {
          role: 'generator',
          model: POPULAR_OPENROUTER_MODELS[0], // Claude 3.5 Sonnet by default
          temperature: 1.0,
          enabled: true
        },
        {
          role: 'refiner',
          model: POPULAR_OPENROUTER_MODELS[0],
          temperature: 1.0,
          enabled: true
        },
        {
          role: 'analyzer',
          model: POPULAR_OPENROUTER_MODELS[2], // Claude Haiku (fast & cheap)
          temperature: 0.1,
          enabled: true
        }
      ],
      defaultPrompts: {
        generation: DEFAULT_GENERATION_PROMPT,
        refinement: DEFAULT_REFINEMENT_PROMPT,
        analysis: DEFAULT_ANALYSIS_PROMPT
      }
    };
  });
  
  // Agentic State
  const [agenticConfig, setAgenticConfig] = useState<AgenticConfig>({
      enabled: true, 
      targetScore: 90,
      maxIterations: 3
  });
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowStep[]>([]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('z12_styles', JSON.stringify(styles));
  }, [styles]);

  useEffect(() => {
    localStorage.setItem('z12_distribution', JSON.stringify(distribution));
  }, [distribution]);

  useEffect(() => {
    localStorage.setItem('z12_app_settings', JSON.stringify(appSettings));
  }, [appSettings]);

  // Analytics: Update activity every 2 minutes (heartbeat)
  useEffect(() => {
    if (!sessionId) return;

    const intervalId = setInterval(() => {
      analyticsService.updateActivity(sessionId);
    }, 2 * 60 * 1000); // Every 2 minutes

    // Cleanup on unmount
    return () => clearInterval(intervalId);
  }, [sessionId]);

  const handleLogin = async (userData: UserSession) => {
    setUser(userData);
    localStorage.setItem('z12_user_session', JSON.stringify(userData));

    // Track login in Firebase
    const userId = userData.email.replace(/[^a-zA-Z0-9]/g, '_');
    const newSessionId = await analyticsService.trackLogin(userId, userData.name, userData.email);
    if (newSessionId) {
      setSessionId(newSessionId);
    }
  };

  const handleLogout = async () => {
    // Track logout in Firebase
    if (sessionId) {
      await analyticsService.trackLogout(sessionId);
    }

    setUser(null);
    setSessionId(null);
    localStorage.removeItem('z12_user_session');
  };

  const activeProfile = useMemo<StylometricProfile>(() => {
    try {
      const allDocumentTexts = styles.flatMap(category => category.documents.map(doc => doc.content));
      return createCompositeProfile(allDocumentTexts.length > 0 ? allDocumentTexts : [""]);
    } catch (error) {
      console.error('❌ Erreur lors du calcul du profil stylométrique:', error);
      // Retourner un profil par défaut en cas d'erreur
      return {
        typeTokenRatio: 0,
        averageWordLength: 0,
        sentenceLengthMean: 0,
        sentenceLengthStdDev: 0,
        punctuationProfile: {},
        fleschReadingEase: 0
      };
    }
  }, [styles]);
  
  const handleInputTextChange = (text: string) => {
    setInputText(text);
    if (error) setError(null);
  };

  const handleOutputTextChange = (text: string) => {
    setOutputText(text);
    setHasBeenEdited(true);
  };

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim() || inputText.length > MAX_INPUT_CHARS) {
        if(inputText.length > MAX_INPUT_CHARS) {
            setError(`Le texte ne peut pas dépasser ${MAX_INPUT_CHARS} caractères.`);
        }
        return;
    }

    const hasDocs = styles.some(s => s.documents.length > 0);
    if (!hasDocs) {
        setError("Veuillez ajouter au moins un document à la bibliothèque pour définir un style.");
        return;
    }

    // Vérifier que la clé API OpenRouter est configurée
    if (!appSettings.apiKeys.openrouter) {
        setError("Veuillez configurer votre clé API OpenRouter dans les Paramètres.");
        setIsSettingsModalOpen(true);
        return;
    }

    setIsLoading(true);
    setOutputText('');
    setAnalysisResult(null);
    setError(null);
    setHasBeenEdited(false);
    setWorkflowLogs([]);

    try {
        const result = await generateHumanizedText(
            inputText,
            styles,
            distribution,
            activeProfile,
            agenticConfig,
            appSettings,
            (step) => setWorkflowLogs(prev => [...prev, step])
        );
        setOutputText(result.text);
        setAnalysisResult(result.analysis);

        // Track text generation activity
        if (user && sessionId) {
          const userId = user.email.replace(/[^a-zA-Z0-9]/g, '_');
          await analyticsService.trackActivity(userId, sessionId, 'text_generation', {
            inputLength: inputText.length,
            outputLength: result.text.length,
            detectionScore: result.analysis.detectionRisk.score
          });
        }
    } catch (e) {
        console.error(e);
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue.");
        }
    } finally {
        setIsLoading(false);
    }
  }, [inputText, styles, distribution, agenticConfig, activeProfile, appSettings, user, sessionId]);

  const handleRefine = useCallback(async () => {
    if (!outputText || !analysisResult) return;

    setIsRefining(true);
    setError(null);
    setHasBeenEdited(false);
    setWorkflowLogs(prev => [...prev, { id: Date.now().toString(), label: "Raffinement manuel", status: "running", details: "Amélioration ciblée demandée..."}]);

    try {
        const result = await refineHumanizedText(outputText, analysisResult, styles, distribution, activeProfile, appSettings);
        setOutputText(result.text);
        setAnalysisResult(result.analysis);
        setWorkflowLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'success', details: 'Terminé.' } : l));

        // Track text refinement activity
        if (user && sessionId) {
          const userId = user.email.replace(/[^a-zA-Z0-9]/g, '_');
          await analyticsService.trackActivity(userId, sessionId, 'text_refinement', {
            textLength: result.text.length,
            detectionScore: result.analysis.detectionRisk.score
          });
        }
    } catch (e) {
         if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de l'amélioration.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, analysisResult, styles, distribution, activeProfile, appSettings, user, sessionId]);

  const handleReanalyze = useCallback(async () => {
    if (!outputText) return;
    setIsRefining(true);
    setError(null);
    setWorkflowLogs(prev => [...prev, { id: Date.now().toString(), label: "Ré-analyse", status: "running", details: "Analyse des modifications..."}]);

    try {
        const result = await analyzeExistingText(outputText, activeProfile, appSettings);
        setOutputText(result.text);
        setAnalysisResult(result.analysis);
        setHasBeenEdited(false);
         setWorkflowLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'success', details: `Nouveau score : ${result.analysis.detectionRisk.score}%` } : l));

        // Track text analysis activity
        if (user && sessionId) {
          const userId = user.email.replace(/[^a-zA-Z0-9]/g, '_');
          await analyticsService.trackActivity(userId, sessionId, 'text_analysis', {
            textLength: outputText.length,
            detectionScore: result.analysis.detectionRisk.score
          });
        }
    } catch(e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de la ré-analyse.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, activeProfile, appSettings, user, sessionId]);


  const gridTemplateColumns = useMemo(() => {
    const leftCol = isStyleLibraryOpen ? 'minmax(320px, 1fr)' : '56px';
    const rightCol = isConfigPanelOpen ? 'minmax(320px, 1fr)' : '56px';
    const midCol = 'minmax(480px, 2.5fr)';
    return `${leftCol} ${midCol} ${rightCol}`;
  }, [isStyleLibraryOpen, isConfigPanelOpen]);

  // Render Login Screen if not authenticated
  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 relative">
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} />
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={appSettings}
        onSave={setAppSettings}
      />

      {/* User Profile / Logout - Top Left */}
      <div className="fixed top-4 left-4 z-40 flex items-center gap-3 bg-card/80 backdrop-blur-md p-2 rounded-full border border-border shadow-sm group">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30 text-primary font-bold text-xs">
           {user.name.charAt(0)}
        </div>
        <div className="flex flex-col max-w-0 group-hover:max-w-[150px] transition-all duration-300 overflow-hidden whitespace-nowrap">
            <span className="text-xs font-bold text-foreground">{user.name}</span>
            <button onClick={handleLogout} className="text-[10px] text-muted-foreground hover:text-destructive text-left">Se déconnecter</button>
        </div>
      </div>

      {/* Top Right Buttons */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 flex gap-2">
        <button
          onClick={() => setIsSettingsModalOpen(true)}
          className="p-2 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg hover:bg-card hover:text-secondary transition-all duration-300 group"
          title="Paramètres"
        >
          <CogIcon className="w-6 h-6 text-muted-foreground group-hover:text-secondary" />
        </button>
        <button
          onClick={() => setIsDocModalOpen(true)}
          className="p-2 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg hover:bg-card hover:text-primary transition-all duration-300 group"
          title="Documentation"
        >
          <QuestionMarkCircleIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
        </button>
      </div>

      <header className="text-center mb-8 flex-shrink-0">
        <div className="flex justify-center items-center mb-2">
            <div className="px-2 py-0.5 rounded border border-primary/30 bg-primary/10 text-[10px] text-primary tracking-widest uppercase font-bold mr-3">
                Production Ready
            </div>
            <div className="px-2 py-0.5 rounded border border-accent/30 bg-accent/10 text-[10px] text-accent tracking-widest uppercase font-bold">
                Agentic Core v2
            </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Humanizer Z12
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Solution agentique autonome pour transformer vos textes IA en contenu humain naturel et authentique.
        </p>
      </header>

      <main 
        className="flex-grow grid gap-8 items-start mb-12"
        style={{ 
          gridTemplateColumns,
          transition: 'grid-template-columns 300ms ease-in-out'
        }}
      >
        <StyleLibrary 
          styles={styles} 
          setStyles={setStyles} 
          isOpen={isStyleLibraryOpen}
          onToggle={() => setIsStyleLibraryOpen(prev => !prev)}
        />
        <GenerationEngine
          inputText={inputText}
          setInputText={handleInputTextChange}
          outputText={outputText}
          setOutputText={handleOutputTextChange}
          isLoading={isLoading}
          isRefining={isRefining}
          handleGenerate={handleGenerate}
          handleRefine={handleRefine}
          handleReanalyze={handleReanalyze}
          analysisResult={analysisResult}
          error={error}
          hasBeenEdited={hasBeenEdited}
          agenticConfig={agenticConfig}
          setAgenticConfig={setAgenticConfig}
          workflowLogs={workflowLogs}
          appSettings={appSettings}
        />
        <ConfigurationPanel
          distribution={distribution}
          setDistribution={setDistribution}
          styles={styles}
          isOpen={isConfigPanelOpen}
          onToggle={() => setIsConfigPanelOpen(prev => !prev)}
        />
      </main>

      <footer className="mt-auto py-6 border-t border-border/50 text-center">
        <div className="max-w-4xl mx-auto px-4">
            <p className="text-xs text-muted-foreground mb-2">
                <strong className="text-foreground/80">Usage Responsable :</strong> Humanizer Z12 est un outil d'aide à la rédaction conçu pour améliorer la fluidité et la qualité stylistique des textes. 
                L'utilisateur est seul responsable de l'utilisation du contenu généré. Nous condamnons l'utilisation de cet outil pour la fraude académique, 
                la désinformation ou toute activité violant les droits d'auteur ou les politiques d'intégrité.
            </p>
            <p className="text-[10px] text-muted-foreground/60">
                propulsé par Zakibelm • Analyse Stylométrique Locale (Intl.Segmenter) • Session Utilisateur Active
            </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
