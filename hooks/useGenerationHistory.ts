
import { useState, useEffect, useCallback } from 'react';
import { GenerationHistoryItem, AnalysisResult, ModelAssignment, AgenticConfig, WorkflowStep } from '../types';

const HISTORY_KEY = 'z12_generation_history';
const MAX_HISTORY_ITEMS = 50;

export const useGenerationHistory = () => {
  const [history, setHistory] = useState<GenerationHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to load history:', e);
      return [];
    }
  });

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Failed to save history:', e);
    }
  }, [history]);

  const addToHistory = useCallback(
    (
      inputText: string,
      outputText: string,
      analysis: AnalysisResult,
      modelAssignments: ModelAssignment[],
      agenticConfig: AgenticConfig,
      workflowLogs: WorkflowStep[],
      estimatedCost?: number
    ) => {
      const newItem: GenerationHistoryItem = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        inputText,
        outputText,
        analysis,
        modelAssignments,
        agenticConfig,
        workflowLogs,
        estimatedCost,
        favorite: false,
        tags: []
      };

      setHistory(prev => {
        const updated = [newItem, ...prev];
        // Keep only the most recent MAX_HISTORY_ITEMS
        return updated.slice(0, MAX_HISTORY_ITEMS);
      });

      return newItem.id;
    },
    []
  );

  const deleteFromHistory = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  }, []);

  const clearHistory = useCallback(() => {
    if (window.confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
      setHistory([]);
    }
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === id ? { ...item, favorite: !item.favorite } : item
      )
    );
  }, []);

  const addTag = useCallback((id: string, tag: string) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, tags: [...(item.tags || []), tag] }
          : item
      )
    );
  }, []);

  const removeTag = useCallback((id: string, tag: string) => {
    setHistory(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, tags: (item.tags || []).filter(t => t !== tag) }
          : item
      )
    );
  }, []);

  return {
    history,
    addToHistory,
    deleteFromHistory,
    clearHistory,
    toggleFavorite,
    addTag,
    removeTag
  };
};
