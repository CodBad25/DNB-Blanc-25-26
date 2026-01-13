// ============================================================================
// MODULE COMPETENCES - Gestion des compétences
// ============================================================================
//
// Ce module gère tout ce qui concerne les compétences mathématiques :
// - Définition des compétences (liste globale)
// - Configuration du barème (sélection, points, détails)
// - Scoring pendant la correction (attribution, calcul)
// - Validation finale (synthèse, niveaux de maîtrise)
// - Modales d'édition des compétences
// - Progression et indicateurs
//
// Dépendances:
// - appState (global) : état de l'application
// - exercisesData (global) : structure de données des exercices
// - defaultCompetences (global) : liste des compétences prédéfinies
// - saveData() (fonction externe) : sauvegarde dans localStorage
//
// @module competences
// ============================================================================

// === DÉFINITIONS DES COMPÉTENCES ===

/**
 * Liste des compétences mathématiques prédéfinies du DNB
 *
 * Chaque compétence comporte un nom, une icône, une couleur et une description.
 * Cette variable est globale (var) pour être accessible depuis tout le code.
 *
 * @type {Array<Object>}
 * @global
 *
 * @property {string} name - Nom de la compétence
 * @property {string} icon - Emoji représentant la compétence
 * @property {string} color - Couleur hex associée
 * @property {string} description - Description de la compétence
 *
 * @module competences
 */
var defaultCompetences = [
    { name: "Calculer", icon: "🧮", color: "#28a745", description: "Effectuer des calculs numériques et littéraux" },
    { name: "Modéliser", icon: "📊", color: "#17a2b8", description: "Traduire en langage mathématique une situation" },
    { name: "Représenter", icon: "📈", color: "#6f42c1", description: "Créer des représentations graphiques, schémas" },
    { name: "Raisonner", icon: "🤔", color: "#dc3545", description: "Tenir une démarche logique, argumenter" },
    { name: "Communiquer", icon: "✓", color: "#ffc107", description: "Expliquer, justifier, présenter une solution" },
    { name: "Chercher", icon: "🔍", color: "#fd7e14", description: "Identifier et mettre en œuvre une stratégie" }
];

// Variables pour les modaux
let modalExerciseId = null;
let modalQuestionId = null;
let modalCompetenceIndex = null;
let pendingExerciseId = null;
let pendingQuestionId = null;

// === CONFIGURATION DU BARÈME (NIVEAU QUESTION) ===

/**
 * Affiche les compétences sélectionnables pour une question d'automatisme
 *
 * Génère les boutons de compétences avec état (sélectionné/non sélectionné)
 * et le bouton d'édition pour les compétences sélectionnées.
 *
 * @param {number} qIndex - Index de la question dans l'exercice 1
 *
 * @example
 * renderAutomatismeQuestionCompetences(0);
 *
 * @dependencies
 * - appState.baremeConfig.exercises['1'] (global)
 * - defaultCompetences (global)
 * - toggleCompetenceForAutomatismeQuestion() (local)
 * - openBaremeQuestionCompetenceModal() (local)
 *
 * @module competences
 */
function renderAutomatismeQuestionCompetences(qIndex) {
    const container = document.getElementById(`qcomp_${qIndex}`);
    if (!container) return;
    const baremeData = appState.baremeConfig.exercises['1'];
    const qKey = `q${qIndex}`;
    const selected = baremeData.questionCompetences[qKey] || [];
    container.innerHTML = defaultCompetences.map(comp => {
        const sel = selected.includes(comp.name);
        const bg = sel ? comp.color : 'white';
        const fg = sel ? 'white' : comp.color;
        return `
            <div style="position: relative; display: inline-flex; margin: 4px;">
                <button type="button"
                        onclick="toggleCompetenceForAutomatismeQuestion(${qIndex}, '${comp.name}')"
                        style="padding:6px 12px; border:2px solid ${comp.color}; border-radius:18px; cursor:pointer; font-weight:600; background:${bg}; color:${fg};">
                    ${comp.icon} ${comp.name}
                </button>
                ${sel ? `
                    <button type="button"
                            onclick="event.stopPropagation(); openBaremeQuestionCompetenceModal('1', ${qIndex}, '${comp.name}')"
                            style="position: absolute; top: -6px; right: -6px; width: 20px; height: 20px; border-radius: 50%; background: white; border: 2px solid ${comp.color}; cursor: pointer; font-size: 10px; display: flex; align-items: center; justify-content: center; padding: 0;"
                            title="Éditer les détails de cette compétence">
                        ✏️
                    </button>
                ` : ''}
            </div>`;
    }).join('');
}

/**
 * Toggle la sélection d'une compétence pour une question d'automatisme
 *
 * Ajoute ou retire une compétence de la liste des compétences sélectionnées
 * pour la question, puis met à jour l'affichage et sauvegarde.
 *
 * @param {number} qIndex - Index de la question dans l'exercice 1
 * @param {string} compName - Nom de la compétence
 *
 * @example
 * toggleCompetenceForAutomatismeQuestion(0, "Calculer");
 *
 * @dependencies
 * - appState.baremeConfig.exercises['1'] (global)
 * - renderAutomatismeQuestionCompetences() (local)
 * - updateCompetencesSummary() (local)
 * - saveData() (fonction externe)
 *
 * @module competences
 */
function toggleCompetenceForAutomatismeQuestion(qIndex, compName) {
    const baremeData = appState.baremeConfig.exercises['1'];
    if (!baremeData.questionCompetences) baremeData.questionCompetences = {};
    const qKey = `q${qIndex}`;
    if (!baremeData.questionCompetences[qKey]) baremeData.questionCompetences[qKey] = [];
    const list = baremeData.questionCompetences[qKey];
    const i = list.indexOf(compName);
    if (i >= 0) list.splice(i, 1); else list.push(compName);
    renderAutomatismeQuestionCompetences(qIndex);
    updateCompetencesSummary();
    saveData();
}

/**
 * Affiche les compétences avec points ajustables pour une question DNB
 *
 * Génère les boutons de compétences avec des contrôles +/- pour ajuster
 * les points de chaque compétence sélectionnée.
 *
 * @param {string|number} exerciseNum - Numéro de l'exercice (2-5)
 * @param {number} qIndex - Index de la question dans l'exercice
 *
 * @example
 * renderDNBQuestionCompetences("2", 0);
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - defaultCompetences (global)
 * - toggleCompetenceForDNBQuestion() (local)
 * - adjustCompetencePoints() (local)
 *
 * @module competences
 */
