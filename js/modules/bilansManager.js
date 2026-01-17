/**
 * bilansManager.js
 * Gestion des bilans et résultats pour le DNB Blanc
 * - Import CSV/Excel pour désanonymat
 * - Génération PDF des bilans individuels
 * - Génération PDF/Excel des bilans de classe
 */

// === ÉTAT GLOBAL ===
const bilansState = {
    eleves: [],           // Liste des élèves importés {numero, nom, prenom, classe}
    classes: [],          // Liste des classes uniques
    corrections: {},      // Corrections chargées depuis localStorage
    selectedClass: 'all', // Filtre classe actuel
    previewData: null,    // Données en aperçu avant import
    currentTab: 'import'  // Onglet actif
};

// === INITIALISATION ===
document.addEventListener('DOMContentLoaded', () => {
    // Fix Retina display blur for Chart.js
    if (typeof Chart !== 'undefined') {
        Chart.defaults.devicePixelRatio = window.devicePixelRatio || 2;
    }

    initDropzoneJSON();
    initDropzone();
    loadExistingData();
    loadExistingCorrections();
    updateUI();
    checkImportsComplete();
});

// === NAVIGATION ONGLETS ===
function switchTab(tabName) {
    // Si onglet désactivé, ne rien faire
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (tabBtn && tabBtn.disabled) return;

    bilansState.currentTab = tabName;

    // Mettre à jour les boutons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });

    // Mettre à jour les panneaux
    document.querySelectorAll('.tab-panel').forEach(panel => {
        panel.classList.toggle('active', panel.id === `tab-${tabName}`);
    });

    // Rafraîchir les données si nécessaire
    if (tabName === 'overview' || tabName === 'students' || tabName === 'generate') {
        updateQuickStats();
        updateResultsTable();
        updateAllClassChips();
    }
}

function enableTab(tabName) {
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (tabBtn) {
        tabBtn.disabled = false;
    }
}

function disableTab(tabName) {
    const tabBtn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (tabBtn) {
        tabBtn.disabled = true;
    }
}

function checkImportsComplete() {
    const hasCorrections = Object.keys(bilansState.corrections.scores || {}).length > 0;
    const hasEleves = bilansState.eleves.length > 0;

    // Activer/désactiver les onglets selon les imports
    if (hasCorrections) {
        enableTab('overview');
        enableTab('students');
        enableTab('generate');

        // Afficher le bouton continuer
        const importActions = document.getElementById('importActions');
        if (importActions) {
            importActions.style.display = 'block';
        }
    } else {
        disableTab('overview');
        disableTab('students');
        disableTab('generate');

        const importActions = document.getElementById('importActions');
        if (importActions) {
            importActions.style.display = 'none';
        }
    }
}

function updateAllClassChips() {
    // Mettre à jour tous les sélecteurs de classe
    ['classChips', 'classChips2', 'classChips3'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            let html = `<button class="chip ${bilansState.selectedClass === 'all' ? 'active' : ''}"
                                data-class="all" onclick="selectClass('all')">Toutes</button>`;
            bilansState.classes.forEach(classe => {
                html += `<button class="chip ${bilansState.selectedClass === classe ? 'active' : ''}"
                                 data-class="${classe}" onclick="selectClass('${classe}')">${classe}</button>`;
            });
            container.innerHTML = html;
        }
    });
}

// === DROPZONE JSON (Corrections) ===
function initDropzoneJSON() {
    const dropzone = document.getElementById('dropzoneJSON');
    const fileInput = document.getElementById('jsonInput');

    if (!dropzone || !fileInput) return;

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) processJSONFile(file);
    });

    // Click to browse
    dropzone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processJSONFile(file);
    });
}

function processJSONFile(file) {
    if (!file.name.endsWith('.json')) {
        alert('Veuillez sélectionner un fichier JSON');
        return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const data = JSON.parse(e.target.result);

            // Détecter la structure du fichier (export app ou structure directe)
            let scores, comments, quickButtons, validatedCandidates, activeCandidates;

            if (data.appState && data.appState.scores) {
                // Structure de l'export app : { appState: { scores, ... }, exercisesData, ... }
                scores = data.appState.scores || {};
                comments = data.appState.candidateComments || {};
                quickButtons = data.appState.quickButtonStates || {};
                validatedCandidates = data.appState.validatedCandidates || [];
                activeCandidates = data.appState.activeCandidates || [];
                console.log('✅ Format détecté : export application');
            } else if (data.scores) {
                // Structure directe : { scores, candidateComments, ... }
                scores = data.scores || {};
                comments = data.candidateComments || {};
                quickButtons = data.quickButtonStates || {};
                validatedCandidates = data.validatedCandidates || [];
                activeCandidates = data.activeCandidates || [];
                console.log('✅ Format détecté : structure directe');
            } else {
                alert('Ce fichier JSON ne contient pas de corrections valides.\nAssurez-vous d\'utiliser le fichier exporté depuis l\'application de correction.');
                return;
            }

            // Stocker les corrections
            bilansState.corrections = {
                scores: scores,
                comments: comments,
                quickButtons: quickButtons,
                validatedCandidates: validatedCandidates,
                activeCandidates: activeCandidates
            };

            // Aussi sauvegarder dans localStorage pour persistance (format normalisé)
            const normalizedData = {
                scores: scores,
                candidateComments: comments,
                quickButtonStates: quickButtons,
                validatedCandidates: validatedCandidates,
                activeCandidates: activeCandidates
            };
            localStorage.setItem('dnb_correction_data', JSON.stringify(normalizedData));

            // Mettre à jour l'UI - nouvelle structure
            const candidateCount = Object.keys(scores).length;

            // Cacher la dropzone, afficher le succès
            const dropzoneContainer = document.getElementById('jsonDropzone');
            const successContainer = document.getElementById('jsonSuccess');
            if (dropzoneContainer) dropzoneContainer.style.display = 'none';
            if (successContainer) {
                successContainer.style.display = 'flex';
                document.getElementById('jsonCount').textContent = `${candidateCount} candidats`;
            }

            // Mettre à jour le statut
            const statusBadge = document.getElementById('jsonStatus');
            if (statusBadge) {
                statusBadge.textContent = 'Importé';
                statusBadge.classList.add('success');
            }

            // Vérifier si les imports sont complets
            checkImportsComplete();

            // Rafraîchir les données
            updateResultsTable();
            updateQuickStats();

            console.log('✅ Corrections importées:', candidateCount, 'candidats');

        } catch (err) {
            console.error('Erreur parsing JSON:', err);
            alert('Erreur lors de la lecture du fichier JSON.\nVérifiez que le fichier n\'est pas corrompu.');
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function resetCorrections() {
    bilansState.corrections = {};
    localStorage.removeItem('dnb_correction_data');

    // Nouvelle structure UI
    const dropzoneContainer = document.getElementById('jsonDropzone');
    const successContainer = document.getElementById('jsonSuccess');
    if (dropzoneContainer) dropzoneContainer.style.display = 'block';
    if (successContainer) successContainer.style.display = 'none';

    const jsonInput = document.getElementById('jsonInput');
    if (jsonInput) jsonInput.value = '';

    const statusBadge = document.getElementById('jsonStatus');
    if (statusBadge) {
        statusBadge.textContent = 'Non importé';
        statusBadge.classList.remove('success');
    }

    checkImportsComplete();
    updateResultsTable();
    updateQuickStats();
}

function loadExistingCorrections() {
    const saved = localStorage.getItem('dnb_correction_data');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            bilansState.corrections = {
                scores: data.scores || {},
                comments: data.candidateComments || {},
                quickButtons: data.quickButtonStates || {},
                validatedCandidates: data.validatedCandidates || [],
                activeCandidates: data.activeCandidates || []
            };

            const candidateCount = Object.keys(data.scores || {}).length;
            if (candidateCount > 0) {
                // Nouvelle structure UI
                const dropzoneContainer = document.getElementById('jsonDropzone');
                const successContainer = document.getElementById('jsonSuccess');
                if (dropzoneContainer) dropzoneContainer.style.display = 'none';
                if (successContainer) {
                    successContainer.style.display = 'flex';
                    document.getElementById('jsonCount').textContent = `${candidateCount} candidats`;
                }

                const statusBadge = document.getElementById('jsonStatus');
                if (statusBadge) {
                    statusBadge.textContent = 'Importé';
                    statusBadge.classList.add('success');
                }
            }
        } catch (e) {
            console.error('Erreur chargement corrections:', e);
        }
    }
}

// === DROPZONE ===
function initDropzone() {
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('fileInput');

    // Drag & Drop
    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) processFile(file);
    });

    // Click to browse
    dropzone.addEventListener('click', (e) => {
        if (e.target.tagName !== 'BUTTON') {
            fileInput.click();
        }
    });

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) processFile(file);
    });
}

// === TRAITEMENT FICHIER ===
function processFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();

    if (extension === 'csv') {
        processCSV(file);
    } else if (['xlsx', 'xls'].includes(extension)) {
        processExcel(file);
    } else {
        alert('Format non supporté. Utilisez CSV ou Excel (.xlsx)');
    }
}

function processCSV(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());

        // Détecter le séparateur (virgule ou point-virgule)
        const separator = lines[0].includes(';') ? ';' : ',';

        // Parser le header
        const headers = lines[0].split(separator).map(h => h.trim().toLowerCase());

        // Trouver les index des colonnes
        const indexes = findColumnIndexes(headers);
        if (!indexes) return;

        // Parser les données
        const data = [];
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(separator).map(v => v.trim().replace(/^["']|["']$/g, ''));
            if (values.length >= 4) {
                data.push({
                    numero: parseInt(values[indexes.numero]) || values[indexes.numero],
                    nom: values[indexes.nom],
                    prenom: values[indexes.prenom],
                    classe: values[indexes.classe]
                });
            }
        }

        showPreview(data);
    };
    reader.readAsText(file, 'UTF-8');
}

function processExcel(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        // Prendre la première feuille
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        if (jsonData.length < 2) {
            alert('Le fichier est vide ou mal formaté');
            return;
        }

        // Trouver la ligne d'en-têtes (celle qui contient "Nom" ou "nom")
        let headerRowIndex = 0;
        for (let i = 0; i < Math.min(jsonData.length, 5); i++) {
            const row = jsonData[i];
            if (row && row.some(cell => String(cell).toLowerCase().includes('nom'))) {
                headerRowIndex = i;
                console.log(`✅ Ligne d'en-têtes trouvée à l'index ${i}:`, row);
                break;
            }
        }

        // Parser le header
        const headers = jsonData[headerRowIndex].map(h => String(h || '').trim().toLowerCase());

        // Trouver les index des colonnes
        const indexes = findColumnIndexes(headers);
        if (!indexes) return;

        // Parser les données (commencer après la ligne d'en-têtes)
        const parsedData = [];
        for (let i = headerRowIndex + 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            if (row && row.length >= 4) {
                parsedData.push({
                    numero: parseInt(row[indexes.numero]) || row[indexes.numero],
                    nom: row[indexes.nom] || '',
                    prenom: row[indexes.prenom] || '',
                    classe: row[indexes.classe] || ''
                });
            }
        }

        showPreview(parsedData.filter(d => d.nom && d.prenom));
    };
    reader.readAsArrayBuffer(file);
}

