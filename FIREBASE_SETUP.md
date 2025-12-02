# Configuration Firebase pour Humanizer Z12

Ce guide vous explique comment configurer Firebase pour tracker les connexions et activités des utilisateurs de votre application Humanizer Z12.

## 📋 Prérequis

- Un compte Google (gratuit)
- L'application Humanizer Z12 installée localement

## 🚀 Étape 1 : Créer un projet Firebase

1. Allez sur [Firebase Console](https://console.firebase.google.com/)
2. Cliquez sur "Ajouter un projet" ou "Add project"
3. Donnez un nom à votre projet (ex: `humanizer-z12-prod`)
4. Désactivez Google Analytics si vous n'en avez pas besoin (optionnel)
5. Cliquez sur "Créer le projet"

## 🔧 Étape 2 : Configurer Firestore Database

1. Dans la console Firebase, allez dans **Firestore Database** (menu de gauche)
2. Cliquez sur "Créer une base de données" ou "Create database"
3. Sélectionnez le mode de démarrage:
   - **Mode test** (pour le développement) - Accès libre pendant 30 jours
   - **Mode production** - Nécessite des règles de sécurité
4. Choisissez un emplacement (ex: `europe-west1` pour l'Europe)
5. Cliquez sur "Activer"

### Règles de sécurité Firestore

Allez dans l'onglet **Règles** et utilisez ces règles de base:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Permettre la lecture/écriture pour les sessions
    match /sessions/{sessionId} {
      allow read, write: if true;
    }

    // Permettre la lecture/écriture pour les statistiques utilisateurs
    match /userStats/{userId} {
      allow read, write: if true;
    }

    // Permettre la lecture/écriture pour les activités
    match /activities/{activityId} {
      allow read, write: if true;
    }
  }
}
\`\`\`

**Note:** Ces règles sont permissives. Pour la production, ajoutez une authentification Firebase.

## 🔑 Étape 3 : Obtenir les clés de configuration

1. Dans la console Firebase, cliquez sur l'icône ⚙️ (Paramètres) > **Paramètres du projet**
2. Descendez jusqu'à "Vos applications"
3. Cliquez sur l'icône **</>** (Web)
4. Donnez un surnom à votre app (ex: `Humanizer Z12 Web`)
5. **NE PAS** cocher "Configurez aussi Firebase Hosting"
6. Cliquez sur "Enregistrer l'application"
7. Copiez les valeurs de configuration Firebase

Vous verrez quelque chose comme ça:

\`\`\`javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX"
};
\`\`\`

## 📝 Étape 4 : Configurer les variables d'environnement

1. Dans le dossier de votre projet Humanizer Z12, créez un fichier \`.env\` à la racine
2. Copiez le contenu de \`.env.example\` dans \`.env\`
3. Remplacez les valeurs par celles de Firebase:

\`\`\`env
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
VITE_FIREBASE_MEASUREMENT_ID=G-XXXXXXXXXX
\`\`\`

4. Enregistrez le fichier

## 🧪 Étape 5 : Tester localement

1. Redémarrez votre serveur de développement:
\`\`\`bash
npm run dev
\`\`\`

2. Connectez-vous à l'application
3. Vérifiez la console du navigateur pour voir:
   - ✅ Firebase initialized successfully

4. Dans la Firebase Console > Firestore Database, vous devriez voir apparaître:
   - Une collection **sessions** avec votre session active
   - Une collection **userStats** avec vos statistiques
   - Une collection **activities** avec vos activités

## 📊 Étape 6 : Voir les statistiques

### Dans Firebase Console

1. Allez dans **Firestore Database**
2. Vous verrez 3 collections:

#### **sessions** - Sessions actives
Cliquez sur une session pour voir:
- \`userId\` - ID de l'utilisateur
- \`name\` - Nom de l'utilisateur
- \`email\` - Email de l'utilisateur
- \`loginTime\` - Heure de connexion
- \`lastActivity\` - Dernière activité
- \`isActive\` - Statut actif/inactif
- \`userAgent\` - Navigateur utilisé

#### **userStats** - Statistiques utilisateurs
Cliquez sur un utilisateur pour voir:
- \`totalLogins\` - Nombre total de connexions
- \`lastLogin\` - Dernière connexion
- \`totalActivities\` - Nombre total d'activités
- \`totalTextGenerated\` - Nombre de textes générés
- \`totalTextAnalyzed\` - Nombre de textes analysés
- \`totalTextRefined\` - Nombre de textes raffinés
- \`accountCreated\` - Date de création du compte

#### **activities** - Historique des activités
Chaque activité contient:
- \`userId\` - ID de l'utilisateur
- \`sessionId\` - ID de la session
- \`activityType\` - Type d'activité (text_generation, text_refinement, text_analysis)
- \`timestamp\` - Date et heure
- \`details\` - Détails supplémentaires (longueur du texte, score de détection, etc.)

### Requêtes utiles

Pour voir les utilisateurs actifs (dernière activité < 5 minutes):
1. Allez dans **sessions**
2. Filtrez par \`isActive == true\`
3. Filtrez par \`lastActivity > [il y a 5 minutes]\`

## 🚀 Étape 7 : Déployer sur Netlify avec Firebase

1. Ajoutez vos variables d'environnement dans Netlify:
   - Allez sur votre site Netlify
   - **Site settings** > **Environment variables**
   - Ajoutez toutes les variables \`VITE_FIREBASE_*\`

2. Redéployez votre site

3. Testez la version en production

## 📈 Données trackées automatiquement

L'application track automatiquement:

✅ **À la connexion:**
- Création d'une session
- Mise à jour des stats utilisateur

✅ **Pendant l'utilisation:**
- Heartbeat toutes les 2 minutes (activité)
- Génération de texte (avec longueur et score)
- Raffinement de texte
- Analyse de texte

✅ **À la déconnexion:**
- Fermeture de la session

## 🔒 Sécurité

### Pour la production

1. Activez **Firebase Authentication** pour sécuriser l'accès
2. Mettez à jour les règles Firestore pour autoriser uniquement les utilisateurs authentifiés
3. Ajoutez des limites de taux (rate limiting)

Exemple de règles sécurisées:

\`\`\`javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }

    match /userStats/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }

    match /activities/{activityId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
\`\`\`

## 🛠️ Troubleshooting

### "Firebase not configured"
- Vérifiez que le fichier \`.env\` existe
- Vérifiez que toutes les variables commencent par \`VITE_\`
- Redémarrez le serveur de développement

### "Permission denied"
- Vérifiez les règles Firestore
- En mode test, les règles expirent après 30 jours

### Pas de données dans Firestore
- Vérifiez la console du navigateur pour des erreurs
- Vérifiez que Firebase est bien initialisé (message ✅)
- Vérifiez vos clés de configuration

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez la console du navigateur
2. Vérifiez la console Firebase pour les erreurs
3. Consultez la [documentation Firebase](https://firebase.google.com/docs)

---

**Félicitations ! 🎉**

Votre application Humanizer Z12 est maintenant configurée avec Firebase. Vous pouvez maintenant suivre les connexions et activités de vos utilisateurs en temps réel !
