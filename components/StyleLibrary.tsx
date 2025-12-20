
import React, { useRef, useState } from 'react';
import { StyleCategory, Document, StyleCategoryId } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';
import TrashIcon from './icons/TrashIcon';
import UserIcon from './icons/UserIcon';
import NewspaperIcon from './icons/NewspaperIcon';
import AcademicCapIcon from './icons/AcademicCapIcon';
import ChatIcon from './icons/ChatIcon';
import PaintBrushIcon from './icons/PaintBrushIcon';

interface StyleLibraryProps {
  styles: StyleCategory[];
  setStyles: React.Dispatch<React.SetStateAction<StyleCategory[]>>;
  isOpen: boolean;
  onToggle: () => void;
}

const CategoryIcon: React.FC<{ id: StyleCategoryId; className?: string }> = ({ id, className }) => {
  switch (id) {
    case 'user': return <UserIcon className={className} />;
    case 'journalistic': return <NewspaperIcon className={className} />;
    case 'academic': return <AcademicCapIcon className={className} />;
    case 'conversational': return <ChatIcon className={className} />;
    case 'creative': return <PaintBrushIcon className={className} />;
    default: return <BookOpenIcon className={className} />;
  }
};

const AccordionItem: React.FC<{ category: StyleCategory; onAddDocument: (id: StyleCategoryId) => void; onDeleteDocument: (categoryId: StyleCategoryId, documentId: string) => void; }> = ({ category, onAddDocument, onDeleteDocument }) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(category.id === 'user');

  return (
    <div className="border-b border-border/50 last:border-b-0">
      <button
        type="button"
        className="flex items-center justify-between w-full p-4 hover:bg-muted/30 transition-all duration-200 group"
        onClick={() => setIsAccordionOpen(!isAccordionOpen)}
      >
        <div className="flex items-center gap-3">
          <CategoryIcon id={category.id} className={`w-4 h-4 transition-colors ${isAccordionOpen ? 'text-primary' : 'text-foreground/50'}`} />
          <span className={`text-xs font-black uppercase tracking-widest ${isAccordionOpen ? 'text-primary' : 'text-foreground/70'}`}>{category.name}</span>
        </div>
        <ChevronDownIcon className={`w-3.5 h-3.5 transform transition-transform duration-300 ${isAccordionOpen ? 'rotate-180 text-primary' : 'text-muted-foreground'}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${isAccordionOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 bg-black/10 rounded-b-xl mx-2 mb-2">
            <p className="text-[9px] text-muted-foreground mb-3 leading-relaxed italic">{category.description}</p>
            <ul className="space-y-1.5">
              {category.documents.map(doc => (
                <li key={doc.id} className="flex items-center justify-between text-[10px] bg-muted/40 px-3 py-1.5 rounded-lg group/item">
                  <span className="truncate max-w-[180px] font-medium" title={doc.name}>{doc.name}</span>
                  <button
                    onClick={() => onDeleteDocument(category.id, doc.id)}
                    className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors"
                  >
                    <TrashIcon className="w-3 h-3" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onAddDocument(category.id)}
              className="mt-3 w-full py-1.5 border border-dashed border-primary/30 rounded-lg flex items-center justify-center text-[10px] text-primary hover:bg-primary/5 transition-all font-black uppercase tracking-tighter"
            >
              <PlusCircleIcon className="w-3.5 h-3.5 mr-2" />
              Importer
            </button>
        </div>
      </div>
    </div>
  );
};

const StyleLibrary: React.FC<StyleLibraryProps> = ({ styles, setStyles, isOpen, onToggle }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const activeCategoryRef = useRef<StyleCategoryId | null>(null);

  const handleAddDocumentClick = (categoryId: StyleCategoryId) => {
    activeCategoryRef.current = categoryId;
    fileInputRef.current?.click();
  };

  const handleDeleteDocument = (categoryId: StyleCategoryId, documentId: string) => {
    setStyles(prev => prev.map(cat => cat.id === categoryId ? { ...cat, documents: cat.documents.filter(doc => doc.id !== documentId) } : cat));
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0 && activeCategoryRef.current) {
      const files = Array.from(event.target.files) as File[];
      const catId = activeCategoryRef.current;
      const read = (f: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsText(f); });
      const docs = (await Promise.all(files.map(async f => { try { return { id: `${catId}-${Date.now()}-${Math.random()}`, name: f.name, content: await read(f) }; } catch { return null; } }))).filter(Boolean) as Document[];
      setStyles(prev => prev.map(cat => cat.id === catId ? { ...cat, documents: [...cat.documents, ...docs] } : cat));
      activeCategoryRef.current = null;
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className={`relative bg-card/60 backdrop-blur-xl rounded-3xl border border-border h-full transition-all duration-400 ease-in-out shadow-2xl flex flex-col ${isOpen ? 'w-full' : 'w-14'}`}>
      <button 
        onClick={onToggle} 
        className={`absolute top-6 z-20 w-8 h-8 rounded-full bg-primary text-white shadow-lg flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${
          isOpen ? '-right-4' : 'left-1/2 -translate-x-1/2'
        }`}
      >
        {isOpen ? <ChevronDoubleLeftIcon className="w-5 h-5" /> : <ChevronDoubleRightIcon className="w-5 h-5" />}
      </button>

      {/* Closed State Icons */}
      {!isOpen && (
        <div className="flex flex-col items-center pt-20 gap-6 overflow-y-auto scrollbar-hide">
          {styles.map(cat => (
            <div key={cat.id} className="group relative" title={cat.name}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all duration-200">
                <CategoryIcon id={cat.id} className="w-5 h-5" />
              </div>
              {cat.documents.length > 0 && (
                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background shadow-sm"></div>
              )}
            </div>
          ))}
          <div className="mt-4 w-px h-12 bg-gradient-to-b from-border to-transparent"></div>
          <div className="text-[9px] font-black uppercase vertical-text tracking-[0.2em] text-muted-foreground/40 pb-8">Bibliothèque</div>
        </div>
      )}

      {/* Open Content */}
      <div className={`flex flex-col h-full overflow-hidden transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 invisible absolute'}`}>
        <div className="p-6 border-b border-border bg-primary/5">
          <div className="flex items-center">
            <BookOpenIcon className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-black ml-3 tracking-tighter uppercase italic text-foreground">Moulage Style</h2>
          </div>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar">
          <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" multiple />
          <div className="border-t border-border/50">
            {styles.map(cat => (
              <AccordionItem key={cat.id} category={cat} onAddDocument={handleAddDocumentClick} onDeleteDocument={handleDeleteDocument} />
            ))}
          </div>
        </div>
      </div>
      <style>{`
        .vertical-text { writing-mode: vertical-rl; transform: rotate(180deg); }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: oklch(var(--primary) / 0.1); border-radius: 20px; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default StyleLibrary;
