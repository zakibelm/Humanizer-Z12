
import React, { useRef, useEffect, useMemo } from 'react';

interface EditableTextAreaProps {
  text: string;
  flaggedSentences: string[];
  onTextChange: (newText: string) => void;
  placeholder?: string;
}

const createMarkup = (text: string, flaggedSentences: string[]): string => {
    if (!text) return '';
    let processedText = text;

    if (flaggedSentences && flaggedSentences.length > 0) {
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        const uniqueSentences = [...new Set(flaggedSentences)]
            .map(s => s.trim())
            .filter(s => s.length > 5) // Éviter de surligner des bouts de phrases trop courts
            .sort((a, b) => b.length - a.length);

        if (uniqueSentences.length > 0) {
            try {
                const regex = new RegExp(`(${uniqueSentences.map(escapeRegex).join('|')})`, 'g');
                processedText = processedText.replace(regex, (match) => {
                    const trimmedMatch = match.trim();
                    const level = uniqueSentences.findIndex(s => s.trim() === trimmedMatch);
                    const highlightLevel = level !== -1 ? level % 2 : 0;
                    const className = highlightLevel === 0 ? 'highlight-risk' : 'highlight-moderate';
                    return `<span class="${className}">${match}</span>`;
                });
            } catch (e) {
                console.error("Regex highlight error:", e);
            }
        }
    }
    // Remplacement des sauts de ligne par <br> pour le rendu HTML
    return processedText.split('\n').join('<br>');
};

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  text,
  flaggedSentences,
  onTextChange,
  placeholder = "L'Artifact apparaîtra ici..."
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastTextRef = useRef(text);

  const markup = useMemo(() => createMarkup(text, flaggedSentences), [text, flaggedSentences]);

  useEffect(() => {
    // On ne met à jour le contenu DOM manuellement QUE si le texte a changé 
    // et qu'il ne provient pas d'une saisie utilisateur directe (pour garder le focus/curseur)
    if (contentRef.current && text !== lastTextRef.current) {
        // Si c'est un chargement IA ou un changement externe
        contentRef.current.innerHTML = markup;
        lastTextRef.current = text;
    }
  }, [markup, text]);

  const handleInput = () => {
    if (contentRef.current) {
      const newText = contentRef.current.innerText;
      lastTextRef.current = newText;
      onTextChange(newText);
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const plainText = e.clipboardData.getData('text/plain');
    const selection = window.getSelection();
    if (!selection?.rangeCount) return;
    selection.deleteFromDocument();
    selection.getRangeAt(0).insertNode(document.createTextNode(plainText));
    selection.collapseToEnd();
    handleInput();
  };

  return (
    <div className="relative group h-full">
      <style>{`
        .highlight-risk {
            color: #ff4d4d;
            background: rgba(255, 77, 77, 0.1);
            text-decoration: underline wavy #ff4d4d;
            text-underline-offset: 4px;
            padding: 2px 0;
        }
        .highlight-moderate {
            color: #ffcc00;
            background: rgba(255, 204, 0, 0.1);
            text-decoration: underline wavy #ffcc00;
            text-underline-offset: 4px;
            padding: 2px 0;
        }
        [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: rgba(255,255,255,0.1);
            pointer-events: none;
            display: block;
            font-style: italic;
        }
        .custom-editable-area {
            min-height: 100%;
            outline: none;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
      `}</style>
      <div
        ref={contentRef}
        onInput={handleInput}
        onPaste={handlePaste}
        contentEditable
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
        className="custom-editable-area w-full font-serif text-lg md:text-xl text-white/90 leading-relaxed selection:bg-primary/30"
      />
    </div>
  );
};

export default EditableTextArea;
