
import { StyleCategory, StyleDistribution } from './types';

export const INITIAL_STYLES: StyleCategory[] = [
  {
    id: 'user',
    name: "Style Utilisateur Principal",
    description: "La 'voix' de base de l'auteur, souvent un mélange de professionnalisme et de clarté.",
    documents: [
      { id: 'user1', name: 'email_professionnel_long.txt', content: "Bonjour à toute l'équipe,\n\nSuite à notre réunion de planification de lundi dernier, je tenais à vous faire parvenir un compte-rendu détaillé des points abordés et des décisions prises concernant le projet 'Phoenix'. Premièrement, nous avons validé le calendrier de développement pour le T3, avec une attention particulière portée aux jalons critiques des semaines 5 et 8. Il est impératif que chaque département respecte ces échéances pour éviter un effet domino sur la livraison finale. J'ai joint le diagramme de Gantt mis à jour à cet effet." },
    ],
    keywords: ['clair', 'concis', 'direct', 'professionnel', 'structuré']
  },
  {
    id: 'marketing',
    name: "Style Marketer / Vendeur",
    description: "Persuasif, captivant et axé sur l'impact psychologique et la conversion.",
    documents: [
      { id: 'mkt1', name: 'copywriting_persuasif.txt', content: "Et si vous pouviez doubler votre productivité sans travailler une heure de plus ? Ça ressemble à une promesse trop belle pour être vraie, n'est-ce pas ? Pourtant, ce n'est pas une question de magie, c'est une question de système. La plupart des gens s'épuisent à nager à contre-courant alors qu'il suffit de construire un barrage intelligent. Dans ce guide, je ne vais pas vous donner des conseils génériques. Je vais vous montrer exactement comment les 1% utilisent la psychologie comportementale pour dominer leur emploi du temps. Ne laissez pas une autre journée filer entre vos doigts. Le moment d'agir, c'est maintenant." },
      { id: 'mkt2', name: 'page_de_vente_impact.txt', content: "Pourquoi vos clients ignorent-ils vos emails ? La vérité est brutale : vous parlez de vous, pas d'eux. Personne ne se soucie de vos fonctionnalités techniques. Ce qu'ils veulent, c'est la fin de leur douleur, la réalisation de leur désir le plus profond. Arrêtez de vendre des perceuses, commencez à vendre des trous parfaits dans le mur. Notre solution Humanizer Z12 ne se contente pas de réécrire du texte. Elle injecte une âme dans vos mots. Elle crée cette connexion invisible qui transforme un simple lecteur en un ambassadeur passionné. Êtes-vous prêt à changer de ligue ?" }
    ],
    keywords: ['persuasif', 'émotionnel', 'captivant', 'vendeur', 'psychologique']
  },
  {
    id: 'journalistic',
    name: "Style Journalistique",
    description: "Clarté, objectivité et narration factuelle, souvent avec une accroche percutante.",
    documents: [],
    keywords: ['factuel', 'informatif', 'engageant', 'narratif', 'objectif']
  },
  {
    id: 'academic',
    name: "Style Académique",
    description: "Rigueur, précision, argumentation formelle et citations.",
    documents: [],
    keywords: ['formel', 'analytique', 'sourcé', 'précis', 'argumenté']
  },
  {
    id: 'conversational',
    name: "Style Conversationnel",
    description: "Proximité, ton direct, langage accessible et questions au lecteur.",
    documents: [],
    keywords: ['accessible', 'relatable', 'informel', 'direct', 'engageant']
  },
  {
    id: 'creative',
    name: "Style Créatif",
    description: "Originalité, imagerie, langage évocateur et expression personnelle.",
    documents: [],
    keywords: ['imaginatif', 'évocateur', 'artistique', 'sensoriel', 'métaphorique']
  },
];

export const INITIAL_DISTRIBUTION: StyleDistribution = {
  user: 30,
  marketing: 30,
  journalistic: 10,
  academic: 10,
  conversational: 10,
  creative: 10,
};

export const MAX_INPUT_CHARS = 500000;
