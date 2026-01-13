/**
 * Module d'import des exercices DNB depuis JSON pré-générés
 *
 * Ce module est OPTIONNEL et ne touche pas au parsing temps réel existant.
 * Tu peux l'activer/désactiver avec un simple toggle.
 */

// Configuration
const JSON_SOURCE = {
    // Chemin vers les JSON générés par dnb-latex-processor (lien symbolique)
    basePath: 'dnb-json/',
    catalogFile: 'catalog.json',
    enabled: true  // ⬅️ TOGGLE ICI : true pour tester, false pour désactiver
};

/**
 * Charge le catalogue des exercices disponibles en JSON
 */
async function loadJSONCatalog() {
    if (!JSON_SOURCE.enabled) {
        console.log('📦 Import JSON désactivé (JSON_SOURCE.enabled = false)');
        return null;
    }

    try {
        const response = await fetch(JSON_SOURCE.basePath + JSON_SOURCE.catalogFile);
        if (!response.ok) throw new Error('Catalogue introuvable');

        const catalog = await response.json();
        console.log(`📦 Catalogue JSON chargé : ${catalog.total_exercices} exercices`);
        return catalog;
    } catch (error) {
        console.warn('⚠️ Impossible de charger le catalogue JSON:', error);
        return null;
    }
}

/**
 * Charge un exercice spécifique depuis JSON
 *
 * @param {string} exerciceId - Ex: "dnb_2025_06_asie_4"
 * @returns {Object} Exercice complet
 */
async function loadJSONExercice(exerciceId) {
    if (!JSON_SOURCE.enabled) {
        return null;
    }

    try {
        const response = await fetch(JSON_SOURCE.basePath + exerciceId + '.json');
        if (!response.ok) throw new Error('Exercice introuvable');

        const exercice = await response.json();
        console.log(`📄 Exercice JSON chargé : ${exerciceId}`);
        return exercice;
    } catch (error) {
        console.error('❌ Erreur chargement exercice JSON:', error);
        return null;
    }
}

/**
 * Convertit un exercice JSON vers le format appState
 *
 * @param {Object} jsonExercice - Exercice au format JSON
 * @returns {Object} Exercice au format appState
 */