function renderDNBQuestionCompetences(exerciseNum, qIndex) {
    const container = document.getElementById(`qcomp_dnb_${exerciseNum}_${qIndex}`);
    if (!container) return;
    const baremeData = appState.baremeConfig.exercises[exerciseNum];
    if (!baremeData.questionCompetences) baremeData.questionCompetences = {};
    const qKey = `q${qIndex}`;
    const selected = baremeData.questionCompetences[qKey] || [];

    // Initialiser les points des compétences si nécessaire
    if (!baremeData.questionCompetencePoints) baremeData.questionCompetencePoints = {};
    if (!baremeData.questionCompetencePoints[qKey]) baremeData.questionCompetencePoints[qKey] = {};

    // Récupérer les points de la question
    const questionPoints = baremeData.questionPoints && baremeData.questionPoints[qKey]
        ? baremeData.questionPoints[qKey]
        : 1;

    container.innerHTML = defaultCompetences.map(comp => {
        const sel = selected.includes(comp.name);
        const bg = sel ? comp.color : 'white';
        const fg = sel ? 'white' : comp.color;

        // Points de cette compétence (répartis équitablement par défaut)
        let compPoints = 0;
        if (sel) {
            if (!baremeData.questionCompetencePoints[qKey][comp.name]) {
                // Répartition équitable par défaut
                compPoints = Math.round((questionPoints / selected.length) * 10) / 10;
                baremeData.questionCompetencePoints[qKey][comp.name] = compPoints;
            } else {
                compPoints = baremeData.questionCompetencePoints[qKey][comp.name];
            }
        }

        return `
            <div style="position: relative; display: inline-flex; flex-direction: column; margin: 4px; background: ${sel ? 'rgba(255,255,255,0.1)' : 'transparent'}; padding: ${sel ? '8px' : '0'}; border-radius: 12px;">
                <button type="button"
                        onclick="toggleCompetenceForDNBQuestion('${exerciseNum}', ${qIndex}, '${comp.name}')"
                        style="padding:6px 12px; border:2px solid ${comp.color}; border-radius:18px; cursor:pointer; font-weight:600; background:${bg}; color:${fg};">
                    ${comp.icon} ${comp.name}
                </button>
                ${sel ? `
                    <div style="display: flex; align-items: center; justify-content: center; gap: 6px; margin-top: 6px;">
                        <button type="button"
                                onclick="adjustCompetencePoints('${exerciseNum}', ${qIndex}, '${comp.name}', -0.5)"
                                style="width: 24px; height: 24px; border-radius: 50%; background: #dc3545; color: white; border: none; cursor: pointer; font-weight: bold; font-size: 16px; display: flex; align-items: center; justify-content: center;"
                                title="Diminuer de 0.5 pt">
                            −
                        </button>
                        <span style="font-weight: bold; color: ${comp.color}; min-width: 40px; text-align: center; font-size: 14px;">
                            ${compPoints} pt
                        </span>
                        <button type="button"
                                onclick="adjustCompetencePoints('${exerciseNum}', ${qIndex}, '${comp.name}', 0.5)"
                                style="width: 24px; height: 24px; border-radius: 50%; background: #28a745; color: white; border: none; cursor: pointer; font-weight: bold; font-size: 16px; display: flex; align-items: center; justify-content: center;"
                                title="Augmenter de 0.5 pt">
                            +
                        </button>
                    </div>
                ` : ''}
            </div>`;
    }).join('');
}

/**
 * Toggle la sélection d'une compétence pour une question DNB
 *
 * Ajoute ou retire une compétence puis redistribue automatiquement
 * les points entre toutes les compétences sélectionnées.
 *
 * @param {string|number} exerciseNum - Numéro de l'exercice (2-5)
 * @param {number} qIndex - Index de la question
 * @param {string} compName - Nom de la compétence
 *
 * @example
 * toggleCompetenceForDNBQuestion("2", 0, "Raisonner");
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - redistributeQuestionCompetencePoints() (local)
 * - updateCompetencesSummary() (local)
 * - saveData() (fonction externe)
 *
 * @module competences
 */
function toggleCompetenceForDNBQuestion(exerciseNum, qIndex, compName) {
    const baremeData = appState.baremeConfig.exercises[exerciseNum];
    if (!baremeData.questionCompetences) baremeData.questionCompetences = {};
    const qKey = `q${qIndex}`;
    if (!baremeData.questionCompetences[qKey]) baremeData.questionCompetences[qKey] = [];
    const list = baremeData.questionCompetences[qKey];
    const i = list.indexOf(compName);

    // Ajouter ou retirer la compétence
    if (i >= 0) {
        list.splice(i, 1);
        // Supprimer les points de cette compétence
        if (baremeData.questionCompetencePoints && baremeData.questionCompetencePoints[qKey]) {
            delete baremeData.questionCompetencePoints[qKey][compName];
        }
    } else {
        list.push(compName);
    }

    // Redistribuer les points entre les compétences
    redistributeQuestionCompetencePoints(exerciseNum, qIndex);

    updateCompetencesSummary();
    saveData();
}

/**
 * Ajuste les points d'une compétence avec les boutons +/-
 *
 * Modifie les points attribués à une compétence spécifique et vérifie
 * que le total ne dépasse pas les points de la question.
 *
 * @param {string|number} exerciseNum - Numéro de l'exercice
 * @param {number} questionIndex - Index de la question
 * @param {string} compName - Nom de la compétence
 * @param {number} delta - Variation de points (+0.5 ou -0.5)
 *
 * @example
 * adjustCompetencePoints("2", 0, "Calculer", 0.5);
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - renderDNBQuestionCompetences() (local)
 * - updateCompetencesSummary() (local)
 * - saveData() (fonction externe)
 *
 * @module competences
 */
function adjustCompetencePoints(exerciseNum, questionIndex, compName, delta) {
    const baremeData = appState.baremeConfig.exercises[exerciseNum];
    const qKey = `q${questionIndex}`;

    if (!baremeData.questionCompetencePoints) baremeData.questionCompetencePoints = {};
    if (!baremeData.questionCompetencePoints[qKey]) baremeData.questionCompetencePoints[qKey] = {};

    // Récupérer les points actuels
    let currentPoints = baremeData.questionCompetencePoints[qKey][compName] || 0;
    let newPoints = Math.round((currentPoints + delta) * 10) / 10;

    // Ne pas descendre en dessous de 0
    if (newPoints < 0) newPoints = 0;

    // Mettre à jour les points
    baremeData.questionCompetencePoints[qKey][compName] = newPoints;

    // Vérifier la cohérence : la somme des points des compétences ne doit pas dépasser les points de la question
    const selectedCompetences = baremeData.questionCompetences[qKey] || [];
    let totalCompPoints = 0;
    selectedCompetences.forEach(comp => {
        totalCompPoints += baremeData.questionCompetencePoints[qKey][comp] || 0;
    });

    const questionPoints = baremeData.questionPoints && baremeData.questionPoints[qKey]
        ? baremeData.questionPoints[qKey]
        : 1;

    // Si le total dépasse, ajuster les autres compétences proportionnellement
    if (totalCompPoints > questionPoints + 0.1) { // tolérance de 0.1
        console.warn(`⚠️ Total des compétences (${totalCompPoints}) dépasse les points de la question (${questionPoints})`);
        // On pourrait implémenter un ajustement automatique ici si nécessaire
    }

    // Re-render les compétences
    renderDNBQuestionCompetences(exerciseNum, questionIndex);
    updateCompetencesSummary();
    saveData();

    console.log(`✅ Compétence ${compName}: ${newPoints} pts (delta: ${delta})`);
}

