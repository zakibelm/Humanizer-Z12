
import React from 'react';
import { AppSettings } from '../types';
import { estimateGenerationCost } from '../configTemplates';

interface ActiveModelsIndicatorProps {
  settings: AppSettings;
  inputWordCount?: number;
  agenticIterations?: number;
}

const ActiveModelsIndicator: React.FC<ActiveModelsIndicatorProps> = ({
  settings,
  inputWordCount = 0,
  agenticIterations = 1
}) => {
  const activeModels = settings.modelAssignments.filter(a => a.enabled);

  if (activeModels.length === 0) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 text-xs">
        <span className="text-destructive font-semibold">⚠️ Aucun modèle actif</span>
      </div>
    );
  }

  const costEstimate = inputWordCount > 0
    ? estimateGenerationCost(inputWordCount, activeModels, agenticIterations)
    : null;

  return (
    <div className="bg-card/50 border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-bold text-foreground flex items-center gap-1">
          <span className="text-secondary">🤖</span> Modèles Actifs
        </h4>
        {costEstimate && (
          <span className="text-xs font-mono text-primary">
            💵 ~${costEstimate.total.toFixed(4)}
          </span>
        )}
      </div>

      <div className="space-y-1">
        {activeModels.map(assignment => {
          const roleIcons = {
            generator: '🎨',
            refiner: '✨',
            analyzer: '🔍'
          };

          const roleLabels = {
            generator: 'Générateur',
            refiner: 'Raffineur',
            analyzer: 'Analyseur'
          };

          return (
            <div key={assignment.role} className="flex items-center justify-between text-[10px]">
              <span className="text-muted-foreground flex items-center gap-1">
                <span>{roleIcons[assignment.role]}</span>
                {roleLabels[assignment.role]}
              </span>
              <span className="text-foreground font-medium truncate max-w-[150px]" title={assignment.model.name}>
                {assignment.model.name}
              </span>
            </div>
          );
        })}
      </div>

      {costEstimate && costEstimate.total > 0.01 && (
        <div className="pt-2 border-t border-border">
          <p className="text-[9px] text-muted-foreground">
            ℹ️ Estimation basée sur {inputWordCount} mots × {agenticIterations} itération(s)
          </p>
        </div>
      )}
    </div>
  );
};

export default ActiveModelsIndicator;
