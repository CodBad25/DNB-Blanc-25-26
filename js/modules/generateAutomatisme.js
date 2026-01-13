/**
 * Module pour générer les questions d'automatismes
 * 
 * Stratégie :
 * 1. Si MathALÉA tourne en local → utiliser l'API locale
 * 2. Sinon, utiliser un cache local si disponible
 * 3. Sinon, utiliser le titre comme question (fallback)
 */

// Cache local des questions générées
const questionCache = {};

/**
 * Génère une question pour un automatisme
 * @param {string} autoId - ID de l'automatisme (ex: "3AutoG01-1")
 * @param {Object} autoData - Données de l'automatisme depuis dictionnaireAutomatismes
 * @returns {Promise<Object>} - { question: string, correction: string }
 */
export async function generateAutomatismeQuestion(autoId, autoData) {
    // Vérifier le cache d'abord
    if (questionCache[autoId]) {
        console.log(`📦 Utilisation du cache pour ${autoId}`);
        return questionCache[autoId];
    }

    // Essayer MathALÉA local
    try {
        const result = await tryMathaleaLocal(autoId, autoData);
        if (result) {
            // Sauvegarder dans le cache
            questionCache[autoId] = result;
            saveCacheToLocalStorage();
            return result;
        }
    } catch (error) {
        console.warn(`⚠️ MathALÉA local indisponible pour ${autoId}:`, error);
    }

    // Fallback : utiliser le titre
    return {
        question: `<p><strong>${autoData.titre}</strong></p>`,
        correction: `<p><em>Correction attendue pour: ${autoData.titre}</em></p>`
    };
}

/**
 * Essaie de générer via MathALÉA local
 */
async function tryMathaleaLocal(autoId, autoData) {
    // Tentative 1 : API locale MathALÉA
    try {
        const url = `http://localhost:5173/api/exercice/${autoData.uuid}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
            const data = await response.json();
            return {
                question: data.question || data.enonce || `<p>${autoData.titre}</p>`,
                correction: data.correction || data.reponse || `<p>Correction pour ${autoData.titre}</p>`
            };
        }
    } catch (error) {
        // Pas de serveur local, continuer
    }

    // Tentative 2 : Via iframe MathALÉA si disponible
    // (à implémenter si nécessaire)
    
    return null;
}

/**
 * Charge le cache depuis localStorage
 */
export function loadCacheFromLocalStorage() {
    try {
        const stored = localStorage.getItem('automatismesQuestionsCache');
        if (stored) {
            Object.assign(questionCache, JSON.parse(stored));
            console.log(`📦 Cache chargé: ${Object.keys(questionCache).length} questions`);
        }
    } catch (error) {
        console.warn('⚠️ Erreur chargement cache:', error);
    }
}

/**
 * Sauvegarde le cache dans localStorage
 */
function saveCacheToLocalStorage() {
    try {
        localStorage.setItem('automatismesQuestionsCache', JSON.stringify(questionCache));
    } catch (error) {
        console.warn('⚠️ Erreur sauvegarde cache:', error);
    }
}

/**
 * Génère toutes les questions pour plusieurs automatismes
 */
export async function generateAutomatismesQuestions(selectedAutomatismes, automatismesData) {
    const results = {};
    
    for (const autoId of selectedAutomatismes) {
        const autoData = automatismesData[autoId];
        if (autoData) {
            results[autoId] = await generateAutomatismeQuestion(autoId, autoData);
        }
    }
    
    return results;
}

// Charger le cache au démarrage
if (typeof window !== 'undefined') {
    loadCacheFromLocalStorage();
}

