
import React, { useState } from 'react';
import { StyleCategory, IterationStepConfig, WritingConfig } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';
import CogIcon from './icons/CogIcon';
import SparklesIcon from './icons/SparklesIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';
import StyleLibrary from './StyleLibrary';
import ConfigurationPanel from './ConfigurationPanel';
import WritingCharacteristics from './WritingCharacteristics';
import { useLanguage } from '../context/LanguageContext';

interface UnifiedSidebarProps {
  styles: StyleCategory[];
  setStyles: React.Dispatch<React.SetStateAction<StyleCategory[]>>;
  workflow: IterationStepConfig[];
  setWorkflow: React.Dispatch<React.SetStateAction<IterationStepConfig[]>>;
  writingConfig: WritingConfig;
  setWritingConfig: (config: WritingConfig) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const UnifiedSidebar: React.FC<UnifiedSidebarProps> = ({
  styles, setStyles, workflow, setWorkflow, writingConfig, setWritingConfig, isOpen, onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'characteristics' | 'workflow'>('library');
  const { t, isRTL } = useLanguage();

  const CloseIcon = isRTL 
    ? (isOpen ? ChevronDoubleRightIcon : ChevronDoubleLeftIcon)
    : (isOpen ? ChevronDoubleLeftIcon : ChevronDoubleRightIcon);

  return (
    <div className={`relative bg-card/60 backdrop-blur-3xl rounded-3xl border border-white/10 h-full transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] shadow-2xl flex flex-col ${isOpen ? 'w-[360px]' : 'w-16'}`}>
      
      <button 
        onClick={onToggle} 
        className={`absolute top-6 z-30 w-8 h-8 rounded-full bg-primary text-white shadow-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          isOpen ? (isRTL ? '-left-4' : '-right-4') : 'left-1/2 -translate-x-1/2'
        }`}
      >
        <CloseIcon className="w-5 h-5" />
      </button>

      <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 invisible'}`}>
        <div className="flex p-1.5 gap-1 bg-black/20 m-4 rounded-2xl border border-white/5">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'library' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <BookOpenIcon className="w-3.5 h-3.5" />
            {t('library')}
          </button>
          <button
            onClick={() => setActiveTab('characteristics')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'characteristics' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <SparklesIcon className="w-3.5 h-3.5" />
            {t('characteristics')}
          </button>
          <button
            onClick={() => setActiveTab('workflow')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
              activeTab === 'workflow' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground hover:bg-white/5'
            }`}
          >
            <CogIcon className="w-3.5 h-3.5" />
            {t('workflow')}
          </button>
        </div>

        <div className="flex-grow overflow-hidden relative">
          <div className={`absolute inset-0 transition-all duration-500 transform ${activeTab === 'library' ? 'translate-x-0 opacity-100' : (isRTL ? 'translate-x-full' : '-translate-x-full') + ' opacity-0 pointer-events-none'}`}>
             <StyleLibrary styles={styles} setStyles={setStyles} />
          </div>
          <div className={`absolute inset-0 transition-all duration-500 transform ${activeTab === 'characteristics' ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0 pointer-events-none'}`}>
             <WritingCharacteristics config={writingConfig} onChange={setWritingConfig} />
          </div>
          <div className={`absolute inset-0 transition-all duration-500 transform ${activeTab === 'workflow' ? 'translate-x-0 opacity-100' : (isRTL ? '-translate-x-full' : 'translate-x-full') + ' opacity-0 pointer-events-none'}`}>
             <ConfigurationPanel workflow={workflow} setWorkflow={setWorkflow} />
          </div>
        </div>
      </div>

      {!isOpen && (
        <div className="flex flex-col items-center pt-20 gap-8">
           <button onClick={() => { setActiveTab('library'); onToggle(); }} className={`p-2 rounded-xl transition-all ${activeTab === 'library' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/40'}`}>
             <BookOpenIcon className="w-6 h-6" />
           </button>
           <button onClick={() => { setActiveTab('characteristics'); onToggle(); }} className={`p-2 rounded-xl transition-all ${activeTab === 'characteristics' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/40'}`}>
             <SparklesIcon className="w-6 h-6" />
           </button>
           <button onClick={() => { setActiveTab('workflow'); onToggle(); }} className={`p-2 rounded-xl transition-all ${activeTab === 'workflow' ? 'bg-primary/20 text-primary' : 'text-muted-foreground/40'}`}>
             <CogIcon className="w-6 h-6" />
           </button>
           <div className="text-[9px] font-black uppercase vertical-text tracking-[0.2em] text-muted-foreground/30">Z12</div>
        </div>
      )}
    </div>
  );
};

export default UnifiedSidebar;
