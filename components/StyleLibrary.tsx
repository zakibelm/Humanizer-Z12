
import React from 'react';
import { StyleCategory, StyleCategoryId } from '../types';
import UserIcon from './icons/UserIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import ChatIcon from './icons/ChatIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
import DownloadIcon from './icons/DownloadIcon';
import SparklesIcon from './icons/SparklesIcon';
import { useLanguage } from '../context/LanguageContext';

interface StyleLibraryProps {
  styles: StyleCategory[];
  setStyles: React.Dispatch<React.SetStateAction<StyleCategory[]>>;
}

const CategoryIcon: React.FC<{ id: StyleCategoryId; className?: string }> = ({ id, className }) => {
  switch (id) {
    case 'user': return <UserIcon className={className} />;
    case 'journalistic': return <NewspaperIcon className={className} />;
    case 'academic': return <AcademicCapIcon className={className} />;
    case 'conversational': return <ChatIcon className={className} />;
    case 'creative': return <PaintBrushIcon className={className} />;
    default: return null;
  }
};

const StyleLibrary: React.FC<StyleLibraryProps> = ({ styles }) => {
  const [selectedId, setSelectedId] = React.useState<StyleCategoryId>('conversational');
  const { t } = useLanguage();

  const getTranslatedName = (id: StyleCategoryId) => {
    switch(id) {
      case 'user': return t('personal');
      case 'journalistic': return t('journalistic');
      case 'academic': return t('academic');
      case 'conversational': return t('conversational');
      case 'creative': return t('creative');
      default: return id;
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 animate-fade-in">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{t('moulageTitle')}</h2>
        <p className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed">{t('moulageSub')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8">
        {styles.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedId(cat.id)}
            className={`flex flex-col items-center justify-center p-6 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
              selectedId === cat.id ? 'border-primary bg-primary/10 shadow-lg' : 'border-white/5 bg-white/5'
            }`}
          >
            <div className={`w-10 h-10 mb-3 rounded-full flex items-center justify-center ${selectedId === cat.id ? 'text-primary' : 'text-muted-foreground/40'}`}>
               <CategoryIcon id={cat.id} className="w-6 h-6" />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest ${selectedId === cat.id ? 'text-white' : 'text-muted-foreground/50'}`}>
              {getTranslatedName(cat.id)}
            </span>
          </button>
        ))}
      </div>

      <div className="mt-auto bg-black/30 border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
         <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
                <SparklesIcon className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-xs font-black uppercase tracking-widest text-white">{t('cloneVoice')}</h3>
            </div>
            <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-xl shadow-lg">
                <DownloadIcon className="w-4 h-4" />
                {t('importStyle')}
            </button>
         </div>
      </div>
    </div>
  );
};

export default StyleLibrary;
