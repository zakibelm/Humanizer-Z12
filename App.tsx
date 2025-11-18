
import React, { useState, useCallback, useMemo } from 'react';
import StyleLibrary from './components/StyleLibrary';
import ConfigurationPanel from './components/ConfigurationPanel';
import GenerationEngine from './components/GenerationEngine';
import { INITIAL_STYLES, INITIAL_DISTRIBUTION, MAX_INPUT_CHARS } from './constants';
import { StyleCategory, StyleDistribution, AnalysisResult, ModelId } from './types';
import { generateHumanizedText, refineHumanizedText, analyzeExistingText } from './services/geminiService';

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
  const [model, setModel] = useState<ModelId>('gemini-2.5-pro');
  const [error, setError] = useState<string | null>(null);
  const [hasBeenEdited, setHasBeenEdited] = useState<boolean>(false);
  
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

    setIsLoading(true);
    setOutputText('');
    setAnalysisResult(null);
    setError(null);
    setHasBeenEdited(false);

    try {
        const result = await generateHumanizedText(inputText, styles, distribution, model);
        setOutputText(result.text);
        setAnalysisResult(result.analysis);
    } catch (e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue.");
        }
    } finally {
        setIsLoading(false);
    }
  }, [inputText, styles, distribution, model]);

  const handleRefine = useCallback(async () => {
    if (!outputText || !analysisResult) return;

    setIsRefining(true);
    setError(null);
    setHasBeenEdited(false);
    
    try {
        const result = await refineHumanizedText(outputText, analysisResult, styles, model);
        setOutputText(result.text);
        setAnalysisResult(result.analysis);
    } catch (e) {
         if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de l'amélioration.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, analysisResult, styles, model]);

  const handleReanalyze = useCallback(async () => {
    if (!outputText) return;
    setIsRefining(true);
    setError(null);
    try {
        const result = await analyzeExistingText(outputText, styles, model);
        setOutputText(result.text); // result.text is the same as outputText
        setAnalysisResult(result.analysis);
        setHasBeenEdited(false); // Reset after re-analysis
    } catch(e) {
        if (e instanceof Error) {
            setError(e.message);
        } else {
            setError("Une erreur inattendue est survenue lors de la ré-analyse.");
        }
    } finally {
        setIsRefining(false);
    }
  }, [outputText, styles, model]);


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
