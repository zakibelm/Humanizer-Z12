
import React, { useState, useMemo, useEffect, useRef } from 'react';
import ClipboardIcon from './icons/ClipboardIcon';
import SparklesIcon from './icons/SparklesIcon';
import { AnalysisResult, AgenticConfig, WorkflowStep } from '../types';
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
  agenticConfig: AgenticConfig;
  setAgenticConfig: (config: AgenticConfig) => void;
  workflowLogs: WorkflowStep[];
}

const GenerationEngine: React.FC<GenerationEngineProps> = ({
  inputText, setInputText, outputText, setOutputText, isLoading, handleGenerate, analysisResult, error, workflowLogs
}) => {
  const [copied, setCopied] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => { if (logsEndRef.current) logsEndRef.current.scrollIntoView({ behavior: 'smooth' }); }, [workflowLogs]);

  const handleCopy = () => {
    navigator.clipboard.writeText(outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col h-full bg-card/20 overflow-hidden">
      {/* Scrollable Area */}
      <div className="flex-grow flex flex-col p-8 overflow-y-auto custom-scrollbar gap-8">
        
        {/* Input */}
        <div className="flex flex-col gap-3 group">
          <div className="flex justify-between items-center px-2">
            <span className="text-[11px] font-black uppercase text-muted-foreground tracking-widest flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-primary/40"></span>
               Source Digitale
            </span>
            <span className={`text-[10px] font-bold ${inputText.length > MAX_INPUT_CHARS ? 'text-destructive' : 'text-muted-foreground/50'}`}>
               {inputText.length.toLocaleString()} / {MAX_INPUT_CHARS.toLocaleString()}
            </span>
          </div>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Insérez le texte généré par l'IA ici..."
            className="w-full h-48 p-6 bg-black/30 border border-border/50 rounded-3xl focus:ring-4 focus:ring-primary/10 transition-all resize-none text-foreground placeholder:text-muted-foreground/20 font-serif leading-relaxed text-lg outline-none"
          />
        </div>

        {/* Workflow & Action */}
        <div className="flex flex-col gap-6 items-center">
            {workflowLogs.length > 0 && (
                <div className="w-full max-w-2xl p-4 bg-primary/5 rounded-2xl border border-primary/20 space-y-2">
                    {workflowLogs.map((log) => (
                        <div key={log.id} className="flex items-center text-[10px] font-mono">
                            <span className={`w-2 h-2 rounded-full mr-3 ${log.status === 'success' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' : 'bg-primary animate-pulse'}`}></span>
                            <span className="font-bold text-foreground/80 mr-2 uppercase tracking-tighter">{log.label}:</span>
                            <span className="text-muted-foreground italic truncate">{log.details}</span>
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>
            )}

            {error && <div className="p-4 bg-destructive/10 border border-destructive/20 text-destructive text-xs font-bold rounded-2xl w-full max-w-2xl text-center uppercase tracking-widest">{error}</div>}

            <button
              onClick={handleGenerate}
              disabled={isLoading || !inputText.trim()}
              className="group relative w-full max-w-sm h-16 bg-primary text-white font-black text-sm uppercase tracking-[0.3em] rounded-full shadow-2xl shadow-primary/30 hover:shadow-primary/50 disabled:opacity-30 disabled:grayscale transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <div className="flex items-center justify-center gap-4">
                {isLoading ? (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path></svg>
                ) : <ZapIcon className="w-5 h-5" />}
                <span>{isLoading ? 'Fusion Cognitive...' : 'Lancer humanizer'}</span>
              </div>
            </button>
        </div>

        {/* Result Area */}
        <div className="flex flex-col gap-3 min-h-[400px]">
          <div className="flex justify-between items-center px-2">
            <span className="text-[11px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
               <SparklesIcon className="w-3.5 h-3.5" />
               Vibration Humaine
            </span>
            {outputText && (
               <button onClick={handleCopy} className="flex items-center gap-2 text-[10px] font-bold text-muted-foreground hover:text-primary transition-all">
                 <ClipboardIcon className="w-4 h-4" />
                 {copied ? 'Copié !' : 'Copier'}
               </button>
            )}
          </div>
          <div className="flex-grow flex flex-col">
              <EditableTextArea
                text={outputText}
                flaggedSentences={analysisResult?.flaggedSentences || []}
                onTextChange={setOutputText}
              />
          </div>
        </div>

        {/* Statistics */}
        {analysisResult && !isLoading && (
          <div className="mt-4 animate-fade-in pb-8">
             <StatisticsPanel analysis={analysisResult} outputText={outputText} />
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerationEngine;
