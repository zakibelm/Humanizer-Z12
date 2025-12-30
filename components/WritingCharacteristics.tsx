
import React from 'react';
import { WritingConfig } from '../types';
import { useLanguage } from '../context/LanguageContext';
import SparklesIcon from './icons/SparklesIcon';
import AdjustmentsIcon from './icons/AdjustmentsIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';

interface WritingCharacteristicsProps {
  config: WritingConfig;
  onChange: (config: WritingConfig) => void;
}

const WritingCharacteristics: React.FC<WritingCharacteristicsProps> = ({ config, onChange }) => {
  const { t, isRTL } = useLanguage();

  const handleUpdate = (updates: Partial<WritingConfig>) => {
    onChange({ ...config, ...updates });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 animate-fade-in space-y-8">
      <div className="mb-2">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{t('characteristics')}</h2>
        <p className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed">Ajustez manuellement les curseurs de personnalité de l'Artifact.</p>
      </div>

      <div className="space-y-6 overflow-y-auto custom-scrollbar pr-2 flex-grow pb-8">
        {/* TEMPERATURE */}
        <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                 <SparklesIcon className="w-3.5 h-3.5" />
                 {t('temperature')}
              </label>
              <span className="text-xs font-black text-white italic">{config.temperature.toFixed(1)}</span>
           </div>
           <input 
             type="range" min="0" max="1.5" step="0.1" 
             value={config.temperature}
             onChange={(e) => handleUpdate({ temperature: parseFloat(e.target.value) })}
             className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-primary"
           />
        </div>

        {/* FORMALITY */}
        <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
           <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-widest text-white/80 flex items-center gap-2">
                 <AdjustmentsIcon className="w-3.5 h-3.5" />
                 {t('formality')}
              </label>
              <span className="text-xs font-black text-white italic">{Math.round(config.formality * 100)}%</span>
           </div>
           <input 
             type="range" min="0" max="1" step="0.05" 
             value={config.formality}
             onChange={(e) => handleUpdate({ formality: parseFloat(e.target.value) })}
             className="w-full h-1.5 bg-black/40 rounded-full appearance-none cursor-pointer accent-white/20"
           />
        </div>

        {/* CONTEXT / TONE */}
        <div className="space-y-4">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{t('tone')}</label>
            <div className="grid grid-cols-2 gap-2">
                {[
                    { id: 'startup', label: t('toneStartup') },
                    { id: 'corporate', label: t('toneCorporate') },
                    { id: 'academic', label: t('toneAcademic') },
                    { id: 'creative', label: t('toneCreative') },
                    { id: 'friendly', label: t('toneFriendly') },
                    { id: 'marketing', label: t('toneMarketing') }
                ].map((tone) => (
                    <button
                        key={tone.id}
                        onClick={() => handleUpdate({ professionalism: tone.id as any })}
                        className={`p-3 text-left text-[10px] font-black uppercase tracking-widest rounded-xl border transition-all ${
                            config.professionalism === tone.id 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-white/5 border-white/5 text-muted-foreground/60 hover:bg-white/10'
                        }`}
                    >
                        <div className="flex items-center gap-2">
                           {tone.id === 'marketing' && <MegaphoneIcon className="w-3 h-3" />}
                           {tone.label}
                        </div>
                    </button>
                ))}
            </div>
        </div>

        {/* EMPATHY & HUMOR */}
        <div className="grid grid-cols-2 gap-3">
            <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t('empathy')}</label>
                <input type="range" min="0" max="1" step="0.1" value={config.empathy} onChange={(e) => handleUpdate({ empathy: parseFloat(e.target.value) })} className="w-full h-1 bg-black/40 rounded-full appearance-none cursor-pointer accent-primary/40" />
            </div>
            <div className="space-y-3 p-4 bg-white/5 border border-white/5 rounded-2xl">
                <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/60">{t('humor')}</label>
                <input type="range" min="0" max="1" step="0.1" value={config.humor} onChange={(e) => handleUpdate({ humor: parseFloat(e.target.value) })} className="w-full h-1 bg-black/40 rounded-full appearance-none cursor-pointer accent-primary/40" />
            </div>
        </div>
      </div>
    </div>
  );
};

export default WritingCharacteristics;
