
import React, { useState, useMemo } from 'react';
import { GenerationHistoryItem } from '../types';
import BookOpenIcon from './icons/BookOpenIcon';
import TrashIcon from './icons/TrashIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';
import DownloadIcon from './icons/DownloadIcon';

interface HistoryPanelProps {
  history: GenerationHistoryItem[];
  onRestore: (item: GenerationHistoryItem) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
  onToggleFavorite: (id: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({
  history,
  onRestore,
  onDelete,
  onClearAll,
  onToggleFavorite,
  isOpen,
  onToggle
}) => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = useMemo(() => {
    let items = history;

    if (filter === 'favorites') {
      items = items.filter(item => item.favorite);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.inputText.toLowerCase().includes(query) ||
        item.outputText.toLowerCase().includes(query) ||
        item.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    return items.sort((a, b) => b.timestamp - a.timestamp);
  }, [history, filter, searchQuery]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) return 'Il y a quelques minutes';
    if (hours < 24) return `Il y a ${Math.floor(hours)}h`;
    if (hours < 48) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `humanizer_history_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) {
    return (
      <div className="flex flex-col items-center">
        <button
          onClick={onToggle}
          className="mb-4 p-3 bg-card/80 backdrop-blur-md border border-border rounded-lg shadow-sm hover:bg-card transition-all duration-300 group"
          title="Ouvrir l'historique"
        >
          <ChevronDoubleRightIcon className="w-5 h-5 text-muted-foreground group-hover:text-foreground" />
        </button>
        <div className="writing-mode-vertical text-xs text-muted-foreground font-semibold tracking-wider">
          HISTORIQUE
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-card/50 border border-border rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Historique</h3>
          <span className="text-xs text-muted-foreground">({history.length})</span>
        </div>
        <button
          onClick={onToggle}
          className="p-1 hover:bg-muted rounded transition-colors"
          title="Fermer"
        >
          <ChevronDoubleLeftIcon className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Controls */}
      <div className="p-3 space-y-2 border-b border-border">
        <input
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-1.5 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`flex-1 px-3 py-1 text-xs rounded ${
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            Tout ({history.length})
          </button>
          <button
            onClick={() => setFilter('favorites')}
            className={`flex-1 px-3 py-1 text-xs rounded ${
              filter === 'favorites'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            ⭐ Favoris ({history.filter(h => h.favorite).length})
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {filteredHistory.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            {searchQuery ? 'Aucun résultat' : 'Aucune génération'}
          </div>
        ) : (
          filteredHistory.map(item => (
            <div
              key={item.id}
              className="p-3 bg-background border border-border rounded-lg hover:border-primary/50 transition-all cursor-pointer group"
              onClick={() => onRestore(item)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs text-muted-foreground">{formatDate(item.timestamp)}</span>
                    {item.favorite && <span className="text-xs">⭐</span>}
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
                        item.analysis.detectionRisk.score >= 90
                          ? 'bg-green-500/20 text-green-400'
                          : item.analysis.detectionRisk.score >= 70
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {item.analysis.detectionRisk.score}%
                    </span>
                  </div>
                  <p className="text-sm text-foreground line-clamp-2">
                    {item.inputText.substring(0, 100)}...
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavorite(item.id);
                    }}
                    className="p-1 hover:bg-muted rounded"
                    title={item.favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <span className="text-sm">{item.favorite ? '⭐' : '☆'}</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(item.id);
                    }}
                    className="p-1 hover:bg-destructive/20 rounded"
                    title="Supprimer"
                  >
                    <TrashIcon className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
              {item.estimatedCost && (
                <div className="text-xs text-muted-foreground">
                  💵 ${item.estimatedCost.toFixed(4)}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      {history.length > 0 && (
        <div className="p-3 border-t border-border flex gap-2">
          <button
            onClick={exportHistory}
            className="flex-1 flex items-center justify-center gap-1 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded transition-colors"
          >
            <DownloadIcon className="w-3.5 h-3.5" />
            Exporter
          </button>
          <button
            onClick={onClearAll}
            className="flex-1 px-3 py-1.5 text-xs bg-destructive/20 text-destructive hover:bg-destructive/30 rounded transition-colors"
          >
            Tout effacer
          </button>
        </div>
      )}
    </div>
  );
};

export default HistoryPanel;
