/**
 * État global de l'application Correcteur DNB Pro
 * Gère toutes les données centralisées de l'application
 */

// État global de l'application - Déclaration dans le scope global
var appState = {
    candidates: [],
    activeCandidates: [],
    currentCandidateIndex: 0,
    currentTab: 'exercise1',
    scores: {}, // candidateNumber: { ex1: { q1: {score: X, competences: {...}}, ... }, ... }
    quickButtonStates: {}, // candidateNumber: { ex1: { q1: 'tb'|'tf'|'nr'|null, ... }, ... }
    validatedCandidates: {}, // candidateNumber: { validated: true, comment: "...", timestamp: "..." }
    candidateComments: {}, // candidateNumber: "commentaire..."
    autoUpdateOverview: true, // Mise à jour automatique de la vue d'ensemble
    correctionMode: '', // 'candidate' ou 'exercise' ou '' (non sélectionné)
    currentExerciseIndex: 1, // Pour le mode par exercice (1-5)
    modeSelected: false, // Indique si un mode a été explicitement choisi
    // Nouvelles propriétés pour la sélection DNB
    dnbData: {}, // Dictionnaire des exercices DNB from MathALÉA
    selectedExercises: [], // IDs des exercices sélectionnés
    parsedExercises: {}, // Contenu parsé des exercices sélectionnés
    // Propriétés pour les automatismes DNB 2025
    automatismesData: {}, // Dictionnaire des automatismes
    selectedAutomatismes: [], // IDs des automatismes sélectionnés pour Ex1
    parsedAutomatismes: {}, // Contenu parsé des automatismes sélectionnés
    // Configuration du barème
    baremeConfig: {
        mode: 'b', // 'a' = points par compétence, 'b' = répartition auto, 'c' = total uniquement
        totalMax: 20, // DNB 2025 sur 20 points (Ex1: 6pts + Ex2-5: 14pts)
        exercises: {} // exerciseId: { totalPoints, selectedCompetences, pointsPerCompetence }
    }
};

/**
 * Initialise l'état de l'application
 */
function initAppState() {
    console.log('📦 État de l\'application initialisé');
}

/**
 * Réinitialise l'état à zéro
 */
function resetAppState() {
    appState.candidates = [];
    appState.activeCandidates = [];
    appState.currentCandidateIndex = 0;
    appState.scores = {};
    appState.quickButtonStates = {};
    appState.validatedCandidates = {};
    appState.candidateComments = {};
    appState.selectedExercises = [];
    appState.selectedAutomatismes = [];
    appState.parsedExercises = {};
    appState.parsedAutomatismes = {};
    console.log('🔄 État réinitialisé');
}

// Note: avec 'var' au niveau global, appState, initAppState et resetAppState
// sont automatiquement disponibles globalement (window.appState, etc.)
