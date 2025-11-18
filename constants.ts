
import { StyleCategory, StyleDistribution } from './types';

export const INITIAL_STYLES: StyleCategory[] = [
  {
    id: 'user',
    name: "Style Utilisateur Principal",
    description: "La 'voix' de base de l'auteur.",
    documents: [
      { id: 'user1', name: 'email_professionnel.txt', content: "Bonjour, Suite à notre conversation, je vous confirme la réception des documents. L'analyse est en cours et je reviendrai vers vous avec un compte-rendu détaillé d'ici la fin de semaine. Cordialement." },
      { id: 'user2', name: 'rapport_analyse.txt', content: "Le présent rapport a pour objectif d'analyser les tendances du marché. La méthodologie employée repose sur une approche quantitative des données collectées au cours du dernier trimestre. Les résultats préliminaires indiquent une croissance significative." },
    ],
    keywords: ['clair', 'concis', 'direct', 'professionnel']
  },
  {
    id: 'journalistic',
    name: "Style Journalistique",
    description: "Clarté, objectivité et narration factuelle.",
    documents: [
      { id: 'jour1', name: 'article_enquete.txt', content: "Hier, les autorités ont annoncé une nouvelle série de mesures visant à réguler le secteur technologique. Des experts s'interrogent sur l'impact potentiel de ces régulations sur l'innovation et la compétitivité." },
    ],
    keywords: ['factuel', 'informatif', 'engageant', 'structuré']
  },
  {
    id: 'academic',
    name: "Style Académique",
    description: "Rigueur, précision et argumentation formelle.",
    documents: [
      { id: 'acad1', name: 'these_recherche.txt', content: "Cette recherche postule que les structures cognitives influencent directement les processus décisionnels. En nous appuyant sur les travaux de Kahneman (2011), nous avons développé un modèle expérimental pour tester cette hypothèse." },
    ],
    keywords: ['formel', 'analytique', 'sourcé', 'précis']
  },
  {
    id: 'conversational',
    name: "Style Conversationnel",
    description: "Proximité, ton direct et langage accessible.",
    documents: [
      { id: 'conv1', name: 'post_de_blog.txt', content: "Vous vous êtes déjà demandé pourquoi certaines habitudes sont si difficiles à changer ? En fait, c'est assez simple quand on y pense. Notre cerveau est câblé pour préférer les chemins familiers. Voyons comment on peut le déjouer." },
    ],
    keywords: ['accessible', 'relatable', 'informel', 'direct']
  },
  {
    id: 'creative',
    name: "Style Créatif",
    description: "Originalité, imagerie et expression personnelle.",
    documents: [
      { id: 'crea1', name: 'nouvelle_fiction.txt', content: "La lune, tel un disque d'argent usé, déversait une lumière blafarde sur les toits endormis. Le silence n'était brisé que par le murmure du vent dans les ruelles désertes, un secret chuchoté à la nuit." },
    ],
    keywords: ['imaginatif', 'évocateur', 'artistique', 'original']
  },
];

export const INITIAL_DISTRIBUTION: StyleDistribution = {
  user: 45,
  journalistic: 20,
  academic: 15,
  conversational: 12,
  creative: 8,
};