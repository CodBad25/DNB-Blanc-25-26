// ============================================================================
// MODULE UI - Utilitaires UI génériques
// ============================================================================
//
// Ce module gère tous les aspects UI génériques de l'application :
// - Navigation entre pages
// - Gestion des onglets
// - Tooltips et infobulles
// - Indicateurs de progression
// - Panneaux (paramètres, administration)
//
// Dépendances:
// - Aucune dépendance métier (fonctions purement UI)
// - Suppose que le DOM est chargé
//
// @module ui
// ============================================================================

// === NAVIGATION ENTRE PAGES ===

/**
 * Affiche une page et masque toutes les autres
 *
 * Cette fonction gère la navigation cohérente entre les différentes pages
 * de l'application en masquant toutes les pages puis en affichant celle demandée.
 *
 * @param {string} pageId - L'ID de la page à afficher
 *
 * @example
 * showPage('automatismesSelectionPage');
 * showPage('baremeDesignPage');
 *
 * @dependencies
 * - renderExercises() (fonction globale, appelée automatiquement pour dnbSelectionPage)
 * - renderAutomatismes() (fonction globale, appelée automatiquement pour automatismesSelectionPage)
 *
 * @module ui
 */
function showPage(pageId) {
    console.log(`🔄 Navigation vers la page: ${pageId}`);

    // Liste de toutes les pages de l'application
    const allPages = [
        'automatismesSelectionPage',
        'dnbSelectionPage',
        'baremeDesignPage',
        'setupPage',
        'candidatesPage',
        'candidatesOverviewPage',
        'mainPage'
    ];

    // MASQUER toutes les pages en retirant .active ET en forçant display:none
    allPages.forEach(id => {
        const page = document.getElementById(id);
        if (page) {
            page.classList.remove('active');
            page.style.display = 'none';  // ✅ FORCER le masquage
        }
    });

    // Afficher uniquement la page demandée
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        targetPage.style.display = 'block';  // ✅ FORCER l'affichage
        console.log(`✅ Page ${pageId} activée et affichée`);

        // 🎯 Appeler automatiquement le rendu approprié selon la page
        if (pageId === 'dnbSelectionPage' && typeof renderExercises === 'function') {
            console.log('🔄 Appel automatique de renderExercises()');
            setTimeout(() => renderExercises(), 50); // Petit délai pour s'assurer que la page est bien affichée
        } else if (pageId === 'automatismesSelectionPage' && typeof renderAutomatismes === 'function') {
            console.log('🔄 Appel automatique de renderAutomatismes()');
            setTimeout(() => renderAutomatismes(), 50);
        }
    } else {
        console.error(`❌ Page ${pageId} introuvable`);
    }
}

// === GESTION DES ONGLETS ===

/**
 * Affiche un onglet d'exercice et masque les autres
 *
 * Utilisé pendant la phase de correction pour naviguer entre les exercices.
 * Met à jour l'état de l'application et réinitialise la compétence en cours.
 *
 * @param {string} tabName - Nom de l'onglet à afficher (ex: 'exercise1', 'exercise2', 'admin')
 *
 * @example
 * showTab('exercise1');
 * showTab('admin');
 *
 * @dependencies
 * - appState.currentTab (global)
 * - appState.currentExerciseIndex (global)
 * - currentlyEditingCompetence (global)
 * - renderExerciseContent() (fonction globale)
 * - updateNavigationButtons() (fonction globale)
 *
 * @module ui
 */
function showTab(tabName) {
    appState.currentTab = tabName;

    // Synchroniser l'index de l'exercice
    if (tabName.startsWith('exercise')) {
        appState.currentExerciseIndex = parseInt(tabName.replace('exercise', ''));
    }

    // Réinitialiser la compétence en cours quand on change d'exercice
    currentlyEditingCompetence = null;

    // Mise à jour des onglets - méthode compatible avec les onglets dynamiques
    document.querySelectorAll('.main-tab').forEach(tab => {
        tab.classList.remove('active');
    });

    // Trouver l'onglet correspondant par son onclick
    const targetTab = Array.from(document.querySelectorAll('.main-tab')).find(tab => {
        return tab.onclick && tab.onclick.toString().includes(`showTab('${tabName}')`);
    });
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Mise à jour du contenu
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });

    if (tabName === 'admin') {
        document.getElementById('adminTab').classList.add('active');
    } else {
        const exerciseNumber = tabName.replace('exercise', '');
        document.getElementById(`exercise${exerciseNumber}Tab`).classList.add('active');
        renderExerciseContent(parseInt(exerciseNumber));
    }

    // Mettre à jour les boutons de navigation
    updateNavigationButtons();
}