/**
 * Redistribue équitablement les points entre les compétences d'une question
 *
 * Après ajout/retrait d'une compétence, recalcule automatiquement
 * les points de toutes les compétences pour respecter le total de la question.
 *
 * @param {string|number} exerciseNum - Numéro de l'exercice
 * @param {number} questionIndex - Index de la question
 *
 * @example
 * redistributeQuestionCompetencePoints("2", 0);
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - renderDNBQuestionCompetences() (local)
 *
 * @module competences
 */
function redistributeQuestionCompetencePoints(exerciseNum, questionIndex) {
    const baremeData = appState.baremeConfig.exercises[exerciseNum];
    const qKey = `q${questionIndex}`;

    const selectedCompetences = baremeData.questionCompetences[qKey] || [];
    if (selectedCompetences.length === 0) {
        // Nettoyer les points si aucune compétence sélectionnée
        if (baremeData.questionCompetencePoints && baremeData.questionCompetencePoints[qKey]) {
            delete baremeData.questionCompetencePoints[qKey];
        }
        renderDNBQuestionCompetences(exerciseNum, questionIndex);
        return;
    }

    // Récupérer les points de la question
    const questionPoints = baremeData.questionPoints && baremeData.questionPoints[qKey]
        ? baremeData.questionPoints[qKey]
        : 1;

    // Redistribuer équitablement
    if (!baremeData.questionCompetencePoints) baremeData.questionCompetencePoints = {};
    if (!baremeData.questionCompetencePoints[qKey]) baremeData.questionCompetencePoints[qKey] = {};

    const pointsPerComp = Math.round((questionPoints / selectedCompetences.length) * 10) / 10;
    let remainder = questionPoints - (pointsPerComp * selectedCompetences.length);
    remainder = Math.round(remainder * 10) / 10;

    selectedCompetences.forEach((compName, index) => {
        let pts = pointsPerComp;
        // Ajouter le reste à la première compétence
        if (index === 0 && remainder !== 0) {
            pts = Math.round((pts + remainder) * 10) / 10;
        }
        baremeData.questionCompetencePoints[qKey][compName] = pts;
    });

    renderDNBQuestionCompetences(exerciseNum, questionIndex);
}

// === CONFIGURATION DU BARÈME (NIVEAU EXERCICE) ===

/**
 * Calcule les compétences utilisées dans un exercice depuis ses questions
 *
 * Parcourt toutes les questions d'un exercice et extrait l'ensemble
 * des compétences sélectionnées (sans doublon).
 *
 * @param {string|number} exerciseNum - Numéro de l'exercice
 * @returns {string[]} Liste des noms de compétences uniques
 *
 * @example
 * const comps = getExerciseCompetencesFromQuestions("2");
 * // Retourne: ["Calculer", "Raisonner", "Communiquer"]
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 *
 * @module competences
 */
function getExerciseCompetencesFromQuestions(exerciseNum) {
    const baremeData = appState.baremeConfig.exercises[exerciseNum];
    if (!baremeData || !baremeData.questionCompetences) return [];

    const allCompetences = new Set();
    Object.values(baremeData.questionCompetences).forEach(compList => {
        compList.forEach(compName => allCompetences.add(compName));
    });

    return Array.from(allCompetences);
}

/**
 * Met à jour le résumé des compétences d'un exercice
 *
 * Affiche dans l'interface le récapitulatif des compétences et points
 * pour un exercice donné.
 *
 * @param {string} exerciseId - ID de l'exercice (ex: "1", "2")
 *
 * @example
 * updateExerciseCompetencesSummary("2");
 *
 * @dependencies
 * - getExerciseCompetencesFromQuestions() (local)
 *
 * @module competences
 */
function updateExerciseCompetencesSummary(exerciseId) {
    const summaryEl = document.getElementById(`competencesSummary_${exerciseId}`);
    if (!summaryEl) return;

    const competences = getExerciseCompetencesFromQuestions(exerciseId);
    if (competences.length === 0) {
        summaryEl.innerHTML = '<em style="color: #999;">Aucune compétence sélectionnée</em>';
        return;
    }

    summaryEl.innerHTML = competences.map(compName => {
        const comp = defaultCompetences.find(c => c.name === compName);
        return `<span style="padding: 4px 8px; margin: 2px; background: ${comp.color}; color: white; border-radius: 12px; font-size: 0.85em;">${comp.icon} ${compName}</span>`;
    }).join(' ');
}

/**
 * Met à jour le résumé global des compétences de tous les exercices
 *
 * Parcourt tous les exercices et agrège les compétences utilisées
 * avec le total de points par compétence.
 *
 * @example
 * updateCompetencesSummary();
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - defaultCompetences (global)
 *
 * @module competences
 */
function updateCompetencesSummary() {
    const summaryEl = document.getElementById('globalCompetencesSummary');
    if (!summaryEl) return;

    // Agréger les compétences de tous les exercices
    const competencesPoints = {};
    defaultCompetences.forEach(comp => {
        competencesPoints[comp.name] = { total: 0, color: comp.color, icon: comp.icon };
    });

    Object.keys(appState.baremeConfig.exercises).forEach(exNum => {
        const baremeData = appState.baremeConfig.exercises[exNum];
        if (!baremeData.questionCompetencePoints) return;

        Object.values(baremeData.questionCompetencePoints).forEach(qPoints => {
            Object.entries(qPoints).forEach(([compName, points]) => {
                if (competencesPoints[compName]) {
                    competencesPoints[compName].total += points;
                }
            });
        });
    });

    // Afficher le résumé
    const html = Object.entries(competencesPoints)
        .filter(([name, data]) => data.total > 0)
        .map(([name, data]) => {
            return `<div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; margin: 4px; background: ${data.color}; color: white; border-radius: 18px; font-weight: 600;">
                <span>${data.icon}</span>
                <span>${name}</span>
                <span style="background: rgba(255,255,255,0.3); padding: 2px 6px; border-radius: 8px; font-size: 0.9em;">${Math.round(data.total * 10) / 10} pts</span>
            </div>`;
        })
        .join('');

    summaryEl.innerHTML = html || '<em style="color: #999;">Aucune compétence configurée</em>';
}

