
import React from 'react';
import { AnalysisResult } from '../types';
import ZapIcon from './icons/ZapIcon';
import BarChartIcon from './icons/BarChartIcon';
import ExternalLinkIcon from './icons/ExternalLinkIcon';
import ScoreGauge from './ScoreGauge';
import StylometricPanel from './StylometricPanel';

const getRiskConfig = (score: number) => {
    if (score > 70) return {
        level: 'Faible',
        color: 'text-green-400',
        textColor: 'text-green-300',
        gaugeColor: 'var(--primary)',
    };
    if (score > 40) return {
        level: 'Modéré',
        color: 'text-yellow-400',
        textColor: 'text-yellow-300',
        gaugeColor: 'oklch(0.81 0.18 86.32)',
    };
    return {
        level: 'Élevé',
        color: 'text-red-400',
        textColor: 'text-red-300',
        gaugeColor: 'var(--destructive)',
    };
};

const StatCard: React.FC<{ title: string; score: number; children: React.ReactNode; icon: React.ReactNode }> = ({ title, score, children, icon }) => (
    <div className="bg-muted/50 p-4 rounded-lg flex-1">
        <div className="flex justify-between items-start">
            <h4 className="text-sm font-medium text-muted-foreground flex items-center">
                {icon}
                {title}
            </h4>
            <span className="text-lg font-bold text-foreground/90">{score}</span>
        </div>
        <div className="text-xs text-foreground/80 mt-2">{children}</div>
    </div>
);


const StatisticsPanel: React.FC<{ analysis: AnalysisResult; outputText: string }> = ({ analysis, outputText }) => {
    
  const config = getRiskConfig(analysis.detectionRisk.score);

  const handleVerifyClick = () => {
    navigator.clipboard.writeText(outputText);
    window.open('https://zerogpt.com', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className={`bg-card/70 border border-border rounded-lg p-5 animate-fade-in`}>
        <div className="flex flex-col md:flex-row gap-5">
            <div className={`flex flex-col items-center justify-center p-4 rounded-lg bg-muted/40 md:w-1/3`}>
                <ScoreGauge score={analysis.detectionRisk.score} color={config.gaugeColor} />
                 <h3 className="text-lg font-bold mt-3 text-card-foreground">
                    Score d'Humanisation
                </h3>
                <p className={`text-sm font-semibold ${config.color}`}>
                    Risque de Détection : {analysis.detectionRisk.level}
                </p>
            </div>

            <div className="flex flex-col gap-4 flex-1">
                <div className="flex flex-col sm:flex-row gap-4">
                    <StatCard title="Perplexité" score={analysis.perplexity.score} icon={<ZapIcon className="w-4 h-4 mr-2" />}>
                        {analysis.perplexity.analysis}
                    </StatCard>
                    <StatCard title="Variation" score={analysis.burstiness.score} icon={<BarChartIcon className="w-4 h-4 mr-2" />}>
                        {analysis.burstiness.analysis}
                    </StatCard>
                </div>
                 <button 
                  onClick={handleVerifyClick}
                  className="w-full py-2 px-4 bg-secondary text-secondary-foreground font-semibold rounded-md hover:bg-secondary/90 transition-colors duration-200 flex items-center justify-center text-sm"
                  title="Copie le texte et ouvre le détecteur ZeroGPT dans un nouvel onglet"
                >
                    <ExternalLinkIcon className="w-4 h-4 mr-2" />
                    Vérifier sur un détecteur externe
                </button>
            </div>
        </div>

        {analysis.stylometricMatch && (
             <div className="mt-4 border-t border-border pt-4">
                <StylometricPanel
                    similarity={analysis.stylometricMatch.similarity}
                    deviations={analysis.stylometricMatch.deviations}
                />
            </div>
        )}

        {analysis.flaggedSentences && analysis.flaggedSentences.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
                <h4 className="text-sm font-medium text-muted-foreground mb-2">Phrases à Risque Identifiées :</h4>
                <ul className="space-y-2">
                    {analysis.flaggedSentences.map((sentence, index) => (
                        <li key={index} className="text-xs text-foreground/80 bg-muted/40 p-2 rounded-md border-l-2 border-yellow-500/50">
                            "{sentence}"
                        </li>
                    ))}
                </ul>
            </div>
        )}
    </div>
  );
};

export default StatisticsPanel;
