
import React, { useRef, useEffect, useMemo } from 'react';

interface EditableTextAreaProps {
  text: string;
  flaggedSentences: string[];
  onTextChange: (newText: string) => void;
}

// Helper to generate HTML. Keep it outside the component for purity.
const createMarkup = (text: string, flaggedSentences: string[]): string => {
    if (!text) return '';
    let processedText = text;

    if (flaggedSentences && flaggedSentences.length > 0) {
        const escapeRegex = (str: string) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        
        // Sanitize sentences: sort by length, ensure uniqueness, trim, and filter out any empty strings.
        const uniqueSentences = [...new Set(flaggedSentences)]
            .map(s => s.trim())
            .filter(Boolean)
            .sort((a, b) => b.length - a.length);

        if (uniqueSentences.length > 0) {
            const regex = new RegExp(`(${uniqueSentences.map(escapeRegex).join('|')})`, 'g');
            processedText = processedText.replace(regex, (match) => {
                const trimmedMatch = match.trim();
                const level = uniqueSentences.findIndex(s => s.trim() === trimmedMatch);
                const highlightLevel = level !== -1 ? level % 3 : 2;
                const className = `highlight highlight-level-${highlightLevel}`;
                return `<span class="${className}" title="Phrase à risque détectée">${match}</span>`;
            });
        }
    }
    return processedText.replace(/\n/g, '<br>');
};


const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  text,
  flaggedSentences,
  onTextChange,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  // This ref tracks whether the last update was from user input, to break update cycles.
  const isInternalUpdate = useRef(false);

  const markup = useMemo(() => createMarkup(text, flaggedSentences), [text, flaggedSentences]);

  useEffect(() => {
    // If the flag is set, it means the user just typed. We don't want to
    // overwrite their input and lose the cursor position. Reset the flag and bail.
    if (isInternalUpdate.current) {
      isInternalUpdate.current = false;
      return;
    }

    // If we're here, the change came from outside (e.g., AI response).
    // Update the DOM if it's out of sync with our calculated markup.
    if (contentRef.current && contentRef.current.innerHTML !== markup) {
      contentRef.current.innerHTML = markup;
    }
  }, [markup]); // This effect ONLY depends on the calculated markup.

  const handleInput = () => {
    if (contentRef.current) {
      // Set the flag to true BEFORE calling onTextChange.
      // This signals that the subsequent re-render is caused by user input.
      isInternalUpdate.current = true;
      // innerText normalizes line breaks to '\n', which is what our state should use.
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
    
    // Manually trigger handleInput to update the state after pasting.
    handleInput();
  };

  return (
    <>
      <style>{`
        .highlight {
            padding: 1px 0;
            border-radius: 3px;
        }
        .highlight-level-0 {
            background-color: oklch(0.6368 0.2078 25.3313 / 0.3);
            border-bottom: 2px solid oklch(0.6368 0.2078 25.3313 / 0.75);
        }
        .highlight-level-1 {
            background-color: oklch(0.81 0.18 86.32 / 0.3);
            border-bottom: 2px solid oklch(0.81 0.18 86.32 / 0.75);
        }
        .highlight-level-2,
        .highlight-level-3 {
            background-color: oklch(0.89 0.16 99.1 / 0.3);
            border-bottom: 2px solid oklch(0.89 0.16 99.1 / 0.75);
        }
      `}</style>
      <div
        ref={contentRef}
        onInput={handleInput}
        onPaste={handlePaste}
        contentEditable
        suppressContentEditableWarning={true}
        className="w-full flex-grow p-3 bg-black/50 border border-input rounded-md overflow-y-auto whitespace-pre-wrap font-serif focus:ring-2 focus:ring-ring focus:border-primary text-foreground shadow-inner"
        // We set the content initially. `useEffect` handles all subsequent updates.
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    </>
  );
};

export default EditableTextArea;
