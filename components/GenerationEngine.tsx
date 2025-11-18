
import React, { useState } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import SparklesIcon from './icons/SparklesIcon';
import { AnalysisResult } from '../types';
import StatisticsPanel from './StatisticsPanel';
import EditableTextArea from './EditableTextArea';

interface GenerationEngineProps {
  inputText: string;
  setInputText: (text: string) => void;
  outputText: string;
  setOutputText: (text: string) => void;
  isLoading: boolean;
  isRefining: boolean;
  handleGenerate: () => void;
  handleRefine: () => void;
  handleReanalyze?: () => void;
  analysisResult: AnalysisResult | null;
}

const GenerationEngine: React.FC<GenerationEngineProps> = ({
  inputText,
  setInputText,
  outputText,
  setOutputText,
  isLoading,
  isRefining,
  handleGenerate,
  handleRefine,
  handleReanalyze,
  analysisResult
}) => {
  const [copied, setCopied] = useState(false);
  const [hasEdited, setHasEdited] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTextChange = (newText: string) => {
    setOutputText(newText);
    setHasEdited(true);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex flex-col flex-grow p-6 rounded-lg bg-card/50 border border-border">
        <div className="flex-1 flex flex-col mb-4 min-h-[150px] sm:min-h-[200px]">
          <label htmlFor="input-text" className="text-sm font-medium text-muted-foreground mb-2">
            Sujet ou texte à humaniser
          </label>
          <textarea
            id="input-text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Écrivez le sujet ici..."
            className="w-full flex-grow p-3 bg-input/80 border border-input rounded-md focus:ring-2 focus:ring-ring focus:border-primary transition-all duration-200 resize-none text-foreground placeholder:text-muted-foreground"
          />
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || isRefining || !inputText}
          className="w-full py-3 px-4 bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/90 disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed transition-colors duration-300 transform hover:scale-105 disabled:scale-100 flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Génération en cours...
            </>
          ) : (
            'Générer le Texte Humanisé'
          )}
        </button>

        {analysisResult && !isLoading && (
          <div className="mt-6">
            <StatisticsPanel analysis={analysisResult} outputText={outputText} />
          </div>
        )}

        <div className="flex-1 flex flex-col mt-6 min-h-[200px] sm:min-h-[250px]">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium text-muted-foreground">
              Résultat {outputText && <span className="text-xs ml-2 italic">(éditable - modifiez les zones surlignées)</span>}
            </label>
            {outputText && (
               <div className="flex items-center space-x-2">
                 {hasEdited && handleReanalyze && (
                    <button
                        onClick={() => {
                          handleReanalyze();
                          setHasEdited(false);
                        }}
                        disabled={isRefining || isLoading}
                        className="flex items-center text-xs font-medium px-3 py-1 bg-blue-600 text-white hover:bg-blue-700 rounded-sm transition-colors disabled:bg-muted disabled:text-muted-foreground"
                        title="Re-analyser le texte modifié"
                    >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-analyser
                    </button>
                 )}
                 {analysisResult && analysisResult.detectionRisk.level !== 'Faible' && !hasEdited && (
                    <button
                        onClick={handleRefine}
                        disabled={isRefining || isLoading}
                        className="flex items-center text-xs font-medium px-3 py-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm transition-colors disabled:bg-muted disabled:text-muted-foreground"
                        title="Améliorer le texte pour réduire le risque de détection"
                    >
                        <SparklesIcon className="w-4 h-4 mr-2"/>
                        {isRefining ? 'Amélioration...' : 'Améliorer'}
                    </button>
                 )}
                <button
                  onClick={handleCopy}
                  className="flex items-center text-xs font-medium px-3 py-1 bg-secondary text-secondary-foreground hover:bg-secondary/90 rounded-sm transition-colors"
                  title="Copier le texte"
                >
                  <ClipboardIcon className="w-4 h-4 mr-2" />
                  {copied ? 'Copié !' : 'Copier'}
                </button>
               </div>
            )}
          </div>
          <EditableTextArea
            text={outputText}
            flaggedSentences={analysisResult?.flaggedSentences || []}
            onTextChange={handleTextChange}
            isEditable={!!outputText}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerationEngine;