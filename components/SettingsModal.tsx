
import React, { useState } from 'react';
import { AppSettings, AIModel, ModelAssignment, WorkflowRole } from '../types';
import { POPULAR_OPENROUTER_MODELS } from '../services/openRouterService';
import { DEFAULT_GENERATION_PROMPT, DEFAULT_REFINEMENT_PROMPT, DEFAULT_ANALYSIS_PROMPT } from '../defaultPrompts';
import { CONFIG_TEMPLATES, applyTemplate } from '../configTemplates';
import CogIcon from './icons/CogIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import ZapIcon from './icons/ZapIcon';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSave }) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'api' | 'models' | 'prompts'>('api');
  const [expandedPrompt, setExpandedPrompt] = useState<string | null>(null);

  if (!isOpen) return null;

  // Tous les modèles sont disponibles via OpenRouter (y compris Gemini)
  const allAvailableModels = POPULAR_OPENROUTER_MODELS;

  const handleSave = () => {
    onSave(localSettings);
    onClose();
  };

  const handleApiKeyChange = (provider: 'openrouter' | 'zerogpt', value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      apiKeys: {
        ...prev.apiKeys,
        [provider]: value
      }
    }));
  };

  const handleModelAssignmentChange = (role: WorkflowRole, field: keyof ModelAssignment, value: any) => {
    setLocalSettings(prev => {
      const assignments = [...prev.modelAssignments];
      const index = assignments.findIndex(a => a.role === role);

      if (index >= 0) {
        if (field === 'model') {
          // Find the full model object
          const modelObj = allAvailableModels.find(m => m.id === value);
          if (modelObj) {
            assignments[index] = { ...assignments[index], model: modelObj };
          }
        } else {
          assignments[index] = { ...assignments[index], [field]: value };
        }
      } else {
        // Create new assignment
        const modelObj = allAvailableModels[0];
        assignments.push({
          role,
          model: modelObj,
          enabled: true,
          [field]: value
        });
      }

      return { ...prev, modelAssignments: assignments };
    });
  };

  const getAssignmentForRole = (role: WorkflowRole): ModelAssignment | undefined => {
    return localSettings.modelAssignments.find(a => a.role === role);
  };

  const handlePromptChange = (promptType: 'generation' | 'refinement' | 'analysis', value: string) => {
    setLocalSettings(prev => ({
      ...prev,
      defaultPrompts: {
        ...prev.defaultPrompts,
        [promptType]: value
      }
    }));
  };

  const resetPromptToDefault = (promptType: 'generation' | 'refinement' | 'analysis') => {
    const defaults = {
      generation: DEFAULT_GENERATION_PROMPT,
      refinement: DEFAULT_REFINEMENT_PROMPT,
      analysis: DEFAULT_ANALYSIS_PROMPT
    };
    handlePromptChange(promptType, defaults[promptType]);
  };

  const handleApplyTemplate = (templateId: string) => {
    const newSettings = applyTemplate(templateId, localSettings);
    setLocalSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-lg shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <CogIcon className="w-7 h-7 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">Paramètres Avancés</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-2xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border bg-muted/20">
          {[
            { id: 'api', label: '🔑 Clés API' },
            { id: 'models', label: '🤖 Modèles' },
            { id: 'prompts', label: '✍️ Prompts Système' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 font-semibold transition-all ${
                activeTab === tab.id
                  ? 'text-primary border-b-2 border-primary bg-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">

          {/* API Keys Tab */}
          {activeTab === 'api' && (
            <div className="space-y-6">
              <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 text-sm text-accent-foreground">
                <strong>ℹ️ Sécurité :</strong> Les clés sont stockées localement dans votre navigateur (localStorage).
                Pour une production, utilisez un backend sécurisé.
              </div>

              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-foreground mb-4">
                <strong>💡 Info :</strong> OpenRouter donne accès à tous les modèles d'IA (Claude, GPT-4, Gemini, Llama, etc.)
                avec une seule clé API. C'est la solution la plus simple et économique.
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    OpenRouter API Key <span className="text-primary">* (Requis)</span>
                  </label>
                  <input
                    type="password"
                    value={localSettings.apiKeys.openrouter || ''}
                    onChange={(e) => handleApiKeyChange('openrouter', e.target.value)}
                    placeholder="sk-or-v1-..."
                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Obtenez votre clé sur <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer" className="text-primary underline hover:text-primary/80">openrouter.ai/keys</a> •
                    Donne accès à tous les modèles (Claude, GPT-4, Gemini, Llama, Mistral, etc.)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">
                    ZeroGPT API Key <span className="text-muted-foreground text-xs">(optionnel)</span>
                  </label>
                  <input
                    type="password"
                    value={localSettings.apiKeys.zerogpt || ''}
                    onChange={(e) => handleApiKeyChange('zerogpt', e.target.value)}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    className="w-full px-4 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Pour la détection AI externe (sinon analyse interne uniquement)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Models Tab */}
          {activeTab === 'models' && (
            <div className="space-y-6">
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 text-sm text-foreground">
                <strong>🎯 Workflow Multi-Modèles :</strong> Assignez différents modèles LLM pour chaque étape.
                <br/>• <strong>Générateur</strong> : Crée le texte initial
                <br/>• <strong>Raffineur</strong> : Paraphrase et humanise le texte
                <br/>• <strong>Analyseur</strong> : Analyse stylistique (perplexité, burstiness)
              </div>

              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 text-sm text-foreground">
                <strong>🔍 Détection IA (ZeroGPT) :</strong> ZeroGPT est utilisé <strong>automatiquement</strong> après chaque itération
                pour détecter si le texte est encore identifiable comme IA. Activez la clé ZeroGPT dans l'onglet "Clés API"
                pour déclencher la boucle agentique d'amélioration (~$0.01/analyse).
                <br/><strong>Sans ZeroGPT</strong>, seule l'analyse stylistique interne est utilisée.
              </div>

              {/* Templates Section */}
              <div>
                <h3 className="font-bold text-foreground mb-3 flex items-center gap-2">
                  <ZapIcon className="w-5 h-5 text-secondary" />
                  Templates de Configuration
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {CONFIG_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleApplyTemplate(template.id)}
                      className="text-left p-4 border border-border rounded-lg hover:bg-muted/30 hover:border-primary/50 transition-all group"
                    >
                      <div className="flex items-start gap-3">
                        <span className="text-3xl">{template.icon}</span>
                        <div className="flex-1">
                          <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {template.name}
                          </h4>
                          <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                          <div className="flex gap-3 mt-2 text-[10px] text-muted-foreground">
                            <span>💵 ~${template.estimatedCostPer1kWords.toFixed(3)}/1k mots</span>
                            <span>⏱️ {template.estimatedSpeed}</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {(['generator', 'refiner', 'analyzer'] as WorkflowRole[]).map(role => {
                const assignment = getAssignmentForRole(role);
                const roleLabels = {
                  generator: '🎨 Générateur (Rédaction initiale)',
                  refiner: '✨ Raffineur (Optimisation itérative)',
                  analyzer: '🔍 Analyseur (Détection & Scoring)'
                };

                return (
                  <div key={role} className="border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-foreground">{roleLabels[role]}</h3>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={assignment?.enabled ?? true}
                          onChange={(e) => handleModelAssignmentChange(role, 'enabled', e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm text-muted-foreground">Actif</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">Modèle</label>
                      <select
                        value={assignment?.model.id || POPULAR_OPENROUTER_MODELS[0].id}
                        onChange={(e) => handleModelAssignmentChange(role, 'model', e.target.value)}
                        disabled={!assignment?.enabled}
                        className="w-full px-3 py-2 bg-background border border-input rounded-md text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
                      >
                        <optgroup label="OpenRouter - Anthropic">
                          {POPULAR_OPENROUTER_MODELS.filter(m => m.id.startsWith('anthropic')).map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} {model.costPer1kTokens && `($${model.costPer1kTokens}/1k)`}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="OpenRouter - OpenAI">
                          {POPULAR_OPENROUTER_MODELS.filter(m => m.id.startsWith('openai')).map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} {model.costPer1kTokens && `($${model.costPer1kTokens}/1k)`}
                            </option>
                          ))}
                        </optgroup>
                        <optgroup label="OpenRouter - Autres (Google, Meta, Mistral, Qwen, GLM, Kimi...)">
                          {POPULAR_OPENROUTER_MODELS.filter(m => !m.id.startsWith('anthropic') && !m.id.startsWith('openai')).map(model => (
                            <option key={model.id} value={model.id}>
                              {model.name} {model.costPer1kTokens && `($${model.costPer1kTokens}/1k)`}
                            </option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-foreground mb-1">
                        Température (Créativité)
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.1"
                        value={assignment?.temperature ?? (role === 'analyzer' ? 0.1 : 1.0)}
                        onChange={(e) => handleModelAssignmentChange(role, 'temperature', parseFloat(e.target.value))}
                        disabled={!assignment?.enabled}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>Précis (0.0)</span>
                        <span className="font-bold">{assignment?.temperature ?? (role === 'analyzer' ? 0.1 : 1.0)}</span>
                        <span>Créatif (2.0)</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Prompts Tab */}
          {activeTab === 'prompts' && (
            <div className="space-y-6">
              <div className="bg-secondary/10 border border-secondary/30 rounded-lg p-4 text-sm text-foreground">
                <strong>✍️ Personnalisation :</strong> Modifiez les instructions système pour chaque étape.
                Les placeholders <code className="bg-background px-1 rounded">{`{STYLOMETRIC_PROFILE}`}</code> et <code className="bg-background px-1 rounded">{`{STYLE_CONTEXT}`}</code> seront automatiquement remplacés.
              </div>

              {(['generation', 'refinement', 'analysis'] as const).map(promptType => {
                const promptLabels = {
                  generation: '🎨 Prompt de Génération',
                  refinement: '✨ Prompt de Raffinement',
                  analysis: '🔍 Prompt d\'Analyse'
                };

                const isExpanded = expandedPrompt === promptType;

                return (
                  <div key={promptType} className="border border-border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedPrompt(isExpanded ? null : promptType)}
                      className="w-full flex items-center justify-between p-4 bg-muted/20 hover:bg-muted/40 transition-colors"
                    >
                      <span className="font-bold text-foreground">{promptLabels[promptType]}</span>
                      <ChevronDownIcon
                        className={`w-5 h-5 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                      />
                    </button>

                    {isExpanded && (
                      <div className="p-4 space-y-3">
                        <textarea
                          value={localSettings.defaultPrompts[promptType]}
                          onChange={(e) => handlePromptChange(promptType, e.target.value)}
                          rows={12}
                          className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-ring resize-y"
                        />
                        <button
                          onClick={() => resetPromptToDefault(promptType)}
                          className="text-xs text-muted-foreground hover:text-primary underline"
                        >
                          ↻ Réinitialiser au prompt par défaut
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-border bg-muted/10">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-md border border-border text-foreground hover:bg-muted transition-colors"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            💾 Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