// === SCORING PENDANT LA CORRECTION ===

/**
 * Récupère le score d'une compétence pour un candidat
 *
 * Accède à la structure appState.scores pour extraire le score
 * d'une compétence spécifique d'une question d'un exercice.
 *
 * @param {number} candidateNumber - Numéro du candidat
 * @param {string|number} exerciseNumber - Numéro de l'exercice
 * @param {string} questionId - ID de la question (ex: "q1")
 * @param {string} competenceName - Nom de la compétence
 * @returns {number} Le score de la compétence (0 si non défini)
 *
 * @example
 * const score = getCandidateCompetenceScore(150, "2", "q1", "Calculer");
 * // Retourne: 2
 *
 * @dependencies
 * - appState.scores (global)
 *
 * @module competences
 */
function getCandidateCompetenceScore(candidateNumber, exerciseNumber, questionId, competenceName) {
    if (!appState.scores[candidateNumber]) return 0;
    if (!appState.scores[candidateNumber][exerciseNumber]) return 0;
    if (!appState.scores[candidateNumber][exerciseNumber][questionId]) return 0;
    if (!appState.scores[candidateNumber][exerciseNumber][questionId].competences) return 0;
    return appState.scores[candidateNumber][exerciseNumber][questionId].competences[competenceName] || 0;
}

/**
 * Définit le score d'une compétence pour un candidat
 *
 * Met à jour le score d'une compétence et recalcule automatiquement
 * le score total de la question.
 *
 * @param {number} candidateNumber - Numéro du candidat
 * @param {string|number} exerciseNumber - Numéro de l'exercice
 * @param {string} questionId - ID de la question
 * @param {string} competenceName - Nom de la compétence
 * @param {number} score - Nouveau score à attribuer
 *
 * @example
 * setCandidateCompetenceScore(150, "2", "q1", "Calculer", 2);
 *
 * @dependencies
 * - appState.scores (global)
 * - exercisesData (global)
 *
 * @module competences
 */
function setCandidateCompetenceScore(candidateNumber, exerciseNumber, questionId, competenceName, score) {
    if (!appState.scores[candidateNumber]) {
        appState.scores[candidateNumber] = {};
    }
    if (!appState.scores[candidateNumber][exerciseNumber]) {
        appState.scores[candidateNumber][exerciseNumber] = {};
    }
    if (!appState.scores[candidateNumber][exerciseNumber][questionId]) {
        appState.scores[candidateNumber][exerciseNumber][questionId] = { score: 0, competences: {} };
    }

    appState.scores[candidateNumber][exerciseNumber][questionId].competences[competenceName] = score;

    // Recalculer le score total de la question
    const question = exercisesData[exerciseNumber].questions.find(q => q.id === questionId);
    let totalScore = 0;
    question.competences.forEach(comp => {
        totalScore += appState.scores[candidateNumber][exerciseNumber][questionId].competences[comp.name] || 0;
    });
    appState.scores[candidateNumber][exerciseNumber][questionId].score = totalScore;
}

// Variables globales pour la gestion de l'appui long
let competencePressTimer = null;
let competencePressStartTime = 0;
const LONG_PRESS_DURATION = 600; // 600ms pour considérer comme un appui long

/**
 * Gère les événements d'appui (court/long) sur un bouton de compétence
 *
 * Implémente la détection d'appui long (600ms) pour mettre une compétence à 0,
 * et l'appui court pour incrémenter normalement.
 *
 * @param {string|number} exerciseNumber - Numéro de l'exercice
 * @param {string} questionId - ID de la question
 * @param {string} competenceName - Nom de la compétence
 * @param {number} maxPoints - Points maximum de la compétence
 * @param {Event} event - L'événement DOM
 * @param {string} action - Type d'action ('start', 'end', 'cancel')
 *
 * @example
 * // Dans le HTML :
 * // onmousedown="handleCompetenceButtonPress(..., event, 'start')"
 * // onmouseup="handleCompetenceButtonPress(..., event, 'end')"
 *
 * @dependencies
 * - toggleCompetenceScore() (local)
 *
 * @module competences
 */
function handleCompetenceButtonPress(exerciseNumber, questionId, competenceName, maxPoints, event, action) {
    if (action === 'start') {
        // Début de l'appui
        competencePressStartTime = Date.now();
        const buttonId = `comp_${exerciseNumber}_${questionId}_${competenceName.replace(/\s/g, '_')}`;
        const button = document.getElementById(buttonId);

        // Timer pour afficher le feedback visuel
        competencePressTimer = setTimeout(() => {
            // Ajouter classe de feedback visuel après 600ms
            if (button) {
                button.classList.add('long-press-active');
            }
        }, LONG_PRESS_DURATION);

    } else if (action === 'end') {
        // Fin de l'appui
        const pressDuration = Date.now() - competencePressStartTime;
        const buttonId = `comp_${exerciseNumber}_${questionId}_${competenceName.replace(/\s/g, '_')}`;
        const button = document.getElementById(buttonId);

        // Nettoyer le timer et le feedback visuel
        if (competencePressTimer) {
            clearTimeout(competencePressTimer);
            competencePressTimer = null;
        }
        if (button) {
            button.classList.remove('long-press-active');
        }

        // Déterminer l'action selon la durée
        if (pressDuration >= LONG_PRESS_DURATION) {
            // Appui long → mettre à 0
            console.log(`🔥 Appui long détecté (${pressDuration}ms) → Mise à 0`);
            toggleCompetenceScore(exerciseNumber, questionId, competenceName, maxPoints, true);
        } else {
            // Appui court → incrément normal
            toggleCompetenceScore(exerciseNumber, questionId, competenceName, maxPoints, false);
        }

        competencePressStartTime = 0;
    } else if (action === 'cancel') {
        // Annulation (souris sort du bouton)
        if (competencePressTimer) {
            clearTimeout(competencePressTimer);
            competencePressTimer = null;
        }
        const buttonId = `comp_${exerciseNumber}_${questionId}_${competenceName.replace(/\s/g, '_')}`;
        const button = document.getElementById(buttonId);
        if (button) {
            button.classList.remove('long-press-active');
        }
        competencePressStartTime = 0;
    }
}

