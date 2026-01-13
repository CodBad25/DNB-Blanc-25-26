/**
 * Module de sélection des exercices DNB depuis MathALÉA
 */
export class DNBSelector {
    constructor() {
        this.dnbData = null;
        this.filteredExercises = [];
        this.filters = {
            year: '',
            theme: '',
            search: ''
        };
    }

    async init() {
        console.log('📚 Chargement du dictionnaire DNB...');
        
        // Charger le dictionnaire DNB
        await this.loadDNBDictionary();
        
        // Setup des événements
        this.setupEventListeners();
        
        // Affichage initial - afficher TOUS les exercices
        this.filteredExercises = Object.entries(this.dnbData);
        this.renderExercises();
        
        console.log(`✅ Interface prête avec ${this.filteredExercises.length} exercices`);
    }

    async loadDNBDictionary() {
        try {
            // Pour l'instant, on utilise un dictionnaire embarqué
            // Plus tard, on pourra charger depuis MathALÉA
            this.dnbData = await this.getDNBData();
            console.log(`✅ ${Object.keys(this.dnbData).length} exercices DNB chargés`);
        } catch (error) {
            console.error('Erreur chargement DNB:', error);
            this.dnbData = {};
        }
    }

    async getDNBData() {
        // Charger le vrai dictionnaire DNB depuis MathALÉA
        try {
            const module = await import('../data/dictionnaireDNB.js');
            return module.dictionnaireDNB;
        } catch (error) {
            console.error('Erreur chargement dictionnaire:', error);
            return {};
        }
    }

    setupEventListeners() {
        // Filtres
        document.getElementById('filterYear')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('filterTheme')?.addEventListener('change', () => this.applyFilters());
        document.getElementById('searchText')?.addEventListener('input', () => this.applyFilters());
        document.getElementById('btnApplyFilters')?.addEventListener('click', () => this.applyFilters());
        
        // Mise à jour de la sélection depuis l'état
        this.updateSelectionDisplay();
    }

    applyFilters() {
        const yearFilter = document.getElementById('filterYear')?.value || '';
        const themeFilter = document.getElementById('filterTheme')?.value || '';
        const searchFilter = document.getElementById('searchText')?.value.toLowerCase() || '';

        this.filteredExercises = Object.entries(this.dnbData).filter(([id, data]) => {
            // Filtre année
            if (yearFilter && data.annee !== yearFilter) return false;
            
            // Filtre thème
            if (themeFilter && !data.tags.includes(themeFilter)) return false;
            
            // Filtre recherche
            if (searchFilter) {
                const searchText = `${id} ${data.lieu} ${data.tags.join(' ')}`.toLowerCase();
                if (!searchText.includes(searchFilter)) return false;
            }
            
            return true;
        });

        console.log(`🔍 ${this.filteredExercises.length} exercices trouvés`);
        this.renderExercises();
    }

    renderExercises() {
        const grid = document.getElementById('exercisesGrid');
        if (!grid) return;

        if (this.filteredExercises.length === 0) {
            grid.innerHTML = '<p class="loading">Aucun exercice trouvé avec ces filtres</p>';
            return;
        }

        const selectedIds = window.appState.getSelectedExercises().map(ex => ex.id);

        grid.innerHTML = this.filteredExercises.map(([id, data]) => {
            const isSelected = selectedIds.includes(id);
            
            return `
                <div class="exercise-card ${isSelected ? 'selected' : ''}" data-id="${id}">
                    <div class="exercise-header">
                        <div class="exercise-title">
                            ${data.lieu} ${data.mois} ${data.annee} - Ex ${data.numeroInitial}
                        </div>
                        <div class="exercise-year">${data.annee}</div>
                    </div>
                    <div class="exercise-location">
                        📍 ${data.lieu} - ${data.mois}
                    </div>
                    <div class="exercise-tags">
                        ${data.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    ${isSelected ? '<div class="select-indicator mt-2">✓ Sélectionné</div>' : ''}
                </div>
            `;
        }).join('');

        // Ajouter les événements de clic
        grid.querySelectorAll('.exercise-card').forEach(card => {
            card.addEventListener('click', () => this.toggleExercise(card.dataset.id));
        });
    }

    toggleExercise(exerciseId) {
        const exerciseData = this.dnbData[exerciseId];
        const selected = window.appState.getSelectedExercises();
        
        if (selected.find(ex => ex.id === exerciseId)) {
            // Désélectionner
            window.appState.removeExercise(exerciseId);
        } else {
            // Sélectionner
            if (!window.appState.addExercise(exerciseId, exerciseData)) {
                return; // Max atteint
            }
        }
        
        this.renderExercises();
        this.updateSelectionDisplay();
    }

    updateSelectionDisplay() {
        const selected = window.appState.getSelectedExercises();
        const countSpan = document.getElementById('selectedCount');
        const selectedList = document.getElementById('selectedExercises');
        const btnNext = document.getElementById('btnNextStep1');

        if (countSpan) countSpan.textContent = selected.length;
        
        if (btnNext) {
            btnNext.disabled = selected.length === 0;
        }

        if (selectedList) {
            if (selected.length === 0) {
                selectedList.innerHTML = '<p style="opacity: 0.7">Aucun exercice sélectionné</p>';
            } else {
                selectedList.innerHTML = selected.map(ex => `
                    <div class="selected-item">
                        <span>${ex.lieu} ${ex.annee} - Ex ${ex.numeroInitial}</span>
                        <button onclick="window.dnbSelector.removeAndUpdate('${ex.id}')">×</button>
                    </div>
                `).join('');
            }
        }
    }

    removeAndUpdate(exerciseId) {
        window.appState.removeExercise(exerciseId);
        this.renderExercises();
        this.updateSelectionDisplay();
    }
}

// Rendre accessible globalement pour les boutons inline
window.dnbSelector = null;
document.addEventListener('DOMContentLoaded', () => {
    window.dnbSelector = new DNBSelector();
});

