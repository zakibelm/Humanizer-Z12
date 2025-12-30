
import React, { useState } from 'react';
import { IterationStepConfig } from '../types';
import PencilIcon from './icons/PencilIcon';
import BeakerIcon from './icons/BeakerIcon';
import FingerPrintIcon from './icons/FingerPrintIcon';
import SparklesIcon from './icons/SparklesIcon';
import CheckBadgeIcon from './icons/CheckBadgeIcon';
import CogIcon from './icons/CogIcon';
import { useLanguage } from '../context/LanguageContext';

interface ConfigurationPanelProps {
  workflow: IterationStepConfig[];
  setWorkflow: React.Dispatch<React.SetStateAction<IterationStepConfig[]>>;
}

const AgentIcon: React.FC<{ index: number; className?: string }> = ({ index, className }) => {
  switch (index) {
    case 0: return <PencilIcon className={className} />;
    case 1: return <BeakerIcon className={className} />;
    case 2: return <FingerPrintIcon className={className} />;
    case 3: return <SparklesIcon className={className} />;
    case 4: return <CheckBadgeIcon className={className} />;
    default: return null;
  }
};

// Liste officielle OpenRouter STRICTE pour éviter "No endpoints found"
const AVAILABLE_MODELS = [
  'google/gemini-2.0-flash-exp:free',
  'google/gemini-flash-1.5',
  'google/gemini-pro-1.5',
  'anthropic/claude-3.5-sonnet',
  'openai/gpt-4o',
  'openai/gpt-4o-mini',
  'meta-llama/llama-3.1-405b'
];

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ workflow, setWorkflow }) => {
  const { t, isRTL } = useLanguage();
  const [editingId, setEditingId] = useState<string | null>(null);

  const toggleAgent = (id: string) => {
    setWorkflow(prev => prev.map(step => 
      step.id === id ? { ...step, active: !step.active } : step
    ));
  };

  const updateAgent = (id: string, updates: Partial<IterationStepConfig>) => {
    setWorkflow(prev => prev.map(step => 
      step.id === id ? { ...step, ...updates } : step
    ));
  };

  const getStatusInfo = (step: IterationStepConfig, index: number) => {
    if (!step.active) return { label: "BYPASSED", class: 'bg-white/5 text-muted-foreground/30 border-white/5' };
    if (index === 0 || index === 1) return { label: t('completed'), class: 'bg-green-500/20 text-green-400 border-green-500/30' };
    if (index === 2) return { label: t('processing'), class: 'bg-primary/20 text-primary border-primary/30 animate-pulse' };
    return { label: t('pending'), class: 'bg-white/5 text-muted-foreground border-white/10' };
  };
  
  return (
    <div className="flex flex-col h-full overflow-hidden p-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{t('multiAgentTitle')}</h2>
        <p className="text-[11px] text-muted-foreground/60 mt-2 uppercase tracking-widest font-black">{t('protocol')}</p>
      </div>

      <div className="space-y-4 relative flex-grow overflow-y-auto custom-scrollbar pr-2 pb-8">
        <div className={`absolute ${isRTL ? 'right-6' : 'left-6'} top-8 bottom-8 w-px bg-gradient-to-b from-primary via-primary/50 to-transparent opacity-30`}></div>
        
        {workflow.map((step, index) => {
          const status = getStatusInfo(step, index);
          const isEditing = editingId === step.id;

          return (
            <div key={step.id} className={`relative flex items-start gap-4 transition-all duration-300 ${!step.active ? 'opacity-40' : 'opacity-100'}`}>
              
              {/* Timeline Node */}
              <div className={`z-10 w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${
                  step.active ? 'bg-primary/10 border-primary text-primary shadow-lg shadow-primary/10' : 'bg-white/5 border-white/10 text-muted-foreground/20'
              }`}>
                <AgentIcon index={index} className="w-6 h-6" />
              </div>

              {/* Agent Card */}
              <div className={`flex-grow p-4 rounded-2xl border transition-all ${
                isEditing ? 'bg-primary/5 border-primary/40 shadow-2xl scale-[1.02]' : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <input 
                      type="checkbox" 
                      checked={step.active} 
                      onChange={() => toggleAgent(step.id)}
                      className="w-4 h-4 rounded bg-black/40 border-white/10 text-primary focus:ring-primary/20 transition-all cursor-pointer"
                    />
                    <h3 className="text-xs font-black uppercase tracking-widest text-white">{t(step.agentName as any)}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[8px] font-black px-2 py-0.5 rounded border tracking-widest ${status.class}`}>
                      {status.label}
                    </span>
                    <button 
                      onClick={() => setEditingId(isEditing ? null : step.id)}
                      className={`p-1.5 rounded-lg transition-all ${isEditing ? 'bg-primary text-white' : 'text-muted-foreground hover:bg-white/5 hover:text-white'}`}
                    >
                      <CogIcon className={`w-3.5 h-3.5 ${isEditing ? 'animate-spin-slow' : ''}`} />
                    </button>
                  </div>
                </div>

                {isEditing ? (
                  <div className="space-y-4 mt-4 animate-fade-in">
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">Model Engine</label>
                      <select 
                        value={step.model}
                        onChange={(e) => updateAgent(step.id, { model: e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[10px] text-white outline-none focus:border-primary/50 transition-all"
                      >
                        {AVAILABLE_MODELS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] font-black text-muted-foreground uppercase tracking-[0.2em] mb-2">System Instructions</label>
                      <textarea 
                        value={step.systemPrompt}
                        onChange={(e) => updateAgent(step.id, { systemPrompt: e.target.value })}
                        rows={3}
                        className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-[10px] text-white/70 outline-none focus:border-primary/50 transition-all resize-none custom-scrollbar"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="text-[10px] text-muted-foreground/60 leading-relaxed italic">
                    {step.model} active
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer minimaliste */}
      <div className="mt-auto border-t border-white/5 pt-6 bg-card/40 -mx-6 px-6 -mb-6 pb-6">
        <div className="flex justify-between items-end mb-2">
            <div>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">{t('totalProgress')}</span>
                <h4 className="text-sm font-black text-white italic">{t('humanizing')}</h4>
            </div>
            <span className="text-2xl font-black text-primary italic">68%</span>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: oklch(var(--primary) / 0.1); border-radius: 20px; }
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ConfigurationPanel;
