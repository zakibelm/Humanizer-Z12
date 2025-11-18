import React from 'react';

interface StylometricPanelProps {
  similarity: number;
  deviations: string[];
}

const StylometricPanel: React.FC<StylometricPanelProps> = ({ similarity, deviations }) => {
  const getSimilarityColor = (score: number): string => {
    if (score >= 85) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getSimilarityBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getSimilarityLabel = (score: number): string => {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Bon';
    return 'À améliorer';
  };

  return (
    <div className="mt-4 p-4 bg-muted/30 rounded-lg border border-border">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-foreground flex items-center">
          <svg className="w-5 h-5 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Analyse Stylométrique
        </h3>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getSimilarityColor(similarity)}`}>
            {similarity.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">
            {getSimilarityLabel(similarity)}
          </div>
        </div>
      </div>

      {/* Barre de progression */}
      <div className="w-full bg-gray-700 rounded-full h-2 mb-3">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${getSimilarityBgColor(similarity)}`}
          style={{ width: `${similarity}%` }}
        ></div>
      </div>

      {/* Légende */}
      <p className="text-xs text-muted-foreground mb-3">
        Similarité avec le profil statistique des documents de référence
      </p>

      {/* Déviations */}
      {deviations.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border">
          <h4 className="text-xs font-medium text-foreground mb-2">Écarts détectés :</h4>
          <ul className="space-y-1">
            {deviations.map((deviation, index) => (
              <li key={index} className="text-xs text-muted-foreground flex items-start">
                <span className="text-orange-400 mr-2">▸</span>
                <span>{deviation}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {deviations.length === 0 && (
        <div className="mt-2 flex items-center text-xs text-green-500">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          Aucun écart significatif
        </div>
      )}
    </div>
  );
};

export default StylometricPanel;
