import React, { useRef, useState } from 'react';
import { StyleCategory, Document, StyleCategoryId } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';
import PlusCircleIcon from './icons/PlusCircleIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';
import TrashIcon from './icons/TrashIcon';

interface StyleLibraryProps {
  styles: StyleCategory[];
  setStyles: React.Dispatch<React.SetStateAction<StyleCategory[]>>;
  isOpen: boolean;
  onToggle: () => void;
}

interface AccordionItemProps {
  category: StyleCategory;
  onAddDocument: (id: StyleCategoryId) => void;
  onDeleteDocument: (categoryId: StyleCategoryId, documentId: string) => void;
}

const AccordionItem: React.FC<AccordionItemProps> = ({ category, onAddDocument, onDeleteDocument }) => {
  const [isAccordionOpen, setIsAccordionOpen] = useState(category.id === 'user');

  return (
    <div className="border-b border-border last:border-b-0">
      <h2>
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium text-left text-foreground hover:bg-muted/50 transition-colors duration-200"
          onClick={() => setIsAccordionOpen(!isAccordionOpen)}
          aria-expanded={isAccordionOpen}
        >
          <span className="text-lg text-primary">{category.name}</span>
          <ChevronDownIcon className={`w-6 h-6 transform transition-transform duration-300 ${isAccordionOpen ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isAccordionOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="p-5 border-t-0 border-border">
            <p className="text-sm text-muted-foreground mb-3">{category.description}</p>
            <ul className="space-y-2">
              {category.documents.map(doc => (
                <li key={doc.id} className="flex items-center justify-between text-sm text-foreground/80 bg-muted/50 px-3 py-1.5 rounded-md">
                  <span className="truncate" title={doc.name}>{doc.name}</span>
                  <button
                    onClick={() => onDeleteDocument(category.id, doc.id)}
                    className="ml-2 p-1 text-muted-foreground hover:text-destructive transition-colors rounded-full"
                    aria-label={`Supprimer ${doc.name}`}
                  >
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button
              onClick={() => onAddDocument(category.id)}
              className="mt-3 flex items-center text-sm text-primary hover:text-primary/90 transition-colors duration-200"
            >
              <PlusCircleIcon className="w-5 h-5 mr-2" />
              Ajouter des documents
            </button>
            <p className="text-xs text-muted-foreground/80 mt-2 italic">
              *Note : Le contenu de tous les fichiers sera lu comme du texte brut.
            </p>
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
    setStyles(prevStyles =>
      prevStyles.map(category =>
        category.id === categoryId
          ? { ...category, documents: category.documents.filter(doc => doc.id !== documentId) }
          : category
      )
    );
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0 && activeCategoryRef.current) {
      const files = Array.from(event.target.files);
      const categoryId = activeCategoryRef.current;

      const readAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsText(file, 'UTF-8');
        });
      };

      const newDocumentsPromises = files.map(async (file: File) => {
        try {
          const content = await readAsText(file);
          const timestamp = Date.now();
          const random = Math.random().toString(36).substring(2, 9);
          return {
            id: `${categoryId}-${timestamp}-${random}`,
            name: file.name,
            content: content,
          };
        } catch (error) {
          console.error(`❌ Erreur lors de la lecture du fichier ${file.name}:`, error);
          return null;
        }
      });

      const newDocuments = (await Promise.all(newDocumentsPromises)).filter(Boolean) as Document[];

      setStyles(prevStyles =>
        prevStyles.map(category =>
          category.id === categoryId
            ? { ...category, documents: [...category.documents, ...newDocuments] }
            : category
        )
      );
      
      activeCategoryRef.current = null;
      if(fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className="relative bg-card/50 rounded-lg border border-border h-full transition-all duration-300 overflow-hidden">
      <button 
        onClick={onToggle} 
        className={`absolute top-1/2 -translate-y-1/2 z-20 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors ${
          isOpen 
            ? '-right-3 bg-card border-y border-r border-border rounded-l-none'
            : 'left-1/2 -translate-x-1/2'
        }`}
        aria-label={isOpen ? "Réduire le panneau des styles" : "Ouvrir le panneau des styles"}
      >
        {isOpen ? <ChevronDoubleLeftIcon className="w-5 h-5" /> : <ChevronDoubleRightIcon className="w-5 h-5" />}
      </button>

      <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <BookOpenIcon className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-bold ml-3 text-card-foreground">Bibliothèque</h2>
          </div>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
          />
          <div className="rounded-lg border border-border overflow-hidden">
            {styles.map(category => (
              <AccordionItem 
                key={category.id} 
                category={category}
                onAddDocument={handleAddDocumentClick}
                onDeleteDocument={handleDeleteDocument}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StyleLibrary;