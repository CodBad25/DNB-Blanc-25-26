# DNB Blanc 25-26 - Documentation projet

## Contexte

Ce projet est une **copie dédiée** de l'application MathEval pour le DNB Blanc 25-26 du collège.
Il a été créé le 13 janvier 2026 pour ne pas affecter l'application MathEval principale.

## Liens

- **Site en ligne** : https://dnb-blanc-1.netlify.app/
- **GitHub** : https://github.com/CodBad25/DNB-Blanc-25-26
- **Projet parent** : MathEval (https://correcteur-universel.vercel.app)

## Fonctionnalités implémentées

### 1. Configuration initiale au démarrage
**Fichiers** : `app.html` (ligne ~85), `js/workflow.js` (fonction `startWithConfiguration`)

Au lancement, l'utilisateur voit un écran avec deux options :
- **Passer l'exercice 1 (Automatismes)** : Permet de commencer directement aux exercices DNB
- **Désactiver les écrans d'aide** : Ne pas afficher les modales explicatives à chaque étape

Les préférences sont sauvegardées dans `localStorage` :
- `dnb_skipAutomatismes`
- `dnb_disableGuidance`

### 2. Bouton "Passer cette étape" sur les automatismes
**Fichier** : `app.html` (ligne ~153), `js/app.js` (fonction `skipAutomatismesStep`)

Sur la page de sélection des automatismes, un bouton permet de passer sans en sélectionner.

### 3. Export Pack Sujet
**Fichiers** : `app.html` (modale `exportPackModal`), `js/modules/packManager.js`

Sur l'écran du barème, le bouton "📦 Exporter Pack Sujet" permet :
- **Télécharger un fichier JSON** : À envoyer aux correcteurs par email/clé USB
- **Générer un lien URL** : Les correcteurs peuvent ouvrir ce lien pour charger le sujet automatiquement

Le pack contient :
- Les exercices sélectionnés
- Le barème configuré
- Les automatismes (si sélectionnés)

### 4. Page d'accueil avec deux modes
**Fichier** : `index.html`

La page d'accueil propose deux choix :
- **Concevoir un sujet** : Workflow complet de création
- **Charger un pack sujet** : Import d'un pack pré-configuré

### 5. Mode correction pour les correcteurs
**Fichier** : `js/modules/packManager.js` (fonctions `checkCorrectionMode`, `loadPackAndShowRecap`, `startCorrectionFromPack`)

Quand un correcteur charge un pack :
1. Il voit un **écran récapitulatif** du sujet (exercices, points, etc.)
2. Il clique "Commencer la correction"
3. Il arrive directement à la **saisie des candidats** (étape 4 du workflow)
4. Les étapes 1-3 sont automatiquement marquées comme complétées

### 6. Mode test désactivé
**Fichier** : `js/modules/importJSON.js`

Le mode test JSON (sélecteur "Parsing temps réel / JSON pré-générés") est désactivé en production.
Pour le réactiver : mettre `enabled: true` dans `JSON_SOURCE` (ligne 13).

### 7. Page d'accueil BB1 simplifiée (15 janvier 2026)
**Fichier** : `index.html`

Nouvelle page d'accueil dédiée au DNB Blanc n°1 avec :
- Design moderne (gradient vert/bleu)
- Aperçu des 5 exercices avec emojis (🏃 Course, 🍬 Bonbons, 🌍 CO2, 🐱 Scratch, 🚗 Trajet)
- Stats affichées : 5 exercices, 20 points, 16 questions
- **Bouton principal** : "Commencer la correction" → accès direct sans passer par le barème
- **Boutons secondaires** : "Voir le barème" et "Créer un sujet"

Configuration BB1 intégrée dans `index.html` (variable `bb1Config`) avec barème complet pré-configuré.

### 8. Modale de validation améliorée (15 janvier 2026)
**Fichiers** : `app.html` (ligne ~1071), `css/main.css` (ligne ~1529), `js/app.js` (ligne ~6594)

Améliorations UX de la modale de validation :
- **Score à GAUCHE** du tableau des compétences (propriété CSS `order: -1`)
- **Score agrandi** : font-size 2.2em, padding 15px 25px
- **Couleurs selon le niveau de maîtrise** (classes CSS) :
  - `.tbm` (≥15/20) : Vert - Très bonne maîtrise
  - `.ms` (≥10/20) : Bleu - Maîtrise satisfaisante
  - `.mf` (≥5/20) : Orange - Maîtrise fragile
  - `.mi` (<5/20) : Rouge - Maîtrise insuffisante
- **Boutons agrandis** : padding 12px 24px, font-size 1.05em

### 9. Corrections de bugs (14-15 janvier 2026)
**Fichier** : `js/app.js`

- **Compétences qui n'apparaissaient pas** : Ajout de l'appel à `applyBaremeCompetencesToExercisesData()` dans `loadBB1Exercises()`
- **Scores incorrects (5/3.5 au lieu de 6/4/3/4/3)** : Correction des IDs de questions (`q${qIndex}` au lieu de `q${qIndex + 1}`)
- **Données perdues au refresh** : Implémentation réelle de `saveData()` et `loadData()` avec localStorage
- **Icônes incorrectes sur les cartes candidats** : Utilisation de `getExerciseDisplayInfo(exercise).icon` au lieu d'icônes hardcodées

### 10. Constante BB1_EXERCISES
**Fichier** : `js/app.js` (début du fichier)

```javascript
const BB1_EXERCISES = {
    'dnb_2017_12_wallisfutuna_7': { title: 'Course', icon: '🏃', intro: '...' },
    'dnb_2016_04_pondichery_3': { title: 'Bonbons', icon: '🍬', intro: '...' },
    'dnb_2019_06_asie_2': { title: 'CO2', icon: '🌍', intro: '...' },
    'dnb_2017_11_ameriquesud_6': { title: 'Scratch', icon: '🐱', intro: '...' },
    'dnb_2019_11_ameriquesud_5': { title: 'Trajet', icon: '🚗', intro: '...' }
};
```

## Structure des fichiers principaux

```
DNB-Blanc-25-26/
├── index.html              # Page d'accueil (Concevoir / Charger pack)
├── app.html                # Application principale
├── js/
│   ├── app.js              # Logique principale
│   ├── workflow.js         # Gestion du workflow en 5 étapes
│   ├── state/
│   │   └── appState.js     # État global de l'application
│   └── modules/
│       ├── packManager.js  # Gestion des packs sujet (NOUVEAU)
│       ├── importJSON.js   # Mode test JSON (désactivé)
│       └── ...
├── css/
│   └── main.css
└── netlify.toml            # Configuration Netlify
```

## Workflow de l'application

```
CONCEPTEUR                              CORRECTEURS
    │                                        │
    ▼                                        │
[Configuration initiale]                     │
    │                                        │
    ▼                                        │
[Étape 1: Automatismes] (facultatif)        │
    │                                        │
    ▼                                        │
[Étape 2: Exercices DNB]                    │
    │                                        │
    ▼                                        │
[Étape 3: Barème]                           │
    │                                        │
    ├──── 📦 Export Pack ───────────────► 📥 Import Pack
    │                                        │
    ▼                                        ▼
[Étape 4: Candidats]                   [Récapitulatif]
    │                                        │
    ▼                                        ▼
[Étape 5: Correction]                  [Étape 4: Candidats]
                                             │
                                             ▼
                                       [Étape 5: Correction]
```

## Pour reprendre le développement

1. Ouvrir le projet : `cd /Users/macbelhaj/DNB-Blanc-25-26`
2. Lancer un serveur local : `python3 -m http.server 8080`
3. Ouvrir : http://localhost:8080

Les modifications sont automatiquement déployées sur Netlify à chaque push sur GitHub.

## TODO / Améliorations possibles

- [ ] Ajouter la génération PDF du sujet dans le pack
- [ ] Permettre de modifier un pack existant
- [ ] Ajouter un système de versioning des packs
- [ ] Synchronisation des corrections entre correcteurs (cloud)

## En cours / À vérifier

- [ ] **Vérifier que le score s'affiche bien à GAUCHE** dans la modale de validation après hard refresh
  - CSS modifié : `order: -1` sur `.main-score-container`, `order: 1` sur `.competences-table-container`
  - Version CSS : `v=20260115002`
