import React, { useState, useCallback, useMemo, useEffect } from 'react';
import StyleLibrary from './components/StyleLibrary';
import ConfigurationPanel from './components/ConfigurationPanel';
import GenerationEngine from './components/GenerationEngine';
import DocumentationModal from './components/DocumentationModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import QuestionMarkCircleIcon from './components/icons/QuestionMarkCircleIcon';
import AdjustmentsIcon from './components/icons/AdjustmentsIcon';
import { INITIAL_STYLES, INITIAL_DISTRIBUTION, MAX_INPUT_CHARS } from './constants';
import { StyleCategory, StyleDistribution, AnalysisResult, ModelId, WorkflowStep, AgenticConfig, StylometricProfile, GlobalSettings } from './types';
import { generateHumanizedText, refineHumanizedText, analyzeExistingText } from './services/geminiService';
import { createCompositeProfile } from './services/stylometryService';

interface UserSession {
  name: string;
  email: string;
  avatar?: string;
}

const DEFAULT_SYSTEM_PROMPT = `**RÔLE:** Tu es Humanizer Z12, un écrivain fantôme expert. Ta tâche est de rédiger un texte au style parfaitement humain et naturel qui doit PASSER LES DÉTECTEURS D'IA.

**MÉTHODE DE RÉDACTION "HUMAN TOUCH" :**
1. **Imperfections :** Introduis 1-2 connecteurs logiques un peu flous ou familiers (ex: "Bon,", "En fait,", "Du coup,").
2. **Opinion :** Prends position légèrement. L'IA est neutre, l'humain est subjectif.
3. **Structure :** Évite les structures "Intro - 3 Paragraphes - Conclusion". Sois plus organique.`;

