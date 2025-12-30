
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import UnifiedSidebar from './components/UnifiedSidebar';
import GenerationEngine from './components/GenerationEngine';
import DocumentationModal from './components/DocumentationModal';
import SettingsModal from './components/SettingsModal';
import LoginScreen from './components/LoginScreen';
import QuestionMarkCircleIcon from './components/icons/QuestionMarkCircleIcon';
import AdjustmentsIcon from './components/icons/AdjustmentsIcon';
import { INITIAL_STYLES } from './constants';
import { StyleCategory, AnalysisResult, WorkflowStep, IterationStepConfig, GlobalSettings, WritingConfig } from './types';
import { callOpenRouter, runAnalysis } from './services/openRouterService';
import { detectAI } from './services/zeroGptService';
import { LanguageProvider, useLanguage } from './context/LanguageContext';

const DEFAULT_WORKFLOW: IterationStepConfig[] = [
  { id: '1', active: true, agentName: 'agent1', model: 'google/gemini-2.0-flash-exp:free', systemPrompt: 'Agis comme un éditeur humain expert. Corrige la grammaire mais garde un ton naturel.' },
  { id: '2', active: true, agentName: 'agent2', model: 'meta-llama/llama-3.1-405b', systemPrompt: 'Casse la monotonie structurelle. Alterne phrases courtes et longues.' },
  { id: '3', active: true, agentName: 'agent3', model: 'google/gemini-flash-1.5', systemPrompt: 'Supprime les expressions typiques de l\'IA.' },
  { id: '4', active: false, agentName: 'agent4', model: 'openai/gpt-4o', systemPrompt: 'Injecte une personnalité spécifique.' },
  { id: '5', active: false, agentName: 'agent5', model: 'anthropic/claude-3.5-sonnet', systemPrompt: 'Vérification finale.' }
];