function findColumnIndexes(headers) {
    // Normaliser les headers (minuscules, sans accents, sans espaces multiples)
    const normalizedHeaders = headers.map(h =>
        h.toLowerCase()
         .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // Enlever accents
         .replace(/\s+/g, ' ') // Espaces multiples -> simple
         .trim()
    );

    console.log('Headers originaux:', headers);
    console.log('Headers normalisés:', normalizedHeaders);

    // Chercher les colonnes avec différentes variantes possibles
    const numeroVariants = ['n ° candidat', 'n° candidat', 'n °candidat', 'n ° cand', 'numero', 'n°', 'num', 'numero', 'no', 'candidat', 'n °'];
    const nomVariants = ['nom'];
    const prenomVariants = ['prenom', 'prénom'];
    const classeVariants = ['classe', 'class', 'division', 'groupe'];

    const findIndex = (variants) => {
        for (const variant of variants) {
            // Chercher correspondance exacte d'abord
            let idx = normalizedHeaders.findIndex(h => h === variant);
            if (idx !== -1) return idx;

            // Sinon chercher si contient
            idx = normalizedHeaders.findIndex(h => h.includes(variant));
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const indexes = {
        numero: findIndex(numeroVariants),
        nom: findIndex(nomVariants),
        prenom: findIndex(prenomVariants),
        classe: findIndex(classeVariants)
    };

    console.log('Indexes trouvés:', indexes);

    if (indexes.numero === -1 || indexes.nom === -1 || indexes.prenom === -1 || indexes.classe === -1) {
        alert(`Colonnes manquantes. Assurez-vous d'avoir : numero, nom, prenom, classe\n\nColonnes détectées : ${headers.join(', ')}\n\nIndexes : numero=${indexes.numero}, nom=${indexes.nom}, prenom=${indexes.prenom}, classe=${indexes.classe}`);
        return null;
    }

    return indexes;
}

// === APERÇU ===
function showPreview(data) {
    bilansState.previewData = data;

    // Cacher la dropzone CSV, afficher l'aperçu
    const csvDropzone = document.getElementById('csvDropzone');
    if (csvDropzone) csvDropzone.style.display = 'none';

    const previewSection = document.getElementById('previewSection');
    if (previewSection) previewSection.style.display = 'block';

    // Stats
    const classes = [...new Set(data.map(d => d.classe))];
    document.getElementById('totalEleves').textContent = data.length;
    document.getElementById('totalClasses').textContent = classes.length;

    // Tableau
    const tbody = document.getElementById('previewTableBody');
    tbody.innerHTML = data.slice(0, 50).map(d => `
        <tr>
            <td>${d.numero}</td>
            <td>${d.nom}</td>
            <td>${d.prenom}</td>
            <td>${d.classe}</td>
        </tr>
    `).join('');

    if (data.length > 50) {
        tbody.innerHTML += `<tr><td colspan="4" style="text-align:center;color:#666;">... et ${data.length - 50} autres</td></tr>`;
    }
}

function cancelImport() {
    bilansState.previewData = null;

    const csvDropzone = document.getElementById('csvDropzone');
    if (csvDropzone) csvDropzone.style.display = 'block';

    const previewSection = document.getElementById('previewSection');
    if (previewSection) previewSection.style.display = 'none';

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';
}

function confirmImport() {
    if (!bilansState.previewData) return;

    bilansState.eleves = bilansState.previewData;
    bilansState.classes = [...new Set(bilansState.eleves.map(e => e.classe))].sort();

    // Sauvegarder dans localStorage
    localStorage.setItem('dnb_bilans_eleves', JSON.stringify(bilansState.eleves));

    // Mettre à jour l'UI - nouvelle structure
    const previewSection = document.getElementById('previewSection');
    if (previewSection) previewSection.style.display = 'none';

    const csvDropzone = document.getElementById('csvDropzone');
    if (csvDropzone) csvDropzone.style.display = 'none';

    const csvSuccess = document.getElementById('csvSuccess');
    if (csvSuccess) {
        csvSuccess.style.display = 'flex';
        document.getElementById('csvCount').textContent = `${bilansState.eleves.length} élèves`;
        document.getElementById('csvClasses').textContent = `Classes : ${bilansState.classes.join(', ')}`;
    }

    // Mettre à jour le statut
    const statusBadge = document.getElementById('csvStatus');
    if (statusBadge) {
        statusBadge.textContent = 'Importé';
        statusBadge.classList.add('success');
    }

    updateAllClassChips();
    updateResultsTable();
    updateQuickStats();
    checkImportsComplete();
}

function resetImport() {
    bilansState.eleves = [];
    bilansState.classes = [];
    bilansState.previewData = null;
    localStorage.removeItem('dnb_bilans_eleves');

    // Nouvelle structure UI
    const csvSuccess = document.getElementById('csvSuccess');
    if (csvSuccess) csvSuccess.style.display = 'none';

    const csvDropzone = document.getElementById('csvDropzone');
    if (csvDropzone) csvDropzone.style.display = 'block';

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.value = '';

    const statusBadge = document.getElementById('csvStatus');
    if (statusBadge) {
        statusBadge.textContent = 'Non importé';
        statusBadge.classList.remove('success');
    }

    updateAllClassChips();
    updateResultsTable();
    updateQuickStats();
}

// === CHARGEMENT DONNÉES EXISTANTES ===
function loadExistingData() {
    const saved = localStorage.getItem('dnb_bilans_eleves');
    if (saved) {
        try {
            bilansState.eleves = JSON.parse(saved);
            bilansState.classes = [...new Set(bilansState.eleves.map(e => e.classe))].sort();

            if (bilansState.eleves.length > 0) {
                // Nouvelle structure UI
                const csvDropzone = document.getElementById('csvDropzone');
                if (csvDropzone) csvDropzone.style.display = 'none';

                const csvSuccess = document.getElementById('csvSuccess');
                if (csvSuccess) {
                    csvSuccess.style.display = 'flex';
                    const csvCount = document.getElementById('csvCount');
                    const csvClasses = document.getElementById('csvClasses');
                    if (csvCount) csvCount.textContent = `${bilansState.eleves.length} élèves`;
                    if (csvClasses) csvClasses.textContent = `Classes : ${bilansState.classes.join(', ')}`;
                }

                const statusBadge = document.getElementById('csvStatus');
                if (statusBadge) {
                    statusBadge.textContent = 'Importé';
                    statusBadge.classList.add('success');
                }
            }
        } catch (e) {
            console.error('Erreur chargement élèves:', e);
        }
    }
}


// === MISE À JOUR UI ===
function updateUI() {
    updateAllClassChips();
    updateResultsTable();
    updateQuickStats();
}

function updateClassChips() {
    // Ancienne fonction - maintenant utilise updateAllClassChips
    updateAllClassChips();
}

function selectClass(classe) {
    bilansState.selectedClass = classe;
    updateAllClassChips();
    updateResultsTable();
    updateQuickStats();
}

function updateQuickStats() {
    const candidats = getCorrectedCandidates();
    const filtered = filterByClass(candidats);

    if (filtered.length > 0) {
        const notes = filtered.map(c => c.note).sort((a, b) => a - b);
        const moyenne = (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(1);
        const mediane = notes.length % 2 === 0
            ? ((notes[notes.length / 2 - 1] + notes[notes.length / 2]) / 2).toFixed(1)
            : notes[Math.floor(notes.length / 2)].toFixed(1);
        const min = Math.min(...notes).toFixed(1);
        const max = Math.max(...notes).toFixed(1);

        // Trouver le champion
        const champion = filtered.reduce((best, c) => c.note > best.note ? c : best, filtered[0]);

        document.getElementById('statMoyenne').textContent = moyenne + '/20';
        document.getElementById('statMediane').textContent = mediane + '/20';
        document.getElementById('statEtendue').textContent = `${min} - ${max}`;
        document.getElementById('statChampion').textContent = max + '/20';
        document.getElementById('statChampionName').textContent = champion.prenom || `N°${champion.numero}`;
    } else {
        document.getElementById('statMoyenne').textContent = '--';
        document.getElementById('statMediane').textContent = '--';
        document.getElementById('statEtendue').textContent = '--';
        document.getElementById('statChampion').textContent = '--';
        document.getElementById('statChampionName').textContent = 'Meilleure note';
    }

    // Mettre à jour les graphiques Chart.js
    updateMasteryChartJS(filtered);
    updateExerciseChartJS(filtered);
    updateDistributionChart(filtered);
    updateBoxPlot(filtered);

    // Mettre à jour les stats d'exercices (cartes)
    updateExerciseStats(filtered);

    // Mettre à jour les recommandations
    updateRecommendations(filtered);
}

// === GRAPHIQUES CHART.JS ===
let masteryChart = null;
let exerciseChart = null;
let distributionChart = null;

function updateMasteryChartJS(candidats) {
    const canvas = document.getElementById('masteryChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const tbm = candidats.filter(c => c.niveau === 'TBM').length;
    const ms = candidats.filter(c => c.niveau === 'MS').length;
    const mf = candidats.filter(c => c.niveau === 'MF').length;
    const mi = candidats.filter(c => c.niveau === 'MI').length;

    // Détruire le graphique existant
    if (masteryChart) {
        masteryChart.destroy();
    }

    masteryChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Très bonne maîtrise', 'Maîtrise satisfaisante', 'Maîtrise fragile', 'Maîtrise insuffisante'],
            datasets: [{
                data: [tbm, ms, mf, mi],
                backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '60%',
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 15,
                        usePointStyle: true,
                        font: { size: 12 }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const pct = total > 0 ? Math.round((context.raw / total) * 100) : 0;
                            return `${context.label}: ${context.raw} (${pct}%)`;
                        }
                    }
                }
            }
        }
    });
}

function updateExerciseChartJS(candidats) {
    const canvas = document.getElementById('exerciseChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const exercises = [
        { num: 1, name: 'Course', max: 6 },
        { num: 2, name: 'Bonbons', max: 4 },
        { num: 3, name: 'CO2', max: 3 },
        { num: 4, name: 'Scratch', max: 4 },
        { num: 5, name: 'Trajet', max: 3 }
    ];

    // Calculer les taux de réussite
    const successRates = exercises.map(ex => {
        let totalScore = 0;
        let count = 0;
        candidats.forEach(c => {
            const scores = calculateExerciseScores(c.numero);
            if (scores[ex.num] !== undefined) {
                totalScore += scores[ex.num];
                count++;
            }
        });
        return count > 0 ? Math.round((totalScore / count / ex.max) * 100) : 0;
    });

    // Détruire le graphique existant
    if (exerciseChart) {
        exerciseChart.destroy();
    }

    exerciseChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: exercises.map(ex => ex.name),
            datasets: [{
                label: 'Taux de réussite (%)',
                data: successRates,
                backgroundColor: successRates.map(rate => {
                    if (rate >= 70) return '#10b981';
                    if (rate >= 50) return '#3b82f6';
                    if (rate >= 30) return '#f59e0b';
                    return '#ef4444';
                }),
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        callback: value => value + '%'
                    }
                }
            }
        }
    });
}

