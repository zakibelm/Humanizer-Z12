
import React, { useState, useEffect, useRef } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import SparklesIcon from './icons/SparklesIcon';
import { AnalysisResult, WorkflowStep } from '../types';
import EditableTextArea from './EditableTextArea';
import ZapIcon from './icons/ZapIcon';
import { useLanguage } from '../context/LanguageContext';

interface GenerationEngineProps {
  inputText: string;
  setInputText: (text: string) => void;
  outputText: string;
  setOutputText: (text: string) => void;
  isLoading: boolean;
  handleGenerate: () => void;
  analysisResult: AnalysisResult | null;
  error: string | null;
  workflowLogs: WorkflowStep[];
}

const GenerationEngine: React.FC<GenerationEngineProps> = ({
  inputText, setInputText, outputText, setOutputText, isLoading, handleGenerate, analysisResult, error, workflowLogs
}) => {
  const { t, isRTL } = useLanguage();
  const [copied, setCopied] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`flex flex-col h-full bg-[#0c0c0e] overflow-hidden relative ${isRTL ? 'text-right' : 'text-left'}`}>
      
      <div className="absolute top-4 left-0 right-0 z-20 px-8 flex justify-between items-center pointer-events-none">
         <div className="flex gap-2 pointer-events-auto">
            <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-full px-3 py-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-destructive rounded-full"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-destructive">{t('highRisk')}</span>
            </div>
            <div className="bg-black/60 backdrop-blur-md border border-white/5 rounded-full px-3 py-1 flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full"></div>
                <span className="text-[9px] font-black uppercase tracking-widest text-yellow-500">{t('moderate')}</span>
            </div>
         </div>
         <div className="flex gap-2 pointer-events-auto">
             <button onClick={handleCopy} className="w-10 h-10 bg-black/60 backdrop-blur-md border border-white/5 rounded-full flex items-center justify-center hover:bg-white/10 transition-all">
                <ClipboardIcon className="w-5 h-5 text-white/40" />
             </button>
         </div>
      </div>

      <div className="flex-grow flex flex-col p-8 overflow-y-auto custom-scrollbar gap-12 pt-20">
        <div className="flex flex-col gap-6 relative">
          <EditableTextArea
            text={outputText || inputText}
            flaggedSentences={analysisResult?.flaggedSentences || []}
            onTextChange={outputText ? setOutputText : setInputText}
            placeholder={t('placeholder')}
          />
        </div>

        {analysisResult && (
           <div className="bg-black/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-6 shadow-2xl animate-fade-in max-w-lg mx-auto w-full relative">
              <div className="flex items-center justify-between mb-6">
                 <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('humanScore')}</span>
                    </div>
                    <div className="flex items-end gap-2">
                        <span className="text-4xl font-black text-white italic">{analysisResult.detectionRisk.score}%</span>
                        <span className="text-[10px] font-black uppercase tracking-widest text-destructive mb-1.5">{t('highRisk')}</span>
                    </div>
                 </div>
                 <div className={isRTL ? 'text-left' : 'text-right'}>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground block mb-1">{t('words')}</span>
                    <span className="text-2xl font-black text-white italic">{outputText.split(/\s+/).filter(Boolean).length}</span>
                    <p className="text-[9px] text-muted-foreground/40 font-bold uppercase tracking-tighter">~2 {t('readTime')}</p>
                 </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-primary to-primary-foreground text-white font-black text-xs uppercase tracking-[0.4em] rounded-2xl shadow-xl shadow-primary/30 hover:shadow-primary/50 disabled:opacity-30 transition-all flex items-center justify-center gap-3"
              >
                {isLoading ? '...' : <ZapIcon className="w-5 h-5" />}
                <span>{isLoading ? '...' : t('launchBtn')}</span>
              </button>
           </div>
        )}

        {!analysisResult && (
           <div className="flex flex-col items-center justify-center gap-8 py-20 opacity-20 group">
              <div className="w-24 h-24 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20">
                <SparklesIcon className="w-12 h-12 text-primary" />
              </div>
              <button
                onClick={handleGenerate}
                disabled={isLoading || !inputText.trim()}
                className="h-16 px-12 bg-primary text-white font-black text-xs uppercase tracking-[0.5em] rounded-full shadow-2xl shadow-primary/20"
              >
                {t('launchBtn')}
              </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default GenerationEngine;
