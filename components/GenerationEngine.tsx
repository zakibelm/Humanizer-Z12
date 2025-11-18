
import React, { useState } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import SparklesIcon from './icons/SparklesIcon';
import { AnalysisResult } from '../types';
import StatisticsPanel from './StatisticsPanel';
import { MAX_INPUT_CHARS } from '../constants';
import EditableTextArea from './EditableTextArea';
import ZapIcon from './icons/ZapIcon';

interface GenerationEngineProps {
  inputText: string;
  setInputText: (text: string) => void;
  outputText: string;
  setOutputText: (text: string) => void;
  isLoading: boolean;
  isRefining: boolean;
  handleGenerate: () => void;
  handleRefine: () => void;
  handleReanalyze: () => void;
  analysisResult: AnalysisResult | null;
  error: string | null;
  hasBeenEdited: boolean;
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
  analysisResult,
  error,
  hasBeenEdited
}) => {
  const [copied, setCopied] = useState(false);
  const isInputTooLong = inputText.length > MAX_INPUT_CHARS;
  const isInputEmpty = !inputText.trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            className={`w-full flex-grow p-3 bg-input/80 border rounded-md focus:ring-2 focus:ring-ring transition-all duration-200 resize-none text-foreground placeholder:text-muted-foreground ${isInputTooLong ? 'border-destructive focus:border-destructive' : 'border-input focus:border-primary'}`}
          />
          <div className={`text-right text-xs mt-1 ${isInputTooLong ? 'text-destructive' : 'text-muted-foreground'}`}>
            {inputText.length} / {MAX_INPUT_CHARS}
          </div>
        </div>
        
        {error && (
            <div className="mb-4 p-3 bg-destructive/20 border border-destructive/50 text-destructive-foreground rounded-md text-sm animate-fade-in" role="alert">
                <p><b className="font-semibold">Erreur :</b> {error}</p>
            </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isLoading || isRefining || isInputEmpty || isInputTooLong}
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
              Résultat (modifiable)
            </label>
            {outputText && (
               <div className="flex items-center space-x-2">
                 {!hasBeenEdited && analysisResult && analysisResult.detectionRisk.score < 90 && (
                    <button
                        onClick={handleRefine}
                        disabled={isRefining || isLoading}
                        className="flex items-center text-xs font-medium px-3 py-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm transition-colors disabled:bg-muted disabled:text-muted-foreground"
                        title="Laisser l'IA améliorer le texte pour réduire le risque de détection"
                    >
                        <SparklesIcon className="w-4 h-4 mr-2"/>
                        {isRefining ? 'Amélioration...' : 'Améliorer'}
                    </button>
                 )}
                 {hasBeenEdited && (
                    <button
                        onClick={handleReanalyze}
                        disabled={isRefining || isLoading}
                        className="flex items-center text-xs font-medium px-3 py-1 bg-accent text-accent-foreground hover:bg-accent/90 rounded-sm transition-colors disabled:bg-muted disabled:text-muted-foreground"
                        title="Analyser vos modifications manuelles"
                    >
                       <ZapIcon className="w-4 h-4 mr-2"/>
                       {isRefining ? 'Analyse...' : 'Re-analyser'}
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
          {analysisResult && (
            <div className="text-xs text-muted-foreground mb-2 flex items-center space-x-3 text-center">
              <span>Légende:</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500/50 mr-1 border border-red-500/80"></span>Risque Élevé</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-orange-500/50 mr-1 border border-orange-500/80"></span>Modéré</span>
              <span className="flex items-center"><span className="w-3 h-3 rounded-full bg-yellow-500/50 mr-1 border border-yellow-500/80"></span>Faible</span>
            </div>
          )}
          <EditableTextArea
            text={outputText}
            flaggedSentences={analysisResult?.flaggedSentences || []}
            onTextChange={setOutputText}
          />
        </div>
      </div>
    </div>
  );
};

export default GenerationEngine;