// === HISTOGRAMME DE DISTRIBUTION DES NOTES ===
function updateDistributionChart(candidats) {
    const canvas = document.getElementById('distributionChartCanvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Créer les tranches de 2 points : 0-2, 2-4, 4-6, ..., 18-20
    const ranges = [];
    for (let i = 0; i < 20; i += 2) {
        ranges.push({ min: i, max: i + 2, label: `${i}-${i + 2}`, count: 0 });
    }

    // Compter les notes dans chaque tranche
    candidats.forEach(c => {
        const note = c.note;
        for (let range of ranges) {
            if (note >= range.min && note < range.max) {
                range.count++;
                break;
            }
            // Cas spécial pour 20/20
            if (note === 20 && range.max === 20) {
                range.count++;
                break;
            }
        }
    });

    // Détruire le graphique existant
    if (distributionChart) {
        distributionChart.destroy();
    }

    // Couleurs selon les tranches (rouge -> orange -> vert)
    const colors = ranges.map((r, i) => {
        if (i < 2) return '#ef4444';      // 0-4 : rouge (MI)
        if (i < 5) return '#f59e0b';      // 4-10 : orange (MF)
        if (i < 7) return '#3b82f6';      // 10-14 : bleu (MS)
        return '#10b981';                  // 14-20 : vert (TBM)
    });

    distributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ranges.map(r => r.label),
            datasets: [{
                label: 'Nombre d\'élèves',
                data: ranges.map(r => r.count),
                backgroundColor: colors,
                borderRadius: 4,
                barPercentage: 0.9,
                categoryPercentage: 0.9
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        title: (items) => `Notes : ${items[0].label}/20`,
                        label: (item) => {
                            const count = item.raw;
                            const pct = candidats.length > 0 ? Math.round((count / candidats.length) * 100) : 0;
                            return `${count} élève${count > 1 ? 's' : ''} (${pct}%)`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Note sur 20',
                        font: { size: 12, weight: '500' }
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Nombre d\'élèves',
                        font: { size: 12, weight: '500' }
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                }
            }
        }
    });
}

// === BOÎTE À MOUSTACHES (Box Plot) ===
function updateBoxPlot(candidats) {
    const container = document.getElementById('boxPlotContainer');
    if (!container) return;

    if (candidats.length === 0) {
        container.innerHTML = '<div style="text-align:center; padding:40px; color:#9ca3af;">Aucune donnée</div>';
        return;
    }

    // Calculer les statistiques
    const notes = candidats.map(c => c.note).sort((a, b) => a - b);
    const n = notes.length;

    const min = notes[0];
    const max = notes[n - 1];
    const median = n % 2 === 0
        ? (notes[n / 2 - 1] + notes[n / 2]) / 2
        : notes[Math.floor(n / 2)];

    // Quartiles
    const q1Index = Math.floor(n / 4);
    const q3Index = Math.floor(3 * n / 4);
    const q1 = notes[q1Index];
    const q3 = notes[q3Index];

    // Moyenne pour référence
    const moyenne = notes.reduce((a, b) => a + b, 0) / n;

    // Positions en pourcentage (échelle 0-20)
    const scale = (val) => (val / 20) * 100;
    const minPos = scale(min);
    const maxPos = scale(max);
    const q1Pos = scale(q1);
    const q3Pos = scale(q3);
    const medianPos = scale(median);
    const moyennePos = scale(moyenne);

    // Générer le HTML du box plot (ÉQUILIBRÉ)
    container.innerHTML = `
        <div style="position: relative; height: 100px; padding: 15px 12px;">
            <div style="position: absolute; left: 12px; right: 12px; top: 15px; bottom: 45px;">
                ${[0, 5, 10, 15, 20].map(v => `
                    <div style="position: absolute; left: ${scale(v)}%; top: 0; bottom: 0; width: 1px; background: #e5e7eb;"></div>
                    <div style="position: absolute; left: ${scale(v)}%; bottom: -20px; transform: translateX(-50%); font-size: 10px; color: #9ca3af;">${v}</div>
                `).join('')}
                <div style="position: absolute; left: 0; right: 0; top: 50%; height: 2px; background: #d1d5db;"></div>
                <div style="position: absolute; left: ${minPos}%; width: ${q1Pos - minPos}%; top: 50%; height: 2px; background: #6b7280; transform: translateY(-50%);"></div>
                <div style="position: absolute; left: ${minPos}%; top: 20%; bottom: 20%; width: 2px; background: #6b7280;"></div>
                <div style="position: absolute; left: ${q1Pos}%; width: ${q3Pos - q1Pos}%; top: 10%; bottom: 10%; background: linear-gradient(135deg, #3b82f6, #60a5fa); border-radius: 4px; box-shadow: 0 2px 6px rgba(59,130,246,0.3);"></div>
                <div style="position: absolute; left: ${q3Pos}%; width: ${maxPos - q3Pos}%; top: 50%; height: 2px; background: #6b7280; transform: translateY(-50%);"></div>
                <div style="position: absolute; left: ${maxPos}%; top: 20%; bottom: 20%; width: 2px; background: #6b7280;"></div>
                <div style="position: absolute; left: ${medianPos}%; top: 5%; bottom: 5%; width: 3px; background: #dc2626; border-radius: 2px; transform: translateX(-50%);"></div>
                <div style="position: absolute; left: ${moyennePos}%; top: 50%; transform: translate(-50%, -50%) rotate(45deg); width: 10px; height: 10px; background: #f59e0b; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>
            </div>
        </div>
        <div style="display: flex; justify-content: space-around; padding: 8px 12px; background: #f8fafc; border-radius: 8px; font-size: 11px;">
            <div style="text-align:center;"><div style="font-weight: 700; color: #374151;">${min.toFixed(1)}</div><div style="font-size:9px; color: #9ca3af;">Min</div></div>
            <div style="text-align:center;"><div style="font-weight: 700; color: #3b82f6;">${q1.toFixed(1)}</div><div style="font-size:9px; color: #9ca3af;">Q1</div></div>
            <div style="text-align:center;"><div style="font-weight: 700; color: #dc2626;">${median.toFixed(1)}</div><div style="font-size:9px; color: #9ca3af;">Médiane</div></div>
            <div style="text-align:center;"><div style="font-weight: 700; color: #f59e0b;">${moyenne.toFixed(1)}</div><div style="font-size:9px; color: #9ca3af;">Moyenne</div></div>
            <div style="text-align:center;"><div style="font-weight: 700; color: #3b82f6;">${q3.toFixed(1)}</div><div style="font-size:9px; color: #9ca3af;">Q3</div></div>
            <div style="text-align:center;"><div style="font-weight: 700; color: #374151;">${max.toFixed(1)}</div><div style="font-size:9px; color: #9ca3af;">Max</div></div>
        </div>
    `;
}

// === RECOMMANDATIONS PÉDAGOGIQUES ===
function updateRecommendations(candidats) {
    const container = document.getElementById('recommendationGrid');
    if (!container) return;

    const exercises = [
        { num: 1, name: 'Course', icon: '🏃', max: 6 },
        { num: 2, name: 'Bonbons', icon: '🍬', max: 4 },
        { num: 3, name: 'CO2', icon: '🌍', max: 3 },
        { num: 4, name: 'Scratch', icon: '🐱', max: 4 },
        { num: 5, name: 'Trajet', icon: '🚗', max: 3 }
    ];

    // Calculer les taux de réussite par exercice
    const exerciseStats = exercises.map(ex => {
        let totalScore = 0;
        let count = 0;
        candidats.forEach(c => {
            const scores = calculateExerciseScores(c.numero);
            if (scores[ex.num] !== undefined) {
                totalScore += scores[ex.num];
                count++;
            }
        });
        const successRate = count > 0 ? (totalScore / count / ex.max) * 100 : 0;
        return { ...ex, successRate: Math.round(successRate) };
    });

    // Catégoriser
    const urgent = exerciseStats.filter(ex => ex.successRate < 50);
    const priority = exerciseStats.filter(ex => ex.successRate >= 50 && ex.successRate < 70);
    const strengths = exerciseStats.filter(ex => ex.successRate >= 70);

    container.innerHTML = `
        <div class="recommendation-card urgent">
            <div class="recommendation-title urgent">🚨 Priorité absolue</div>
            <div class="recommendation-desc">Exercices avec moins de 50% de réussite</div>
            ${urgent.length > 0 ? `
                <ul class="recommendation-list">
                    ${urgent.map(ex => `<li>${ex.icon} ${ex.name} (${ex.successRate}%)</li>`).join('')}
                </ul>
            ` : '<div class="recommendation-empty">Aucun exercice critique</div>'}
        </div>

        <div class="recommendation-card priority">
            <div class="recommendation-title priority">⚠️ À améliorer</div>
            <div class="recommendation-desc">Exercices entre 50% et 70%</div>
            ${priority.length > 0 ? `
                <ul class="recommendation-list">
                    ${priority.map(ex => `<li>${ex.icon} ${ex.name} (${ex.successRate}%)</li>`).join('')}
                </ul>
            ` : '<div class="recommendation-empty">Aucun exercice dans cette zone</div>'}
        </div>

        <div class="recommendation-card strength">
            <div class="recommendation-title strength">✅ Points forts</div>
            <div class="recommendation-desc">Exercices avec plus de 70% de réussite</div>
            ${strengths.length > 0 ? `
                <ul class="recommendation-list">
                    ${strengths.map(ex => `<li>${ex.icon} ${ex.name} (${ex.successRate}%)</li>`).join('')}
                </ul>
            ` : '<div class="recommendation-empty">Aucun point fort identifié</div>'}
        </div>
    `;
}

// === STATS PAR EXERCICE ===
function updateExerciseStats(candidats) {
    const container = document.getElementById('exerciseDetailGrid');
    if (!container) return;

    if (candidats.length === 0) {
        container.innerHTML = '<div style="text-align:center;padding:20px;color:#9ca3af;width:100%;">Aucune donnée</div>';
        return;
    }

    const exercises = [
        { num: 1, name: 'Course', icon: '🏃', max: 6, color: '#22c55e' },
        { num: 2, name: 'Bonbons', icon: '🍬', max: 4, color: '#8b5cf6' },
        { num: 3, name: 'CO2', icon: '🌍', max: 3, color: '#3b82f6' },
        { num: 4, name: 'Scratch', icon: '🐱', max: 4, color: '#f59e0b' },
        { num: 5, name: 'Trajet', icon: '🚗', max: 3, color: '#ef4444' }
    ];

    // Calculer les moyennes par exercice
    const exerciseMeans = {};
    exercises.forEach(ex => {
        let totalScore = 0;
        let count = 0;

        candidats.forEach(c => {
            const scores = calculateExerciseScores(c.numero);
            if (scores[ex.num] !== undefined) {
                totalScore += scores[ex.num];
                count++;
            }
        });

        exerciseMeans[ex.num] = count > 0 ? totalScore / count : 0;
    });

    container.innerHTML = exercises.map(ex => {
        const mean = exerciseMeans[ex.num] || 0;
        const pct = Math.round((mean / ex.max) * 100);

        return `
            <div class="exercise-detail-card">
                <div class="ex-icon">${ex.icon}</div>
                <div class="ex-name">${ex.name}</div>
                <div class="ex-score">${mean.toFixed(1)}/${ex.max}</div>
                <div class="ex-bar">
                    <div class="ex-bar-fill" style="width:${pct}%;background:${ex.color};"></div>
                </div>
                <div class="ex-pct">${pct}% de réussite</div>
            </div>
        `;
    }).join('');
}

