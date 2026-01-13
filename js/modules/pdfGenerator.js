// ===================================
// MODULE DE GÉNÉRATION PDF - DNB
// ===================================

/**
 * Ouvre le modal de configuration PDF
 */
function openPdfConfigModal() {
    document.getElementById('pdfConfigModal').style.display = 'flex';
}

/**
 * Ferme le modal de configuration PDF
 */
function closePdfConfigModal() {
    document.getElementById('pdfConfigModal').style.display = 'none';
}

/**
 * Génère le PDF du sujet DNB avec page de garde style Domatex
 * @param {boolean} isCorrection - Si true, génère le PDF de correction, sinon le sujet
 */
async function generateSubjectPdf(isCorrection = false) {
    // Récupérer le mode sélectionné
    const pdfMode = document.querySelector('input[name="pdfMode"]:checked')?.value || 'complete';

    // Récupérer les données du formulaire
    const config = {
        etablissement: document.getElementById('pdfEtablissement').value,
        ville: document.getElementById('pdfVille').value,
        session: document.getElementById('pdfSession').value,
        duree: document.getElementById('pdfDuree').value,
        points: document.getElementById('pdfPoints').value,
        serie: document.getElementById('pdfSerie').value,
        badge: document.getElementById('pdfBadge').value,
        isCorrection: isCorrection,
        mode: pdfMode  // 'complete' ou 'questions'
    };

    // Valider le formulaire
    if (!config.etablissement || !config.ville || !config.session) {
        alert('⚠️ Veuillez remplir tous les champs obligatoires');
        return;
    }

    // Afficher un loader
    showPdfLoader();

    try {
        // Créer le PDF
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        if (isCorrection) {
            // PDF de correction
            await addCorrectionCoverPage(pdf, config);
            await addCorrectionsPages(pdf, config);
        } else {
            // PDF du sujet
            await addCoverPage(pdf, config);
            await addExercisesPages(pdf, config);
        }

        // Sauvegarder le PDF
        const suffix = isCorrection ? 'correction' : 'sujet';
        const fileName = `dnb_${suffix}_${config.serie.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
        pdf.save(fileName);

        // Fermer le modal et cacher le loader
        closePdfConfigModal();
        hidePdfLoader();

        alert(`✅ PDF ${isCorrection ? 'de correction' : 'du sujet'} généré avec succès !\n\nFichier: ${fileName}`);
    } catch (error) {
        console.error('Erreur lors de la génération du PDF:', error);
        hidePdfLoader();
        alert('❌ Erreur lors de la génération du PDF. Consultez la console pour plus de détails.');
    }
}

/**
 * Ajoute la page de garde style Domatex
 */
async function addCoverPage(pdf, config) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // En-tête établissement (haut gauche)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(config.etablissement, 20, 20);
    pdf.text(config.ville, 20, 27);

    // Titre principal (centré)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const titre = 'DIPLÔME NATIONAL DU BREVET';
    const titreWidth = pdf.getTextWidth(titre);
    pdf.text(titre, (pageWidth - titreWidth) / 2, 50);

    // Session
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const sessionWidth = pdf.getTextWidth(config.session);
    pdf.text(config.session, (pageWidth - sessionWidth) / 2, 60);

    // Durée + Points
    const dureePoints = `DURÉE : ${config.duree} - ${config.points} POINTS`;
    const dureePointsWidth = pdf.getTextWidth(dureePoints);
    pdf.text(dureePoints, (pageWidth - dureePointsWidth) / 2, 68);

    // Encadré central gris (style Domatex)
    const boxWidth = 150;
    const boxHeight = 65;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = 80;

    // Rectangle gris avec bordure arrondie
    pdf.setFillColor(200, 200, 200);
    pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, 'F');

    // Texte dans l'encadré
    pdf.setFontSize(10);
    pdf.text('Épreuve de :', pageWidth / 2, boxY + 15, { align: 'center' });

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MATHÉMATIQUES', pageWidth / 2, boxY + 28, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text(config.serie, pageWidth / 2, boxY + 38, { align: 'center' });

    // Badge interne blanc (si fourni)
    if (config.badge) {
        const badgeWidth = 80;
        const badgeHeight = 15;
        const badgeX = (pageWidth - badgeWidth) / 2;
        const badgeY = boxY + 45;

        pdf.setFillColor(255, 255, 255);
        pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');
        pdf.setDrawColor(0);
        pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'S');

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(config.badge, pageWidth / 2, badgeY + 10, { align: 'center' });
    }

    // Informations réglementaires
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const y = boxY + boxHeight + 15;

    pdf.text("L'utilisation de la calculatrice est autorisée (circ. 99-186 du 16 novembre 1999)", pageWidth / 2, y, { align: 'center' });
    pdf.text("Le sujet est composé de six exercices indépendants.", pageWidth / 2, y + 7, { align: 'center' });
    pdf.text("Le candidat peut les traiter dans l'ordre qui lui convient.", pageWidth / 2, y + 14, { align: 'center' });

    // Tableau des exercices avec barème
    const tableY = y + 25;
    addBaremeTable(pdf, tableY, pageWidth);

    // Encadré instructions en bas
    const instructY = pageHeight - 40;
    pdf.setDrawColor(0);
    pdf.rect(20, instructY, pageWidth - 40, 25);

    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text("Toutes les réponses doivent être justifiées,", 22, instructY + 6);
    pdf.setFont('helvetica', 'normal');
    pdf.text(" sauf si une indication contraire est donnée.", 95, instructY + 6);

    pdf.text("Pour chaque question, si le travail n'est pas terminé, laisser tout de même une trace de la recherche.", 22, instructY + 12);
    pdf.text("Elle sera prise en compte dans la notation", 22, instructY + 18);

    // Numéro de page
    pdf.setFontSize(8);
    pdf.text('1', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

/**
 * Ajoute la page de garde pour la correction (style différencié)
 */
async function addCorrectionCoverPage(pdf, config) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // En-tête établissement (haut gauche)
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text(config.etablissement, 20, 20);
    pdf.text(config.ville, 20, 27);

    // Titre principal (centré)
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    const titre = 'DIPLÔME NATIONAL DU BREVET';
    const titreWidth = pdf.getTextWidth(titre);
    pdf.text(titre, (pageWidth - titreWidth) / 2, 50);

    // Session
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const sessionWidth = pdf.getTextWidth(config.session);
    pdf.text(config.session, (pageWidth - sessionWidth) / 2, 60);

    // Durée + Points
    const dureePoints = `DURÉE : ${config.duree} - ${config.points} POINTS`;
    const dureePointsWidth = pdf.getTextWidth(dureePoints);
    pdf.text(dureePoints, (pageWidth - dureePointsWidth) / 2, 68);

    // Encadré central bleu (pour différencier la correction)
    const boxWidth = 150;
    const boxHeight = 65;
    const boxX = (pageWidth - boxWidth) / 2;
    const boxY = 80;

    // Rectangle bleu avec bordure arrondie
    pdf.setFillColor(200, 230, 255);
    pdf.roundedRect(boxX, boxY, boxWidth, boxHeight, 5, 5, 'F');

    // Texte dans l'encadré
    pdf.setFontSize(10);
    pdf.text('Épreuve de :', pageWidth / 2, boxY + 15, { align: 'center' });

    pdf.setFontSize(18);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MATHÉMATIQUES', pageWidth / 2, boxY + 28, { align: 'center' });

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'italic');
    pdf.text(config.serie, pageWidth / 2, boxY + 38, { align: 'center' });

    // Badge interne blanc avec "CORRECTION"
    const badgeWidth = 100;
    const badgeHeight = 18;
    const badgeX = (pageWidth - badgeWidth) / 2;
    const badgeY = boxY + 45;

    pdf.setFillColor(59, 130, 246); // Bleu
    pdf.roundedRect(badgeX, badgeY, badgeWidth, badgeHeight, 3, 3, 'F');

    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(255, 255, 255);
    pdf.text('CORRECTION', pageWidth / 2, badgeY + 12, { align: 'center' });
    pdf.setTextColor(0, 0, 0);

    // Informations
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    const y = boxY + boxHeight + 15;

    pdf.text("Éléments de correction pour l'évaluation", pageWidth / 2, y, { align: 'center' });
    pdf.text("Document à l'usage exclusif des enseignants", pageWidth / 2, y + 7, { align: 'center' });

    // Tableau des exercices avec barème
    const tableY = y + 20;
    addBaremeTable(pdf, tableY, pageWidth);

    // Numéro de page
    pdf.setFontSize(8);
    pdf.text('1', pageWidth / 2, pageHeight - 10, { align: 'center' });
}

/**
 * Ajoute le tableau de barème sur la page de garde
 */
function addBaremeTable(pdf, startY, pageWidth) {
    const tableWidth = 120;
    const tableX = (pageWidth - tableWidth) / 2;
    const rowHeight = 8;

    // En-tête invisible mais bordures
    pdf.setDrawColor(0);
    pdf.setLineWidth(0.5);

    let currentY = startY;

    // Pour chaque exercice
    let exerciceNum = 1;
    for (const [exId, exercise] of Object.entries(exercisesData)) {
        const totalPoints = exercise.questions.reduce((sum, q) => sum + q.points, 0);

        // Ligne du tableau
        pdf.rect(tableX, currentY, tableWidth / 2, rowHeight);
        pdf.rect(tableX + tableWidth / 2, currentY, tableWidth / 2, rowHeight);

        // Texte
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');
        pdf.text(`Exercice ${exerciceNum}`, tableX + 5, currentY + 5.5);
        pdf.text(`${totalPoints} points`, tableX + tableWidth / 2 + 5, currentY + 5.5);

        currentY += rowHeight;
        exerciceNum++;
    }

    // Ligne "Barème indicatif"
    pdf.rect(tableX, currentY, tableWidth, rowHeight);
    pdf.setFont('helvetica', 'italic');
    pdf.setFontSize(9);
    const text = 'Barème indicatif';
    const textWidth = pdf.getTextWidth(text);
    pdf.text(text, tableX + (tableWidth - textWidth) / 2, currentY + 5.5);
}

/**
 * Ajoute les pages d'exercices - PNG pour DNB, HTML pour automatismes (Ex1)
 * Stratégie : Ex1 seul, Ex2-6 groupés intelligemment selon leur taille réelle
 */
async function addExercisesPages(pdf, config) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const exercisesArray = Object.entries(exercisesData);

    // Exercice 1 : seul sur sa page (automatismes sans calculatrice)
    if (exercisesArray.length > 0) {
        const [exId, exercise] = exercisesArray[0];
        await addExerciseFromHTML(pdf, exercise, 1);
    }

    // Exercices 2-6 : choisir la stratégie selon le mode
    if (exercisesArray.length > 1) {
        if (config.mode === 'questions') {
            // Nouveau mode : questions séparées
            await addGroupedQuestions(pdf, exercisesArray.slice(1), pageWidth, pageHeight);
        } else {
            // Mode classique : exercices complets
            await addGroupedExercises(pdf, exercisesArray.slice(1), pageWidth, pageHeight);
        }
    }
}

/**
 * Groupe intelligemment les exercices 2-6 selon leur taille réelle
 */
async function addGroupedExercises(pdf, exercises, pageWidth, pageHeight) {
    const margin = 10;
    const titleHeight = 8; // Hauteur du titre
    const spacing = 5; // Espacement entre exercices
    const maxPageHeight = pageHeight - 30; // Hauteur disponible (marges haut/bas)
    const imgWidth = pageWidth - (2 * margin);

    // Charger toutes les tailles d'images
    const exerciseSizes = [];
    for (let i = 0; i < exercises.length; i++) {
        const [exId, exercise] = exercises[i];
        const exerciceNum = i + 2; // Commence à 2
        const dnbId = exercise.dnbId;
        const metadata = exercise.metadata;

        if (!dnbId || !metadata) {
            exerciseSizes.push({ exerciceNum, exercise, height: 50 });
            continue;
        }

        const pngPath = `dnb/${metadata.annee}/tex/png/${dnbId}.png`;
        try {
            const imgData = await loadImageAsDataURL(pngPath);
            const img = await loadImage(imgData);
            const imgHeight = (img.height * imgWidth) / img.width;
            const totalHeight = titleHeight + imgHeight + spacing;
            exerciseSizes.push({ exerciceNum, exercise, height: totalHeight, img });
        } catch (error) {
            console.error('Erreur chargement taille pour Ex' + exerciceNum, error);
            exerciseSizes.push({ exerciceNum, exercise, height: 50 });
        }
    }

    // Grouper les exercices selon l'espace disponible
    let currentPageExercises = [];
    let currentPageHeight = 0;

    for (const exData of exerciseSizes) {
        const neededHeight = currentPageHeight === 0 ? exData.height : currentPageHeight + exData.height;

        if (neededHeight <= maxPageHeight) {
            // Peut tenir sur la page courante
            currentPageExercises.push(exData);
            currentPageHeight = neededHeight;
        } else {
            // Ne tient pas, finaliser la page courante et commencer une nouvelle
            if (currentPageExercises.length > 0) {
                await renderExercisesOnPage(pdf, currentPageExercises, pageWidth, pageHeight, margin, titleHeight, spacing);
            }
            currentPageExercises = [exData];
            currentPageHeight = exData.height;
        }
    }

    // Finaliser la dernière page
    if (currentPageExercises.length > 0) {
        await renderExercisesOnPage(pdf, currentPageExercises, pageWidth, pageHeight, margin, titleHeight, spacing);
    }
}

/**
 * Rend plusieurs exercices sur une même page
 */
async function renderExercisesOnPage(pdf, exercisesData, pageWidth, pageHeight, margin, titleHeight, spacing) {
    pdf.addPage();
    let currentY = 15;

    for (const exData of exercisesData) {
        const { exerciceNum, exercise, img } = exData;

        // Titre
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const totalPoints = exercise.questions.reduce((sum, q) => sum + q.points, 0);
        pdf.text(`Exercice ${exerciceNum} (${totalPoints} points)`, margin, currentY);
        currentY += titleHeight;

        // Image
        if (img) {
            const imgWidth = pageWidth - (2 * margin);
            const imgHeight = (img.height * imgWidth) / img.width;

            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            const imgData = canvas.toDataURL('image/png');

            pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
            currentY += imgHeight + spacing;
        } else {
            pdf.setFontSize(9);
            pdf.text('Erreur de chargement', margin, currentY);
            currentY += 20;
        }
    }
}

/**
 * Ajoute les pages de corrections (tous les exercices)
 */
async function addCorrectionsPages(pdf, config) {
    let exerciceNum = 1;

    for (const [exId, exercise] of Object.entries(exercisesData)) {
        const isAutomatismes = exerciceNum === 1;

        if (isAutomatismes) {
            await addCorrectionsPage(pdf, exercise, exerciceNum);
        } else {
            await addCorrectionFromPNG(pdf, exercise, exerciceNum);
        }

        exerciceNum++;
    }
}

/**
 * Groupe intelligemment les QUESTIONS séparées (nouveau mode)
 */
async function addGroupedQuestions(pdf, exercises, pageWidth, pageHeight) {
    console.log('🎯 Mode : Questions séparées');

    const margin = 10;
    const titleHeight = 6;
    const spacing = 8;
    const maxPageHeight = pageHeight - 30;
    const imgWidth = pageWidth - (2 * margin);

    // Charger le mapping des questions
    let questionsMapping = {};
    try {
        const response = await fetch('dnb/2025/questions-mapping.json');
        questionsMapping = await response.json();
    } catch (error) {
        console.error('❌ Erreur chargement mapping questions:', error);
        await addGroupedExercises(pdf, exercises, pageWidth, pageHeight);
        return;
    }

    // Collecter toutes les questions
    const allQuestions = [];

    for (let i = 0; i < exercises.length; i++) {
        const [exId, exercise] = exercises[i];
        const exerciceNum = i + 2;
        const dnbId = exercise.dnbId;

        console.log(`🔍 Exercice ${exerciceNum}:`, {
            exId,
            dnbId,
            hasMapping: !!questionsMapping[dnbId],
            availableKeys: Object.keys(questionsMapping).slice(0, 3)
        });

        if (!dnbId || !questionsMapping[dnbId]) {
            console.warn(`⚠️ Pas de mapping pour "${dnbId}"`);
            console.warn(`   Clés disponibles:`, Object.keys(questionsMapping));
            continue;
        }

        const mapping = questionsMapping[dnbId];

        for (const question of mapping.questions) {
            try {
                const imgData = await loadImageAsDataURL(question.pngPath);
                const img = await loadImage(imgData);
                const imgHeight = (img.height * imgWidth) / img.width;

                allQuestions.push({
                    exerciceNum,
                    questionNum: question.numero,
                    img,
                    height: titleHeight + imgHeight + spacing
                });

                // Sous-questions
                for (const sq of question.sousQuestions) {
                    const sqImgData = await loadImageAsDataURL(sq.pngPath);
                    const sqImg = await loadImage(sqImgData);
                    const sqImgHeight = (sqImg.height * imgWidth) / sqImg.width;

                    allQuestions.push({
                        exerciceNum,
                        questionNum: `${question.numero}${sq.lettre}`,
                        img: sqImg,
                        height: titleHeight + sqImgHeight + spacing
                    });
                }
            } catch (error) {
                console.error(`❌ Erreur Q${question.numero}:`, error);
            }
        }
    }

    console.log(`📊 ${allQuestions.length} questions à grouper`);

    // Grouper sur les pages
    let currentPageQuestions = [];
    let currentPageHeight = 0;

    for (const qData of allQuestions) {
        const neededHeight = currentPageHeight === 0 ? qData.height : currentPageHeight + qData.height;

        if (neededHeight <= maxPageHeight) {
            currentPageQuestions.push(qData);
            currentPageHeight = neededHeight;
        } else {
            if (currentPageQuestions.length > 0) {
                await renderQuestionsOnPage(pdf, currentPageQuestions, pageWidth, pageHeight, margin);
            }
            currentPageQuestions = [qData];
            currentPageHeight = qData.height;
        }
    }

    if (currentPageQuestions.length > 0) {
        await renderQuestionsOnPage(pdf, currentPageQuestions, pageWidth, pageHeight, margin);
    }
}

/**
 * Rend plusieurs questions sur une même page
 */
async function renderQuestionsOnPage(pdf, questionsData, pageWidth, pageHeight, margin) {
    pdf.addPage();
    let currentY = 15;

    for (const qData of questionsData) {
        // Titre
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`Ex${qData.exerciceNum} - Q${qData.questionNum}`, margin, currentY);
        currentY += 6;

        // Image
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (qData.img.height * imgWidth) / qData.img.width;

        const canvas = document.createElement('canvas');
        canvas.width = qData.img.width;
        canvas.height = qData.img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(qData.img, 0, 0);
        const imgData = canvas.toDataURL('image/png');

        pdf.addImage(imgData, 'PNG', margin, currentY, imgWidth, imgHeight);
        currentY += imgHeight + 8;
    }
}

/**
 * Ajoute un exercice depuis le rendu HTML (pour automatismes)
 */
async function addExerciseFromHTML(pdf, exercise, exerciceNum) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Nouvelle page
    pdf.addPage();

    // Titre
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const totalPoints = exercise.questions.reduce((sum, q) => sum + q.points, 0);
    pdf.text(`Exercice ${exerciceNum} ( ${totalPoints} points )`, 20, 20);

    // Créer un conteneur temporaire pour le rendu
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position: absolute; left: -9999px; width: 750px; padding: 20px; background: white; font-family: Arial, sans-serif;';
    document.body.appendChild(tempContainer);

    // Ajouter chaque question
    for (let qIdx = 0; qIdx < exercise.questions.length; qIdx++) {
        const question = exercise.questions[qIdx];

        const questionDiv = document.createElement('div');
        questionDiv.style.cssText = 'margin-bottom: 20px; page-break-inside: avoid;';

        const questionNumber = document.createElement('div');
        questionNumber.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 14px;';
        questionNumber.textContent = `${qIdx + 1})`;
        questionDiv.appendChild(questionNumber);

        const questionContent = document.createElement('div');
        questionContent.style.cssText = 'margin-left: 15px; line-height: 1.6;';
        questionContent.innerHTML = question.statement || question.title;
        questionDiv.appendChild(questionContent);

        tempContainer.appendChild(questionDiv);

        // Rendre les formules KaTeX
        if (window.renderMathInElement) {
            renderMathInElement(questionContent, {
                delimiters: [
                    {left: '$$', right: '$$', display: true},
                    {left: '$', right: '$', display: false},
                    {left: '\\[', right: '\\]', display: true},
                    {left: '\\(', right: '\\)', display: false}
                ]
            });
        }
    }

    // Capturer avec html2canvas
    try {
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        await addImageWithPagination(pdf, imgData, 20, 30, imgWidth, imgHeight, pageWidth, pageHeight);
    } catch (error) {
        console.error('Erreur rendu HTML Ex' + exerciceNum, error);
    }

    document.body.removeChild(tempContainer);
}

/**
 * Ajoute un exercice depuis le PNG DNB
 */
async function addExerciseFromPNG(pdf, exercise, exerciceNum) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Nouvelle page
    pdf.addPage();

    // Titre
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    const totalPoints = exercise.questions.reduce((sum, q) => sum + q.points, 0);
    pdf.text(`Exercice ${exerciceNum} ( ${totalPoints} points )`, 15, 15);

    // Construire le chemin du PNG
    const dnbId = exercise.dnbId;
    const metadata = exercise.metadata;

    if (!dnbId || !metadata) {
        console.error('Pas de dnbId ou metadata pour exercice', exerciceNum);
        return;
    }

    const pngPath = `dnb/${metadata.annee}/tex/png/${dnbId}.png`;
    console.log('Chargement PNG:', pngPath);

    try {
        const imgData = await loadImageAsDataURL(pngPath);
        const img = await loadImage(imgData);

        // Marges réduites : 15mm au lieu de 20mm
        const margin = 15;
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (img.height * imgWidth) / img.width;

        await addImageWithSmartPagination(pdf, img, margin, 22, imgWidth, imgHeight, pageWidth, pageHeight);
    } catch (error) {
        console.error('Erreur chargement PNG pour Ex' + exerciceNum, error);
        pdf.setFontSize(11);
        pdf.text('Erreur de chargement de l\'exercice', 20, 40);
    }
}

/**
 * Ajoute une correction depuis le PNG DNB
 */
async function addCorrectionFromPNG(pdf, exercise, exerciceNum) {
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    pdf.addPage();

    // Titre
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 100, 200);
    pdf.text(`Correction - Exercice ${exerciceNum}`, 15, 15);
    pdf.setTextColor(0, 0, 0);

    // Construire le chemin du PNG de correction
    const dnbId = exercise.dnbId;
    const metadata = exercise.metadata;

    if (!dnbId || !metadata) {
        return;
    }

    const pngPath = `dnb/${metadata.annee}/tex/png/${dnbId}_cor.png`;
    console.log('Chargement correction PNG:', pngPath);

    try {
        const imgData = await loadImageAsDataURL(pngPath);
        const img = await loadImage(imgData);

        // Marges réduites
        const margin = 15;
        const imgWidth = pageWidth - (2 * margin);
        const imgHeight = (img.height * imgWidth) / img.width;

        await addImageWithSmartPagination(pdf, img, margin, 22, imgWidth, imgHeight, pageWidth, pageHeight);
    } catch (error) {
        console.error('Erreur chargement correction PNG pour Ex' + exerciceNum, error);
        pdf.setFontSize(11);
        pdf.text('Correction non disponible', 20, 40);
    }
}

/**
 * Détecte si une ligne horizontale de l'image est "vide" (blanche)
 */
function isLineEmpty(imageData, y, width, threshold = 240) {
    const startIndex = y * width * 4;
    let whitePixels = 0;

    // Échantillonner tous les 10 pixels pour la performance
    for (let x = 0; x < width; x += 10) {
        const index = startIndex + (x * 4);
        const r = imageData.data[index];
        const g = imageData.data[index + 1];
        const b = imageData.data[index + 2];

        // Considérer comme blanc si RGB > threshold
        if (r > threshold && g > threshold && b > threshold) {
            whitePixels++;
        }
    }

    // Si plus de 90% des pixels échantillonnés sont blancs
    return (whitePixels / (width / 10)) > 0.9;
}

/**
 * Trouve les meilleures positions de découpe dans l'image (zones blanches)
 */
function findCutPositions(img, maxHeightPerPage) {
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    const positions = [];
    const minGapHeight = 20; // Minimum 20px de gap pour considérer comme zone de coupe

    let currentGapStart = null;
    let currentGapSize = 0;

    // Scanner l'image ligne par ligne
    for (let y = 0; y < img.height; y++) {
        const isEmpty = isLineEmpty(imageData, y, img.width);

        if (isEmpty) {
            if (currentGapStart === null) {
                currentGapStart = y;
                currentGapSize = 1;
            } else {
                currentGapSize++;
            }
        } else {
            // Fin d'un gap
            if (currentGapStart !== null && currentGapSize >= minGapHeight) {
                // Milieu du gap = meilleur point de coupe
                positions.push({
                    y: currentGapStart + Math.floor(currentGapSize / 2),
                    gapSize: currentGapSize
                });
            }
            currentGapStart = null;
            currentGapSize = 0;
        }
    }

    return positions;
}

/**
 * Ajoute une image au PDF avec découpage intelligent aux zones blanches
 */
async function addImageWithSmartPagination(pdf, img, x, startY, imgWidth, imgHeight, pageWidth, pageHeight) {
    const availableHeight = pageHeight - startY - 20; // Hauteur disponible sur la première page
    const availableHeightNextPages = pageHeight - 40; // Hauteur dispo pages suivantes

    // Si l'image tient sur une page, l'ajouter directement
    if (imgHeight <= availableHeight) {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', x, startY, imgWidth, imgHeight);
        return;
    }

    // Sinon, trouver les positions de découpe optimales
    const cutPositions = findCutPositions(img, availableHeight);
    console.log('Positions de découpe détectées:', cutPositions);

    // Calculer l'échelle entre dimensions PDF et pixels image
    const scale = img.width / imgWidth;

    // Découper l'image en sections
    let currentSourceY = 0;
    let currentPdfY = startY;
    let currentPageHeight = availableHeight;
    let pageNum = 0;

    while (currentSourceY < img.height) {
        // Trouver la meilleure position de coupe pour cette page
        const targetSourceY = currentSourceY + (currentPageHeight * scale);

        // Chercher une position de coupe proche
        let bestCut = null;
        let bestDistance = Infinity;

        for (const cut of cutPositions) {
            if (cut.y > currentSourceY && cut.y <= targetSourceY + (50 * scale)) {
                const distance = Math.abs(cut.y - targetSourceY);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    bestCut = cut;
                }
            }
        }

        // Déterminer la hauteur de cette section
        let sectionHeight;
        if (bestCut && bestDistance < (100 * scale)) {
            // Utiliser la position de coupe optimale
            sectionHeight = bestCut.y - currentSourceY;
        } else {
            // Pas de bonne position, découper à la limite de page
            sectionHeight = Math.min(currentPageHeight * scale, img.height - currentSourceY);
        }

        // Créer le canvas pour cette section
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = sectionHeight;
        const ctx = canvas.getContext('2d');

        ctx.drawImage(
            img,
            0, currentSourceY,
            img.width, sectionHeight,
            0, 0,
            img.width, sectionHeight
        );

        // Ajouter au PDF
        const sectionImgData = canvas.toDataURL('image/png');
        const sectionPdfHeight = sectionHeight / scale;
        pdf.addImage(sectionImgData, 'PNG', x, currentPdfY, imgWidth, sectionPdfHeight);

        // Préparer pour la section suivante
        currentSourceY += sectionHeight;

        if (currentSourceY < img.height) {
            // Ajouter une nouvelle page
            pdf.addPage();
            currentPdfY = 20;
            currentPageHeight = availableHeightNextPages;
            pageNum++;
        }
    }
}

/**
 * Ajoute une image au PDF avec pagination automatique (ancienne version, conservée pour compatibilité)
 */
async function addImageWithPagination(pdf, imgData, x, startY, imgWidth, imgHeight, pageWidth, pageHeight) {
    if (imgHeight > pageHeight - 40) {
        // Diviser en plusieurs pages
        const pagesNeeded = Math.ceil(imgHeight / (pageHeight - 40));

        for (let p = 0; p < pagesNeeded; p++) {
            if (p > 0) {
                pdf.addPage();
            }

            const currentY = p === 0 ? startY : 20;
            const img = await loadImage(imgData);

            const sourceY = p * (pageHeight - 40);
            const sourceHeight = Math.min(pageHeight - 40, imgHeight - sourceY);

            // Créer un canvas pour cette portion
            const canvas = document.createElement('canvas');
            const scale = img.width / imgWidth;
            canvas.width = img.width;
            canvas.height = sourceHeight * scale;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(
                img,
                0, sourceY * scale,
                img.width, sourceHeight * scale,
                0, 0,
                img.width, sourceHeight * scale
            );

            const partialImgData = canvas.toDataURL('image/png');
            pdf.addImage(partialImgData, 'PNG', x, currentY, imgWidth, sourceHeight);
        }
    } else {
        pdf.addImage(imgData, 'PNG', x, startY, imgWidth, imgHeight);
    }
}

/**
 * Charge une image depuis un chemin et retourne DataURL
 */
function loadImageAsDataURL(path) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';

        img.onload = function() {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };

        img.onerror = function(err) {
            reject(new Error(`Impossible de charger l'image: ${path}`));
        };

        img.src = path;
    });
}

