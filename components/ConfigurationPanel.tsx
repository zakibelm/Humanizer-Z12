
import React, { useState } from 'react';
import { StyleDistribution, StyleCategory, StyleCategoryId } from '../types';
import CogIcon from './icons/CogIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ChevronDoubleLeftIcon from './icons/ChevronDoubleLeftIcon';
import ChevronDoubleRightIcon from './icons/ChevronDoubleRightIcon';

interface AccordionSectionProps {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({ title, children, isOpen, onToggle }) => {
  return (
    <div className="border-b border-border last:border-b-0">
      <h2>
        <button
          type="button"
          className="flex items-center justify-between w-full p-5 font-medium text-left text-foreground hover:bg-muted/50 transition-colors duration-200"
          onClick={onToggle}
          aria-expanded={isOpen}
        >
          <span className="text-lg text-primary">{title}</span>
          <ChevronDownIcon className={`w-6 h-6 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </h2>
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-[1000px]' : 'max-h-0'}`}>
        <div className="p-5 border-t-0 border-border">
          {children}
        </div>
      </div>
    </div>
  );
};

interface ConfigurationPanelProps {
  distribution: StyleDistribution;
  setDistribution: React.Dispatch<React.SetStateAction<StyleDistribution>>;
  styles: StyleCategory[];
  isOpen: boolean;
  onToggle: () => void;
}

const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({ distribution, setDistribution, styles, isOpen, onToggle }) => {
  const [openSection, setOpenSection] = useState<string | null>('distribution');

  const toggleAccordionSection = (section: string) => {
    setOpenSection(openSection === section ? null : section);
  };

  const handleSliderChange = (id: StyleCategoryId, value: number) => {
    setDistribution(prev => ({
      ...prev,
      [id]: value,
    }));
  };

  return (
     <div className="relative bg-card/50 rounded-lg border border-border h-full transition-all duration-300 overflow-hidden">
        <button 
          onClick={onToggle} 
          className={`absolute top-1/2 -translate-y-1/2 z-20 p-1 rounded-md text-muted-foreground hover:text-primary hover:bg-muted transition-colors ${
            isOpen 
              ? '-left-3 bg-card border-y border-l border-border rounded-r-none'
              : 'left-1/2 -translate-x-1/2'
          }`}
          aria-label={isOpen ? "Réduire le panneau de configuration" : "Ouvrir le panneau de configuration"}
        >
          {isOpen ? <ChevronDoubleRightIcon className="w-5 h-5" /> : <ChevronDoubleLeftIcon className="w-5 h-5" />}
        </button>

      <div className={`transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="p-6">
          <div className="flex items-center mb-4">
            <CogIcon className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-bold ml-3 text-card-foreground">Configuration</h2>
          </div>
          <div className="rounded-lg border border-border overflow-hidden">
            <AccordionSection
              title="Distribution du Mix"
              isOpen={openSection === 'distribution'}
              onToggle={() => toggleAccordionSection('distribution')}
            >
              <div className="space-y-6">
                {styles.map(style => (
                  <div key={style.id}>
                    <div className="flex justify-between items-baseline mb-1">
                      <label htmlFor={`${style.id}-slider`} className="text-md font-medium text-foreground/90">
                        {style.name}
                      </label>
                      <span className="text-lg font-bold text-primary">{distribution[style.id]}%</span>
                    </div>
                    <input
                      id={`${style.id}-slider`}
                      type="range"
                      min="0"
                      max="100"
                      value={distribution[style.id]}
                      onChange={(e) => handleSliderChange(style.id, parseInt(e.target.value, 10))}
                      className="w-full h-2 bg-input rounded-lg appearance-none cursor-pointer range-lg accent-primary"
                    />
                  </div>
                ))}
              </div>
            </AccordionSection>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationPanel;