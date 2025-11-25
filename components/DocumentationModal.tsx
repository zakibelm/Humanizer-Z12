
import React, { useState } from 'react';
import ZapIcon from './icons/ZapIcon';
import ShieldCheckIcon from './icons/ShieldCheckIcon';
import BookOpenIcon from './icons/BookOpenIcon';
import CogIcon from './icons/CogIcon';

interface DocumentationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DocumentationModal: React.FC<DocumentationModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'start' | 'agentic' | 'metrics' | 'library'>('start');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-card w-full max-w-4xl h-[85vh] rounded-xl border border-border shadow-2xl flex flex-col overflow-hidden relative">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-border bg-muted/20">
            <div>
                <h2 className="text-2xl font-bold text-foreground">Documentation Humanizer Z12</h2>
                <p className="text-sm text-muted-foreground">Guide complet d'utilisation et manuel technique.</p>
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

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 bg-muted/30 border-r border-border p-4 space-y-2 overflow-y-auto">
                <button 
                    onClick={() => setActiveTab('start')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'start' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <ZapIcon className="w-4 h-4 mr-3" />
                    Démarrage Rapide
                </button>
                <button 
                    onClick={() => setActiveTab('agentic')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'agentic' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <ShieldCheckIcon className="w-4 h-4 mr-3" />
                    Mode Agentique (Expert)
                </button>
                <button 
                    onClick={() => setActiveTab('metrics')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'metrics' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <CogIcon className="w-4 h-4 mr-3" />
                    Comprendre les Scores
                </button>
                <button 
                    onClick={() => setActiveTab('library')}
                    className={`w-full flex items-center p-3 rounded-lg text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-primary text-primary-foreground shadow-md' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                >
                    <BookOpenIcon className="w-4 h-4 mr-3" />
                    Bibliothèque de Styles
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 p-8 overflow-y-auto font-serif leading-relaxed text-foreground/90">
                
                {activeTab === 'start' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-primary mb-4 font-sans">🚀 Démarrage Rapide</h3>
                        
                        <div className="bg-muted/30 p-4 rounded-lg border-l-4 border-primary">
                            <p className="font-medium">Humanizer Z12 transforme des textes générés par IA (ChatGPT, Claude) en textes au profil stylométrique naturel et fluide.</p>
                        </div>

                        <ol className="list-decimal list-inside space-y-4 marker:text-primary marker:font-bold">
                            <li>
                                <strong>Préparez votre texte :</strong> Collez votre brouillon généré par une IA dans la zone de texte principale, ou écrivez simplement un sujet (ex: "Les avantages de l'énergie solaire").
                            </li>
                            <li>
                                <strong>Choisissez vos styles (Optionnel) :</strong> Utilisez le panneau de gauche "Bibliothèque" pour ajouter vos propres documents (emails, rapports) si vous voulez que l'IA imite VOTRE style.
                            </li>
                            <li>
                                <strong>Configurez le mix (Droite) :</strong> Ajustez les curseurs dans le panneau "Configuration". Par exemple, augmentez "Style Utilisateur" et baissez "Académique" pour un ton plus naturel.
                            </li>
                            <li>
                                <strong>Lancez la génération :</strong> Cliquez sur <span className="inline-block bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded font-bold">Lancer la Génération</span>.
                            </li>
                            <li>
                                <strong>Analysez et Exportez :</strong> Une fois terminé, consultez le score. Si le résultat vous plaît, cliquez sur "Exporter" pour télécharger le rapport complet.
                            </li>
                        </ol>
                    </div>
                )}

                {activeTab === 'agentic' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-accent mb-4 font-sans">🤖 Le Mode Agentique (Auto-Refine)</h3>
                        
                        <p>
                            C'est le cœur de la puissance du Z12. Contrairement aux outils classiques qui génèrent une seule fois, le Z12 possède une boucle de rétroaction autonome <strong>"Observe-Execute"</strong>.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4">
                            <div className="bg-card border border-border p-4 rounded-lg">
                                <h4 className="font-bold text-lg mb-2 text-foreground">1. Génération & Analyse</h4>
                                <p className="text-sm text-muted-foreground">L'IA génère un premier jet, puis bascule instantanément en mode "Analyste Stylométrique" pour s'auto-évaluer.</p>
                            </div>
                            <div className="bg-card border border-border p-4 rounded-lg">
                                <h4 className="font-bold text-lg mb-2 text-foreground">2. Décision & Raffinement</h4>
                                <p className="text-sm text-muted-foreground">Si le score est inférieur à votre cible (ex: 90%), l'IA identifie les phrases "robotiques" et réécrit uniquement ces parties.</p>
                            </div>
                        </div>

                        <h4 className="font-bold font-sans mt-6">Comment le configurer ?</h4>
                        <ul className="list-disc list-inside space-y-2 text-sm">
                            <li><strong>Toggle "Mode Agentique" :</strong> Situé au dessus de la zone de texte. Laissez-le activé pour les meilleurs résultats.</li>
                            <li><strong>Cible (%) :</strong> Le score d'humanisation visé avant que l'IA ne s'arrête.</li>
                            <li><strong>Max Itérations :</strong> Le nombre d'essais maximum (pour éviter les boucles infinies). Généralement, 2 ou 3 itérations suffisent.</li>
                        </ul>
                    </div>
                )}

                {activeTab === 'metrics' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-secondary mb-4 font-sans">📊 Comprendre les Métriques Scientifiques</h3>
                        <p className="text-muted-foreground mb-4">Nous utilisons l'analyse stylométrique avancée (NLP) pour garantir l'authenticité.</p>

                        <div className="space-y-4">
                            <div className="border border-border rounded-lg p-4">
                                <h4 className="text-lg font-bold text-foreground flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                                    Perplexité
                                </h4>
                                <p className="text-sm mt-1">
                                    Mesure à quel point un texte surprend le modèle de langage. 
                                    <br/><span className="italic text-muted-foreground">Humain = Perplexité élevée (choix de mots imprévisibles). IA = Perplexité faible.</span>
                                </p>
                            </div>

                            <div className="border border-border rounded-lg p-4">
                                <h4 className="text-lg font-bold text-foreground flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                                    Burstiness (Variation)
                                </h4>
                                <p className="text-sm mt-1">
                                    Mesure la variation de la structure des phrases. L'IA a tendance à faire des phrases de longueur moyenne constante.
                                    <br/><span className="italic text-muted-foreground">Humain = Alternance de phrases très courtes et très longues (Grande variance).</span>
                                </p>
                            </div>

                            <div className="border border-border rounded-lg p-4">
                                <h4 className="text-lg font-bold text-foreground flex items-center">
                                    <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                                    Flesch Reading Ease
                                </h4>
                                <p className="text-sm mt-1">
                                    Indique la complexité de lecture. Un score trop bas (texte très complexe) ou trop haut (texte enfantin) peut être suspect selon le contexte.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'library' && (
                    <div className="space-y-6 animate-fade-in">
                        <h3 className="text-2xl font-bold text-foreground mb-4 font-sans">📚 Gestion de la Bibliothèque</h3>
                        
                        <p>
                            Le Z12 n'est pas qu'un outil de réécriture, c'est un caméléon. Il apprend de vos documents pour imiter une "voix" spécifique.
                        </p>

                        <div className="space-y-4 mt-6">
                            <h4 className="font-bold font-sans border-b border-border pb-2">Comment ajouter votre propre style ?</h4>
                            <ol className="list-decimal list-inside space-y-3">
                                <li>Ouvrez le panneau <strong>Bibliothèque</strong> à gauche.</li>
                                <li>Dépliez la section <strong>"Style Utilisateur Principal"</strong>.</li>
                                <li>Cliquez sur <span className="text-primary font-medium">Ajouter des documents</span>.</li>
                                <li>Sélectionnez des fichiers <code>.txt</code> ou <code>.md</code> contenant vos propres écrits (emails, articles, rapports).</li>
                            </ol>
                            
                            <div className="bg-yellow-500/10 border border-yellow-500/20 p-4 rounded-md text-sm mt-4">
                                <strong className="text-yellow-500 block mb-1">Conseil Pro :</strong>
                                Pour un résultat optimal, fournissez au moins 3 documents de 500 mots chacun. Plus vous donnez de données, plus le "mimétisme" sera précis.
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentationModal;