/**
 * Toggle le score d'une compétence avec système incrémental
 *
 * Implémente la logique de clics incrémentiels : chaque clic ajoute l'incrément
 * jusqu'au maximum, puis revient à 0. L'appui long permet de mettre directement à 0.
 * Gère automatiquement l'activation des boutons rapides TB/TF selon le score total.
 *
 * @param {string|number} exerciseNumber - Numéro de l'exercice
 * @param {string} questionId - ID de la question
 * @param {string} competenceName - Nom de la compétence
 * @param {number} maxPoints - Points maximum de la compétence
 * @param {boolean} [setToZero=false] - Si true, met directement à 0 (appui long)
 *
 * @example
 * toggleCompetenceScore("2", "q1", "Calculer", 2, false);
 *
 * @dependencies
 * - appState.scores (global)
 * - appState.activeCandidates (global)
 * - appState.currentCandidateIndex (global)
 * - appState.quickButtonStates (global)
 * - exercisesData (global)
 * - currentlyEditingCompetence (global)
 * - renderCurrentExercise() (fonction externe, module correction)
 * - updateExerciseScore() (fonction externe, module correction)
 * - updateTotalScore() (fonction externe, module correction)
 * - updateAllProgressIndicators() (fonction externe, module ui)
 * - saveData() (fonction externe)
 * - checkAutoNavigationAfterCompetence() (local)
 *
 * @module competences
 */
function toggleCompetenceScore(exerciseNumber, questionId, competenceName, maxPoints, setToZero = false) {
    const candidate = appState.activeCandidates[appState.currentCandidateIndex];
    const question = exercisesData[exerciseNumber].questions.find(q => q.id === questionId);
    const competence = question.competences.find(c => c.name === competenceName);

    // Gestion de la compétence "en cours" pour les compétences 2+ points
    const competenceKey = `${candidate.number}_${exerciseNumber}_${questionId}_${competenceName}`;

    // Si on clique sur une compétence multi-points, elle devient "en cours"
    if (competence.points > 1) {
        currentlyEditingCompetence = competenceKey;
    }

    // Initialisation
    if (!appState.scores[candidate.number]) {
        appState.scores[candidate.number] = {};
    }
    if (!appState.scores[candidate.number][exerciseNumber]) {
        appState.scores[candidate.number][exerciseNumber] = {};
    }
    if (!appState.scores[candidate.number][exerciseNumber][questionId]) {
        appState.scores[candidate.number][exerciseNumber][questionId] = { score: 0, competences: {} };
    }

    const currentScore = appState.scores[candidate.number][exerciseNumber][questionId].competences[competenceName] || 0;
    let newScore;

    // Appui long pour mettre directement à 0
    if (setToZero) {
        newScore = 0;
        // Si on met à 0 via appui long, la compétence n'est plus "en cours"
        if (competence.points > 1 && currentlyEditingCompetence === competenceKey) {
            currentlyEditingCompetence = null;
        }
    } else {
        // Comportement normal : incrément
        const increment = competence.increment || 1;
        newScore = currentScore + increment;

        // Système de clics incrémentiels - Si on dépasse le max, retour à 0
        if (newScore > competence.points) {
            newScore = 0;
            // Si on remet à 0 une compétence multi-points, elle n'est plus "en cours"
            if (competence.points > 1 && currentlyEditingCompetence === competenceKey) {
                currentlyEditingCompetence = null;
            }
        }
    }

    appState.scores[candidate.number][exerciseNumber][questionId].competences[competenceName] = newScore;

    // Si on atteint le score maximum pour une compétence multi-points, elle n'est plus "en cours"
    if (newScore === competence.points && competence.points > 1) {
        currentlyEditingCompetence = null;
    }

    // Protection contre dépassement X > Y
    let totalScore = 0;
    question.competences.forEach(comp => {
        const compScore = appState.scores[candidate.number][exerciseNumber][questionId].competences[comp.name] || 0;
        totalScore += compScore;
    });

    // S'assurer que le total ne dépasse jamais le maximum de la question
    if (totalScore > question.points) {
        const ratio = question.points / totalScore;
        question.competences.forEach(comp => {
            const compScore = appState.scores[candidate.number][exerciseNumber][questionId].competences[comp.name] || 0;
            appState.scores[candidate.number][exerciseNumber][questionId].competences[comp.name] =
                Math.round(compScore * ratio * 2) / 2; // Arrondi à 0.5
        });
        totalScore = question.points;
    }

    appState.scores[candidate.number][exerciseNumber][questionId].score = totalScore;

    // Initialiser les boutons rapides s'ils n'existent pas
    if (!appState.quickButtonStates[candidate.number]) {
        appState.quickButtonStates[candidate.number] = {};
    }
    if (!appState.quickButtonStates[candidate.number][exerciseNumber]) {
        appState.quickButtonStates[candidate.number][exerciseNumber] = {};
    }

    // Logique d'activation automatique des boutons TB/TF selon le score
    const currentQuickButtonState = appState.quickButtonStates[candidate.number][exerciseNumber][questionId];

    // Ne pas modifier si c'est déjà NR (non rendu)
    if (currentQuickButtonState !== 'nr') {
        if (totalScore === question.points) {
            // Score parfait → activer TB
            appState.quickButtonStates[candidate.number][exerciseNumber][questionId] = 'tb';
        } else if (totalScore === 0) {
            // Vérifier que TOUS les critères sont explicitement à 0 (pas par défaut)
            let allCriteriaAtZero = true;
            let hasCriteriaSet = false;

            question.competences.forEach(comp => {
                const compScore = appState.scores[candidate.number][exerciseNumber][questionId].competences[comp.name];
                if (compScore === undefined) {
                    // Critère pas encore touché (valeur par défaut)
                    allCriteriaAtZero = false;
                } else {
                    hasCriteriaSet = true;
                    if (compScore !== 0) {
                        allCriteriaAtZero = false;
                    }
                }
            });

            // TF seulement si tous les critères ont été explicitement mis à 0
            if (allCriteriaAtZero && hasCriteriaSet) {
                appState.quickButtonStates[candidate.number][exerciseNumber][questionId] = 'tf';
            } else {
                appState.quickButtonStates[candidate.number][exerciseNumber][questionId] = null;
            }
        } else {
            // Score partiel → aucun bouton rapide
            appState.quickButtonStates[candidate.number][exerciseNumber][questionId] = null;
        }
    }

    renderCurrentExercise();
    updateExerciseScore(exerciseNumber);
    updateTotalScore();
    updateAllProgressIndicators();
    saveData();

    // Navigation automatique si question terminée
    checkAutoNavigationAfterCompetence(exerciseNumber, questionId);
}

/**
 * Vérifie et déclenche la navigation automatique après correction d'une compétence
 *
 * Si la question est terminée (completed ou perfect) et qu'un mode de correction
 * est actif, déclenche la navigation automatique vers la question/exercice/candidat suivant.
 *
 * @param {string|number} exerciseNumber - Numéro de l'exercice
 * @param {string} questionId - ID de la question
 *
 * @example
 * checkAutoNavigationAfterCompetence("2", "q1");
 *
 * @dependencies
 * - appState.correctionMode (global)
 * - appState.activeCandidates (global)
 * - appState.currentCandidateIndex (global)
 * - getQuestionProgressState() (fonction externe, module correction)
 * - autoNavigateAfterCompetenceCorrection() (local)
 *
 * @module competences
 */
