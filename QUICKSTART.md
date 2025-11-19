# 🚀 Guide de Démarrage Rapide - Humanizer Z12 v2.1.0

## ⚠️ Problème : Le bouton "Générer" ne fonctionne pas ?

### Solution en 3 étapes :

#### 1️⃣ Obtenez votre clé API Gemini

- Allez sur : https://aistudio.google.com/app/apikey
- Cliquez sur "Create API Key"
- Copiez la clé (format: `AIzaSy...`)

#### 2️⃣ Configurez le fichier `.env.local`

Ouvrez le fichier `.env.local` à la racine du projet et ajoutez votre clé :

```env
GEMINI_API_KEY=AIzaSyCvotre_vraie_cle_ici
```

**IMPORTANT** : Remplacez `AIzaSyCvotre_vraie_cle_ici` par votre vraie clé API !

#### 3️⃣ Redémarrez le serveur

```bash
# Arrêtez le serveur (Ctrl+C)
# Puis relancez :
npm run dev
```

---

## ✅ Vérification

Si tout fonctionne correctement :

1. L'application s'ouvre sur http://localhost:3000
2. Vous pouvez entrer un sujet dans le champ "Sujet ou texte à humaniser"
3. Le bouton "Générer le Texte Humanisé" est cliquable (pas grisé)
4. Après avoir cliqué, vous voyez "Génération en cours..."
5. Le texte humanisé apparaît avec les phrases surlignées en couleur

---

## 🐛 Dépannage

### Erreur "API key not found"
→ Vérifiez que `GEMINI_API_KEY` est bien défini dans `.env.local`

### Le bouton reste grisé
→ Vérifiez que vous avez entré du texte dans le champ d'entrée

### Erreur 403 ou "Invalid API key"
→ Votre clé API est invalide ou a expiré, générez-en une nouvelle

### Rien ne se passe au clic
→ Ouvrez la console du navigateur (F12) et vérifiez les erreurs

---

## 📋 Checklist Complète

- [ ] Node.js installé (v18+)
- [ ] `npm install` exécuté
- [ ] Clé API Gemini obtenue
- [ ] `.env.local` créé avec `GEMINI_API_KEY`
- [ ] Serveur démarré avec `npm run dev`
- [ ] Application accessible sur http://localhost:3000
- [ ] Bouton "Générer" fonctionne

---

## 🎯 Premier Test

Une fois configuré, testez avec ce sujet :

```
Les avancées technologiques dans le domaine de l'intelligence artificielle
```

Vous devriez obtenir :
- ✅ Texte généré en 5-15 secondes
- ✅ Score d'humanisation affiché (ex: 85%)
- ✅ Phrases surlignées en rouge/orange/jaune
- ✅ Possibilité de cliquer pour éditer

---

## 📞 Support

Si le problème persiste :
1. Vérifiez les logs dans la console du terminal
2. Vérifiez les erreurs dans la console du navigateur (F12)
3. Ouvrez une issue sur GitHub : https://github.com/zakibelm/Humanizer-Z12/issues

---

**Version :** 2.1.0
**Dernière mise à jour :** 2025-01-18
