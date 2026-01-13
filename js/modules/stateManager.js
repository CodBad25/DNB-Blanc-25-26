/**
 * Gestionnaire d'état centralisé pour l'application
 */
export class StateManager {
    constructor() {
        this.state = {
            selectedExercises: [], // Exercices DNB sélectionnés
            configuredExercises: [], // Exercices configurés avec questions/points
            candidates: [],
            currentStep: 1,
            correctionData: {}
        };
        
        // Charger depuis localStorage si disponible
        this.loadFromStorage();
    }

    /**
     * Ajoute un exercice à la sélection
     */
    addExercise(exerciseId, exerciseData) {
        if (this.state.selectedExercises.length >= 5) {
            alert('⚠️ Maximum 5 exercices');
            return false;
        }
        
        if (this.state.selectedExercises.find(ex => ex.id === exerciseId)) {
            return false; // Déjà sélectionné
        }
        
        this.state.selectedExercises.push({
            id: exerciseId,
            ...exerciseData
        });
        
        this.saveToStorage();
        return true;
    }

    /**
     * Retire un exercice de la sélection
     */
    removeExercise(exerciseId) {
        this.state.selectedExercises = this.state.selectedExercises.filter(
            ex => ex.id !== exerciseId
        );
        this.saveToStorage();
    }

    /**
     * Obtient la liste des exercices sélectionnés
     */
    getSelectedExercises() {
        return this.state.selectedExercises;
    }

    /**
     * Sauvegarde dans localStorage
     */
    saveToStorage() {
        try {
            localStorage.setItem('dnb-correction-pro-state', JSON.stringify(this.state));
        } catch (error) {
            console.error('Erreur sauvegarde:', error);
        }
    }

    /**
     * Charge depuis localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('dnb-correction-pro-state');
            if (saved) {
                const loadedState = JSON.parse(saved);
                this.state = { ...this.state, ...loadedState };
            }
        } catch (error) {
            console.error('Erreur chargement:', error);
        }
    }

    /**
     * Réinitialise tout
     */
    reset() {
        this.state = {
            selectedExercises: [],
            configuredExercises: [],
            candidates: [],
            currentStep: 1,
            correctionData: {}
        };
        localStorage.removeItem('dnb-correction-pro-state');
    }
}



