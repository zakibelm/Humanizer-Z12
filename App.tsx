
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import UnifiedSidebar from './components/UnifiedSidebar';
import GenerationEngine from './components/GenerationEngine';
import DocumentationModal from './components/DocumentationModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import QuestionMarkCircleIcon from './components/icons/QuestionMarkCircleIcon';
import AdjustmentsIcon from './components/icons/AdjustmentsIcon';
import { INITIAL_STYLES } from './constants';
import { StyleCategory, AnalysisResult, WorkflowStep, IterationStepConfig, GlobalSettings } from './types';
import { callOpenRouter, runAnalysis } from './services/openRouterService';
import { detectAI } from './services/zeroGptService';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const DEFAULT_WORKFLOW: IterationStepConfig[] = [
  { 
    id: '1', 
    active: true, 
    agentName: 'agent1', 
    model: 'anthropic/claude-3.5-sonnet', 
    systemPrompt: 'Agis comme un éditeur humain expert. Corrige la grammaire mais garde un ton naturel et imparfait.' 
  },
  { 
    id: '2', 
    active: true, 
    agentName: 'agent2', 
    model: 'meta-llama/llama-3.1-405b', 
    systemPrompt: 'Casse la monotonie structurelle. Alterne phrases courtes et longues de manière imprévisible.' 
  },
  { 
    id: '3', 
    active: true, 
    agentName: 'agent3', 
    model: 'google/gemini-2.0-flash-exp', 
    systemPrompt: 'Supprime les expressions typiques de l\'IA comme "En conclusion", "Il est important de".' 
  },
  { 
    id: '4', 
    active: false, 
    agentName: 'agent4', 
    model: 'openai/gpt-4o', 
    systemPrompt: 'Injecte une personnalité spécifique basée sur le style sélectionné.' 
  },
  { 
    id: '5', 
    active: false, 
    agentName: 'agent5', 
    model: 'anthropic/claude-3-opus', 
    systemPrompt: 'Vérification finale. Le texte doit passer les tests de Turing avec brio.' 
  }
];

const MainApp: React.FC = () => {
  const { t, language, setLanguage, isRTL } = useLanguage();
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
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
      setError("Configure API Key");
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
        setWorkflowLogs(prev => [...prev, { id: logId, label: t(stepConfig.agentName as any), status: 'running', details: `${stepConfig.model}` }]);
        currentText = await callOpenRouter(currentText, stepConfig, settings.openRouterApiKey);
        setWorkflowLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', details: `OK` } : l));
      }
      setOutputText(currentText);
      const analysis = await runAnalysis(currentText, settings.openRouterApiKey);
      const zeroGpt = await detectAI(currentText, settings.zeroGptApiKey);
      if (zeroGpt && !zeroGpt.error) {
        analysis.detectionRisk.score = Math.round((analysis.detectionRisk.score + (100 - zeroGpt.fakePercentage)) / 2);
      }
      setAnalysisResult(analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, workflow, settings, t]);

  const gridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isRTL 
      ? `1fr ${isSidebarOpen ? '360px' : '64px'}` 
      : `${isSidebarOpen ? '360px' : '64px'} 1fr`,
    transition: 'grid-template-columns 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
    width: '100%',
    height: '100%',
    gap: '1rem',
    direction: isRTL ? 'rtl' : 'ltr' as any
  }), [isSidebarOpen, isRTL]);

  if (!user) return <LoginScreen onLogin={(u) => { setUser(u); localStorage.setItem('z12_user', JSON.stringify(u)); }} />;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-foreground font-sans overflow-hidden">
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
        settings={settings}
        onSave={setSettings}
      />
      
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-card/20 backdrop-blur-md flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary">{t('appTitle')}</h1>
          <div className="flex items-center ml-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-2"></div>
            <span className="text-[10px] font-black uppercase tracking-widest text-green-500/80">{t('vibrationActive')}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            {(['fr', 'en', 'ar'] as const).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${language === lang ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
              >
                {lang}
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-all"><AdjustmentsIcon className="w-5 h-5"/></button>
            <button onClick={() => setIsDocModalOpen(true)} className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-all"><QuestionMarkCircleIcon className="w-5 h-5"/></button>
          </div>
          <div className="h-8 w-px bg-white/5 mx-2"></div>
          <div className="flex items-center gap-3">
            <div className={`text-right ${isRTL ? 'text-left' : 'text-right'}`}>
              <p className="text-xs font-bold leading-none">{user.name}</p>
              <button onClick={() => { setUser(null); localStorage.removeItem('z12_user'); }} className="text-[10px] text-destructive hover:underline">{t('logout')}</button>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black border border-primary/30">
              {user.name.charAt(0)}
            </div>
          </div>
        </div>
      </header>

      <main style={gridStyles} className="flex-grow p-4 overflow-hidden">
        {isRTL ? (
          <>
            <section className="h-full overflow-hidden bg-card/20 rounded-3xl border border-white/5 shadow-2xl">
              <GenerationEngine 
                inputText={inputText} setInputText={setInputText}
                outputText={outputText} setOutputText={setOutputText}
                isLoading={isLoading} handleGenerate={handleGenerate}
                analysisResult={analysisResult} error={error} workflowLogs={workflowLogs}
              />
            </section>
            <aside className="h-full">
              <UnifiedSidebar 
                styles={styles} setStyles={setStyles}
                workflow={workflow} setWorkflow={setWorkflow}
                isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
              />
            </aside>
          </>
        ) : (
          <>
            <aside className="h-full">
              <UnifiedSidebar 
                styles={styles} setStyles={setStyles}
                workflow={workflow} setWorkflow={setWorkflow}
                isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
              />
            </aside>
            <section className="h-full overflow-hidden bg-card/20 rounded-3xl border border-white/5 shadow-2xl">
              <GenerationEngine 
                inputText={inputText} setInputText={setInputText}
                outputText={outputText} setOutputText={setOutputText}
                isLoading={isLoading} handleGenerate={handleGenerate}
                analysisResult={analysisResult} error={error} workflowLogs={workflowLogs}
              />
            </section>
          </>
        )}
      </main>

      <footer className="h-8 border-t border-white/5 flex items-center justify-between px-6 text-[10px] text-muted-foreground/40 flex-shrink-0 bg-black/40">
        <div>&copy; 2025 Propulsé par zakibelm</div>
        <div className="flex items-center gap-4 uppercase font-bold tracking-widest">
          <span>{t('appTitle')}</span>
          <span className="text-primary">v2.3.1</span>
        </div>
      </footer>
    </div>
  );
};

const App: React.FC = () => (
  <LanguageProvider>
    <MainApp />
  </LanguageProvider>
);

export default App;
