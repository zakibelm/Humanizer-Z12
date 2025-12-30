
import React, { useState, useMemo } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import SparklesIcon from './icons/SparklesIcon';
import { AnalysisResult, WorkflowStep } from '../types';
import EditableTextArea from './EditableTextArea';
import ZapIcon from './icons/ZapIcon';
import RefreshIcon from './icons/RefreshIcon';
import MagnifyingGlassIcon from './icons/MagnifyingGlassIcon';
import { useLanguage } from '../context/LanguageContext';

interface GenerationEngineProps {
  inputText: string;
  setInputText: (text: string) => void;
  outputText: string;
  setOutputText: (text: string) => void;
  isLoading: boolean;
  handleGenerate: () => void;
  handleReAnalyze: () => void;
  analysisResult: AnalysisResult | null;
  error: string | null;
  workflowLogs: WorkflowStep[];
}

const GenerationEngine: React.FC<GenerationEngineProps> = ({
  inputText, setInputText, outputText, setOutputText, isLoading, handleGenerate, handleReAnalyze, analysisResult, error, workflowLogs
}) => {
  const { t, isRTL } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(outputText || inputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = useMemo(() => {
    if (!outputText) return 0;
    return outputText.trim().split(/\s+/).filter(w => w.length > 0).length;
  }, [outputText]);

  const efficiencyRatio = useMemo(() => {
    if (!analysisResult || wordCount === 0) return 0;
    // Ratio du score d'humanisation par rapport au nombre de mots (normalisé pour 100 mots)
    return (analysisResult.detectionRisk.score / (wordCount / 100)).toFixed(2);
  }, [analysisResult, wordCount]);

  return (
    <div className={`flex flex-col h-full bg-[#0c0c0e] overflow-hidden relative ${isRTL ? 'text-right' : 'text-left'}`}>
      
      {/* Barre d'outils flottante */}
      <div className="absolute top-4 left-0 right-0 z-30 px-6 flex justify-between items-center pointer-events-none">
         <div className="flex gap-2 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-full px-4 py-1.5 flex items-center gap-2 shadow-2xl">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{t('vibrationActive')}</span>
            </div>
         </div>
         <div className="flex gap-2 pointer-events-auto">
             <button onClick={handleCopy} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all shadow-2xl">
                <ClipboardIcon className={`w-5 h-5 ${copied ? 'text-primary' : 'text-white/40'}`} />
             </button>
         </div>
      </div>

      <div className="flex-grow grid grid-cols-1 md:grid-cols-2 h-full overflow-hidden">
        
        {/* CANEVAS 1: SOURCE */}
        <div className={`flex flex-col border-white/5 p-8 pt-20 transition-all h-full ${isRTL ? 'border-l' : 'border-r'}`}>
           <div className="mb-4 flex items-center gap-2 opacity-40">
              <SparklesIcon className="w-4 h-4" />
              <span className="text-[10px] font-black uppercase tracking-widest">{t('sourceTitle')}</span>
           </div>
           <div className="flex-grow overflow-hidden mb-6">
             <textarea
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               placeholder={t('placeholder')}
               className="w-full h-full bg-transparent outline-none text-xl font-serif text-white/60 leading-relaxed resize-none custom-scrollbar"
             />
           </div>
           <div className="mt-auto">
              <button
                onClick={handleGenerate}
                disabled={isLoading || !inputText.trim()}
                className="group relative w-full h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-3 overflow-hidden transition-all hover:bg-primary hover:border-primary disabled:opacity-20"
              >
                <ZapIcon className={`w-5 h-5 text-primary group-hover:text-white transition-colors ${isLoading ? 'animate-pulse' : ''}`} />
                <span className="text-xs font-black uppercase tracking-[0.3em] text-white">{isLoading ? t('humanizing') : t('launchBtn')}</span>
              </button>
           </div>
        </div>

        {/* CANEVAS 2: ARTIFACT */}
        <div className="flex flex-col bg-black/20 p-8 pt-20 relative group/artifact h-full overflow-hidden">
           <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2 opacity-60">
                <ZapIcon className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest">{t('artifactTitle')}</span>
              </div>
              
              {analysisResult && (
                 <div className="flex items-center gap-6 animate-fade-in bg-black/40 px-4 py-2 rounded-xl border border-white/5">
                    <div className="flex flex-col items-end">
                        <span className="text-[14px] font-black text-primary italic leading-none">{analysisResult.detectionRisk.score}%</span>
                        <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-tighter">{t('humanScore')}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[14px] font-black text-white italic leading-none">{wordCount}</span>
                        <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-tighter">{t('words')}</span>
                    </div>
                    <div className="w-px h-6 bg-white/10"></div>
                    <div className="flex flex-col items-end">
                        <span className="text-[14px] font-black text-secondary italic leading-none">{efficiencyRatio}</span>
                        <span className="text-[7px] font-bold text-muted-foreground uppercase tracking-tighter">{t('efficiencyRatio')}</span>
                    </div>
                 </div>
              )}
           </div>

           <div className="flex-grow overflow-y-auto custom-scrollbar pr-2 h-full">
              <EditableTextArea
                text={outputText}
                flaggedSentences={analysisResult?.flaggedSentences || []}
                onTextChange={setOutputText}
                placeholder={isLoading ? "Architecting Content..." : "L'Artifact traité apparaîtra ici..."}
              />
           </div>

           {/* ACTIONS ARTIFACT */}
           <div className={`mt-6 grid grid-cols-2 gap-3 transition-all duration-500 ${(outputText || analysisResult) ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
              <button
                onClick={handleReAnalyze}
                disabled={isLoading || !outputText}
                className="h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center gap-2 hover:bg-white/10 transition-all disabled:opacity-20"
              >
                <MagnifyingGlassIcon className="w-4 h-4 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white/80">{t('reAnalyze')}</span>
              </button>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !outputText}
                className="h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-2 hover:bg-primary/20 transition-all disabled:opacity-20"
              >
                <RefreshIcon className="w-4 h-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-widest text-primary">{t('reHumanize')}</span>
              </button>
           </div>

           {error && (
             <div className="absolute bottom-24 left-8 right-8 bg-destructive/20 border border-destructive/30 p-4 rounded-xl animate-fade-in z-40">
                <p className="text-[10px] text-destructive font-black uppercase tracking-widest">{error}</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default GenerationEngine;
