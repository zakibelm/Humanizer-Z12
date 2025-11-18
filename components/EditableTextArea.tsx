
import React, { useEffect, useRef } from 'react';

interface EditableTextAreaProps {
  text: string;
  flaggedSentences: string[];
  onTextChange: (newText: string) => void;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  text,
  flaggedSentences,
  onTextChange,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const getHighlightedHtml = () => {
    if (!flaggedSentences || flaggedSentences.length === 0) {
      return text;
    }
    
    // Use a Set for faster lookups
    const sentencesToHighlight = new Set(flaggedSentences);
    
    // Create a robust regex
    const regex = new RegExp(`(${flaggedSentences.map(s => escapeRegex(s)).join('|')})`, 'g');
    
    return text
      .split(regex)
      .map((part, index) => {
        if (sentencesToHighlight.has(part)) {
          const level = flaggedSentences.indexOf(part); // 0 = high, 1 = med, 2 = low
          const className = `highlight highlight-level-${level}`;
          return `<span class="${className}" title="Phrase à risque détectée">${part}</span>`;
        }
        return part;
      })
      .join('');
  };

  useEffect(() => {
    const element = contentRef.current;
    if (element) {
        // Only update if the content differs to avoid losing cursor position
        const currentHtml = element.innerHTML.replace(/<br>/g, '\n');
        const newHtml = getHighlightedHtml();
        if (currentHtml !== newHtml) {
             // A simple way to try and preserve cursor position
            const selection = window.getSelection();
            const range = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
            const startOffset = range ? range.startOffset : 0;
            
            element.innerHTML = newHtml.replace(/\n/g, '<br>');

            // Restore cursor
            if (range && element.firstChild) {
                try {
                    const newRange = document.createRange();
                    // This is a simplification and might not work perfectly in all cases
                    const textNode = element.firstChild.childNodes[0] || element.firstChild;
                    newRange.setStart(textNode, Math.min(startOffset, textNode.textContent?.length || 0));
                    newRange.collapse(true);
                    selection?.removeAllRanges();
                    selection?.addRange(newRange);
                } catch(e) {
                    // It's okay if this fails sometimes, not critical
                }
            }
        }
    }
  }, [text, flaggedSentences]);

  const handleInput = () => {
    const element = contentRef.current;
    if (element) {
      onTextChange(element.innerText);
    }
  };

  return (
    <>
    <style>{`
        .highlight {
            padding: 2px 0;
            border-radius: 3px;
            transition: background-color 0.2s ease-in-out;
        }
        .highlight-level-0 {
            background-color: rgba(239, 68, 68, 0.2);
            border-bottom: 2px solid rgba(239, 68, 68, 0.6);
        }
        .highlight-level-1 {
            background-color: rgba(249, 115, 22, 0.2);
            border-bottom: 2px solid rgba(249, 115, 22, 0.6);
        }
        .highlight-level-2 {
            background-color: rgba(234, 179, 8, 0.2);
            border-bottom: 2px solid rgba(234, 179, 8, 0.6);
        }
    `}</style>
    <div
      ref={contentRef}
      onInput={handleInput}
      contentEditable
      className="w-full flex-grow p-3 bg-input/80 border border-input rounded-md overflow-y-auto whitespace-pre-wrap font-serif focus:ring-2 focus:ring-ring focus:border-primary"
      dangerouslySetInnerHTML={{ __html: getHighlightedHtml().replace(/\n/g, '<br>') }}
    />
    </>
  );
};

export default EditableTextArea;
