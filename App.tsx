
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import StyleLibrary from './components/StyleLibrary';
import ConfigurationPanel from './components/ConfigurationPanel';
import GenerationEngine from './components/GenerationEngine';
import { INITIAL_STYLES, INITIAL_DISTRIBUTION, MAX_INPUT_CHARS } from './constants';
import { StyleCategory, StyleDistribution, AnalysisResult, ModelId, WorkflowStep, AgenticConfig, StylometricProfile } from './types';
import { generateHumanizedText, refineHumanizedText, analyzeExistingText } from './services/geminiService';
import { createCompositeProfile } from './services/stylometryService';

const App: React.FC = () => {
  // Initialize state with lazy initializers to try loading from local storage first
  const [styles, setStyles] = useState<StyleCategory[]>(() => {
    const saved = localStorage.getItem('z12_styles');
    return saved ? JSON.parse(saved) : INITIAL_STYLES;
  });
  
  const [distribution, setDistribution] = useState<StyleDistribution>(() => {
    const saved = localStorage.getItem('z12_distribution');
    return saved ? JSON.parse(saved) : INITIAL_DISTRIBUTION;
  });

  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isStyleLibraryOpen, setIsStyleLibraryOpen] = useState(true);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [model, setModel] = useState<ModelId>('gemini-2.5-pro');
  const [error, setError] = useState<string | null>(null);
  const [hasBeenEdited, setHasBeenEdited] = useState<boolean>(false);
  
  // Agentic State
  const [agenticConfig, setAgenticConfig] = useState<AgenticConfig>({
      enabled: true, // Enabled by default for better results
      targetScore: 90,
      maxIterations: 3
  });
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowStep[]>([]);

  // Persistence Effect
  useEffect(() => {
    localStorage.setItem('z12_styles', JSON.stringify(styles));
  }, [styles]);

  useEffect(() => {
    localStorage.setItem('z12_distribution', JSON.stringify(distribution));
  }, [distribution]);

  // PERFORMANCE OPTIMIZATION:
  // Calculate the composite profile ONLY when styles change, not on every generation.
  // This matches the "Backend Workflow 1" logic.
  const activeProfile = useMemo<StylometricProfile>(() => {
    const allDocumentTexts = styles.flatMap(category => category.documents.map(doc => doc.content));
    // Fallback if no docs, though UI prevents empty generation usually
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

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim() || inputText.length > MAX_INPUT_CHARS) {
        if(inputText.length > MAX_INPUT_CHARS) {
            setError(`Le texte ne peut pas dépasser ${MAX_INPUT_CHARS} caractères.`);
        }
        return;
    }

    // Check if we have any docs
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
            model,
            activeProfile, // Pass the memoized profile
            agenticConfig,
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
  }, [inputText, styles, distribution, model, agenticConfig, activeProfile]);

  const handleRefine = useCallback(async () => {
    if (!outputText || !analysisResult) return;

    setIsRefining(true);
    setError(null);
    setHasBeenEdited(false);
    setWorkflowLogs(prev => [...prev, { id: Date.now().toString(), label: "Raffinement manuel", status: "running", details: "Amélioration ciblée demandée..."}]);
    
    try {
        const result = await refineHumanizedText(outputText, analysisResult, styles, model, activeProfile);
        setOutputText(result.text);
        setAnalysisResult(result.analysis);
        setWorkflowLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'success', details: 'Terminé.' } : l));
    } catch (e) {
         if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de l'amélioration.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, analysisResult, styles, model, activeProfile]);

  const handleReanalyze = useCallback(async () => {
    if (!outputText) return;
    setIsRefining(true);
    setError(null);
    setWorkflowLogs(prev => [...prev, { id: Date.now().toString(), label: "Ré-analyse", status: "running", details: "Analyse des modifications..."}]);

    try {
        const result = await analyzeExistingText(outputText, activeProfile, model);
        setOutputText(result.text); 
        setAnalysisResult(result.analysis);
        setHasBeenEdited(false);
         setWorkflowLogs(prev => prev.map(l => l.status === 'running' ? { ...l, status: 'success', details: `Nouveau score : ${result.analysis.detectionRisk.score}%` } : l));
    } catch(e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de la ré-analyse.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, activeProfile, model]);


  const gridTemplateColumns = useMemo(() => {
    const leftCol = isStyleLibraryOpen ? 'minmax(320px, 1fr)' : '56px';
    const rightCol = isConfigPanelOpen ? 'minmax(320px, 1fr)' : '56px';
    const midCol = 'minmax(480px, 2.5fr)';
    return `${leftCol} ${midCol} ${rightCol}`;
  }, [isStyleLibraryOpen, isConfigPanelOpen]);

  return (
    <div className="min-h-screen flex flex-col p-4 sm:p-6 lg:p-8">
      <header className="text-center mb-8 flex-shrink-0">
        <h1 className="text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
          Humanizer Z12 <span className="text-xs font-mono bg-accent/20 text-accent px-2 py-1 rounded ml-2 border border-accent/50">AGENTIC CORE</span>
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Architecture de génération autonome avec boucle de vérification et mémoire persistante.
        </p>
      </header>

      <main 
        className="flex-grow grid gap-8 items-start"
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
        />
        <ConfigurationPanel 
          distribution={distribution} 
          setDistribution={setDistribution}
          styles={styles}
          isOpen={isConfigPanelOpen}
          onToggle={() => setIsConfigPanelOpen(prev => !prev)}
          model={model}
          setModel={setModel}
        />
      </main>
    </div>
  );
}

export default App;