/**
 * Charge une image et retourne l'élément Image
 */
function loadImage(dataURL) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = dataURL;
    });
}

/**
 * Ajoute la page de corrections pour un exercice
 */
async function addCorrectionsPage(pdf, exercise, exerciceNum) {
    pdf.addPage();

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    // Titre de la correction
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 100, 200);
    pdf.text(`Correction - Exercice ${exerciceNum}`, 20, 20);
    pdf.setTextColor(0, 0, 0);

    // Créer un conteneur temporaire pour les corrections
    const tempContainer = document.createElement('div');
    tempContainer.style.cssText = 'position: absolute; left: -9999px; width: 750px; padding: 20px; background: white; font-family: Arial, sans-serif;';
    document.body.appendChild(tempContainer);

    // Ajouter chaque correction
    for (let qIdx = 0; qIdx < exercise.questions.length; qIdx++) {
        const question = exercise.questions[qIdx];

        if (question.answer) {
            const corrDiv = document.createElement('div');
            corrDiv.style.cssText = 'margin-bottom: 20px; page-break-inside: avoid;';

            const corrNumber = document.createElement('div');
            corrNumber.style.cssText = 'font-weight: bold; margin-bottom: 8px; font-size: 14px; color: #0066cc;';
            corrNumber.textContent = `${qIdx + 1})`;
            corrDiv.appendChild(corrNumber);

            const corrContent = document.createElement('div');
            corrContent.style.cssText = 'margin-left: 15px; line-height: 1.6; color: #333;';
            corrContent.innerHTML = question.answer;
            corrDiv.appendChild(corrContent);

            tempContainer.appendChild(corrDiv);

            // Rendre les formules KaTeX
            if (window.renderMathInElement) {
                renderMathInElement(corrContent, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\[', right: '\\]', display: true},
                        {left: '\\(', right: '\\)', display: false}
                    ]
                });
            }
        }
    }

    // Capturer et ajouter au PDF
    try {
        const canvas = await html2canvas(tempContainer, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');
        const imgWidth = pageWidth - 40;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        if (imgHeight > pageHeight - 40) {
            // Diviser en plusieurs pages si nécessaire
            const pagesNeeded = Math.ceil(imgHeight / (pageHeight - 40));
            let currentY = 30;

            for (let p = 0; p < pagesNeeded; p++) {
                if (p > 0) {
                    pdf.addPage();
                    currentY = 20;
                }

                const sourceY = p * (pageHeight - 40) * (canvas.height / imgHeight);
                const sourceHeight = Math.min((pageHeight - 40) * (canvas.height / imgHeight), canvas.height - sourceY);
                const destHeight = (sourceHeight * imgWidth) / canvas.width;

                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = sourceHeight;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx.drawImage(canvas, 0, sourceY, canvas.width, sourceHeight, 0, 0, canvas.width, sourceHeight);

                const partialImgData = tempCanvas.toDataURL('image/png');
                pdf.addImage(partialImgData, 'PNG', 20, currentY, imgWidth, destHeight);
            }
        } else {
            pdf.addImage(imgData, 'PNG', 20, 30, imgWidth, imgHeight);
        }
    } catch (error) {
        console.error('Erreur lors du rendu des corrections', error);
    }

    document.body.removeChild(tempContainer);
}

/**
 * Supprime les balises HTML d'un texte
 */
function stripHtml(html) {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
}

/**
 * Affiche un loader pendant la génération
 */
function showPdfLoader() {
    // Créer et afficher un loader
    const loader = document.createElement('div');
    loader.id = 'pdfLoader';
    loader.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.8);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 99999;
    `;

    loader.innerHTML = `
        <div style="text-align: center; color: white;">
            <div style="font-size: 48px; margin-bottom: 20px;">📄</div>
            <div style="font-size: 20px; margin-bottom: 10px;">Génération du PDF en cours...</div>
            <div style="font-size: 14px; opacity: 0.8;">Veuillez patienter</div>
        </div>
    `;

    document.body.appendChild(loader);
}

/**
 * Cache le loader
 */
function hidePdfLoader() {
    const loader = document.getElementById('pdfLoader');
    if (loader) {
        loader.remove();
    }
}
