// Barème prédéfini pour le DNB Blanc n°1 du 9/12/2025
const BAREME_BB1_2025 = {
    name: "DNB Blanc n°1 - 9/12/2025",
    totalMax: 20,
    exercises: {
        // Exercice 1 : 6 points
        "1": {
            totalPoints: 6,
            questionPoints: {
                q0: 2.5,  // Question 1
                q1: 2.5,  // Question 2
                q2: 1     // Question 3
            },
            questionCompetences: {
                q0: ["Modéliser", "Calculer"],
                q1: ["Modéliser", "Calculer"],
                q2: ["Calculer"]
            },
            questionCompetencePoints: {
                q0: { "Modéliser": 1, "Calculer": 1.5 },
                q1: { "Modéliser": 1, "Calculer": 1.5 },
                q2: { "Calculer": 1 }
            }
        },
        // Exercice 2 : 4 points
        "2": {
            totalPoints: 4,
            questionPoints: {
                q0: 1,    // Question 1
                q1: 0.5,  // Question 2
                q2: 0.5,  // Question 3
                q3: 1,    // Question 4a
                q4: 1     // Question 4b
            },
            questionCompetences: {
                q0: ["Chercher"],
                q1: ["Chercher"],
                q2: ["Chercher"],
                q3: ["Raisonner"],
                q4: ["Raisonner"]
            },
            questionCompetencePoints: {
                q0: { "Chercher": 1 },
                q1: { "Chercher": 0.5 },
                q2: { "Chercher": 0.5 },
                q3: { "Raisonner": 1 },
                q4: { "Raisonner": 1 }
            }
        },
        // Exercice 3 : 3 points
        "3": {
            totalPoints: 3,
            questionPoints: {
                q0: 1.5,  // Question 1
                q1: 1.5   // Question 2
            },
            questionCompetences: {
                q0: ["Calculer", "Chercher"],
                q1: ["Calculer", "Chercher"]
            },
            questionCompetencePoints: {
                q0: { "Calculer": 1, "Chercher": 0.5 },
                q1: { "Calculer": 1, "Chercher": 0.5 }
            }
        },
        // Exercice 4 : 4 points
        "4": {
            totalPoints: 4,
            questionPoints: {
                q0: 1,  // Question 1a
                q1: 1,  // Question 1b
                q2: 1,  // Question 1c
                q3: 1   // Question 2
            },
            questionCompetences: {
                q0: ["Modéliser"],
                q1: ["Modéliser"],
                q2: ["Modéliser"],
                q3: ["Modéliser"]
            },
            questionCompetencePoints: {
                q0: { "Modéliser": 1 },
                q1: { "Modéliser": 1 },
                q2: { "Modéliser": 1 },
                q3: { "Modéliser": 1 }
            }
        },
        // Exercice 5 : 3 points
        "5": {
            totalPoints: 3,
            questionPoints: {
                q0: 1,  // Question 1
                q1: 2   // Question 2
            },
            questionCompetences: {
                q0: ["Chercher"],
                q1: ["Communiquer"]
            },
            questionCompetencePoints: {
                q0: { "Chercher": 1 },
                q1: { "Communiquer": 2 }
            }
        }
    },
    // Bilan des compétences
    bilan: {
        "Chercher": 4,
        "Calculer": 6,
        "Modéliser": 6,
        "Raisonner": 2,
        "Communiquer": 2
    }
};

// Fonction pour appliquer ce barème
function applyBaremeBB1() {
    if (!appState.baremeConfig.exercises) {
        alert("⚠️ Veuillez d'abord sélectionner les exercices");
        return;
    }

    const exerciseNums = Object.keys(appState.baremeConfig.exercises);

    exerciseNums.forEach((exNum, index) => {
        // Le barème BB1 utilise les numéros 1-5, mais l'app peut avoir 1-5 ou 2-6
        const baremeKey = (index + 1).toString();
        const baremeData = BAREME_BB1_2025.exercises[baremeKey];

        if (baremeData && appState.baremeConfig.exercises[exNum]) {
            // Copier les données du barème
            appState.baremeConfig.exercises[exNum].totalPoints = baremeData.totalPoints;
            appState.baremeConfig.exercises[exNum].questionPoints = { ...baremeData.questionPoints };
            appState.baremeConfig.exercises[exNum].questionCompetences = { ...baremeData.questionCompetences };
            appState.baremeConfig.exercises[exNum].questionCompetencePoints = { ...baremeData.questionCompetencePoints };

            console.log(`✅ Barème Ex${exNum} appliqué: ${baremeData.totalPoints} pts`);
        }
    });

    // Rafraîchir l'affichage
    if (typeof renderBaremeExerciseTabs === 'function') {
        renderBaremeExerciseTabs();
    }
    if (typeof showBaremeExercise === 'function') {
        showBaremeExercise(currentBaremeExerciseIndex || 0);
    }
    if (typeof calculateTotalPoints === 'function') {
        calculateTotalPoints();
    }
    if (typeof updateCompetencesSummary === 'function') {
        updateCompetencesSummary();
    }

    alert(`✅ Barème "${BAREME_BB1_2025.name}" appliqué avec succès !`);
}
