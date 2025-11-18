
import React from 'react';

interface ScoreGaugeProps {
  score: number;
  color: string;
}

const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, color }) => {
  const size = 100;
  const strokeWidth = 10;
  const center = size / 2;
  const radius = center - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke="var(--input)"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={center}
          cy={center}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s ease-in-out' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-2xl font-extrabold text-foreground">{score}</span>
        <span className="text-sm font-bold text-muted-foreground ml-0.5">%</span>
      </div>
    </div>
  );
};

export default ScoreGauge;