const DEFAULT_WRITING_CONFIG: WritingConfig = {
    temperature: 0.8,
    formality: 0.5,
    professionalism: 'marketing',
    empathy: 0.7,
    humor: 0.3
};

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

  const [writingConfig, setWritingConfig] = useState<WritingConfig>(() => {
    try {
      const saved = localStorage.getItem('z12_writing_config');
      return saved ? JSON.parse(saved) : DEFAULT_WRITING_CONFIG;
    } catch { return DEFAULT_WRITING_CONFIG; }
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
    localStorage.setItem('z12_writing_config', JSON.stringify(writingConfig));
  }, [settings, workflow, writingConfig]);

  const handleGenerate = useCallback(async () => {
    const isRehumanizing = outputText && outputText.trim().length > 20;
    const sourceText = isRehumanizing ? outputText : inputText;
    if (!sourceText.trim()) return;
    if (!settings.openRouterApiKey) { setError("Configure API Key"); setIsSettingsModalOpen(true); return; }

    setIsLoading(true);
    setError(null);
    setWorkflowLogs([]);
    setAnalysisResult(null);
    if (!isRehumanizing) setOutputText(""); 

    let currentText = sourceText;

    try {
      const activeSteps = workflow.filter(s => s.active);
      
      const characteristicOverlay = `
INSTRUCTIONS DE PERSONNALITÉ PRIORITAIRES:
- Niveau de Formalité: ${writingConfig.formality > 0.7 ? 'Très formel' : writingConfig.formality < 0.3 ? 'Décontracté' : 'Équilibré'}
- Ton & Contexte: ${
        writingConfig.professionalism === 'marketing' 
          ? 'MARKETER VENDEUR (Captivant, utilise des leviers psychologiques, crée du désir et de l\'urgence, storytelling de marque, impact maximal)' 
          : writingConfig.professionalism === 'friendly' ? 'Amical et cordial' 
          : writingConfig.professionalism === 'startup' ? 'Startup direct' 
          : writingConfig.professionalism === 'corporate' ? 'Corporate sérieux' 
          : writingConfig.professionalism === 'academic' ? 'Académique' 
          : 'Créatif'
      }
- Empathie: ${writingConfig.empathy > 0.5 ? 'Forte connexion émotionnelle' : 'Neutre'}
- Humour: ${writingConfig.humor > 0.5 ? 'Subtil humour' : 'Sérieux'}
      `;

      for (const stepConfig of activeSteps) {
        const logId = Date.now().toString();
        setWorkflowLogs(prev => [...prev, { id: logId, label: t(stepConfig.agentName as any), status: 'running', details: `${stepConfig.model}` }]);
        const enrichedStep = { ...stepConfig, systemPrompt: stepConfig.systemPrompt + characteristicOverlay };
        currentText = await callOpenRouter(currentText, enrichedStep, settings.openRouterApiKey, writingConfig.temperature);
        setWorkflowLogs(prev => prev.map(l => l.id === logId ? { ...l, status: 'success', details: `OK` } : l));
        setOutputText(currentText);
      }
      
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
  }, [inputText, outputText, workflow, settings, t, writingConfig]);

  const handleReAnalyze = useCallback(async () => {
    if (!outputText.trim()) return;
    setIsLoading(true);
    try {
      const analysis = await runAnalysis(outputText, settings.openRouterApiKey);
      const zeroGpt = await detectAI(outputText, settings.zeroGptApiKey);
      if (zeroGpt && !zeroGpt.error) {
        analysis.detectionRisk.score = Math.round((analysis.detectionRisk.score + (100 - zeroGpt.fakePercentage)) / 2);
      }
      setAnalysisResult(analysis);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, [outputText, settings]);

  const gridStyles = useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: isRTL ? `1fr ${isSidebarOpen ? '360px' : '64px'}` : `${isSidebarOpen ? '360px' : '64px'} 1fr`,
    transition: 'all 0.5s ease',
    width: '100%',
    height: '100%',
    gap: '1rem',
    direction: isRTL ? 'rtl' : 'ltr' as any
  }), [isSidebarOpen, isRTL]);

  if (!user) return <LoginScreen onLogin={(u) => { setUser(u); localStorage.setItem('z12_user', JSON.stringify(u)); }} />;

  return (
    <div className="h-screen w-screen flex flex-col bg-[#09090b] text-foreground font-sans overflow-hidden">
      <DocumentationModal isOpen={isDocModalOpen} onClose={() => setIsDocModalOpen(false)} />
      <SettingsModal isOpen={isSettingsModalOpen} onClose={() => setIsSettingsModalOpen(false)} settings={settings} onSave={setSettings} />
      <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-card/20 backdrop-blur-md flex-shrink-0 z-50">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg shadow-primary/20">
            <span className="text-white font-bold text-xl">Z</span>
          </div>
          <h1 className="text-2xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-foreground to-primary">{t('appTitle')}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-black/40 p-1 rounded-lg border border-white/10">
            {(['fr', 'en', 'ar'] as const).map((lang) => (
              <button key={lang} onClick={() => setLanguage(lang)} className={`px-3 py-1 rounded-md text-[10px] font-black uppercase transition-all ${language === lang ? 'bg-primary text-white' : 'text-muted-foreground'}`}>{lang}</button>
            ))}
          </div>
          <button onClick={() => setIsSettingsModalOpen(true)} className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-all"><AdjustmentsIcon className="w-5 h-5"/></button>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-black border border-primary/30">{user.name.charAt(0)}</div>
          </div>
        </div>
      </header>
      <main style={gridStyles} className="flex-grow p-4 overflow-hidden">
        {isRTL ? (
          <>
            <section className="h-full overflow-hidden bg-card/20 rounded-3xl border border-white/5 shadow-2xl">
              <GenerationEngine inputText={inputText} setInputText={setInputText} outputText={outputText} setOutputText={setOutputText} isLoading={isLoading} handleGenerate={handleGenerate} handleReAnalyze={handleReAnalyze} analysisResult={analysisResult} error={error} workflowLogs={workflowLogs} />
            </section>
            <aside className="h-full">
              <UnifiedSidebar styles={styles} setStyles={setStyles} workflow={workflow} setWorkflow={setWorkflow} writingConfig={writingConfig} setWritingConfig={setWritingConfig} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </aside>
          </>
        ) : (
          <>
            <aside className="h-full">
              <UnifiedSidebar styles={styles} setStyles={setStyles} workflow={workflow} setWorkflow={setWorkflow} writingConfig={writingConfig} setWritingConfig={setWritingConfig} isOpen={isSidebarOpen} onToggle={() => setIsSidebarOpen(!isSidebarOpen)} />
            </aside>
            <section className="h-full overflow-hidden bg-card/20 rounded-3xl border border-white/5 shadow-2xl">
              <GenerationEngine inputText={inputText} setInputText={setInputText} outputText={outputText} setOutputText={setOutputText} isLoading={isLoading} handleGenerate={handleGenerate} handleReAnalyze={handleReAnalyze} analysisResult={analysisResult} error={error} workflowLogs={workflowLogs} />
            </section>
          </>
        )}
      </main>
      <footer className="h-8 border-t border-white/5 flex items-center justify-between px-6 text-[10px] text-muted-foreground/40 bg-black/40">
        <div>&copy; 2025 Propulsé par zakibelm</div>
        <div className="flex items-center gap-4 uppercase font-bold tracking-widest"><span className="text-primary">v2.4.0 (Marketer Engine)</span></div>
      </footer>
    </div>
  );
};

const App: React.FC = () => <LanguageProvider><MainApp /></LanguageProvider>;
export default App;
