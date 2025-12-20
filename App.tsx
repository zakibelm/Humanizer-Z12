
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import StyleLibrary from './components/StyleLibrary';
import ConfigurationPanel from './components/ConfigurationPanel';
import GenerationEngine from './components/GenerationEngine';
import DocumentationModal from './components/DocumentationModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import QuestionMarkCircleIcon from './components/icons/QuestionMarkCircleIcon';
import AdjustmentsIcon from './components/icons/AdjustmentsIcon';
import { INITIAL_STYLES, MAX_INPUT_CHARS } from './constants';
import { StyleCategory, AnalysisResult, WorkflowStep, IterationStepConfig, GlobalSettings } from './types';
import { callOpenRouter, runAnalysis } from './services/openRouterService';
import { detectAI } from './services/zeroGptService';

const DEFAULT_WORKFLOW: IterationStepConfig[] = [
  {
    id: '1',
    active: true,
    agentName: 'Éditeur Correcteur',
    model: 'anthropic/claude-3.5-sonnet',
    systemPrompt: `IMPORTANT : Tu es Humanizer Z12. Ta mission est de réviser le texte pour le rendre humain.`
  },
  {
    id: '2',
    active: false,
    agentName: 'Expert Burstiness',
    model: 'meta-llama/llama-3.1-405b',
    systemPrompt: `Casse la monotonie des phrases. Alterne entre phrases très courtes et complexes.`
  },
  {
    id: '3',
    active: false,
    agentName: 'Anti-Détection',
    model: 'google/gemini-2.0-flash-exp',
    systemPrompt: `Remplace les mots trop prévisibles par des nuances humaines plus rares.`
  },
  {
    id: '4',
    active: false,
    agentName: 'Styliste Mimétique',
    model: 'openai/gpt-4o',
    systemPrompt: `Applique un ton conversationnel direct avec des questions rhétoriques.`
  },
  {
    id: '5',
    active: false,
    agentName: 'Polisseur Final',
    model: 'anthropic/claude-3-opus',
    systemPrompt: `Ajoute des imperfections humaines naturelles (Bon, En fait, etc.) sans changer le sens.`
  }
];

