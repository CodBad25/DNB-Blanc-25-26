// ============================================================================
// GESTIONNAIRE DE PACK SUJET - DNB BLANC 25-26
// ============================================================================

// Ouvrir la modale d'export
function openExportPackModal() {
    const modal = document.getElementById('exportPackModal');
    modal.style.display = 'flex';

    // Générer le récapitulatif
    generatePackSummary();

    // Générer l'URL de partage
    generateShareUrl();
}

// Fermer la modale d'export
function closeExportPackModal() {
    document.getElementById('exportPackModal').style.display = 'none';
}

// Générer le récapitulatif du pack
function generatePackSummary() {
    const summaryDiv = document.getElementById('packSummary');

    // Compter les exercices
    const exerciseCount = Object.keys(exercisesData || {}).length;

    // Calculer le total des points
    let totalPoints = 0;
    let totalQuestions = 0;
    for (const exNum in exercisesData) {
        const ex = exercisesData[exNum];
        totalQuestions += (ex.questions || []).length;
        for (const q of (ex.questions || [])) {
            totalPoints += q.points || 0;
        }
    }

    summaryDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div><strong>Exercices :</strong> ${exerciseCount}</div>
            <div><strong>Questions :</strong> ${totalQuestions}</div>
            <div><strong>Total points :</strong> ${totalPoints}</div>
            <div><strong>Barème sur :</strong> 20 points</div>
        </div>
    `;
}

// Créer le pack de données
function createPackData() {
    const packName = document.getElementById('packSubjectName')?.value || 'DNB Blanc';

    return {
        version: '1.0',
        type: 'dnb-subject-pack',
        name: packName,
        createdAt: new Date().toISOString(),
        exercises: exercisesData,
        selectedExercises: appState.selectedExercises || [],
        baremeConfig: appState.baremeConfig || {},
        automatismes: appState.selectedAutomatismes || [],
        parsedAutomatismes: appState.parsedAutomatismes || {}
    };
}

// Télécharger le pack en JSON
function downloadPackJSON() {
    const packData = createPackData();
    const packName = packData.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `pack_${packName}_${new Date().toISOString().split('T')[0]}.json`;

    const blob = new Blob([JSON.stringify(packData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log('📦 Pack sujet téléchargé:', filename);
}

// Générer l'URL de partage
function generateShareUrl() {
    const packData = createPackData();
    const urlInput = document.getElementById('packShareUrl');

    try {
        // Encoder en base64
        const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(packData))));

        // Vérifier la taille (limite URL ~2000 caractères)
        if (encoded.length > 8000) {
            urlInput.value = 'Pack trop volumineux pour URL - utilisez le fichier JSON';
            urlInput.style.color = '#dc3545';
            return;
        }

        // Construire l'URL
        const baseUrl = window.location.origin + window.location.pathname.replace('app.html', '');
        const shareUrl = `${baseUrl}index.html?pack=${encoded}`;

        urlInput.value = shareUrl;
        urlInput.style.color = '#2c3e50';
    } catch (e) {
        console.error('Erreur génération URL:', e);
        urlInput.value = 'Erreur - utilisez le fichier JSON';
        urlInput.style.color = '#dc3545';
    }
}

// Copier l'URL de partage
function copyPackUrl() {
    const urlInput = document.getElementById('packShareUrl');
    urlInput.select();
    document.execCommand('copy');

    // Feedback visuel
    const btn = event.target;
    const originalText = btn.textContent;
    btn.textContent = 'Copié !';
    btn.style.background = '#28a745';

    setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '#1565c0';
    }, 2000);
}

// === CHARGEMENT DU PACK (MODE CORRECTION) ===

// Vérifier si on est en mode correction
function checkCorrectionMode() {
    const urlParams = new URLSearchParams(window.location.search);
    const isCorrectionMode = urlParams.get('mode') === 'correction';
    const hasPack = localStorage.getItem('dnb_subject_pack');

    if (isCorrectionMode && hasPack) {
        console.log('📦 Mode correction détecté - chargement du pack');
        loadPackAndShowRecap();
        return true;
    }
    return false;
}

// Charger le pack et afficher le récapitulatif
function loadPackAndShowRecap() {
    try {
        const packData = JSON.parse(localStorage.getItem('dnb_subject_pack'));

        if (!packData || packData.type !== 'dnb-subject-pack') {
            throw new Error('Pack invalide');
        }

        // Afficher le récapitulatif
        showPackRecapModal(packData);

    } catch (e) {
        console.error('Erreur chargement pack:', e);
        alert('Erreur lors du chargement du pack sujet');
        localStorage.removeItem('dnb_subject_pack');
        localStorage.removeItem('dnb_correction_mode');
        window.location.href = 'index.html';
    }
}

// Afficher la modale de récapitulatif
function showPackRecapModal(packData) {
    const modal = document.getElementById('packRecapModal');

    // Titre
    document.getElementById('packRecapTitle').textContent = packData.name || 'Sujet sans nom';

    // Infos générales
    const infoDiv = document.getElementById('packRecapInfo');
    const exerciseCount = Object.keys(packData.exercises || {}).length;
    let totalQuestions = 0;
    let totalPoints = 0;

    for (const exNum in packData.exercises) {
        const ex = packData.exercises[exNum];
        totalQuestions += (ex.questions || []).length;
        for (const q of (ex.questions || [])) {
            totalPoints += q.points || 0;
        }
    }

    infoDiv.innerHTML = `
        <div><strong>📅 Créé le :</strong> ${new Date(packData.createdAt).toLocaleDateString('fr-FR')}</div>
        <div><strong>📚 Exercices :</strong> ${exerciseCount}</div>
        <div><strong>❓ Questions :</strong> ${totalQuestions}</div>
        <div><strong>🎯 Total points :</strong> ${totalPoints}</div>
    `;

    // Liste des exercices
    const exercisesDiv = document.getElementById('packRecapExercises');
    exercisesDiv.innerHTML = '';

    for (const exNum in packData.exercises) {
        const ex = packData.exercises[exNum];
        const exDiv = document.createElement('div');
        exDiv.style.cssText = 'background: #f8f9fa; padding: 12px; border-radius: 8px; border-left: 4px solid #667eea;';
        exDiv.innerHTML = `
            <div style="font-weight: 600; color: #2c3e50;">Exercice ${exNum}: ${ex.title || 'Sans titre'}</div>
            <div style="font-size: 0.9em; color: #666; margin-top: 4px;">
                ${(ex.questions || []).length} questions - ${ex.theme || ''}
            </div>
        `;
        exercisesDiv.appendChild(exDiv);
    }

    // Stocker les données du pack pour utilisation ultérieure
    window.loadedPackData = packData;

    // Afficher la modale
    modal.style.display = 'flex';
}

// Fermer la modale de récapitulatif
function closePackRecapModal() {
    document.getElementById('packRecapModal').style.display = 'none';
}

// Démarrer la correction depuis le pack
function startCorrectionFromPack() {
    const packData = window.loadedPackData;

    if (!packData) {
        alert('Erreur: données du pack non disponibles');
        return;
    }

    // Charger les données dans l'application
    exercisesData = packData.exercises;
    appState.selectedExercises = packData.selectedExercises || [];
    appState.baremeConfig = packData.baremeConfig || {};
    appState.selectedAutomatismes = packData.automatismes || [];
    appState.parsedAutomatismes = packData.parsedAutomatismes || {};

    // Fermer la modale
    closePackRecapModal();

    // Aller directement à la sélection des candidats
    workflowState.currentStep = 4;
    workflowState.completedSteps = [1, 2, 3];

    // Nettoyer le mode correction
    localStorage.removeItem('dnb_correction_mode');

    // Afficher la page de sélection des candidats
    showPage('setupPage');
    createWorkflowStepper();

    console.log('✅ Pack chargé, prêt pour la correction');
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier le mode correction après un court délai (pour laisser app.js s'initialiser)
    setTimeout(() => {
        checkCorrectionMode();
    }, 100);
});