function convertJSONToAppState(jsonExercice) {
    // Générer les chemins des images croppées
    const imageBasePath = 'dnb-images/';
    const croppedImages = [];
    if (jsonExercice.cropped_images_count > 0) {
        for (let i = 1; i <= jsonExercice.cropped_images_count; i++) {
            croppedImages.push(`${imageBasePath}${jsonExercice.exercice_id}_graphique_${i}.png`);
        }
    }

    // Créer une galerie d'images HTML
    const imageGalleryHTML = croppedImages.length > 0 ? `
        <div class="cropped-images-gallery" style="margin: 20px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border: 2px solid #4caf50;">
            <div style="font-weight: bold; color: #2e7d32; margin-bottom: 10px;">
                📸 ${croppedImages.length} images extraites (graphiques, tableaux, Scratch)
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 10px;">
                ${croppedImages.map((img, idx) => `
                    <div style="background: white; padding: 5px; border-radius: 4px; text-align: center;">
                        <img src="${img}"
                             alt="Image ${idx + 1}"
                             style="max-width: 100%; max-height: 150px; cursor: pointer; border-radius: 4px;"
                             onclick="window.open('${img}', '_blank')"
                             onerror="this.parentElement.style.display='none'">
                        <div style="font-size: 11px; color: #666; margin-top: 5px;">Image ${idx + 1}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    ` : '';

    return {
        // Métadonnées de l'exercice
        metadata: {
            id: jsonExercice.exercice_id,
            annee: jsonExercice.annee,
            lieu: jsonExercice.lieu,
            numero: jsonExercice.numero,
            titre: jsonExercice.titre,
            source: 'json-preprocessed',
            croppedImagesCount: jsonExercice.cropped_images_count || 0
        },

        // Questions converties avec galerie d'images
        questions: jsonExercice.questions.map(q => q.enonce_html + imageGalleryHTML),

        // Corrections converties avec galerie d'images
        corrections: jsonExercice.questions.map(q => q.correction_html + imageGalleryHTML),

        // Stocker les chemins des images pour utilisation future
        croppedImages: croppedImages
    };
}

/**
 * Initialise un dropdown pour choisir entre parsing et JSON
 */
function createSourceSelector() {
    if (!JSON_SOURCE.enabled) return;

    const container = document.getElementById('exercisesGrid');
    if (!container) {
        console.warn('Container exercisesGrid not found');
        return;
    }

    // Vérifier si le sélecteur existe déjà
    if (document.getElementById('sourceSelector')) {
        console.log('📦 Sélecteur JSON déjà présent');
        return;
    }

    // Ajouter un sélecteur de source AVANT le container (pas dedans)
    const selector = document.createElement('div');
    selector.id = 'sourceSelector';
    selector.style.cssText = 'padding: 15px; margin-bottom: 20px; background: #fff3cd; border-radius: 8px; border: 2px solid #ffc107;';
    selector.innerHTML = `
        <div style="display: flex; align-items: center; gap: 15px;">
            <span style="font-weight: bold; color: #856404;">🧪 Mode test :</span>
            <select id="exerciceSource" style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;">
                <option value="realtime">🔴 Parsing temps réel (actuel)</option>
                <option value="json">🟢 JSON pré-générés (nouveau)</option>
            </select>
            <span id="sourceStatus" style="font-size: 0.9em; color: #666;"></span>
        </div>
    `;

    // Insérer AVANT le container, pas dedans (pour éviter d'être écrasé par innerHTML)
    container.parentNode.insertBefore(selector, container);

    // Gérer le changement de source
    document.getElementById('exerciceSource').addEventListener('change', async (e) => {
        const source = e.target.value;
        const statusEl = document.getElementById('sourceStatus');

        if (source === 'json') {
            const catalog = await loadJSONCatalog();
            if (catalog) {
                statusEl.textContent = `✅ ${catalog.total_exercices} exercices disponibles`;
                statusEl.style.color = '#28a745';

                // Recharger la liste avec les exercices JSON
                displayJSONExercicesList(catalog);
            } else {
                statusEl.textContent = '❌ Catalogue JSON introuvable';
                statusEl.style.color = '#dc3545';
            }
        } else {
            statusEl.textContent = 'Mode parsing actuel';
            statusEl.style.color = '#666';
            // Recharger la liste normale via la fonction globale renderExercises
            if (typeof renderExercises === 'function') {
                renderExercises();
            } else {
                console.warn('⚠️ Fonction renderExercises() non disponible');
            }
        }
    });

    console.log('✅ Sélecteur de source JSON ajouté');
}

/**
 * Affiche la liste des exercices depuis le catalogue JSON
 */
async function displayJSONExercicesList(catalog) {
    const container = document.getElementById('exercisesGrid');
    if (!container) return;

    // Vider seulement le container (le sélecteur est AVANT le container, pas dedans)
    container.innerHTML = '';

    // Enrichir le catalogue avec le nombre d'images (charger les JSON complets)
    const enrichedExercices = {};
    for (const [id, info] of Object.entries(catalog.exercices)) {
        try {
            const response = await fetch(JSON_SOURCE.basePath + id + '.json');
            const fullData = await response.json();
            enrichedExercices[id] = {
                ...info,
                cropped_images_count: fullData.cropped_images_count || 0
            };
        } catch (error) {
            enrichedExercices[id] = { ...info, cropped_images_count: 0 };
        }
    }

    // Grouper par année et lieu
    const byYear = {};
    for (const [id, info] of Object.entries(enrichedExercices)) {
        if (!byYear[info.annee]) byYear[info.annee] = {};
        if (!byYear[info.annee][info.lieu]) byYear[info.annee][info.lieu] = [];
        byYear[info.annee][info.lieu].push({ id, ...info });
    }

    // Afficher
    Object.keys(byYear).sort().reverse().forEach(annee => {
        const yearDiv = document.createElement('div');
        yearDiv.innerHTML = `
            <h3 style="color: #2c3e50; margin: 20px 0 10px 0;">📅 ${annee}</h3>
        `;
        container.appendChild(yearDiv);

        Object.keys(byYear[annee]).sort().forEach(lieu => {
            const exercices = byYear[annee][lieu];

            exercices.forEach(ex => {
                const card = document.createElement('div');
                card.className = 'exercise-card';
                card.style.cssText = 'margin: 10px 0; padding: 15px; background: #e8f5e9; border-radius: 8px; cursor: pointer; border: 2px solid #4caf50;';

                // Badge pour les images croppées
                const imagesBadge = ex.cropped_images_count > 0
                    ? `<span style="background: #2196f3; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; margin-left: 8px;">📸 ${ex.cropped_images_count} images</span>`
                    : '';

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: #2e7d32;">✅ ${ex.titre}</strong>
                            ${imagesBadge}
                            <div style="font-size: 0.9em; color: #666; margin-top: 4px;">
                                📝 ${ex.total_questions} questions • 📦 Source: JSON pré-généré
                            </div>
                        </div>
                        <button class="select-json-exercice" data-id="${ex.id}"
                                style="padding: 8px 16px; background: #4caf50; color: white; border: none; border-radius: 4px; cursor: pointer;">
                            Sélectionner
                        </button>
                    </div>
                `;
                container.appendChild(card);

                // Au clic sur la carte ou le bouton
                const selectBtn = card.querySelector('.select-json-exercice');
                selectBtn.addEventListener('click', async (e) => {
                    e.stopPropagation();
                    await selectJSONExercice(ex.id);
                });
                card.addEventListener('click', async () => {
                    await selectJSONExercice(ex.id);
                });
            });
        });
    });
}