// === GESTION DES TOOLTIPS ===

/**
 * Affiche une infobulle de description au survol
 *
 * @param {Event} event - L'événement de survol
 * @param {string} text - Le texte à afficher dans l'infobulle
 * @param {string} tooltipId - L'ID unique de l'infobulle
 *
 * @example
 * showDescriptionTooltip(event, "Description de la compétence", "comp_calc_1");
 *
 * @module ui
 */
function showDescriptionTooltip(event, text, tooltipId) {
    const tooltip = document.getElementById('desc_' + tooltipId);
    if (tooltip && text) {
        tooltip.style.display = 'block';
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
    }
}

/**
 * Masque une infobulle de description
 *
 * @param {string} tooltipId - L'ID unique de l'infobulle à masquer
 *
 * @example
 * hideDescriptionTooltip("comp_calc_1");
 *
 * @module ui
 */
function hideDescriptionTooltip(tooltipId) {
    const tooltip = document.getElementById('desc_' + tooltipId);
    if (tooltip) {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 300);
    }
}

/**
 * Toggle l'affichage d'une infobulle optionnelle (clic)
 *
 * Ferme toutes les autres infobulles avant d'ouvrir celle demandée.
 *
 * @param {string} tooltipId - L'ID de l'infobulle à basculer
 *
 * @example
 * toggleOptionalTooltip("tooltip_question_1");
 *
 * @module ui
 */
function toggleOptionalTooltip(tooltipId) {
    // Fermer tous les autres tooltips facultatifs
    document.querySelectorAll('.tooltip-optional-new').forEach(el => {
        if (el.id !== tooltipId) {
            el.style.display = 'none';
        }
    });

    const tooltip = document.getElementById(tooltipId);
    if (tooltip) {
        tooltip.style.display = (tooltip.style.display === 'block') ? 'none' : 'block';
    }
}

// === INDICATEURS DE PROGRESSION ===

/**
 * Crée un indicateur de progression HTML
 *
 * Les états possibles sont :
 * - 'not-started' : Pas commencé (gris)
 * - 'in-progress' : En cours (orange)
 * - 'completed' : Terminé (vert)
 * - 'perfect' : Parfait (vert brillant)
 *
 * @param {string} state - État de progression ('not-started', 'in-progress', 'completed', 'perfect')
 * @param {string} [size='normal'] - Taille de l'indicateur ('small', 'normal', 'large')
 * @returns {string} HTML de l'indicateur
 *
 * @example
 * const indicator = createProgressIndicator('in-progress', 'small');
 * element.innerHTML = indicator;
 *
 * @module ui
 */
function createProgressIndicator(state, size = 'normal') {
    const sizeClass = size === 'small' ? 'small' : size === 'large' ? 'large' : '';
    return `<div class="progress-indicator ${state} ${sizeClass}"></div>`;
}

/**
 * Met à jour tous les indicateurs de progression pour le candidat actuel
 *
 * Parcourt tous les exercices et met à jour leurs indicateurs dans les onglets.
 *
 * @example
 * updateAllProgressIndicators();
 *
 * @dependencies
 * - appState.activeCandidates (global)
 * - appState.currentCandidateIndex (global)
 * - updateTabsProgressIndicators() (local)
 *
 * @module ui
 */
function updateAllProgressIndicators() {
    if (!appState.activeCandidates[appState.currentCandidateIndex]) return;

    const candidateNumber = appState.activeCandidates[appState.currentCandidateIndex].number;

    // Mettre à jour les indicateurs des onglets d'exercices
    updateTabsProgressIndicators(candidateNumber);
}

/**
 * Met à jour les indicateurs de progression dans les onglets d'exercices
 *
 * Affiche un point coloré dans chaque onglet pour indiquer l'état de progression.
 *
 * @param {number} candidateNumber - Numéro du candidat
 *
 * @example
 * updateTabsProgressIndicators(150);
 *
 * @dependencies
 * - exercisesData (global)
 * - getExerciseProgressState() (fonction externe, module correction)
 *
 * @module ui
 */