function updateResultsTable() {
    const candidats = getCorrectedCandidates();
    const filtered = filterByClass(candidats);

    const tbody = document.getElementById('resultsTableBody');
    const noResults = document.getElementById('noResults');
    const tableContainer = document.querySelector('.results-table-container');

    if (filtered.length === 0) {
        tableContainer.style.display = 'none';
        noResults.style.display = 'block';
        return;
    }

    tableContainer.style.display = 'block';
    noResults.style.display = 'none';

    // Trier par classe puis par nom
    filtered.sort((a, b) => {
        if (a.classe !== b.classe) return a.classe.localeCompare(b.classe);
        return a.nom.localeCompare(b.nom);
    });

    tbody.innerHTML = filtered.map(c => `
        <tr>
            <td>${c.numero}</td>
            <td>${c.nom} ${c.prenom}</td>
            <td>${c.classe}</td>
            <td class="note">${c.note.toFixed(1)}</td>
            <td><span class="niveau-badge ${c.niveau.toLowerCase()}">${c.niveau}</span></td>
            <td class="actions">
                <button class="action-btn" onclick="previewIndividualPDF(${c.numero})">👁️</button>
                <button class="action-btn" onclick="downloadIndividualPDF(${c.numero})">📥</button>
            </td>
        </tr>
    `).join('');
}

function getCorrectedCandidates() {
    const result = [];
    const scores = bilansState.corrections.scores || {};

    // Récupérer les seuils de maîtrise
    const seuils = JSON.parse(localStorage.getItem('dnb_maitrise_seuils') || '{"tbm":15,"ms":10,"mf":5}');

    Object.keys(scores).forEach(candidateNumber => {
        const num = parseInt(candidateNumber);
        const candidateScores = scores[candidateNumber];

        // Calculer la note totale
        let totalScore = 0;
        Object.keys(candidateScores).forEach(exKey => {
            const exercise = candidateScores[exKey];
            Object.keys(exercise).forEach(qKey => {
                totalScore += exercise[qKey].score || 0;
            });
        });

        // Trouver l'élève correspondant
        const eleve = bilansState.eleves.find(e => e.numero == num);

        // Déterminer le niveau
        let niveau = 'MI';
        if (totalScore >= seuils.tbm) niveau = 'TBM';
        else if (totalScore >= seuils.ms) niveau = 'MS';
        else if (totalScore >= seuils.mf) niveau = 'MF';

        result.push({
            numero: num,
            nom: eleve ? eleve.nom : `Candidat`,
            prenom: eleve ? eleve.prenom : `${num}`,
            classe: eleve ? eleve.classe : 'Non attribué',
            note: totalScore,
            niveau: niveau
        });
    });

    return result;
}

function filterByClass(candidats) {
    if (bilansState.selectedClass === 'all') return candidats;
    return candidats.filter(c => c.classe === bilansState.selectedClass);
}

// === GÉNÉRATION PDF INDIVIDUEL ===
function previewIndividualPDF(numero) {
    const candidat = getCorrectedCandidates().find(c => c.numero == numero);
    if (!candidat) return;

    const previewContent = document.getElementById('pdfPreviewContent');
    // Utiliser le même HTML compact que pour le PDF
    previewContent.innerHTML = `<div style="max-width:600px; margin:0 auto;">${generateCompactBilanHTML(candidat)}</div>`;

    document.getElementById('pdfPreviewModal').classList.add('active');

    // Stocker le numéro pour le téléchargement
    bilansState.currentPreviewNumero = numero;
}

function closePdfPreview() {
    document.getElementById('pdfPreviewModal').classList.remove('active');
}

function downloadCurrentPdf() {
    console.log('downloadCurrentPdf appelé, numero:', bilansState.currentPreviewNumero);
    if (bilansState.currentPreviewNumero) {
        try {
            downloadIndividualPDF(bilansState.currentPreviewNumero);
        } catch (e) {
            console.error('Erreur PDF:', e);
            alert('Erreur lors de la génération du PDF: ' + e.message);
        }
    }
}

function generateBilanHTML(candidat) {
    const scores = bilansState.corrections.scores[candidat.numero] || {};
    const comment = bilansState.corrections.comments ? bilansState.corrections.comments[candidat.numero] : '';

    // Calculer les scores par exercice
    const exerciseScores = calculateExerciseScores(candidat.numero);

    // Calculer les scores par compétence
    const competenceScores = calculateCompetenceScores(candidat.numero);

    // Exercices avec emojis
    const exerciseEmojis = {
        1: { emoji: '🏃', name: 'Course', max: 6 },
        2: { emoji: '🍬', name: 'Bonbons', max: 4 },
        3: { emoji: '🌍', name: 'CO2', max: 3 },
        4: { emoji: '🐱', name: 'Scratch', max: 4 },
        5: { emoji: '🚗', name: 'Trajet', max: 3 }
    };

    let exercisesHTML = '';
    Object.keys(exerciseEmojis).forEach(exNum => {
        const ex = exerciseEmojis[exNum];
        const score = exerciseScores[exNum] || 0;
        exercisesHTML += `
            <div class="bilan-exercice-badge">
                <span class="emoji">${ex.emoji}</span>
                <span class="name">${ex.name}</span>
                <span class="score">${score}/${ex.max}</span>
            </div>
        `;
    });

    let competencesHTML = '';
    const competenceNames = ['Chercher', 'Modéliser', 'Représenter', 'Calculer', 'Raisonner', 'Communiquer'];
    competenceNames.forEach(comp => {
        const data = competenceScores[comp] || { score: 0, max: 0 };
        const pct = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
        let niveau = 'MI';
        if (pct >= 75) niveau = 'TBM';
        else if (pct >= 50) niveau = 'MS';
        else if (pct >= 25) niveau = 'MF';

        competencesHTML += `
            <tr>
                <td>${comp}</td>
                <td style="text-align:center">${pct}%</td>
                <td style="text-align:center"><span class="niveau-badge ${niveau.toLowerCase()}">${niveau}</span></td>
                <td>
                    <div style="background:#e5e7eb;border-radius:4px;height:8px;overflow:hidden;">
                        <div style="width:${pct}%;height:100%;background:${getCompetenceColor(niveau)};"></div>
                    </div>
                </td>
            </tr>
        `;
    });

    return `
        <div class="bilan-preview">
            <div class="bilan-header">
                <div class="titre">DNB Blanc - Décembre 2025</div>
                <div class="eleve-nom">${candidat.nom} ${candidat.prenom}</div>
                <div class="eleve-classe">${candidat.classe}</div>
            </div>

            <div class="bilan-body">
                <div class="bilan-exercices">
                    ${exercisesHTML}
                </div>

                <div class="bilan-score-row">
                    <div class="bilan-score">
                        <div class="note ${candidat.niveau.toLowerCase()}">${candidat.note.toFixed(1)}/20</div>
                        <div style="margin-top:8px;font-weight:600;color:#666;">${getNiveauLabel(candidat.niveau)}</div>
                    </div>

                    <div class="bilan-competences">
                        <table>
                            <thead>
                                <tr>
                                    <th>Compétence</th>
                                    <th>%</th>
                                    <th>Niveau</th>
                                    <th>Progression</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${competencesHTML}
                            </tbody>
                        </table>
                    </div>
                </div>

                ${comment ? `
                    <div class="bilan-commentaire">
                        <div class="label">Commentaire du correcteur</div>
                        <div class="content">${comment}</div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function calculateExerciseScores(numero) {
    const scores = bilansState.corrections.scores[numero] || {};
    const result = {};

    Object.keys(scores).forEach(exKey => {
        const exNum = parseInt(exKey);
        let total = 0;
        Object.keys(scores[exKey]).forEach(qKey => {
            total += scores[exKey][qKey].score || 0;
        });
        result[exNum] = Math.round(total * 10) / 10;
    });

    return result;
}

function calculateCompetenceScores(numero) {
    const scores = bilansState.corrections.scores[numero] || {};
    const result = {};

    // Récupérer le barème depuis localStorage
    const bb1Config = JSON.parse(localStorage.getItem('dnb_bb1_config') || '{}');
    const baremeExercises = bb1Config.baremeConfig?.exercises || {};

    // Barème par défaut si pas de config
    const defaultBareme = {
        '1': { // Course
            questionCompetencePoints: {
                q0: { 'Modéliser': 1, 'Calculer': 1.5 },
                q1: { 'Modéliser': 1, 'Calculer': 1.5 },
                q2: { 'Calculer': 1 }
            }
        },
        '2': { // Bonbons
            questionCompetencePoints: {
                q0: { 'Chercher': 1 },
                q1: { 'Chercher': 0.5 },
                q2: { 'Chercher': 0.5 },
                q3: { 'Raisonner': 1 },
                q4: { 'Raisonner': 1 }
            }
        },
        '3': { // CO2
            questionCompetencePoints: {
                q0: { 'Calculer': 1, 'Chercher': 0.5 },
                q1: { 'Calculer': 1, 'Chercher': 0.5 }
            }
        },
        '4': { // Scratch
            questionCompetencePoints: {
                q0: { 'Modéliser': 1 },
                q1: { 'Modéliser': 1 },
                q2: { 'Modéliser': 1 },
                q3: { 'Modéliser': 1 }
            }
        },
        '5': { // Trajet
            questionCompetencePoints: {
                q0: { 'Chercher': 1 },
                q1: { 'Communiquer': 2 }
            }
        }
    };

    // Utiliser le barème configuré ou le défaut
    const exercisesBareme = Object.keys(baremeExercises).length > 0 ? baremeExercises : defaultBareme;

    // Calculer les max depuis le barème
    Object.keys(exercisesBareme).forEach(exKey => {
        const exBareme = exercisesBareme[exKey];
        const questionPoints = exBareme.questionCompetencePoints || {};

        Object.keys(questionPoints).forEach(qKey => {
            const compPoints = questionPoints[qKey];
            Object.keys(compPoints).forEach(compName => {
                // Normaliser le nom de compétence (prendre le premier mot)
                const compBase = compName.split(' ')[0];
                if (!result[compBase]) {
                    result[compBase] = { score: 0, max: 0 };
                }
                result[compBase].max += compPoints[compName] || 0;
            });
        });
    });

    // Ajouter les scores obtenus
    Object.keys(scores).forEach(exKey => {
        Object.keys(scores[exKey]).forEach(qKey => {
            const question = scores[exKey][qKey];
            if (question.competences) {
                Object.keys(question.competences).forEach(compName => {
                    const compBase = compName.split(' ')[0];
                    if (!result[compBase]) {
                        result[compBase] = { score: 0, max: 0 };
                    }
                    result[compBase].score += question.competences[compName] || 0;
                });
            }
        });
    });

    return result;
}

function getCompetenceColor(niveau) {
    const colors = {
        'TBM': '#22c55e',
        'MS': '#3b82f6',
        'MF': '#f59e0b',
        'MI': '#ef4444'
    };
    return colors[niveau] || '#6b7280';
}

function getNiveauLabel(niveau) {
    const labels = {
        'TBM': 'Très\u00A0bonne\u00A0maîtrise',
        'MS': 'Maîtrise\u00A0satisfaisante',
        'MF': 'Maîtrise\u00A0fragile',
        'MI': 'Maîtrise\u00A0insuffisante'
    };
    return labels[niveau] || niveau;
}

// === TÉLÉCHARGEMENT PDF AVEC HTML2PDF ===
function downloadIndividualPDF(numero) {
    console.log('downloadIndividualPDF appelé avec numero:', numero);

    // Vérifier que html2pdf est disponible
    if (typeof html2pdf === 'undefined') {
        alert('Erreur: html2pdf non chargé. Vérifiez votre connexion internet.');
        console.error('html2pdf non disponible');
        return;
    }

    const candidat = getCorrectedCandidates().find(c => c.numero == numero);
    if (!candidat) {
        console.error('Candidat non trouvé:', numero);
        return;
    }

    // Générer le HTML compact du bilan
    const bilanHTML = generateCompactBilanHTML(candidat);

    // Créer élément temporaire
    const element = document.createElement('div');
    element.innerHTML = `<div id="pdfContent" style="font-family:'Segoe UI',system-ui,sans-serif; width:210mm; background:white;">${bilanHTML}</div>`;
    element.style.position = 'absolute';
    element.style.left = '-9999px';
    document.body.appendChild(element);

    const pdfElement = element.querySelector('#pdfContent');

    // Options html2pdf
    const fileName = candidat.nom !== 'Candidat'
        ? `Bilan_${candidat.nom}_${candidat.prenom}.pdf`
        : `Bilan_Candidat_${numero}.pdf`;

    const opt = {
        margin: 10,
        filename: fileName,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf()
        .set(opt)
        .from(pdfElement)
        .save()
        .then(() => {
            console.log('PDF généré avec succès!');
            document.body.removeChild(element);
        })
        .catch(err => {
            console.error('Erreur html2pdf:', err);
            document.body.removeChild(element);
        });
}

// === BILAN COMPACT (tient sur demi-page A4) ===
function generateCompactBilanHTML(candidat) {
    const exerciseScores = calculateExerciseScores(candidat.numero);
    const competenceScores = calculateCompetenceScores(candidat.numero);
    const comment = bilansState.corrections.comments ? bilansState.corrections.comments[candidat.numero] : '';
    const nrGrid = generateNRGridHTML(candidat.numero, true);

    // Couleurs selon niveau
    const colors = {
        'TBM': { bg: '#22c55e', light: '#dcfce7', text: '#166534' },
        'MS': { bg: '#3b82f6', light: '#dbeafe', text: '#1e40af' },
        'MF': { bg: '#f59e0b', light: '#fef3c7', text: '#92400e' },
        'MI': { bg: '#ef4444', light: '#fee2e2', text: '#dc2626' }
    };
    const color = colors[candidat.niveau] || colors['MS'];

    // Exercices en ligne compacte
    const exercises = [
        { name: 'Course', emoji: '🏃', max: 6 },
        { name: 'Bonbons', emoji: '🍬', max: 4 },
        { name: 'CO2', emoji: '🌍', max: 3 },
        { name: 'Scratch', emoji: '🐱', max: 4 },
        { name: 'Trajet', emoji: '🚗', max: 3 }
    ];

    const exercisesHTML = exercises.map((ex, i) => {
        const score = exerciseScores[i + 1] || 0;
        return `
            <div style="text-align:center; padding:8px 6px; background:#f8fafc; border-radius:8px; border:1px solid #e2e8f0; min-width:55px;">
                <div style="font-size:14px;">${ex.emoji}</div>
                <div style="font-size:9px; color:#64748b;">${ex.name}</div>
                <div style="font-size:13px; font-weight:700; color:#1e293b;">${score}/${ex.max}</div>
            </div>
        `;
    }).join('');

    // Compétences avec barres de progression
    const compList = ['Chercher', 'Modéliser', 'Calculer', 'Raisonner', 'Communiquer'];
    const competencesHTML = compList.map(comp => {
        const data = competenceScores[comp] || { score: 0, max: 1 };
        const pct = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
        let niveau = 'MI';
        if (pct >= 75) niveau = 'TBM';
        else if (pct >= 50) niveau = 'MS';
        else if (pct >= 25) niveau = 'MF';
        const nColor = colors[niveau];

        return `
            <div style="margin-bottom:6px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:2px;">
                    <span style="font-size:10px; font-weight:500; color:#374151;">${comp}</span>
                    <span style="font-size:9px; font-weight:600; color:${nColor.text};">${pct}%</span>
                </div>
                <div style="height:6px; background:#e5e7eb; border-radius:3px; overflow:hidden;">
                    <div style="height:100%; width:${pct}%; background:${nColor.bg}; border-radius:3px;"></div>
                </div>
            </div>
        `;
    }).join('');

    // Commentaire compact
    const commentHTML = comment ? `
        <div style="margin-top:10px; padding:10px; background:#f8fafc; border-left:3px solid ${color.bg}; border-radius:0 6px 6px 0;">
            <div style="font-size:10px; color:#64748b; font-weight:600; margin-bottom:4px;">💬 Commentaire</div>
            <div style="font-size:11px; color:#334155; font-style:italic;">${comment.substring(0, 200)}${comment.length > 200 ? '...' : ''}</div>
        </div>
    ` : '';

    return `
        <!-- Header compact avec note bien visible -->
        <div style="background: linear-gradient(135deg, ${color.bg}, ${color.bg}dd); color:white; padding:15px 20px; border-radius:10px 10px 0 0;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <div style="font-size:10px; opacity:0.9;">DNB Blanc - Décembre 2025</div>
                    <div style="font-size:18px; font-weight:700;">${candidat.nom.toUpperCase()}&nbsp;${candidat.prenom}</div>
                    <div style="font-size:12px; opacity:0.9;">Classe&nbsp;${candidat.classe}</div>
                </div>
                <div style="text-align:center;">
                    <div style="width:70px; height:70px; background:white; border-radius:50%; display:flex; align-items:center; justify-content:center; box-shadow:0 4px 12px rgba(0,0,0,0.15);">
                        <div>
                            <div style="font-size:24px; font-weight:800; color:${color.bg};">${candidat.note.toFixed(1)}</div>
                            <div style="font-size:10px; color:#666; margin-top:-2px;">/20</div>
                        </div>
                    </div>
                    <div style="font-size:9px; margin-top:6px; font-weight:600;">${getNiveauLabel(candidat.niveau)}</div>
                </div>
            </div>
        </div>

        <!-- Corps -->
        <div style="padding:15px; border:1px solid #e2e8f0; border-top:none; border-radius:0 0 10px 10px;">
            <!-- Exercices en ligne -->
            <div style="display:flex; justify-content:center; gap:8px; margin-bottom:15px;">
                ${exercisesHTML}
            </div>

            <!-- Grille NR + Compétences côte à côte -->
            <div style="display:flex; gap:15px;">
                <!-- Grille NR -->
                <div style="flex:0 0 180px;">
                    ${nrGrid}
                </div>

                <!-- Compétences avec barres -->
                <div style="flex:1;">
                    <div style="font-size:11px; font-weight:600; color:#495057; margin-bottom:8px;">Compétences</div>
                    ${competencesHTML}
                </div>
            </div>

            ${commentHTML}
        </div>

        <!-- Footer mini -->
        <div style="text-align:right; padding:8px 15px; color:#94a3b8; font-size:9px;">
            Généré le ${new Date().toLocaleDateString('fr-FR')}
        </div>
    `;
}

// === RECHERCHE ÉLÈVES ===
function filterStudentsTable() {
    const searchInput = document.getElementById('searchStudents');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    const rows = document.querySelectorAll('#resultsTableBody tr');
    let visibleCount = 0;

    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        const matches = searchTerm === '' || text.includes(searchTerm);
        row.style.display = matches ? '' : 'none';
        if (matches) visibleCount++;
    });

    // Afficher/cacher le message "aucun résultat"
    const noResults = document.getElementById('noResults');
    const tableContainer = document.querySelector('.results-table-container');

    if (visibleCount === 0 && searchTerm !== '') {
        if (noResults) noResults.style.display = 'block';
        if (tableContainer) tableContainer.style.display = 'none';
    } else {
        if (noResults) noResults.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
    }
}

