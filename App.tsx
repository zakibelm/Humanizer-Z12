
import React, { useState, useCallback, useMemo } from 'react';
import StyleLibrary from './components/StyleLibrary';
import ConfigurationPanel from './components/ConfigurationPanel';
import GenerationEngine from './components/GenerationEngine';
import { INITIAL_STYLES, INITIAL_DISTRIBUTION } from './constants';
import { StyleCategory, StyleDistribution, AnalysisResult } from './types';
import { generateHumanizedText, refineHumanizedText } from './services/geminiService';

const App: React.FC = () => {
  const [styles, setStyles] = useState<StyleCategory[]>(INITIAL_STYLES);
  const [distribution, setDistribution] = useState<StyleDistribution>(INITIAL_DISTRIBUTION);
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isRefining, setIsRefining] = useState<boolean>(false);
  const [isStyleLibraryOpen, setIsStyleLibraryOpen] = useState(true);
  const [isConfigPanelOpen, setIsConfigPanelOpen] = useState(true);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  
  const handleGenerate = useCallback(async () => {
    if (!inputText.trim()) return;

    setIsLoading(true);
    setOutputText('');
    setAnalysisResult(null);

    const result = await generateHumanizedText(inputText, styles, distribution);
    
    setOutputText(result.text);
    setAnalysisResult(result.analysis);
    setIsLoading(false);
  }, [inputText, styles, distribution]);

  const handleRefine = useCallback(async () => {
    if (!outputText || !analysisResult) return;

    setIsRefining(true);
    const result = await refineHumanizedText(outputText, analysisResult.flaggedSentences);
    
    setOutputText(result.text);
    setAnalysisResult(result.analysis);
    setIsRefining(false);
  }, [outputText, analysisResult]);


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
          Humanizer Z12
        </h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-2xl mx-auto">
          Système de multi-style humain intelligent pour une écriture authentique.
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
          setInputText={setInputText}
          outputText={outputText}
          isLoading={isLoading}
          isRefining={isRefining}
          handleGenerate={handleGenerate}
          handleRefine={handleRefine}
          analysisResult={analysisResult}
        />
        <ConfigurationPanel 
          distribution={distribution} 
          setDistribution={setDistribution}
          styles={styles}
          isOpen={isConfigPanelOpen}
          onToggle={() => setIsConfigPanelOpen(prev => !prev)}
        />
      </main>
    </div>
  );
}

export default App;