function updateTabsProgressIndicators(candidateNumber) {
    Object.keys(exercisesData).forEach(ex => {
        const tabButton = document.querySelector(`[onclick="showTab('exercise${ex}')"]`);
        if (tabButton) {
            // Supprimer l'ancien indicateur s'il existe
            const existingIndicator = tabButton.querySelector('.progress-indicator');
            if (existingIndicator) {
                existingIndicator.remove();
            }

            // Ajouter le nouvel indicateur
            const state = getExerciseProgressState(candidateNumber, ex);
            const indicator = document.createElement('div');
            indicator.className = `progress-indicator ${state}`;
            tabButton.appendChild(indicator);
        }
    });
}

// === GESTION DES PANNEAUX ===

/**
 * Toggle l'affichage du panneau de paramètres
 *
 * Bascule l'affichage du panneau latéral des paramètres.
 *
 * @example
 * toggleParametresPanel();
 *
 * @module ui
 */
function toggleParametresPanel() {
    const panel = document.getElementById('parametresPanel');
    const btnHeader = document.getElementById('parametresBtnHeader');

    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'flex';
        if (btnHeader) btnHeader.classList.add('active');
    } else {
        panel.style.display = 'none';
        if (btnHeader) btnHeader.classList.remove('active');
    }
}

/**
 * Toggle l'affichage du panneau d'administration
 *
 * Bascule l'affichage du panneau latéral d'administration.
 * Charge automatiquement l'exercice 1 lors de l'ouverture.
 *
 * @example
 * toggleAdminPanel();
 *
 * @dependencies
 * - showAdminExercise() (local)
 *
 * @module ui
 */
function toggleAdminPanel() {
    const panel = document.getElementById('adminPanel');
    const btnHeader = document.getElementById('adminToggleBtnHeader');

    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'flex';
        if (btnHeader) btnHeader.classList.add('active');
        // Charger l'exercice 1 par défaut
        showAdminExercise(1);
    } else {
        panel.style.display = 'none';
        if (btnHeader) btnHeader.classList.remove('active');
    }
}

/**
 * Affiche un onglet du panneau d'administration
 *
 * @param {string} tabName - Nom de l'onglet à afficher
 *
 * @example
 * showAdminTab('bareme');
 *
 * @module ui
 */
function showAdminTab(tabName) {
    // Désactiver tous les onglets
    document.querySelectorAll('.admin-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.admin-tab-content').forEach(content => {
        content.classList.remove('active');
    });

    // Activer l'onglet sélectionné
    document.querySelector(`[onclick="showAdminTab('${tabName}')"]`).classList.add('active');
    document.getElementById(`admin${tabName.charAt(0).toUpperCase() + tabName.slice(1)}Tab`).classList.add('active');
}

/**
 * Affiche un exercice dans le panneau d'administration
 *
 * Met à jour la variable globale currentAdminExercise et affiche le contenu.
 *
 * @param {number} exerciseNumber - Numéro de l'exercice à afficher
 *
 * @example
 * showAdminExercise(1);
 *
 * @dependencies
 * - currentAdminExercise (global)
 * - renderAdminExercise() (fonction externe)
 *
 * @module ui
 */
function showAdminExercise(exerciseNumber) {
    currentAdminExercise = exerciseNumber;

    // Mettre à jour les onglets d'exercice
    document.querySelectorAll('.admin-exercise-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="showAdminExercise(${exerciseNumber})"]`).classList.add('active');

    // Générer le contenu de l'exercice
    renderAdminExercise(exerciseNumber);
}

// === EVENT LISTENERS GLOBAUX ===

/**
 * Ferme les infobulles optionnelles au clic en dehors
 *
 * Event listener global qui ferme toutes les infobulles lorsqu'on clique
 * en dehors d'un bouton d'information.
 *
 * @module ui
 */
document.addEventListener('click', function(e) {
    if (!e.target.classList.contains('competence-info-i')) {
        document.querySelectorAll('.tooltip-optional-new').forEach(el => {
            el.style.display = 'none';
        });
    }
});

// ============================================================================
// FIN DU MODULE UI
// ============================================================================