function getNiveauRGB(niveau) {
    const colors = {
        'TBM': [34, 197, 94],
        'MS': [59, 130, 246],
        'MF': [245, 158, 11],
        'MI': [239, 68, 68]
    };
    return colors[niveau] || [0, 0, 0];
}

// === GÉNÉRATION TOUS LES PDF ===
function generateAllIndividualPDF() {
    const candidats = filterByClass(getCorrectedCandidates());

    if (candidats.length === 0) {
        alert('Aucun candidat à exporter');
        return;
    }

    if (!confirm(`Générer ${candidats.length} PDF individuels ?`)) return;

    candidats.forEach((c, index) => {
        setTimeout(() => {
            downloadIndividualPDF(c.numero);
        }, index * 500); // Délai pour éviter surcharge navigateur
    });
}

// === SÉLECTEUR INDIVIDUEL ===
function showIndividualSelector() {
    const candidats = filterByClass(getCorrectedCandidates());
    const container = document.getElementById('studentList');

    container.innerHTML = candidats.map(c => `
        <div class="student-item" onclick="previewIndividualPDF(${c.numero})">
            <div class="student-info">
                <span class="student-name">${c.nom} ${c.prenom}</span>
                <span class="student-class">${c.classe} - N°${c.numero}</span>
            </div>
            <span class="student-note">${c.note.toFixed(1)}/20</span>
        </div>
    `).join('');

    document.getElementById('individualModal').classList.add('active');

    // Recherche
    document.getElementById('searchStudent').value = '';
    document.getElementById('searchStudent').addEventListener('input', filterStudentList);
}

function filterStudentList(e) {
    const search = e.target.value.toLowerCase();
    const items = document.querySelectorAll('.student-item');

    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(search) ? 'flex' : 'none';
    });
}

function closeIndividualModal() {
    document.getElementById('individualModal').classList.remove('active');
}