function checkAutoNavigationAfterCompetence(exerciseNumber, questionId) {
    // Vérifier si un mode de correction est sélectionné
    if (!appState.correctionMode) return;

    const candidate = appState.activeCandidates[appState.currentCandidateIndex];
    const questionState = getQuestionProgressState(candidate.number, exerciseNumber, questionId);

    // La question doit être terminée (completed ou perfect) pour déclencher la navigation
    if (questionState !== 'completed' && questionState !== 'perfect') {
        return;
    }

    // Délai court pour que le correcteur voie le changement d'état
    setTimeout(() => {
        autoNavigateAfterCompetenceCorrection(exerciseNumber, questionId);
    }, 600); // 0.6 seconde pour voir le point vert
}

/**
 * Navigation automatique après correction complète d'une question
 *
 * Gère la logique de navigation selon le mode de correction (par candidat ou par exercice).
 * Vérifie si l'exercice est terminé avant de passer au suivant.
 *
 * @param {string|number} originalExerciseNumber - Numéro de l'exercice d'origine
 * @param {string} questionId - ID de la question
 *
 * @example
 * autoNavigateAfterCompetenceCorrection("2", "q1");
 *
 * @dependencies
 * - appState.correctionMode (global)
 * - appState.currentExerciseIndex (global)
 * - appState.activeCandidates (global)
 * - getExerciseProgressState() (fonction externe, module correction)
 * - nextExercise() (fonction externe, module correction)
 * - nextCandidate() (fonction externe, module correction)
 * - navigateToNextIncompleteQuestion() (fonction externe, module correction)
 *
 * @module competences
 */
function autoNavigateAfterCompetenceCorrection(originalExerciseNumber, questionId) {
    const candidate = appState.activeCandidates[appState.currentCandidateIndex];

    if (appState.correctionMode === 'candidate') {
        // Utiliser l'exercice ACTUEL, pas l'exercice d'origine
        const currentExerciseNumber = appState.currentExerciseIndex;

        // Mode par candidat : vérifier si tout l'exercice ACTUEL est terminé
        const exerciseState = getExerciseProgressState(candidate.number, currentExerciseNumber);

        console.log(`🔍 DEBUG - Exercice ACTUEL ${currentExerciseNumber} pour candidat ${candidate.number}:`);
        console.log(`(Déclenché depuis exercice ${originalExerciseNumber})`);
        console.log(`État global de l'exercice: ${exerciseState}`);

        // Si l'exercice est terminé, passer au suivant
        if (exerciseState === 'completed' || exerciseState === 'perfect') {
            console.log('✅ Exercice terminé → navigation vers exercice suivant');
            setTimeout(() => nextExercise(), 300);
        } else {
            // Sinon, chercher la prochaine question incomplète
            console.log('⏭️ Exercice non terminé → recherche question incomplète');
            navigateToNextIncompleteQuestion(currentExerciseNumber);
        }
    } else if (appState.correctionMode === 'exercise') {
        // Mode par exercice : passer au candidat suivant pour le même exercice
        console.log('🔄 Mode exercice → navigation vers candidat suivant');
        setTimeout(() => nextCandidate(), 300);
    }
}

// === PROGRESSION ET INDICATEURS ===

/**
 * Détermine l'état de progression d'une compétence
 *
 * Retourne l'état visuel de la compétence (non commencée, en cours, terminée, parfaite)
 * en fonction du score et de si elle est actuellement en cours d'édition.
 *
 * @param {number} candidateNumber - Numéro du candidat
 * @param {string|number} exerciseNumber - Numéro de l'exercice
 * @param {string} questionId - ID de la question
 * @param {string} competenceName - Nom de la compétence
 * @returns {string} État de progression ('not-started', 'in-progress', 'completed', 'perfect')
 *
 * @example
 * const state = getCompetenceProgressState(150, "2", "q1", "Calculer");
 * // Retourne: "perfect"
 *
 * @dependencies
 * - exercisesData (global)
 * - appState.scores (global)
 * - currentlyEditingCompetence (global)
 * - getCandidateCompetenceScore() (local)
 *
 * @module competences
 */
function getCompetenceProgressState(candidateNumber, exerciseNumber, questionId, competenceName) {
    const question = exercisesData[exerciseNumber].questions.find(q => q.id === questionId);
    const competence = question.competences.find(c => c.name === competenceName);

    // Vérifier si cette compétence a été touchée (explicitement cliquée)
    const hasBeenTouched = appState.scores[candidateNumber]?.[exerciseNumber]?.[questionId]?.competences?.hasOwnProperty(competenceName);

    if (!hasBeenTouched) {
        return 'not-started';
    }

    const currentScore = getCandidateCompetenceScore(candidateNumber, exerciseNumber, questionId, competenceName);

    // Pour les compétences à 1 point : toujours terminé une fois cliquée
    if (competence.points === 1) {
        if (currentScore === 1) {
            return 'perfect'; // Score maximal
        } else {
            return 'completed'; // Touchée mais pas de point (décision du correcteur)
        }
    }

    // Pour les compétences multi-points (2+ pts) : nouvelle logique
    const competenceKey = `${candidateNumber}_${exerciseNumber}_${questionId}_${competenceName}`;

    // Si cette compétence est actuellement en cours d'édition
    if (currentlyEditingCompetence === competenceKey) {
        if (currentScore === competence.points) {
            return 'perfect'; // Score maximal atteint
        } else {
            return 'in-progress'; // En cours de correction
        }
    }

    // Si une autre compétence est en cours, celle-ci est terminée
    if (currentScore === competence.points) {
        return 'perfect'; // Score maximal
    } else {
        return 'completed'; // Correction terminée (score partiel accepté)
    }
}

// === VALIDATION ET SYNTHÈSE ===

/**
 * Calcule les scores globaux de compétences pour un candidat
 *
 * Parcourt tous les exercices et questions pour agréger les scores
 * par compétence (total obtenu, maximum possible, items réussis).
 *
 * @param {number} candidateNumber - Numéro du candidat
 * @returns {Object} Objet avec les scores par compétence
 *
 * @example
 * const scores = calculateCompetencesScores(150);
 * // Retourne: { Calculer: { total: 8, max: 10, itemsSuccess: 4, itemsTotal: 5, icon: '🧮' }, ... }
 *
 * @dependencies
 * - exercisesData (global)
 * - getCandidateCompetenceScore() (local)
 *
 * @module competences
 */
