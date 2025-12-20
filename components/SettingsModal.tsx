import React, { useState, useEffect } from 'react';
import { GlobalSettings, ModelId } from '../types';
import AdjustmentsIcon from './icons/AdjustmentsIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: GlobalSettings;
  onSave: (newSettings: GlobalSettings) => void;
}

const DEFAULT_SYSTEM_PROMPT = `<u><b><u><b>IMPORTANT : JE NE VEUX PAS QUE TU AGISSES COMME UN GHOSTWRITER MAIS PLUTÔT COMME UN ÉDITEUR CORRECTEUR.</b></u></b></u>

**RÔLE:** Tu es Humanizer Z12, un éditeur correcteur expert. Ta tâche est de réviser le texte pour lui donner un style parfaitement humain et naturel qui doit PASSER LES DÉTECTEURS D'IA.

**MÉTHODE DE RÉDACTION "HUMAN TOUCH" :**
1. **Imperfections :** Introduis 1-2 connecteurs logiques un peu flous ou familiers.
2. **Opinion :** Prends position légèrement. L'IA est neutre, l'humain est subjectif.
3. **Structure :** Évite les structures "Intro - 3 Paragraphes - Conclusion". Sois plus organique.`;

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [formData, setFormData] = useState<GlobalSettings>(settings);
  const [showKey, setShowKey] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleChange = (field: keyof GlobalSettings, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleKeyVisibility = (keyName: string) => {
    setShowKey(prev => ({ ...prev, [keyName]: !prev[keyName] }));
  };

  const handleSave = () => {
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
            <div className="flex items-center">
                <div className="bg-primary/20 p-2 rounded-lg mr-3">
                    <AdjustmentsIcon className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground">Paramètres Généraux</h2>
                    <p className="text-xs text-muted-foreground">Configuration des APIs et du Moteur IA</p>
                </div>
            </div>
            <button 
                onClick={onClose}
                className="p-2 hover:bg-muted rounded-full transition-colors text-muted-foreground hover:text-foreground"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
        </div>

        <div className="p-6 overflow-y-auto space-y-6">
            
            {/* API KEYS SECTION */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Clés API (Privées)</h3>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Clé API Google Gemini</label>
                    <div className="relative">
                        <input 
                            type={showKey['google'] ? "text" : "password"}
                            value={formData.googleApiKey}
                            onChange={(e) => handleChange('googleApiKey', e.target.value)}
                            className="w-full bg-input border border-border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-10"
                            placeholder="AIzaSy..."
                        />
                        <button 
                            onClick={() => toggleKeyVisibility('google')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                            {showKey['google'] ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 8.201 1.875 10.336 6.59.335.753.335 1.572 0 2.324A10.004 10.004 0 0110 17c-4.257 0-8.201-1.875-10.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-5.386 1.651 1.651 0 000-1.186A10.004 10.004 0 0011.17 3.033l-7.89-7.89zm4.242 4.242a4 4 0 015.656 5.656l-5.656-5.656z" clipRule="evenodd" /><path d="M13.17 13.17l-1.72-1.72a2 2 0 10-2.828-2.828l-1.72-1.72A3.992 3.992 0 0110 6a4 4 0 014 4c0 .36-.053.708-.152 1.036.096.046.195.09.294.134H14v2h.17z" /></svg>
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">Utilisée pour la génération, la paraphrase et l'analyse stylométrique.</p>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Clé API ZeroGPT (Détection)</label>
                    <div className="relative">
                        <input 
                            type={showKey['zero'] ? "text" : "password"}
                            value={formData.zeroGptApiKey}
                            onChange={(e) => handleChange('zeroGptApiKey', e.target.value)}
                            className="w-full bg-input border border-border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none pr-10"
                            placeholder="ba51f..."
                        />
                         <button 
                            onClick={() => toggleKeyVisibility('zero')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                             {showKey['zero'] ? (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fillRule="evenodd" d="M.664 10.59a1.651 1.651 0 010-1.186A10.004 10.004 0 0110 3c4.257 0 8.201 1.875 10.336 6.59.335.753.335 1.572 0 2.324A10.004 10.004 0 0110 17c-4.257 0-8.201-1.875-10.336-6.41zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" /></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4"><path fillRule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-1.745-1.745a10.029 10.029 0 003.3-5.386 1.651 1.651 0 000-1.186A10.004 10.004 0 0011.17 3.033l-7.89-7.89zm4.242 4.242a4 4 0 015.656 5.656l-5.656-5.656z" clipRule="evenodd" /><path d="M13.17 13.17l-1.72-1.72a2 2 0 10-2.828-2.828l-1.72-1.72A3.992 3.992 0 0110 6a4 4 0 014 4c0 .36-.053.708-.152 1.036.096.046.195.09.294.134H14v2h.17z" /></svg>
                            )}
                        </button>
                    </div>
                    <p className="text-[10px] text-muted-foreground">La clé ZeroGPT sert de juge externe pour valider l'humanisation.</p>
                </div>
            </section>

            {/* MODEL CONFIG SECTION */}
            <section className="space-y-4">
                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider border-b border-border pb-2">Configuration IA</h3>
                
                <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Modèle de Traitement</label>
                    <select 
                        value={formData.selectedModel}
                        onChange={(e) => handleChange('selectedModel', e.target.value as ModelId)}
                        className="w-full bg-input border border-border rounded-md p-2.5 text-sm focus:ring-2 focus:ring-primary outline-none"
                    >
                        <option value="gemini-2.5-pro">Gemini 2.5 Pro (Recommandé - Haute Qualité)</option>
                        <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rapide)</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium text-foreground">Prompt Système (Instructions Mères)</label>
                        <button 
                            onClick={() => handleChange('systemPromptOverride', DEFAULT_SYSTEM_PROMPT)}
                            className="text-xs text-primary hover:underline"
                        >
                            Restaurer défaut
                        </button>
                    </div>
                    <textarea 
                        value={formData.systemPromptOverride}
                        onChange={(e) => handleChange('systemPromptOverride', e.target.value)}
                        className="w-full h-40 bg-input border border-border rounded-md p-3 text-xs font-mono leading-relaxed focus:ring-2 focus:ring-primary outline-none resize-none"
                        placeholder="Définissez ici les instructions de base de l'IA..."
                    />
                    <p className="text-[10px] text-muted-foreground">
                        Ce prompt définit la personnalité de l'IA avant d'appliquer les styles. Soyez précis sur le ton et les interdictions.
                    </p>
                </div>
            </section>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3">
            <button 
                onClick={onClose}
                className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
                Annuler
            </button>
            <button 
                onClick={handleSave}
                className="px-6 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:bg-primary/90 flex items-center"
            >
                <ShieldCheckIcon className="w-4 h-4 mr-2" />
                Sauvegarder les paramètres
            </button>
        </div>

      </div>
    </div>
  );
};

export default SettingsModal;