/**
 * Sélectionne un exercice JSON et l'ajoute à appState
 */
async function selectJSONExercice(exerciceId) {
    console.log(`📥 Chargement de ${exerciceId}...`);

    const jsonExercice = await loadJSONExercice(exerciceId);
    if (!jsonExercice) {
        alert('❌ Impossible de charger l\'exercice');
        return;
    }

    // Convertir au format appState
    const converted = convertJSONToAppState(jsonExercice);

    // L'ajouter à appState.parsedExercises
    if (!appState.parsedExercises) appState.parsedExercises = {};
    appState.parsedExercises[exerciceId] = converted;

    // L'ajouter à dnbData
    if (!appState.dnbData) appState.dnbData = {};
    appState.dnbData[exerciceId] = {
        annee: jsonExercice.annee,
        lieu: jsonExercice.lieu,
        numero: jsonExercice.numero,
        titre: jsonExercice.titre,
        tags: [] // Peut être étendu plus tard
    };

    // L'ajouter à selectedExercises s'il n'y est pas déjà
    if (!appState.selectedExercises) appState.selectedExercises = [];
    if (!appState.selectedExercises.includes(exerciceId)) {
        appState.selectedExercises.push(exerciceId);
    }

    // Mettre à jour l'affichage
    if (typeof updateSelectionDisplay === 'function') {
        updateSelectionDisplay();
    }

    // Rafraîchir la liste pour afficher la sélection
    if (typeof renderExercises === 'function') {
        renderExercises();
    }

    console.log(`✅ Exercice ${exerciceId} ajouté (source: JSON)`);

    const imagesInfo = jsonExercice.cropped_images_count > 0
        ? `\n📸 ${jsonExercice.cropped_images_count} images extraites (graphiques, tableaux, Scratch)`
        : '';

    alert(`✅ Exercice ajouté : ${jsonExercice.titre}\n\n📝 ${jsonExercice.total_questions} questions${imagesInfo}\n📦 Source : JSON pré-généré avec cropping automatique`);
}

// Initialiser au chargement de la page
if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        if (!JSON_SOURCE.enabled) return;

        console.log('🧪 Mode test JSON activé');

        // Attendre que le container existe (max 5 secondes)
        let attempts = 0;
        const maxAttempts = 50; // 50 × 100ms = 5 secondes

        const checkAndInit = () => {
            const container = document.getElementById('exercisesGrid');
            if (container) {
                console.log('✅ Container exercisesGrid détecté, ajout du sélecteur JSON');
                createSourceSelector();
            } else if (attempts < maxAttempts) {
                attempts++;
                setTimeout(checkAndInit, 100);
            } else {
                console.error('❌ Timeout : container exercisesGrid introuvable après 5 secondes');
            }
        };

        // Démarrer la vérification après un court délai
        setTimeout(checkAndInit, 100);
    });
}