const App: React.FC = () => {
  // Auth State
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const savedUser = localStorage.getItem('z12_user_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch { return null; }
  });

  // Global Settings State (API Keys, etc.)
  const [settings, setSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem('z12_settings');
      return saved ? JSON.parse(saved) : {
        googleApiKey: process.env.API_KEY || '',
        zeroGptApiKey: 'ba51f26b-7e8b-423e-bf2d-6c49e2210840',
        selectedModel: 'gemini-3-pro-preview' as ModelId,
        systemPromptOverride: DEFAULT_SYSTEM_PROMPT
      };
    } catch {
      return {
        googleApiKey: '',
        zeroGptApiKey: '',
        selectedModel: 'gemini-3-pro-preview' as ModelId,
        systemPromptOverride: DEFAULT_SYSTEM_PROMPT
      };
    }
  });

  const [styles, setStyles] = useState<StyleCategory[]>(() => {
    try {
        const saved = localStorage.getItem('z12_styles');
        return saved ? JSON.parse(saved) : INITIAL_STYLES;
    } catch { return INITIAL_STYLES; }
  });
  
  const [distribution, setDistribution] = useState<StyleDistribution>(() => {
    try {
        const saved = localStorage.getItem('z12_distribution');
        return saved ? JSON.parse(saved) : INITIAL_DISTRIBUTION;
    } catch { return INITIAL_DISTRIBUTION; }
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
  
  // Agentic State
  const [agenticConfig, setAgenticConfig] = useState<AgenticConfig>({
      enabled: true, 
      targetScore: 92,
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
    localStorage.setItem('z12_settings', JSON.stringify(settings));
  }, [settings]);

  const handleLogin = (userData: UserSession) => {
    setUser(userData);
    localStorage.setItem('z12_user_session', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('z12_user_session');
  };

  const activeProfile = useMemo<StylometricProfile>(() => {
    const allDocumentTexts = styles.flatMap(category => category.documents.map(doc => doc.content));
    return createCompositeProfile(allDocumentTexts.length > 0 ? allDocumentTexts : [""]);
  }, [styles]);
  
  const handleInputTextChange = (text: string) => {
    setInputText(text);
    if (error) setError(null);
  };

  const handleOutputTextChange = (text: string) => {
    setOutputText(text);
    setHasBeenEdited(true);
  };

  const handleModelChange = (model: ModelId) => {
      setSettings(prev => ({ ...prev, selectedModel: model }));
  };

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim() || inputText.length > MAX_INPUT_CHARS) {
        if(inputText.length > MAX_INPUT_CHARS) {
            setError(`Le texte ne peut pas dépasser ${MAX_INPUT_CHARS} caractères.`);
        }
        return;
    }

    if (!settings.googleApiKey) {
        setError("Clé API Google manquante. Veuillez la configurer dans les paramètres.");
        setIsSettingsModalOpen(true);
        return;
    }

    const hasDocs = styles.some(s => s.documents.length > 0);
    if (!hasDocs) {
        setError("Veuillez ajouter au moins un document à la bibliothèque pour définir un style.");
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
            {
                googleApiKey: settings.googleApiKey,
                zeroGptApiKey: settings.zeroGptApiKey,
                model: settings.selectedModel,
                systemPrompt: settings.systemPromptOverride || DEFAULT_SYSTEM_PROMPT
            },
            (step) => setWorkflowLogs(prev => [...prev, step])
        );
        setOutputText(result.text);
        setAnalysisResult(result.analysis);
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
  }, [inputText, styles, distribution, settings, agenticConfig, activeProfile]);

  const handleRefine = useCallback(async () => {
    if (!outputText || !analysisResult) return;
    if (!settings.googleApiKey) {
        setError("Clé API Google manquante.");
        return;
    }

    setIsRefining(true);
    setError(null);
    setHasBeenEdited(false);
    setWorkflowLogs(prev => [...prev, { id: Date.now().toString(), label: "Raffinement agentique", status: "running", details: "Ajustement précis des segments artificiels..."}]);
    
    try {
        const result = await refineHumanizedText(
            outputText, 
            analysisResult, 
            styles, 
            activeProfile,
            {
                googleApiKey: settings.googleApiKey,
                zeroGptApiKey: settings.zeroGptApiKey,
                model: settings.selectedModel
            }
        );
        setOutputText(result.text);
        setAnalysisResult(result.analysis);
        setWorkflowLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'success', details: 'Raffinement terminé avec succès.' } : l));
    } catch (e) {
         if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de l'amélioration.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, analysisResult, styles, settings, activeProfile]);

  const handleReanalyze = useCallback(async () => {
    if (!outputText) return;
    if (!settings.googleApiKey) {
        setError("Clé API Google manquante.");
        return;
    }

    setIsRefining(true);
    setError(null);
    setWorkflowLogs(prev => [...prev, { id: Date.now().toString(), label: "Audit de réécriture", status: "running", details: "Validation stylométrique des modifications manuelles..."}]);

    try {
        const result = await analyzeExistingText(
            outputText, 
            activeProfile,
            {
                googleApiKey: settings.googleApiKey,
                zeroGptApiKey: settings.zeroGptApiKey,
                model: settings.selectedModel
            }
        );
        setOutputText(result.text); 
        setAnalysisResult(result.analysis);
        setHasBeenEdited(false);
         setWorkflowLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'success', details: `Nouveau score d'authenticité : ${result.analysis.detectionRisk.score}%` } : l));
    } catch(e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de la ré-analyse.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, activeProfile, settings]);


  const gridTemplateColumns = useMemo(() => {
    const leftCol = isStyleLibraryOpen ? 'minmax(300px, 1fr)' : '48px';
    const rightCol = isConfigPanelOpen ? 'minmax(300px, 1fr)' : '48px';
    const midCol = 'minmax(600px, 3fr)';
    return `${leftCol} ${midCol} ${rightCol}`;
  }, [isStyleLibraryOpen, isConfigPanelOpen]);

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8 relative selection:bg-primary/30 selection:text-white">
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        settings={settings}
        onSave={setSettings}
      />
      
      <div className="fixed top-4 left-4 z-40 flex items-center gap-3 bg-card/80 backdrop-blur-md p-2 rounded-full border border-border shadow-sm group hover:border-primary/50 transition-all">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border border-primary/30 text-primary font-bold text-xs">
           {user.name.charAt(0)}
        </div>
        <div className="flex flex-col max-w-0 group-hover:max-w-[150px] transition-all duration-300 overflow-hidden whitespace-nowrap">
            <span className="text-xs font-bold text-foreground">{user.name}</span>
            <button onClick={handleLogout} className="text-[10px] text-muted-foreground hover:text-destructive text-left">Se déconnecter</button>
        </div>
      </div>

      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-40 flex gap-3">
        <button 
            onClick={() => setIsSettingsModalOpen(true)}
            className="p-2 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg hover:bg-card hover:text-primary transition-all duration-300 group"
            title="Paramètres"
        >
            <AdjustmentsIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
        </button>
        <button 
            onClick={() => setIsDocModalOpen(true)}
            className="p-2 bg-card/80 backdrop-blur-md border border-border rounded-full shadow-lg hover:bg-card hover:text-primary transition-all duration-300 group"
            title="Documentation"
        >
            <QuestionMarkCircleIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
        </button>
      </div>

      <header className="text-center mb-10 flex-shrink-0 animate-fade-in">
        <div className="flex flex-col items-center mb-4">
            <div className="flex gap-2 mb-4">
                <div className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-[10px] text-primary tracking-widest uppercase font-black">
                    Système Agentique
                </div>
                <div className="px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-[10px] text-accent tracking-widest uppercase font-black">
                    Authenticité Z12
                </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white via-primary to-secondary drop-shadow-sm leading-tight">
                Humanizer Z12
            </h1>
            <p className="mt-4 text-lg md:text-xl font-bold text-primary/80 tracking-tight animate-pulse">
                GÉNIAL ! Vous venez d'élever le concept à un niveau supérieur
            </p>
        </div>
      </header>

      <main className="flex-grow flex flex-col lg:grid overflow-hidden gap-6" style={{ gridTemplateColumns }}>
        
        {/* Left Panel: Style Library */}
        <aside className={`${isStyleLibraryOpen ? 'block' : 'hidden lg:block'} transition-all duration-300`}>
          <StyleLibrary 
            styles={styles} 
            setStyles={setStyles} 
            isOpen={isStyleLibraryOpen} 
            onToggle={() => setIsStyleLibraryOpen(!isStyleLibraryOpen)}
          />
        </aside>

        {/* Center Panel: Generation Engine */}
        <section className="flex-1 overflow-y-auto">
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
          />
        </section>

        {/* Right Panel: Configuration */}
        <aside className={`${isConfigPanelOpen ? 'block' : 'hidden lg:block'} transition-all duration-300`}>
          <ConfigurationPanel 
            distribution={distribution} 
            setDistribution={setDistribution} 
            styles={styles} 
            isOpen={isConfigPanelOpen} 
            onToggle={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
            model={settings.selectedModel}
            setModel={handleModelChange}
          />
        </aside>

      </main>

      <footer className="mt-8 py-4 border-t border-border flex flex-col sm:flex-row justify-between items-center text-xs text-muted-foreground flex-shrink-0">
        <div className="flex items-center space-x-4 mb-2 sm:mb-0">
          <span className="flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Moteur Gemini 2.5 Pro Actif
          </span>
          <span className="opacity-50">|</span>
          <span>© 2025 Humanizer Z12 - Agentic Solutions</span>
        </div>
        <div className="flex space-x-6">
          <a href="#" className="hover:text-primary transition-colors">Conditions</a>
          <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
          <a href="#" className="hover:text-primary transition-colors">Support Technique</a>
        </div>
      </footer>
    </div>
  );
};

export default App;