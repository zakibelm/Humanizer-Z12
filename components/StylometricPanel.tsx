
import React from 'react';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import AlertTriangleIcon from './icons/AlertTriangleIcon';

interface StylometricPanelProps {
  similarity: number;
  deviations: string[];
}

const StylometricPanel: React.FC<StylometricPanelProps> = ({ similarity, deviations }) => {
  const getSimilarityColor = (score: number): string => {
    if (score >= 85) return 'text-green-400';
    if (score >= 70) return 'text-yellow-400';
    return 'text-orange-400';
  };

  const getSimilarityBgColor = (score: number): string => {
    if (score >= 85) return 'bg-green-500';
    if (score >= 70) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const colorClass = getSimilarityColor(similarity);
  const bgColorClass = getSimilarityBgColor(similarity);

  return (
    <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">Analyse Stylométrique</h4>
        <div className="bg-muted/40 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-foreground/90">Similarité au style de référence</span>
                <span className={`text-lg font-bold ${colorClass}`}>{similarity}%</span>
            </div>
            <div className="w-full bg-input rounded-full h-2.5">
                <div 
                    className={`${bgColorClass} h-2.5 rounded-full transition-all duration-500`} 
                    style={{ width: `${similarity}%` }}
                ></div>
            </div>

            {deviations.length > 0 && (
                <div className="mt-3 border-t border-border/50 pt-3">
                    <h5 className="text-xs font-semibold text-muted-foreground mb-2 flex items-center">
                        <AlertTriangleIcon className="w-4 h-4 mr-2 text-yellow-500" />
                        Axes d'amélioration principaux :
                    </h5>
                    <ul className="space-y-1.5">
                        {deviations.map((deviation, index) => (
                            <li key={index} className="text-xs text-foreground/80">
                                - {deviation}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
             {deviations.length === 0 && similarity >= 85 && (
                 <div className="mt-3 border-t border-border/50 pt-3 flex items-center text-xs text-green-400">
                    <ShieldCheckIcon className="w-4 h-4 mr-2" />
                    Excellente correspondance avec le profil stylistique de référence.
                </div>
            )}
        </div>
    </div>
  );
};

export default StylometricPanel;
