
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
            .filter(Boolean)
            .sort((a, b) => b.length - a.length);

        if (uniqueSentences.length > 0) {
            const regex = new RegExp(`(${uniqueSentences.map(escapeRegex).join('|')})`, 'g');
            processedText = processedText.replace(regex, (match) => {
                const trimmedMatch = match.trim();
                const level = uniqueSentences.findIndex(s => s.trim() === trimmedMatch);
                const highlightLevel = level !== -1 ? level % 2 : 1;
                const className = highlightLevel === 0 ? 'highlight-risk' : 'highlight-moderate';
                return `<span class="${className}" title="Détail du risque IA">${match}</span>`;
            });
        }
    }
    return processedText.replace(/\n/g, '<br>');
};

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  text,
  flaggedSentences,
  onTextChange,
  placeholder = "Commencez à rédiger..."
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const isInternalUpdate = useRef(false);

  const markup = useMemo(() => createMarkup(text, flaggedSentences), [text, flaggedSentences]);

  useEffect(() => {
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }
    if (contentRef.current && contentRef.current.innerHTML !== markup) {
      contentRef.current.innerHTML = markup;
    }
  }, [markup]);

  const handleInput = () => {
    if (contentRef.current) {
      isInternalUpdate.current = true;
      onTextChange(contentRef.current.innerText);
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
    <div className="relative group">
      <style>{`
        .highlight-risk {
            color: oklch(0.6368 0.2078 25.3313);
            text-decoration: underline wavy oklch(0.6368 0.2078 25.3313 / 0.5);
            text-underline-offset: 4px;
        }
        .highlight-moderate {
            color: oklch(0.81 0.18 86.32);
            text-decoration: underline wavy oklch(0.81 0.18 86.32 / 0.5);
            text-underline-offset: 4px;
        }
        [contenteditable]:empty:before {
            content: attr(data-placeholder);
            color: rgba(255,255,255,0.1);
            pointer-events: none;
            display: block;
        }
      `}</style>
      <div
        ref={contentRef}
        onInput={handleInput}
        onPaste={handlePaste}
        contentEditable
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
        className="w-full min-h-[400px] outline-none text-xl md:text-2xl font-serif text-white/80 leading-relaxed whitespace-pre-wrap selection:bg-primary/30"
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </div>
  );
};

export default EditableTextArea;
