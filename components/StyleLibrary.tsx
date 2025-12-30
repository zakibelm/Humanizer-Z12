
import React, { useState, useRef } from 'react';
import { StyleCategory, StyleCategoryId, Document as DocType } from '../types';
import UserIcon from './icons/UserIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import ChatIcon from './icons/ChatIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';
import MegaphoneIcon from './icons/MegaphoneIcon';
import TrashIcon from './icons/TrashIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
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
    case 'marketing': return <MegaphoneIcon className={className} />;
    default: return null;
  }
};

const StyleLibrary: React.FC<StyleLibraryProps> = ({ styles, setStyles }) => {
  const { t, isRTL } = useLanguage();
  const [activeCatId, setActiveCatId] = useState<StyleCategoryId | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeCategory = styles.find(s => s.id === activeCatId);

  const getTranslatedName = (id: StyleCategoryId) => {
    switch(id) {
      case 'user': return t('personal');
      case 'journalistic': return t('journalistic');
      case 'academic': return t('academic');
      case 'conversational': return t('conversational');
      case 'creative': return t('creative');
      case 'marketing': return t('marketing');
      default: return id;
    }
  };

  const handleAddDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeCatId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const newDoc: DocType = {
        id: Date.now().toString(),
        name: file.name,
        content: content
      };

      setStyles(prev => prev.map(cat => 
        cat.id === activeCatId 
          ? { ...cat, documents: [newDoc, ...cat.documents] }
          : cat
      ));
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeDocument = (docId: string) => {
    if (!activeCatId) return;
    setStyles(prev => prev.map(cat => 
      cat.id === activeCatId 
        ? { ...cat, documents: cat.documents.filter(d => d.id !== docId) }
        : cat
    ));
  };

  return (
    <div className="flex flex-col h-full overflow-hidden p-6 animate-fade-in relative">
      {!activeCatId ? (
        <>
          <div className="mb-6">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase italic">{t('moulageTitle')}</h2>
            <p className="text-[11px] text-muted-foreground/60 mt-2 leading-relaxed">{t('moulageSub')}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 flex-grow overflow-y-auto custom-scrollbar pb-4">
            {styles.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCatId(cat.id)}
                className="flex flex-col items-center justify-center p-6 rounded-2xl border border-white/5 bg-white/5 transition-all duration-300 hover:border-primary hover:bg-primary/5 group"
              >
                <div className="w-10 h-10 mb-3 rounded-full flex items-center justify-center text-muted-foreground/40 group-hover:text-primary transition-colors">
                   <CategoryIcon id={cat.id} className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-center text-muted-foreground/50 group-hover:text-white">
                  {getTranslatedName(cat.id)}
                </span>
                <span className="text-[8px] mt-2 font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                  {cat.documents.length} REFS
                </span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <div className="flex flex-col h-full animate-fade-in">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setActiveCatId(null)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-primary hover:text-white transition-all">
              <ChevronDoubleLeftIcon className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
            </button>
            <div>
              <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">{getTranslatedName(activeCatId)}</h2>
              <p className="text-[9px] text-primary font-black uppercase tracking-widest">Base de connaissances</p>
            </div>
          </div>
          <div className="flex-grow overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-6">
            <button onClick={() => fileInputRef.current?.click()} className="w-full p-4 border-2 border-dashed border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-primary/40 hover:bg-primary/5 transition-all group">
              <PlusCircleIcon className="w-6 h-6 text-muted-foreground/40 group-hover:text-primary transition-colors" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground group-hover:text-white">Ajouter une référence</span>
              <input type="file" ref={fileInputRef} onChange={handleAddDocument} className="hidden" accept=".txt,.md,.docx" />
            </button>
            {activeCategory?.documents.map((doc) => (
              <div key={doc.id} className="p-4 bg-white/5 border border-white/5 rounded-2xl group relative hover:border-white/10 transition-all">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex flex-col overflow-hidden">
                    <span className="text-[10px] font-black text-white/80 truncate pr-8">{doc.name}</span>
                    <span className="text-[8px] text-muted-foreground/40 uppercase font-black">{doc.content.length} CHARS</span>
                  </div>
                  <button onClick={() => removeDocument(doc.id)} className="p-1.5 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[9px] text-muted-foreground/40 line-clamp-2 leading-relaxed italic">"{doc.content.substring(0, 100)}..."</p>
              </div>
            ))}
          </div>
        </div>
      )}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: oklch(var(--primary) / 0.1); border-radius: 20px; }
      `}</style>
    </div>
  );
};

export default StyleLibrary;