// === BILAN CLASSE PDF AVEC PDFMAKE ===
async function generateClassPDF() {
    const candidats = filterByClass(getCorrectedCandidates());

    if (candidats.length === 0) {
        alert('Aucun candidat à exporter');
        return;
    }

    const className = bilansState.selectedClass === 'all' ? 'Toutes classes' : bilansState.selectedClass;

    // Calculer les statistiques
    const notes = candidats.map(c => c.note).sort((a, b) => a - b);
    const n = notes.length;
    const moyenne = (notes.reduce((a, b) => a + b, 0) / n).toFixed(2);
    const mediane = n % 2 === 0
        ? ((notes[Math.floor(n/2) - 1] + notes[Math.floor(n/2)]) / 2).toFixed(2)
        : notes[Math.floor(n/2)].toFixed(2);
    const min = Math.min(...notes).toFixed(1);
    const max = Math.max(...notes).toFixed(1);
    const q1 = notes[Math.floor(n * 0.25)].toFixed(2);
    const q3 = notes[Math.floor(n * 0.75)].toFixed(2);

    // Répartition par tranches (sur 20)
    const tranches = [
        { label: '0 à 5', min: 0, max: 5, color: '#dc2626' },
        { label: '5 à 10', min: 5, max: 10, color: '#ea580c' },
        { label: '10 à 15', min: 10, max: 15, color: '#ca8a04' },
        { label: '15 à 20', min: 15, max: 20, color: '#16a34a' }
    ];

    tranches.forEach(t => {
        t.count = notes.filter(note => note >= t.min && note < t.max).length;
        if (t.max === 20) t.count = notes.filter(note => note >= t.min && note <= t.max).length;
        t.pct = Math.round((t.count / n) * 100);
    });

    // Notes par classe
    const classes = [...new Set(candidats.map(c => c.classe))].sort();
    const notesByClass = {};
    classes.forEach(cl => {
        notesByClass[cl] = candidats.filter(c => c.classe === cl)
            .sort((a, b) => b.note - a.note)
            .map(c => ({ nom: c.nom, prenom: c.prenom, note: c.note }));
    });

    // Fonction pour couleur selon note
    const getNoteColor = (note) => {
        if (note >= 15) return '#16a34a';
        if (note >= 10) return '#2563eb';
        if (note >= 5) return '#ea580c';
        return '#dc2626';
    };

    const getNoteFillColor = (note) => {
        if (note >= 15) return '#dcfce7';
        if (note >= 10) return '#dbeafe';
        if (note >= 5) return '#ffedd5';
        return '#fee2e2';
    };

    // Capturer les graphiques du dashboard
    let distributionChartImg = null;
    let masteryChartImg = null;
    let exerciseChartImg = null;

    // Fonction pour valider une image base64
    const isValidImage = (dataUrl) => {
        return dataUrl && dataUrl.length > 100 && dataUrl.startsWith('data:image/png;base64,');
    };

    try {
        const distCanvas = document.getElementById('distributionChartCanvas');
        if (distCanvas) {
            const img = distCanvas.toDataURL('image/png');
            if (isValidImage(img)) distributionChartImg = img;
        }

        const masteryCanvas = document.getElementById('masteryChartCanvas');
        if (masteryCanvas) {
            const img = masteryCanvas.toDataURL('image/png');
            if (isValidImage(img)) masteryChartImg = img;
        }

        const exCanvas = document.getElementById('exerciseChartCanvas');
        if (exCanvas) {
            const img = exCanvas.toDataURL('image/png');
            if (isValidImage(img)) exerciseChartImg = img;
        }
    } catch (e) {
        console.log('Erreur capture graphiques:', e);
    }

    // Calculer les stats par exercice
    const exerciseStats = getExerciseStatsForPDF();

    // === CONSTRUCTION DU DOCUMENT PDFMAKE ===
    const docDefinition = {
        pageSize: 'A4',
        pageMargins: [25, 25, 25, 25],
        defaultStyle: {
            font: 'Roboto',
            fontSize: 9
        },
        content: [
            // === EN-TÊTE ===
            {
                columns: [
                    {
                        width: '*',
                        stack: [
                            { text: 'DNB Blanc - Mathématiques', style: 'mainTitle' },
                            { text: `Bilan ${className} - Décembre 2025`, style: 'subtitle' }
                        ]
                    },
                    {
                        width: 'auto',
                        stack: [
                            { text: `${n} élèves`, style: 'headerStat', alignment: 'right' },
                            { text: `Moyenne: ${moyenne}/20`, style: 'headerStatBig', alignment: 'right' }
                        ]
                    }
                ],
                margin: [0, 0, 0, 15]
            },

            // === TABLEAU RÉPARTITION ===
            {
                table: {
                    widths: ['*', '*', '*', '*', 60],
                    body: [
                        // En-tête avec couleurs
                        [
                            { text: '0 à 5', style: 'tableHeader', fillColor: '#dc2626' },
                            { text: '5 à 10', style: 'tableHeader', fillColor: '#ea580c' },
                            { text: '10 à 15', style: 'tableHeader', fillColor: '#ca8a04' },
                            { text: '15 à 20', style: 'tableHeader', fillColor: '#16a34a' },
                            { text: 'Total', style: 'tableHeader', fillColor: '#374151' }
                        ],
                        // Effectifs
                        [
                            { text: `${tranches[0].count}`, style: 'tableCell', bold: true },
                            { text: `${tranches[1].count}`, style: 'tableCell', bold: true },
                            { text: `${tranches[2].count}`, style: 'tableCell', bold: true },
                            { text: `${tranches[3].count}`, style: 'tableCell', bold: true },
                            { text: `${n}`, style: 'tableCell', bold: true, fillColor: '#f3f4f6' }
                        ],
                        // Pourcentages
                        [
                            { text: `${tranches[0].pct}%`, style: 'tableCellSmall', color: '#dc2626' },
                            { text: `${tranches[1].pct}%`, style: 'tableCellSmall', color: '#ea580c' },
                            { text: `${tranches[2].pct}%`, style: 'tableCellSmall', color: '#ca8a04' },
                            { text: `${tranches[3].pct}%`, style: 'tableCellSmall', color: '#16a34a' },
                            { text: '100%', style: 'tableCellSmall', color: '#374151' }
                        ]
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#d1d5db',
                    vLineColor: () => '#d1d5db'
                },
                margin: [0, 0, 0, 15]
            },

            // === STATISTIQUES ===
            {
                columns: [
                    // Colonne gauche: Stats
                    {
                        width: '55%',
                        stack: [
                            { text: 'Statistiques', style: 'sectionTitle', margin: [0, 0, 0, 8] },
                            {
                                table: {
                                    widths: [80, 50, 80, 50],
                                    body: [
                                        [
                                            { text: 'Moyenne', fillColor: '#fef3c7', bold: true, margin: [5, 4] },
                                            { text: moyenne, color: '#1e40af', bold: true, margin: [5, 4] },
                                            { text: 'Médiane', fillColor: '#fef3c7', bold: true, margin: [5, 4] },
                                            { text: mediane, color: '#1e40af', bold: true, margin: [5, 4] }
                                        ],
                                        [
                                            { text: 'Minimum', fillColor: '#dcfce7', bold: true, margin: [5, 4] },
                                            { text: min, margin: [5, 4] },
                                            { text: 'Maximum', fillColor: '#fee2e2', bold: true, margin: [5, 4] },
                                            { text: max, margin: [5, 4] }
                                        ],
                                        [
                                            { text: 'Quartile 1', fillColor: '#ffedd5', bold: true, margin: [5, 4] },
                                            { text: q1, margin: [5, 4] },
                                            { text: 'Quartile 3', fillColor: '#ffedd5', bold: true, margin: [5, 4] },
                                            { text: q3, margin: [5, 4] }
                                        ]
                                    ]
                                },
                                layout: {
                                    hLineWidth: () => 1,
                                    vLineWidth: () => 1,
                                    hLineColor: () => '#e5e7eb',
                                    vLineColor: () => '#e5e7eb'
                                }
                            }
                        ]
                    },
                    // Colonne droite: Niveaux de maîtrise
                    {
                        width: '45%',
                        stack: [
                            { text: 'Niveaux de maîtrise', style: 'sectionTitle', margin: [10, 0, 0, 8] },
                            {
                                table: {
                                    widths: ['*', 40, 50],
                                    body: [
                                        [
                                            { text: 'TBM (≥15)', fillColor: '#dcfce7', color: '#166534', bold: true, margin: [5, 3] },
                                            { text: candidats.filter(c => c.note >= 15).length, alignment: 'center', margin: [5, 3] },
                                            { text: `${Math.round(candidats.filter(c => c.note >= 15).length / n * 100)}%`, alignment: 'center', color: '#166534', margin: [5, 3] }
                                        ],
                                        [
                                            { text: 'MS (≥10)', fillColor: '#dbeafe', color: '#1e40af', bold: true, margin: [5, 3] },
                                            { text: candidats.filter(c => c.note >= 10 && c.note < 15).length, alignment: 'center', margin: [5, 3] },
                                            { text: `${Math.round(candidats.filter(c => c.note >= 10 && c.note < 15).length / n * 100)}%`, alignment: 'center', color: '#1e40af', margin: [5, 3] }
                                        ],
                                        [
                                            { text: 'MF (≥5)', fillColor: '#ffedd5', color: '#c2410c', bold: true, margin: [5, 3] },
                                            { text: candidats.filter(c => c.note >= 5 && c.note < 10).length, alignment: 'center', margin: [5, 3] },
                                            { text: `${Math.round(candidats.filter(c => c.note >= 5 && c.note < 10).length / n * 100)}%`, alignment: 'center', color: '#c2410c', margin: [5, 3] }
                                        ],
                                        [
                                            { text: 'MI (<5)', fillColor: '#fee2e2', color: '#dc2626', bold: true, margin: [5, 3] },
                                            { text: candidats.filter(c => c.note < 5).length, alignment: 'center', margin: [5, 3] },
                                            { text: `${Math.round(candidats.filter(c => c.note < 5).length / n * 100)}%`, alignment: 'center', color: '#dc2626', margin: [5, 3] }
                                        ]
                                    ]
                                },
                                layout: {
                                    hLineWidth: () => 1,
                                    vLineWidth: () => 1,
                                    hLineColor: () => '#e5e7eb',
                                    vLineColor: () => '#e5e7eb'
                                },
                                margin: [10, 0, 0, 0]
                            }
                        ]
                    }
                ],
                margin: [0, 0, 0, 15]
            },

            // === DÉTAIL PAR EXERCICE ===
            { text: 'Performance par exercice', style: 'sectionTitle', margin: [0, 5, 0, 8] },
            {
                table: {
                    widths: ['*', '*', '*', '*', '*'],
                    body: [
                        // En-têtes exercices
                        exerciseStats.map(ex => ({
                            text: `${ex.icon} ${ex.name}`,
                            style: 'tableHeader',
                            fillColor: ex.color,
                            alignment: 'center'
                        })),
                        // Scores moyens
                        exerciseStats.map(ex => ({
                            text: `${ex.mean.toFixed(1)}/${ex.max}`,
                            alignment: 'center',
                            bold: true,
                            fontSize: 11,
                            margin: [0, 5]
                        })),
                        // Taux de réussite
                        exerciseStats.map(ex => ({
                            text: `${ex.pct}%`,
                            alignment: 'center',
                            color: ex.pct >= 60 ? '#16a34a' : ex.pct >= 40 ? '#ca8a04' : '#dc2626',
                            fontSize: 10,
                            margin: [0, 3]
                        }))
                    ]
                },
                layout: {
                    hLineWidth: () => 1,
                    vLineWidth: () => 1,
                    hLineColor: () => '#d1d5db',
                    vLineColor: () => '#d1d5db'
                },
                margin: [0, 0, 0, 15]
            },

            // === NOTES PAR CLASSE ===
            { text: 'Notes par classe', style: 'sectionTitle', margin: [0, 5, 0, 8] },
            buildClassNotesTable(classes, notesByClass, getNoteColor, getNoteFillColor),

            // === PIED DE PAGE ===
            {
                text: `Généré le ${new Date().toLocaleDateString('fr-FR')} - DNB Blanc 25-26`,
                style: 'footer',
                margin: [0, 15, 0, 0]
            }
        ],
        styles: {
            mainTitle: {
                fontSize: 18,
                bold: true,
                color: '#1e40af'
            },
            subtitle: {
                fontSize: 12,
                color: '#374151',
                margin: [0, 3, 0, 0]
            },
            headerStat: {
                fontSize: 10,
                color: '#6b7280'
            },
            headerStatBig: {
                fontSize: 14,
                bold: true,
                color: '#1e40af'
            },
            sectionTitle: {
                fontSize: 11,
                bold: true,
                color: '#1f2937'
            },
            tableHeader: {
                fontSize: 9,
                bold: true,
                color: '#ffffff',
                alignment: 'center',
                margin: [0, 6]
            },
            tableCell: {
                fontSize: 12,
                alignment: 'center',
                margin: [0, 6]
            },
            tableCellSmall: {
                fontSize: 9,
                alignment: 'center',
                margin: [0, 3]
            },
            footer: {
                fontSize: 8,
                color: '#9ca3af',
                alignment: 'center'
            }
        }
    };

    // === PAGE 2: GRAPHIQUES (si disponibles) ===
    if (distributionChartImg || masteryChartImg || exerciseChartImg) {
        docDefinition.content.push({ text: '', pageBreak: 'before' });
        docDefinition.content.push({
            text: 'Analyse graphique détaillée',
            style: 'mainTitle',
            alignment: 'center',
            margin: [0, 0, 0, 20]
        });

        const chartsRow = [];

        if (distributionChartImg) {
            chartsRow.push({
                stack: [
                    { text: 'Répartition des notes', style: 'sectionTitle', alignment: 'center', margin: [0, 0, 0, 5] },
                    { image: distributionChartImg, width: 240, alignment: 'center' }
                ],
                width: '50%'
            });
        }

        if (masteryChartImg) {
            chartsRow.push({
                stack: [
                    { text: 'Niveaux de maîtrise', style: 'sectionTitle', alignment: 'center', margin: [0, 0, 0, 5] },
                    { image: masteryChartImg, width: 240, alignment: 'center' }
                ],
                width: '50%'
            });
        }

        if (chartsRow.length > 0) {
            docDefinition.content.push({
                columns: chartsRow,
                margin: [0, 0, 0, 20]
            });
        }

        if (exerciseChartImg) {
            docDefinition.content.push({
                stack: [
                    { text: 'Performance par exercice', style: 'sectionTitle', alignment: 'center', margin: [0, 0, 0, 5] },
                    { image: exerciseChartImg, width: 450, alignment: 'center' }
                ],
                margin: [0, 0, 0, 20]
            });
        }
    }

    // Générer le PDF
    pdfMake.createPdf(docDefinition).download(`Bilan_${className.replace(/\s/g, '_')}.pdf`);
}

// Fonction helper pour construire le tableau des notes par classe
function buildClassNotesTable(classes, notesByClass, getNoteColor, getNoteFillColor) {
    const classColors = ['#dc2626', '#ea580c', '#16a34a', '#2563eb', '#7c3aed'];
    const maxRows = Math.max(...classes.map(cl => notesByClass[cl].length));

    // En-têtes
    const headerRow = classes.map((cl, i) => ({
        text: cl,
        style: 'tableHeader',
        fillColor: classColors[i % classColors.length],
        alignment: 'center'
    }));

    // Lignes de données - uniquement les notes
    const dataRows = [];
    for (let i = 0; i < Math.min(maxRows, 35); i++) { // Limiter à 35 lignes
        const row = classes.map(cl => {
            const student = notesByClass[cl][i];
            if (!student) return { text: '', margin: [2, 3] };

            return {
                text: student.note.toFixed(1),
                fontSize: 9,
                bold: true,
                fillColor: getNoteFillColor(student.note),
                color: getNoteColor(student.note),
                alignment: 'center',
                margin: [2, 3]
            };
        });
        dataRows.push(row);
    }

    return {
        table: {
            widths: classes.map(() => '*'),
            body: [headerRow, ...dataRows]
        },
        layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#e5e7eb',
            vLineColor: () => '#e5e7eb'
        }
    };
}

