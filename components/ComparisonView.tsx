
import React from 'react';
import { AnalysisResult } from '../types';
import StatisticsPanel from './StatisticsPanel';

interface ComparisonViewProps {
  resultA: {
    text: string;
    analysis: AnalysisResult;
    label: string;
  };
  resultB: {
    text: string;
    analysis: AnalysisResult;
    label: string;
  };
  onSelectWinner: (winner: 'A' | 'B') => void;
  onClose: () => void;
}

const ComparisonView: React.FC<ComparisonViewProps> = ({
  resultA,
  resultB,
  onSelectWinner,
  onClose
}) => {
  const getWinner = () => {
    if (resultA.analysis.detectionRisk.score > resultB.analysis.detectionRisk.score) {
      return 'A';
    } else if (resultB.analysis.detectionRisk.score > resultA.analysis.detectionRisk.score) {
      return 'B';
    }
    return null;
  };

  const winner = getWinner();

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          🔬 Comparaison A/B
        </h2>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-card border border-border rounded-lg hover:bg-muted transition-colors"
        >
          Fermer
        </button>
      </div>

      <div className="flex-1 grid grid-cols-2 gap-6 overflow-hidden">
        {/* Result A */}
        <div className={`flex flex-col border-2 rounded-lg p-4 ${
          winner === 'A' ? 'border-primary bg-primary/5' : 'border-border bg-card'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {winner === 'A' && '🏆'} Résultat A
              <span className="text-sm text-muted-foreground font-normal">({resultA.label})</span>
            </h3>
            <button
              onClick={() => onSelectWinner('A')}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Choisir A
            </button>
          </div>

          <div className="mb-4">
            <StatisticsPanel analysisResult={resultA.analysis} />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 bg-background rounded-lg border border-border text-sm text-foreground whitespace-pre-wrap">
              {resultA.text}
            </div>
          </div>
        </div>

        {/* Result B */}
        <div className={`flex flex-col border-2 rounded-lg p-4 ${
          winner === 'B' ? 'border-primary bg-primary/5' : 'border-border bg-card'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
              {winner === 'B' && '🏆'} Résultat B
              <span className="text-sm text-muted-foreground font-normal">({resultB.label})</span>
            </h3>
            <button
              onClick={() => onSelectWinner('B')}
              className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              Choisir B
            </button>
          </div>

          <div className="mb-4">
            <StatisticsPanel analysisResult={resultB.analysis} />
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="p-3 bg-background rounded-lg border border-border text-sm text-foreground whitespace-pre-wrap">
              {resultB.text}
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Stats */}
      <div className="mt-6 p-4 bg-card border border-border rounded-lg">
        <h4 className="font-bold text-foreground mb-3">Comparaison Détaillée</h4>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Score Global</span>
            <div className="flex gap-2 mt-1">
              <span className={resultA.analysis.detectionRisk.score >= resultB.analysis.detectionRisk.score ? 'font-bold text-primary' : 'text-foreground'}>
                A: {resultA.analysis.detectionRisk.score}%
              </span>
              <span className="text-muted-foreground">vs</span>
              <span className={resultB.analysis.detectionRisk.score >= resultA.analysis.detectionRisk.score ? 'font-bold text-primary' : 'text-foreground'}>
                B: {resultB.analysis.detectionRisk.score}%
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Perplexité</span>
            <div className="flex gap-2 mt-1">
              <span className={resultA.analysis.perplexity.score >= resultB.analysis.perplexity.score ? 'font-bold text-primary' : 'text-foreground'}>
                A: {resultA.analysis.perplexity.score}%
              </span>
              <span className="text-muted-foreground">vs</span>
              <span className={resultB.analysis.perplexity.score >= resultA.analysis.perplexity.score ? 'font-bold text-primary' : 'text-foreground'}>
                B: {resultB.analysis.perplexity.score}%
              </span>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Burstiness</span>
            <div className="flex gap-2 mt-1">
              <span className={resultA.analysis.burstiness.score >= resultB.analysis.burstiness.score ? 'font-bold text-primary' : 'text-foreground'}>
                A: {resultA.analysis.burstiness.score}%
              </span>
              <span className="text-muted-foreground">vs</span>
              <span className={resultB.analysis.burstiness.score >= resultA.analysis.burstiness.score ? 'font-bold text-primary' : 'text-foreground'}>
                B: {resultB.analysis.burstiness.score}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonView;
