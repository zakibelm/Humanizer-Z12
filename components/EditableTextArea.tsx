import React, { useState, useEffect, useRef } from 'react';

interface EditableTextAreaProps {
  text: string;
  flaggedSentences: string[];
  onTextChange: (newText: string) => void;
  isEditable: boolean;
}

const EditableTextArea: React.FC<EditableTextAreaProps> = ({
  text,
  flaggedSentences,
  onTextChange,
  isEditable
}) => {
  const [localText, setLocalText] = useState(text);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLocalText(text);
  }, [text]);

  // Fonction pour échapper les caractères spéciaux regex
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  };

  // Fonction pour surligner les phrases flaggées
  const highlightFlaggedText = (content: string): string => {
    if (!flaggedSentences || flaggedSentences.length === 0) {
      return content;
    }

    let highlightedText = content;

    // Trier par longueur décroissante pour éviter les conflits de remplacement
    const sortedSentences = [...flaggedSentences].sort((a, b) => b.length - a.length);

    sortedSentences.forEach((sentence, index) => {
      // Nettoyer la phrase des espaces superflus
      const cleanSentence = sentence.trim();
      if (!cleanSentence) return;

      // Échapper les caractères spéciaux pour regex
      const escapedSentence = escapeRegex(cleanSentence);

      // Créer un regex pour trouver la phrase (insensible à la casse)
      const regex = new RegExp(`(${escapedSentence})`, 'gi');

      // Remplacer par version surlignée
      highlightedText = highlightedText.replace(
        regex,
        `<mark class="ai-flagged-text" data-severity="${getSeverityLevel(index)}" title="Phrase détectée comme IA - Cliquez pour modifier">$1</mark>`
      );
    });

    return highlightedText;
  };

  // Détermine le niveau de sévérité basé sur la position dans la liste
  const getSeverityLevel = (index: number): string => {
    if (index === 0) return 'high'; // Premier = plus suspect
    if (index === 1) return 'medium';
    return 'low';
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newText = e.currentTarget.innerText;
    setLocalText(newText);
    onTextChange(newText);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text/plain');
    document.execCommand('insertText', false, text);
  };

  return (
    <div className="relative">
      {/* Zone d'édition */}
      <div
        ref={contentRef}
        contentEditable={isEditable}
        suppressContentEditableWarning
        onInput={handleInput}
        onPaste={handlePaste}
        className={`
          w-full min-h-[250px] p-4
          bg-input/80 border border-input rounded-md
          overflow-y-auto whitespace-pre-wrap font-serif
          focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary
          transition-all duration-200
          ${isEditable ? 'cursor-text' : 'cursor-default'}
        `}
        dangerouslySetInnerHTML={{
          __html: isEditable ? highlightFlaggedText(localText) : localText || '<span class="text-muted-foreground">Le résultat apparaîtra ici...</span>'
        }}
      />

      {/* Légende des couleurs (si phrases flaggées) */}
      {isEditable && flaggedSentences.length > 0 && (
        <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.4)' }}></span>
            <span>Risque élevé</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'rgba(251, 146, 60, 0.4)' }}></span>
            <span>Risque moyen</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="inline-block w-3 h-3 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.4)' }}></span>
            <span>Risque faible</span>
          </div>
          <span className="ml-auto italic">💡 Cliquez sur les zones surlignées pour les modifier</span>
        </div>
      )}

      {/* Styles CSS pour le surlignage */}
      <style jsx>{`
        .ai-flagged-text {
          padding: 2px 4px;
          border-radius: 3px;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .ai-flagged-text[data-severity="high"] {
          background-color: rgba(239, 68, 68, 0.3);
          border-bottom: 2px solid rgba(239, 68, 68, 0.6);
        }

        .ai-flagged-text[data-severity="medium"] {
          background-color: rgba(251, 146, 60, 0.3);
          border-bottom: 2px solid rgba(251, 146, 60, 0.6);
        }

        .ai-flagged-text[data-severity="low"] {
          background-color: rgba(234, 179, 8, 0.3);
          border-bottom: 2px solid rgba(234, 179, 8, 0.6);
        }

        .ai-flagged-text:hover {
          filter: brightness(1.1);
          transform: scale(1.02);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        [contenteditable]:focus {
          outline: none;
        }

        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
        }
      `}</style>
    </div>
  );
};

export default EditableTextArea;