// Fonction pour obtenir les stats par exercice pour le PDF
function getExerciseStatsForPDF() {
    const candidats = filterByClass(getCorrectedCandidates());
    const exercises = [
        { num: 1, name: 'Course', icon: '🏃', max: 6, color: '#16a34a' },
        { num: 2, name: 'Bonbons', icon: '🍬', max: 4, color: '#7c3aed' },
        { num: 3, name: 'CO2', icon: '🌍', max: 3, color: '#2563eb' },
        { num: 4, name: 'Scratch', icon: '🐱', max: 4, color: '#ca8a04' },
        { num: 5, name: 'Trajet', icon: '🚗', max: 3, color: '#dc2626' }
    ];

    return exercises.map(ex => {
        let totalScore = 0;
        let count = 0;
        candidats.forEach(c => {
            const scores = calculateExerciseScores(c.numero);
            if (scores[ex.num] !== undefined) {
                totalScore += scores[ex.num];
                count++;
            }
        });
        const mean = count > 0 ? totalScore / count : 0;
        const pct = Math.round((mean / ex.max) * 100);

        return { ...ex, mean, pct };
    });
}

// Fonction pour générer les cartes détail exercice
function getExerciseDetailCards() {
    const candidats = filterByClass(getCorrectedCandidates());
    const exercises = [
        { num: 1, name: 'Course', icon: '🏃', max: 6, color: '#22c55e' },
        { num: 2, name: 'Bonbons', icon: '🍬', max: 4, color: '#8b5cf6' },
        { num: 3, name: 'CO2', icon: '🌍', max: 3, color: '#3b82f6' },
        { num: 4, name: 'Scratch', icon: '🐱', max: 4, color: '#f59e0b' },
        { num: 5, name: 'Trajet', icon: '🚗', max: 3, color: '#ef4444' }
    ];

    return exercises.map(ex => {
        let totalScore = 0;
        let count = 0;
        candidats.forEach(c => {
            const scores = calculateExerciseScores(c.numero);
            if (scores[ex.num] !== undefined) {
                totalScore += scores[ex.num];
                count++;
            }
        });
        const mean = count > 0 ? totalScore / count : 0;
        const pct = Math.round((mean / ex.max) * 100);

        return `
            <div style="flex:1; background:white; border-radius:6px; padding:8px; text-align:center; border:1px solid #e5e7eb;">
                <div style="font-size:16px;">${ex.icon}</div>
                <div style="font-size:9px; color:#6b7280;">${ex.name}</div>
                <div style="font-size:12px; font-weight:bold; color:#1f2937;">${mean.toFixed(1)}/${ex.max}</div>
                <div style="height:3px; background:#e5e7eb; border-radius:2px; margin:4px 0;">
                    <div style="height:100%; width:${pct}%; background:${ex.color}; border-radius:2px;"></div>
                </div>
                <div style="font-size:8px; color:#9ca3af;">${pct}%</div>
            </div>
        `;
    }).join('');
}

// === EXPORT EXCEL CLASSE ===
function exportClassExcel() {
    const candidats = filterByClass(getCorrectedCandidates());

    if (candidats.length === 0) {
        alert('Aucun candidat à exporter');
        return;
    }

    const className = bilansState.selectedClass === 'all' ? 'Toutes_classes' : bilansState.selectedClass;

    // Préparer les données
    const data = [
        ['DNB Blanc - Décembre 2025', '', '', '', ''],
        [`Classe: ${className}`, '', '', '', ''],
        ['', '', '', '', ''],
        ['N°', 'Nom', 'Prénom', 'Classe', 'Note /20', 'Niveau']
    ];

    candidats.sort((a, b) => a.nom.localeCompare(b.nom));
    candidats.forEach(c => {
        data.push([c.numero, c.nom, c.prenom, c.classe, c.note, c.niveau]);
    });

    // Statistiques
    const notes = candidats.map(c => c.note);
    const moyenne = (notes.reduce((a, b) => a + b, 0) / notes.length).toFixed(2);

    data.push(['', '', '', '', '', '']);
    data.push(['Statistiques', '', '', '', '', '']);
    data.push(['Effectif', candidats.length, '', '', '', '']);
    data.push(['Moyenne', moyenne, '', '', '', '']);
    data.push(['TBM', candidats.filter(c => c.niveau === 'TBM').length, '', '', '', '']);
    data.push(['MS', candidats.filter(c => c.niveau === 'MS').length, '', '', '', '']);
    data.push(['MF', candidats.filter(c => c.niveau === 'MF').length, '', '', '', '']);
    data.push(['MI', candidats.filter(c => c.niveau === 'MI').length, '', '', '', '']);

    // Créer le workbook
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Bilan');

    // Télécharger
    XLSX.writeFile(wb, `Bilan_${className}.xlsx`);
}

// === TOGGLE VIEW ===
function toggleResultsView() {
    // Pour une future fonctionnalité de vue alternative (grille, etc.)
    console.log('Toggle view');
}

// === GÉNÉRATION GRILLE NR POUR PDF ===
function generateNRGridHTML(numero, forPDF = false) {
    const quickButtons = bilansState.corrections.quickButtons || {};
    const scores = bilansState.corrections.scores || {};

    // Définition des exercices (correspondance avec les clés dans les données)
    const exercisesDef = [
        { key: '1', name: 'Course', icon: '🏃', max: 6 },
        { key: '2', name: 'Bonbons', icon: '🍬', max: 4 },
        { key: '3', name: 'CO2', icon: '🌍', max: 3 },
        { key: '4', name: 'Scratch', icon: '🐱', max: 4 },
        { key: '5', name: 'Trajet', icon: '🚗', max: 3 }
    ];

    // Nombre de questions par exercice
    const questionsPerExercise = {
        '1': 3, // Course: 3 questions (q0, q1, q2)
        '2': 5, // Bonbons: 5 questions
        '3': 2, // CO2: 2 questions
        '4': 4, // Scratch: 4 questions
        '5': 2  // Trajet: 2 questions
    };

    let totalAnswered = 0;
    let totalQuestions = 0;

    // Style inline pour PDF
    const containerStyle = forPDF
        ? 'margin-top:15px; padding:12px; background:#f8f9fa; border-radius:10px; border:1px solid #e9ecef;'
        : '';
    const titleStyle = forPDF
        ? 'font-size:11px; font-weight:600; color:#495057; margin-bottom:10px; text-align:center; white-space:nowrap;'
        : '';
    const exerciseRowStyle = forPDF
        ? 'display:flex; align-items:center; gap:8px; margin-bottom:6px; padding:4px 8px; background:white; border-radius:6px;'
        : '';
    const iconStyle = forPDF
        ? 'font-size:14px; width:20px; text-align:center;'
        : '';
    const nameStyle = forPDF
        ? 'font-size:10px; font-weight:500; color:#495057; width:60px;'
        : '';
    const questionsContainerStyle = forPDF
        ? 'display:flex; gap:3px; flex:1;'
        : '';
    const questionBoxStyle = forPDF
        ? 'width:14px; height:14px; border-radius:3px; background:#dee2e6;'
        : '';
    const answeredStyle = forPDF
        ? 'width:14px; height:14px; border-radius:3px; background:#28a745;'
        : '';
    const nrStyle = forPDF
        ? 'width:14px; height:14px; border-radius:3px; background:#adb5bd;'
        : '';
    const countStyle = forPDF
        ? 'font-size:10px; font-weight:600; color:#6c757d; min-width:30px; text-align:right;'
        : '';
    const countAllStyle = forPDF
        ? 'font-size:10px; font-weight:600; color:#28a745; min-width:30px; text-align:right;'
        : '';

    let exercisesHTML = '';

    exercisesDef.forEach(ex => {
        const questionCount = questionsPerExercise[ex.key] || 0;
        let exerciseAnswered = 0;
        let questionsHTML = '';

        for (let qIndex = 0; qIndex < questionCount; qIndex++) {
            const questionKey = `q${qIndex}`;

            // Vérifier l'état de la question
            const quickState = quickButtons[numero]?.[ex.key]?.[questionKey];
            const hasScores = scores[numero]?.[ex.key]?.[questionKey];

            // Une question est traitée si elle a un quick state OU des scores
            const isAnswered = quickState || (hasScores && Object.keys(hasScores).length > 0);
            const isNR = quickState === 'nr';

            totalQuestions++;

            let style = questionBoxStyle;
            if (isNR) {
                style = nrStyle;
            } else if (isAnswered) {
                style = answeredStyle;
                exerciseAnswered++;
                totalAnswered++;
            }

            questionsHTML += `<div style="${style}" title="Q${qIndex + 1}"></div>`;
        }

        const allAnswered = exerciseAnswered === questionCount;
        const currentCountStyle = allAnswered ? countAllStyle : countStyle;

        exercisesHTML += `
            <div style="${exerciseRowStyle}">
                <span style="${iconStyle}">${ex.icon}</span>
                <span style="${nameStyle}">${ex.name}</span>
                <div style="${questionsContainerStyle}">
                    ${questionsHTML}
                </div>
                <span style="${currentCountStyle}">${exerciseAnswered}/${questionCount}</span>
            </div>
        `;
    });

    // Total
    const allDone = totalAnswered === totalQuestions;
    const totalStyle = forPDF
        ? 'margin-top:10px; padding-top:10px; border-top:1px solid #e9ecef; display:flex; justify-content:space-between; font-size:11px; font-weight:600;'
        : '';
    const totalValueStyle = forPDF
        ? `color:${allDone ? '#28a745' : '#dc3545'};`
        : '';

    return `
        <div style="${containerStyle}">
            <div style="${titleStyle}">Questions&nbsp;traitées</div>
            ${exercisesHTML}
            <div style="${totalStyle}">
                <span style="color:#495057;">Total</span>
                <span style="${totalValueStyle}">${totalAnswered}/${totalQuestions}</span>
            </div>
        </div>
    `;
}

