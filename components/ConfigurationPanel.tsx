
import React from 'react';
import { IterationStepConfig } from '../types';
import CogIcon from './icons/CogIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import PencilIcon from './icons/PencilIcon';
import BeakerIcon from './icons/BeakerIcon';
import FingerPrintIcon from './icons/FingerPrintIcon';
import SparklesIcon from './icons/SparklesIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';

interface ConfigurationPanelProps {
  workflow: IterationStepConfig[];
  setWorkflow: React.Dispatch<React.SetStateAction<IterationStepConfig[]>>;
  isOpen: boolean;
  onToggle: () => void;
}

const AgentIcon: React.FC<{ index: number; className?: string }> = ({ index, className }) => {
  switch (index) {
    case 0: return <PencilIcon className={className} />;
    case 1: return <BeakerIcon className={className} />;
    case 2: return <FingerPrintIcon className={className} />;
    case 3: return <SparklesIcon className={className} />;
    case 4: return <CheckBadgeIcon className={className} />;
    default: return <CogIcon className={className} />;
  }
};

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ workflow, setWorkflow, isOpen, onToggle }) => {
  
  const updateStep = (id: string, updates: Partial<IterationStepConfig>) => {
    setWorkflow(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  return (
    <div className={`relative bg-card/60 backdrop-blur-xl rounded-3xl border border-border h-full transition-all duration-400 ease-in-out shadow-2xl flex flex-col ${isOpen ? 'w-full' : 'w-14'}`}>
      {/* Toggle Button */}
      <button 
        onClick={onToggle} 
        className={`absolute top-6 z-20 w-8 h-8 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          isOpen ? '-left-4' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        {isOpen ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
      </button>

      {/* Closed State Icons */}
      {!isOpen && (
        <div className="flex flex-col items-center pt-20 gap-6 overflow-y-auto scrollbar-hide">
          {workflow.map((step, index) => (
            <div key={step.id} className="group relative" title={step.agentName}>
               <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 ${
                 step.active 
                   ? 'bg-primary/20 text-primary shadow-[0_0_10px_rgba(var(--primary),0.1)]' 
                   : 'text-muted-foreground/40 grayscale hover:grayscale-0 hover:text-muted-foreground'
               }`}>
                  <AgentIcon index={index} className="w-5 h-5" />
               </div>
               {step.active && (
                  <div className="absolute top-0 right-0 w-2 h-2 bg-primary rounded-full border border-background shadow-[0_0_5px_rgba(var(--primary),0.5)]"></div>
               )}
            </div>
          ))}
          <div className="mt-4 w-px h-12 bg-gradient-to-b from-border to-transparent"></div>
          <div className="text-[9px] font-black uppercase vertical-text tracking-[0.2em] text-muted-foreground/40 pb-8">Agents Workflow</div>
        </div>
      )}

      {/* Open Content */}
      <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 invisible absolute'}`}>
        <div className="p-6 border-b border-border bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <CogIcon className="w-5 h-5 text-primary animate-spin-slow" />
              <h2 className="text-lg font-black ml-3 tracking-tighter uppercase italic text-foreground">Agents Z12</h2>
            </div>
            <div className="px-2 py-0.5 bg-primary rounded text-[10px] font-black text-white shadow-sm">
              {workflow.filter(s => s.active).length} / 5
            </div>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {workflow.map((step, index) => (
            <div key={step.id} className={`p-4 rounded-2xl border transition-all duration-300 relative group ${
              step.active 
                ? 'border-primary/50 bg-card/50 shadow-xl' 
                : 'border-border bg-muted/20 opacity-40 grayscale hover:opacity-60'
            }`}>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${step.active ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-muted text-muted-foreground'}`}>
                      <AgentIcon index={index} className="w-5 h-5" />
                   </div>
                   <input 
                      type="text"
                      value={step.agentName}
                      onChange={(e) => updateStep(step.id, { agentName: e.target.value })}
                      className={`bg-transparent font-bold text-sm focus:outline-none border-b border-transparent focus:border-primary/30 ${step.active ? 'text-foreground' : 'text-muted-foreground'}`}
                      placeholder="Agent"
                    />
                </div>
                
                {/* Switch Toggle */}
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={step.active} 
                    onChange={(e) => updateStep(step.id, { active: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-muted rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary shadow-inner"></div>
                </label>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${step.active ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 h-0 overflow-hidden'}`}>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-primary/70 uppercase tracking-widest block">Modèle Cognitif</label>
                  <select 
                    value={step.model}
                    onChange={(e) => updateStep(step.id, { model: e.target.value })}
                    className="w-full bg-input border border-border/50 rounded-xl p-2 text-xs text-foreground focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                  >
                    <option value="anthropic/claude-3.5-sonnet">Claude 3.5 Sonnet</option>
                    <option value="openai/gpt-4o">GPT-4o</option>
                    <option value="meta-llama/llama-3.1-405b">Llama 3.1 405B</option>
                    <option value="google/gemini-2.0-flash-exp">Gemini 2.0 Flash</option>
                    <option value="mistralai/mistral-large">Mistral Large 2</option>
                    <option value="anthropic/claude-3-opus">Claude 3 Opus</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-primary/70 uppercase tracking-widest block">Instructions Système</label>
                  <textarea 
                    value={step.systemPrompt}
                    onChange={(e) => updateStep(step.id, { systemPrompt: e.target.value })}
                    className="w-full h-24 bg-black/20 border border-border/50 rounded-xl p-3 text-[10px] font-mono leading-relaxed resize-none focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder:text-muted-foreground/30 scrollbar-hide"
                    placeholder="Directives pour cet agent..."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="p-4 bg-muted/10 border-t border-border">
           <p className="text-[9px] text-muted-foreground font-medium text-center italic">
             La séquence s'exécute de haut en bas.
           </p>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: oklch(var(--primary) / 0.1); border-radius: 20px; }
        .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ConfigurationPanel;