function calculateCompetencesScores(candidateNumber) {
    const competencesData = {
        'Calculer': { total: 0, max: 0, itemsSuccess: 0, itemsTotal: 0, icon: '🧮' },
        'Modéliser': { total: 0, max: 0, itemsSuccess: 0, itemsTotal: 0, icon: '📊' },
        'Représenter': { total: 0, max: 0, itemsSuccess: 0, itemsTotal: 0, icon: '📈' },
        'Raisonner': { total: 0, max: 0, itemsSuccess: 0, itemsTotal: 0, icon: '🤔' },
        'Communiquer': { total: 0, max: 0, itemsSuccess: 0, itemsTotal: 0, icon: '💬' },
        'Chercher': { total: 0, max: 0, itemsSuccess: 0, itemsTotal: 0, icon: '🔍' }
    };

    // Parcourir tous les exercices et questions
    Object.keys(exercisesData).forEach(ex => {
        const exercise = exercisesData[ex];
        if (!exercise) return;

        exercise.questions.forEach(question => {
            question.competences.forEach(comp => {
                const competenceType = comp.name.split(' ')[0]; // Prendre le premier mot
                if (competencesData[competenceType]) {
                    const candidateScore = getCandidateCompetenceScore(candidateNumber, ex, question.id, comp.name);
                    competencesData[competenceType].total += candidateScore;
                    competencesData[competenceType].max += comp.points;
                    competencesData[competenceType].itemsTotal += 1;

                    // Un item est considéré comme réussi s'il a au moins 50% des points
                    const successThreshold = comp.points * 0.5;
                    if (candidateScore >= successThreshold) {
                        competencesData[competenceType].itemsSuccess += 1;
                    }

                    // Debug pour voir quelles compétences sont trouvées
                    if (candidateScore > 0) {
                        console.log(`Compétence ${competenceType}: +${candidateScore}/${comp.points} pts (Ex${ex} Q${question.id}) - ${candidateScore >= successThreshold ? 'RÉUSSI' : 'ÉCHOUÉ'}`);
                    }
                } else {
                    console.warn(`Compétence non reconnue: ${competenceType} dans Ex${ex} Q${question.id}`);
                }
            });
        });
    });

    // Debug final
    console.log('Scores finaux des compétences:', competencesData);

    return competencesData;
}

/**
 * Affiche la synthèse des compétences dans la modale de validation
 *
 * Génère un tableau avec le pourcentage, le niveau de maîtrise et la progression
 * pour chaque compétence.
 *
 * @param {Object} competencesScores - Scores calculés par calculateCompetencesScores()
 *
 * @example
 * const scores = calculateCompetencesScores(150);
 * renderCompetencesValidation(scores);
 *
 * @dependencies
 * - defaultCompetences (global)
 *
 * @module competences
 */