// === GÉNÉRATION PDF GROUPÉS PAR CLASSE (2 par page) ===
async function generateClassPDFGrouped() {
    const candidats = filterByClass(getCorrectedCandidates());

    if (candidats.length === 0) {
        alert('Aucun candidat à exporter');
        return;
    }

    // Trier par classe puis par nom
    candidats.sort((a, b) => {
        if (a.classe !== b.classe) return a.classe.localeCompare(b.classe);
        return a.nom.localeCompare(b.nom);
    });

    const className = bilansState.selectedClass === 'all' ? 'Toutes_classes' : bilansState.selectedClass;

    // Créer les paires de candidats
    const pairs = [];
    for (let i = 0; i < candidats.length; i += 2) {
        pairs.push({
            c1: candidats[i],
            c2: candidats[i + 1] || null
        });
    }

    // Initialiser jsPDF
    const { jsPDF } = window.jspdf || {};
    if (!jsPDF) {
        // Fallback: télécharger les bilans un par un
        alert(`Génération de ${candidats.length} PDF individuels...`);
        for (let i = 0; i < candidats.length; i++) {
            setTimeout(() => downloadIndividualPDF(candidats[i].numero), i * 800);
        }
        return;
    }

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = 210;
    const pageHeight = 297;

    // Afficher un message de progression
    const progressDiv = document.createElement('div');
    progressDiv.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: white; padding: 30px 50px; border-radius: 12px; box-shadow: 0 10px 40px rgba(0,0,0,0.3); z-index: 10000; text-align: center;';
    progressDiv.innerHTML = '<div style="font-size: 18px; margin-bottom: 10px;">Génération du PDF...</div><div id="pdfProgress">0 / ' + pairs.length + ' pages</div>';
    document.body.appendChild(progressDiv);

    // Générer chaque page
    for (let i = 0; i < pairs.length; i++) {
        const { c1, c2 } = pairs[i];

        // Mettre à jour la progression
        document.getElementById('pdfProgress').textContent = `${i + 1} / ${pairs.length} pages`;

        // Créer le conteneur pour cette page
        const container = document.createElement('div');
        container.style.cssText = 'position: fixed; top: 0; left: 0; width: 210mm; background: white; z-index: 9999; padding: 8mm; box-sizing: border-box;';

        container.innerHTML = `
            <div style="font-family: 'Segoe UI', system-ui, sans-serif;">
                <div style="margin-bottom: 8mm; padding-bottom: 8mm; border-bottom: 2px dashed #ddd;">
                    ${generateCompactBilanHTML(c1)}
                </div>
                ${c2 ? generateCompactBilanHTML(c2) : '<div style="height: 100px;"></div>'}
            </div>
        `;

        document.body.appendChild(container);

        // Attendre le rendu
        await new Promise(r => setTimeout(r, 150));

        // Capturer en canvas
        try {
            const canvas = await html2canvas(container, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Ajouter au PDF
            if (i > 0) pdf.addPage();

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);

        } catch (err) {
            console.error('Erreur page ' + i, err);
        }

        // Nettoyer
        document.body.removeChild(container);
    }

    // Sauvegarder le PDF
    pdf.save(`Bilans_${className}.pdf`);

    // Retirer le message de progression
    document.body.removeChild(progressDiv);
    console.log('PDF groupé généré avec succès!');
}

function generateMiniPDFBilan(candidat) {
    const exerciseScores = calculateExerciseScores(candidat.numero);
    const competenceScores = calculateCompetenceScores(candidat.numero);
    const comment = bilansState.corrections.comments ? bilansState.corrections.comments[candidat.numero] : '';
    const nrGrid = generateNRGridHTMLMini(candidat.numero);

    // Couleurs selon niveau
    const colors = {
        'TBM': { bg: '#22c55e', light: '#dcfce7', text: '#166534' },
        'MS': { bg: '#3b82f6', light: '#dbeafe', text: '#1e40af' },
        'MF': { bg: '#f59e0b', light: '#fef3c7', text: '#92400e' },
        'MI': { bg: '#ef4444', light: '#fee2e2', text: '#dc2626' }
    };
    const color = colors[candidat.niveau] || colors['MS'];

    // Exercices en ligne très compacte
    const exercises = [
        { name: 'Crs', emoji: '🏃', max: 6 },
        { name: 'Bon', emoji: '🍬', max: 4 },
        { name: 'CO2', emoji: '🌍', max: 3 },
        { name: 'Scr', emoji: '🐱', max: 4 },
        { name: 'Trj', emoji: '🚗', max: 3 }
    ];

    const exercisesHTML = exercises.map((ex, i) => {
        const score = exerciseScores[i + 1] || 0;
        return `<span style="display:inline-block; text-align:center; padding:3px 6px; background:#f8fafc; border-radius:4px; border:1px solid #e2e8f0; font-size:9px;">${ex.emoji} ${score}/${ex.max}</span>`;
    }).join(' ');

    // Compétences ultra-compactes (une ligne)
    const compList = ['Che', 'Mod', 'Cal', 'Rai', 'Com'];
    const compFull = ['Chercher', 'Modéliser', 'Calculer', 'Raisonner', 'Communiquer'];
    const competencesHTML = compList.map((comp, i) => {
        const data = competenceScores[compFull[i]] || { score: 0, max: 1 };
        const pct = data.max > 0 ? Math.round((data.score / data.max) * 100) : 0;
        let niveau = 'MI';
        if (pct >= 75) niveau = 'TBM';
        else if (pct >= 50) niveau = 'MS';
        else if (pct >= 25) niveau = 'MF';
        const nColor = colors[niveau];
        return `<span style="display:inline-block; background:${nColor.light}; color:${nColor.text}; padding:2px 5px; border-radius:4px; font-size:8px; font-weight:600;" title="${compFull[i]}">${comp}</span>`;
    }).join(' ');

    // Commentaire mini
    const commentHTML = comment ? `
        <div style="margin-top:6px; padding:5px 8px; background:#f8fafc; border-left:2px solid ${color.bg}; font-size:8px; color:#334155; font-style:italic;">
            ${comment.substring(0, 80)}${comment.length > 80 ? '...' : ''}
        </div>
    ` : '';

    return `
        <div style="font-family:'Segoe UI',system-ui,sans-serif; height:100%; display:flex; flex-direction:column; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden;">
            <!-- Header mini avec score intégré -->
            <div style="background: linear-gradient(135deg, ${color.bg}, ${color.bg}dd); color:white; padding:10px 15px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <div style="font-size:8px; opacity:0.8;">DNB Blanc - Déc. 2025</div>
                        <div style="font-size:14px; font-weight:700;">${candidat.nom.toUpperCase()} ${candidat.prenom}</div>
                        <div style="font-size:10px; opacity:0.9;">${candidat.classe}</div>
                    </div>
                    <div style="text-align:center; background:rgba(255,255,255,0.2); padding:8px 12px; border-radius:8px;">
                        <div style="font-size:20px; font-weight:700;">${candidat.note.toFixed(1)}<span style="font-size:10px;">/20</span></div>
                        <div style="font-size:8px; opacity:0.9;">${candidat.niveau}</div>
                    </div>
                </div>
            </div>

            <!-- Corps compact -->
            <div style="flex:1; padding:8px 12px;">
                <!-- Exercices -->
                <div style="margin-bottom:8px; text-align:center;">
                    ${exercisesHTML}
                </div>

                <!-- Grille NR + Compétences -->
                <div style="display:flex; gap:10px; align-items:flex-start;">
                    <div style="flex:0 0 auto;">${nrGrid}</div>
                    <div style="flex:1;">
                        <div style="font-size:8px; color:#666; margin-bottom:4px;">Compétences:</div>
                        <div>${competencesHTML}</div>
                    </div>
                </div>

                ${commentHTML}
            </div>
        </div>
    `;
}

// Grille NR version mini pour PDF groupés
function generateNRGridHTMLMini(numero) {
    const quickButtons = bilansState.corrections.quickButtons || {};
    const scores = bilansState.corrections.scores || {};

    const exercisesDef = [
        { key: '1', icon: '🏃' },
        { key: '2', icon: '🍬' },
        { key: '3', icon: '🌍' },
        { key: '4', icon: '🐱' },
        { key: '5', icon: '🚗' }
    ];

    const questionsPerExercise = { '1': 3, '2': 5, '3': 2, '4': 4, '5': 2 };

    let totalAnswered = 0;
    let totalQuestions = 0;
    let html = '';

    exercisesDef.forEach(ex => {
        const questionCount = questionsPerExercise[ex.key] || 0;
        let exerciseAnswered = 0;
        let questionsHTML = '';

        for (let qIndex = 0; qIndex < questionCount; qIndex++) {
            const questionKey = `q${qIndex}`;
            const quickState = quickButtons[numero]?.[ex.key]?.[questionKey];
            const hasScores = scores[numero]?.[ex.key]?.[questionKey];
            const isAnswered = quickState || (hasScores && Object.keys(hasScores).length > 0);
            const isNR = quickState === 'nr';

            totalQuestions++;
            let bgColor = '#dee2e6';
            if (isNR) {
                bgColor = '#adb5bd';
            } else if (isAnswered) {
                bgColor = '#28a745';
                exerciseAnswered++;
                totalAnswered++;
            }
            questionsHTML += `<span style="display:inline-block; width:10px; height:10px; background:${bgColor}; border-radius:2px; margin:1px;"></span>`;
        }

        html += `<div style="display:flex; align-items:center; gap:4px; margin-bottom:3px;">
            <span style="font-size:10px;">${ex.icon}</span>
            <span>${questionsHTML}</span>
            <span style="font-size:8px; color:#666;">${exerciseAnswered}/${questionCount}</span>
        </div>`;
    });

    const allDone = totalAnswered === totalQuestions;
    return `
        <div style="background:#f8f9fa; padding:6px 8px; border-radius:6px; border:1px solid #e9ecef;">
            <div style="font-size:8px; font-weight:600; color:#495057; margin-bottom:4px;">Questions</div>
            ${html}
            <div style="border-top:1px solid #e9ecef; margin-top:4px; padding-top:4px; font-size:9px; font-weight:600; color:${allDone ? '#28a745' : '#dc3545'};">
                Total: ${totalAnswered}/${totalQuestions}
            </div>
        </div>
    `;
}