const App: React.FC = () => {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('z12_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const [settings, setSettings] = useState<GlobalSettings>(() => {
    try {
      const saved = localStorage.getItem('z12_settings');
      return saved ? JSON.parse(saved) : { openRouterApiKey: '', zeroGptApiKey: '' };
    } catch { return { openRouterApiKey: '', zeroGptApiKey: '' }; }
  });

  const [workflow, setWorkflow] = useState<IterationStepConfig[]>(() => {
    try {
      const saved = localStorage.getItem('z12_workflow');
      return saved ? JSON.parse(saved) : DEFAULT_WORKFLOW;
    } catch { return DEFAULT_WORKFLOW; }
  });

  const [styles, setStyles] = useState<StyleCategory[]>(INITIAL_STYLES);
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStyleLibraryOpen, setIsStyleLibraryOpen] = useState(true);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [workflowLogs, setWorkflowLogs] = useState<WorkflowStep[]>([]);

  useEffect(() => {
    localStorage.setItem('z12_settings', JSON.stringify(settings));
    localStorage.setItem('z12_workflow', JSON.stringify(workflow));
  }, [settings, workflow]);

  const handleGenerate = useCallback(async () => {
    if (!inputText.trim()) return;
    if (!settings.openRouterApiKey) {
      setError("Configurez votre clé OpenRouter.");
      setIsSettingsModalOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    setWorkflowLogs([]);
    let currentText = inputText;

    try {
      const activeSteps = workflow.filter(s => s.active);
      if (activeSteps.length === 0) throw new Error("Activez au moins un agent.");
      
      for (const stepConfig of activeSteps) {
        const logId = Date.now().toString();
        setWorkflowLogs(prev => [...prev, { id: logId, label: stepConfig.agentName, status: 'running', details: `${stepConfig.model}` }]);
        currentText = await callOpenRouter(currentText, stepConfig, settings.openRouterApiKey);
        setWorkflowLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', details: `Terminé.` } : l));
      }

      setOutputText(currentText);
      const analysisLogId = "analysis-" + Date.now();
      setWorkflowLogs(prev => [...prev, { id: analysisLogId, label: "Audit Authentique", status: 'running', details: "Calcul du score..." }]);
      
      const analysis = await runAnalysis(currentText, settings.openRouterApiKey);
      const zeroGpt = await detectAI(currentText, settings.zeroGptApiKey);
      
      if (zeroGpt && !zeroGpt.error) {
        analysis.detectionRisk.score = Math.round((analysis.detectionRisk.score + (100 - zeroGpt.fakePercentage)) / 2);
      }
      
      setAnalysisResult(analysis);
      setWorkflowLogs(prev => prev.map(l => l.id === analysisLogId ? { ...l, status: 'success', details: `${analysis.detectionRisk.score}%` } : l));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, workflow, settings]);

  const gridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: `${isStyleLibraryOpen ? '320px' : '60px'} 1fr ${isConfigPanelOpen ? '380px' : '60px'}`,
    transition: 'grid-template-columns 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    height: '100%',
    gap: '1rem'
  }), [isStyleLibraryOpen, isConfigPanelOpen]);

  if (!user) return <LoginScreen onLogin={(u) => { setUser(u); localStorage.setItem('z12_user', JSON.stringify(u)); }} />;

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground font-sans overflow-hidden">
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        settings={settings}
        onSave={setSettings}
      />
      
      {/* Header compact */}
      <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/30 backdrop-blur-md flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary">Humanizer Z12</h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex gap-2">
            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 border border-border rounded-full hover:bg-muted transition-all" title="Configuration"><AdjustmentsIcon className="w-5 h-5"/></button>
            <button onClick={() => setIsDocModalOpen(true)} className="p-2 border border-border rounded-full hover:bg-muted transition-all" title="Aide"><QuestionMarkCircleIcon className="w-5 h-5"/></button>
          </div>
          <div className="h-8 w-px bg-border mx-2"></div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold leading-none">{user.name}</p>
              <button onClick={() => { setUser(null); localStorage.removeItem('z12_user'); }} className="text-[10px] text-destructive hover:underline">Déconnexion</button>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black border border-primary/30">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main style={gridStyles} className="flex-grow p-4 overflow-hidden">
        {/* Style Library (Left) */}
        <aside className="h-full">
          <StyleLibrary 
            styles={styles} 
            setStyles={setStyles} 
            isOpen={isStyleLibraryOpen} 
            onToggle={() => setIsStyleLibraryOpen(!isStyleLibraryOpen)} 
          />
        </aside>

        {/* Workspace (Center) */}
        <section className="h-full overflow-hidden bg-card/20 rounded-3xl border border-border/50 shadow-2xl">
          <GenerationEngine 
            inputText={inputText} setInputText={setInputText}
            outputText={outputText} setOutputText={setOutputText}
            isLoading={isLoading} isRefining={false}
            handleGenerate={handleGenerate} handleRefine={() => {}} handleReanalyze={() => {}}
            analysisResult={analysisResult} error={error} hasBeenEdited={false}
            workflowLogs={workflowLogs}
            agenticConfig={{ enabled: true, targetScore: 90, maxIterations: workflow.filter(s => s.active).length }}
            setAgenticConfig={() => {}}
          />
        </section>

        {/* Agent Workflow (Right) */}
        <aside className="h-full">
          <ConfigurationPanel 
            workflow={workflow} 
            setWorkflow={setWorkflow} 
            isOpen={isConfigPanelOpen} 
            onToggle={() => setIsConfigPanelOpen(!isConfigPanelOpen)}
          />
        </aside>
      </main>

      {/* Footer minimaliste mis à jour */}
      <footer className="h-8 border-t border-border flex items-center justify-between px-6 text-[10px] text-muted-foreground flex-shrink-0">
        <div className="flex items-center gap-4">
          <span>&copy; 2025 Propulsé par zakibelm</span>
          <span className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>OpenRouter Sync OK</span>
        </div>
        <div className="flex items-center gap-4 uppercase font-bold tracking-widest">
          <span>Mode Multi-Agents</span>
          <span className="text-primary">v2.3.1</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