function renderCompetencesValidation(competencesScores) {
    const tbody = document.getElementById('competencesValidationTable');
    tbody.innerHTML = '';

    Object.entries(competencesScores).forEach(([competenceName, data]) => {
        const percentage = data.max > 0 ? Math.round((data.total / data.max) * 100) : 0;

        let levelText = '';
        let levelColor = '';

        if (percentage >= 75) {
            levelText = 'TBM';
            levelColor = '#28a745';
        } else if (percentage >= 50) {
            levelText = 'MS';
            levelColor = '#17a2b8';
        } else if (percentage >= 25) {
            levelText = 'MF';
            levelColor = '#ffc107';
        } else {
            levelText = 'MI';
            levelColor = '#dc3545';
        }

        const row = document.createElement('tr');
        // Trouver la couleur de la compétence dans le code
        const defaultComp = defaultCompetences.find(dc => dc.name === competenceName);
        const competenceColor = defaultComp ? defaultComp.color : '#6c757d';

        row.innerHTML = `
            <td>
                <div class="competence-name">
                    <span style="font-size: 16px;">${data.icon}</span>
                    <span class="competence-name-text" style="color: ${competenceColor};">${competenceName}</span>
                </div>
            </td>
            <td>
                <div class="competence-percentage" style="color: ${levelColor};">
                    ${percentage}%
                </div>
                <div class="competence-items" style="font-size: 0.75em; color: #6c757d; margin-top: 2px;">
                    ${data.itemsSuccess}/${data.itemsTotal} items
                </div>
            </td>
            <td>
                <div class="competence-level">
                    <span class="level-badge" style="background: ${levelColor};">
                        ${levelText}
                    </span>
                </div>
            </td>
            <td>
                <div class="competence-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%; background: ${levelColor};"></div>
                    </div>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Affiche la synthèse des compétences dans la modale finale
 *
 * Génère une grille visuelle avec icône, nom, pourcentage et niveau de maîtrise
 * pour chaque compétence.
 *
 * @param {Object} competencesScores - Scores calculés par calculateCompetencesScores()
 *
 * @example
 * const scores = calculateCompetencesScores(150);
 * renderCompetencesSynthesis(scores);
 *
 * @module competences
 */
function renderCompetencesSynthesis(competencesScores) {
    const grid = document.getElementById('competencesSynthesisGrid');
    grid.innerHTML = '';

    Object.entries(competencesScores).forEach(([competenceName, data]) => {
        const percentage = data.max > 0 ? Math.round((data.total / data.max) * 100) : 0;

        let levelText = '';
        let levelClass = '';
        let levelColor = '';

        if (percentage >= 75) {
            levelText = 'TBM';
            levelClass = 'tbm';
            levelColor = '#28a745';
        } else if (percentage >= 50) {
            levelText = 'MS';
            levelClass = 'ms';
            levelColor = '#17a2b8';
        } else if (percentage >= 25) {
            levelText = 'MF';
            levelClass = 'mf';
            levelColor = '#ffc107';
        } else {
            levelText = 'MI';
            levelClass = 'mi';
            levelColor = '#dc3545';
        }

        const item = document.createElement('div');
        item.className = 'competence-synthesis-item';
        item.innerHTML = `
            <div class="competence-synthesis-icon">${data.icon}</div>
            <div class="competence-synthesis-name">${competenceName}</div>
            <div class="competence-synthesis-percentage" style="color: ${levelColor};">${percentage}%</div>
            <div class="competence-synthesis-progress">
                <div class="competence-synthesis-progress-bar" style="width: ${percentage}%; background: ${levelColor};"></div>
            </div>
            <div class="competence-synthesis-level" style="background: ${levelColor};">${levelText}</div>
            <div class="competence-synthesis-score">${data.total}/${data.max} pts</div>
            <div class="competence-synthesis-items" style="font-size: 0.7em; color: #6c757d; margin-top: 2px;">
                ${data.itemsSuccess}/${data.itemsTotal} items réussis
            </div>
        `;

        grid.appendChild(item);
    });
}

// === MODALES D'ÉDITION ===

/**
 * Ouvre la modale d'édition d'une compétence au niveau du barème exercice
 *
 * @param {string} exerciseId - ID de l'exercice
 * @param {string} competenceName - Nom de la compétence
 *
 * @example
 * openBaremeCompetenceModal("2", "Calculer");
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - defaultCompetences (global)
 *
 * @module competences
 */
function openBaremeCompetenceModal(exerciseId, competenceName) {
    const modal = document.getElementById('baremeCompetenceModal');
    const baremeData = appState.baremeConfig.exercises[exerciseId];

    // Stocker l'exercice et la compétence en cours d'édition
    modalExerciseId = exerciseId;
    pendingExerciseId = exerciseId;

    // Trouver la compétence dans les détails personnalisés
    const customDetails = baremeData.competenceDetails && baremeData.competenceDetails[competenceName];
    const defaultComp = defaultCompetences.find(c => c.name === competenceName);

    // Pré-remplir le formulaire
    document.getElementById('baremeCompName').textContent = competenceName;
    document.getElementById('baremeCompDescription').value = customDetails?.description || defaultComp.description;
    document.getElementById('baremeCompTooltip').value = customDetails?.tooltip || defaultComp.description;
    document.getElementById('baremeCompIncrement').value = customDetails?.increment || 0.5;

    modal.classList.add('active');
}

/**
 * Ferme la modale d'édition de compétence du barème
 *
 * @example
 * closeBaremeCompetenceModal();
 *
 * @module competences
 */
function closeBaremeCompetenceModal() {
    document.getElementById('baremeCompetenceModal').classList.remove('active');
    modalExerciseId = null;
}

/**
 * Ouvre la modale d'édition d'une compétence au niveau question du barème
 *
 * @param {string} exerciseId - ID de l'exercice
 * @param {number} questionIndex - Index de la question
 * @param {string} competenceName - Nom de la compétence
 *
 * @example
 * openBaremeQuestionCompetenceModal("2", 0, "Raisonner");
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - defaultCompetences (global)
 *
 * @module competences
 */
function openBaremeQuestionCompetenceModal(exerciseId, questionIndex, competenceName) {
    const modal = document.getElementById('baremeCompetenceModal');
    const baremeData = appState.baremeConfig.exercises[exerciseId];
    const qKey = `q${questionIndex}`;

    // Stocker l'exercice, la question et la compétence en cours d'édition
    modalExerciseId = exerciseId;
    modalQuestionId = qKey;

    // Trouver la compétence dans les détails personnalisés de la question
    const questionDetails = baremeData.questionCompetenceDetails &&
                           baremeData.questionCompetenceDetails[qKey] &&
                           baremeData.questionCompetenceDetails[qKey][competenceName];

    // Sinon, chercher dans les détails au niveau exercice
    const exerciseDetails = baremeData.competenceDetails && baremeData.competenceDetails[competenceName];

    // Sinon, utiliser les valeurs par défaut
    const defaultComp = defaultCompetences.find(c => c.name === competenceName);
    const customDetails = questionDetails || exerciseDetails;

    // Pré-remplir le formulaire
    document.getElementById('baremeCompName').textContent = `${competenceName} (Question ${questionIndex + 1})`;
    document.getElementById('baremeCompDescription').value = customDetails?.description || defaultComp.description;
    document.getElementById('baremeCompTooltip').value = customDetails?.tooltip || defaultComp.description;
    document.getElementById('baremeCompIncrement').value = customDetails?.increment || 0.5;

    // Récupérer les points de la compétence
    const compPoints = baremeData.questionCompetencePoints &&
                      baremeData.questionCompetencePoints[qKey] &&
                      baremeData.questionCompetencePoints[qKey][competenceName];

    if (compPoints) {
        document.getElementById('baremeCompPoints').value = compPoints;
        document.getElementById('baremeCompPointsContainer').style.display = 'block';
    } else {
        document.getElementById('baremeCompPointsContainer').style.display = 'none';
    }

    modal.classList.add('active');
}

/**
 * Sauvegarde les modifications de la modale de compétence du barème
 *
 * Enregistre les détails personnalisés (description, tooltip, incrément, points)
 * pour la compétence éditée.
 *
 * @example
 * saveBaremeCompetenceModal();
 *
 * @dependencies
 * - appState.baremeConfig.exercises (global)
 * - modalExerciseId (global)
 * - modalQuestionId (global)
 * - renderAutomatismeQuestionCompetences() (local)
 * - renderDNBQuestionCompetences() (local)
 * - saveData() (fonction externe)
 *
 * @module competences
 */
function saveBaremeCompetenceModal() {
    if (!modalExerciseId) return;

    const baremeData = appState.baremeConfig.exercises[modalExerciseId];
    const competenceName = document.getElementById('baremeCompName').textContent.split(' (')[0]; // Enlever "(Question X)"

    const description = document.getElementById('baremeCompDescription').value;
    const tooltip = document.getElementById('baremeCompTooltip').value;
    const increment = parseFloat(document.getElementById('baremeCompIncrement').value);

    if (modalQuestionId) {
        // Édition au niveau question
        if (!baremeData.questionCompetenceDetails) baremeData.questionCompetenceDetails = {};
        if (!baremeData.questionCompetenceDetails[modalQuestionId]) {
            baremeData.questionCompetenceDetails[modalQuestionId] = {};
        }

        baremeData.questionCompetenceDetails[modalQuestionId][competenceName] = {
            description,
            tooltip,
            increment
        };

        // Si les points sont modifiés
        const pointsInput = document.getElementById('baremeCompPoints');
        if (pointsInput.value) {
            const points = parseFloat(pointsInput.value);
            if (!baremeData.questionCompetencePoints) baremeData.questionCompetencePoints = {};
            if (!baremeData.questionCompetencePoints[modalQuestionId]) {
                baremeData.questionCompetencePoints[modalQuestionId] = {};
            }
            baremeData.questionCompetencePoints[modalQuestionId][competenceName] = points;
        }

        // Re-render les compétences de la question
        const qIndex = parseInt(modalQuestionId.replace('q', ''));
        if (modalExerciseId === '1') {
            renderAutomatismeQuestionCompetences(qIndex);
        } else {
            renderDNBQuestionCompetences(modalExerciseId, qIndex);
        }
    } else {
        // Édition au niveau exercice
        if (!baremeData.competenceDetails) baremeData.competenceDetails = {};

        baremeData.competenceDetails[competenceName] = {
            description,
            tooltip,
            increment
        };
    }

    saveData();
    closeBaremeCompetenceModal();

    console.log('✅ Compétence sauvegardée:', competenceName, { description, tooltip, increment });
}

// ============================================================================
// FIN DU MODULE COMPETENCES
// ============================================================================
