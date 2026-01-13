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
