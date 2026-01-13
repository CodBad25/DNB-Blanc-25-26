// ============================================================================
// MODULE EXERCISES - Logique commune aux exercices
// ============================================================================
//
// Ce module gère toute la logique liée aux exercices :
// - Parsing LaTeX vers HTML
// - Gestion des automatismes (sélection, preview, génération)
// - Gestion des exercices DNB (filtrage, recherche, sélection)
// - Génération finale de exercisesData
// - Chargement et parsing des fichiers LaTeX
//
// Dépendances:
// - appState (global) : état de l'application
// - exercisesData (global) : structure de données des exercices
// - window.dictionnaireAutomatismes (global) : dictionnaire des automatismes MathALÉA
// - dictionnaireDNB (global) : dictionnaire des exercices DNB
// - katex, renderMathInElement (bibliothèques externes) : rendu des formules mathématiques
// - scratchblocks (bibliothèque externe) : rendu des blocs Scratch
// - window.genererAutomatisme (fonction globale) : générateur d'automatismes
//
// @module exercises
// ============================================================================

// === PARSING LATEX ===

/**
 * Convertit du code LaTeX en HTML
 *
 * Cette fonction transforme les commandes LaTeX courantes en leur équivalent HTML
 * tout en préservant les formules mathématiques pour le rendu ultérieur par KaTeX.
 *
 * @param {string} latex - Le code LaTeX à convertir
 * @param {string} exerciceId - L'ID de l'exercice (utilisé pour le contexte de debug)
 * @returns {string} Le code HTML résultant
 *
 * @example
 * const html = latexToHtml("\\textbf{Question 1}: Calculer $2+2$", "dnb_2024_01");
 * // Retourne: "<strong>Question 1</strong>: Calculer $2+2$"
 *
 * @dependencies
 * - Aucune (fonction pure de transformation)
 *
 * @module exercises
 */
function latexToHtml(latex, exerciceId) {
    let html = latex;

    // ⚠️ IMPORTANT : Préserver les formules mathématiques AVANT toute autre conversion
    // MathALÉA préserve les formules pour que KaTeX les traite ensuite

    // Nettoyer les commandes de taille de police LaTeX (à ignorer pour HTML/KaTeX)
    html = html.replace(/\\Large\s*/g, '');
    html = html.replace(/\\large\s*/g, '');
    html = html.replace(/\\small\s*/g, '');
    html = html.replace(/\\tiny\s*/g, '');
    html = html.replace(/\\scriptsize\s*/g, '');
    html = html.replace(/\\footnotesize\s*/g, '');
    html = html.replace(/\\normalsize\s*/g, '');
    html = html.replace(/\\huge\s*/g, '');
    html = html.replace(/\\Huge\s*/g, '');

    // Nettoyer les commandes d'espacement LaTeX
    html = html.replace(/\\vspace\*?\{[^}]*\}/g, '');
    html = html.replace(/\\hspace\*?\{[^}]*\}/g, ' ');
    html = html.replace(/\\vskip[^\n]*/g, '');
    html = html.replace(/\\quad/g, ' ');
    html = html.replace(/\\qquad/g, '  ');

    // Commandes LaTeX simples → HTML (en évitant les formules math)
    html = html.replace(/\\textbf\{([^}]*)\}/g, '<strong>$1</strong>');
    html = html.replace(/\\textit\{([^}]*)\}/g, '<em>$1</em>');
    html = html.replace(/\\emph\{([^}]*)\}/g, '<em>$1</em>');
    html = html.replace(/\\og\{\}/g, '«');
    html = html.replace(/\\fg\{\}/g, '»');
    html = html.replace(/\\medskip/gi, '<br>');
    html = html.replace(/\\bigskip/gi, '<br><br>');
    html = html.replace(/\\smallskip/gi, '<br>');
    html = html.replace(/\\no\s+/g, 'n°');
    // Conversion \np avec ou sans paramètre optionnel : \np[cm]{29} → 29 cm
    html = html.replace(/\\np\[([^\]]*)\]\{([^}]*)\}/g, '$2 $1');
    html = html.replace(/\\np\{([^}]*)\}/g, '$1');
    html = html.replace(/\\text\{([^}]*)\}/g, '$1');
    html = html.replace(/\\hfill/g, ' ');
    html = html.replace(/\\degres/g, '°');
    html = html.replace(/\\degree/g, '°');
    html = html.replace(/\\euro/g, '€');
    html = html.replace(/\\times/g, '×');
    html = html.replace(/\\dots/g, '...');
    html = html.replace(/\\ldots/g, '...');
    html = html.replace(/\\cdots/g, '⋯');

    // Commandes de formatage supplémentaires
    html = html.replace(/\\underline\{([^}]*)\}/g, '<u>$1</u>');
    html = html.replace(/\\ul\{([^}]*)\}/g, '<u>$1</u>');
    html = html.replace(/\\bfseries\s*/g, '<strong>');
    html = html.replace(/\\mdseries\s*/g, '</strong>');
    html = html.replace(/\\itshape\s*/g, '<em>');
    html = html.replace(/\\upshape\s*/g, '</em>');

    // Convertir les exposants \up{e} en <sup>e</sup>
    html = html.replace(/\\up\{([^}]*)\}/g, '<sup>$1</sup>');

    html = html.replace(/\\,/g, ' ');
    html = html.replace(/~/g, ' ');
    html = html.replace(/\\\s+/g, ' ');
    html = html.replace(/\\%/g, '%');

    // Nettoyer les commentaires LaTeX
    html = html.replace(/%[^\n]*/g, '');

    // Convertir les environnements math LaTeX vers le format KaTeX
    // \( \) pour inline, \[ \] pour display
    // Si le LaTeX utilise déjà $ ou $$, les préserver
    // Si le LaTeX utilise \begin{equation}, convertir en \[ \]
    html = html.replace(/\\begin\{equation\*?\}[\s\S]*?\\end\{equation\*?\}/g, (match) => {
        const content = match.replace(/\\begin\{equation\*?\}/g, '').replace(/\\end\{equation\*?\}/g, '').trim();
        return `\\[${content}\\]`;
    });
    html = html.replace(/\\begin\{align\*?\}[\s\S]*?\\end\{align\*?\}/g, (match) => {
        const content = match.replace(/\\begin\{align\*?\}/g, '').replace(/\\end\{align\*?\}/g, '').trim();
        return `\\[${content}\\]`;
    });

    // === NOUVELLES CONVERSIONS : LISTES ET TABLEAUX ===

    // Convertir les listes enumerate en HTML <ol> AVANT de supprimer l'environnement
    html = html.replace(/\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/gi, (match, content) => {
        const items = content.split(/\\item\s*/).filter(i => i.trim());
        if (items.length === 0) return '';
        return '<ol style="margin: 10px 0; padding-left: 25px;">' +
               items.map(i => `<li style="margin: 5px 0;">${i.trim()}</li>`).join('') +
               '</ol>';
    });

    // Convertir les listes itemize en HTML <ul>
    html = html.replace(/\\begin\{itemize\}([\s\S]*?)\\end\{itemize\}/gi, (match, content) => {
        const items = content.split(/\\item\s*/).filter(i => i.trim());
        if (items.length === 0) return '';
        return '<ul style="margin: 10px 0; padding-left: 25px;">' +
               items.map(i => `<li style="margin: 5px 0;">${i.trim()}</li>`).join('') +
               '</ul>';
    });

    // Convertir les tableaux simples en HTML
    html = html.replace(/\\begin\{tabular\}(\[[^\]]*\])?\{([^\}]*)\}([\s\S]*?)\\end\{tabular\}/gi, (match, align, cols, content) => {
        // Nettoyer le contenu et séparer les lignes
        const rows = content.split('\\\\').map(r => r.trim()).filter(r => r.length > 0);
        if (rows.length === 0) return '<span style="color: #999;">Tableau vide</span>';

        let table = '<table style="border-collapse: collapse; margin: 10px 0; border: 1px solid #ddd;">';
        rows.forEach((row, rowIndex) => {
            // Séparer les cellules (ignorer les \hline)
            const cleanRow = row.replace(/\\hline/g, '');
            const cells = cleanRow.split('&').map(c => c.trim());

            table += '<tr>';
            cells.forEach(cell => {
                const style = 'border: 1px solid #ddd; padding: 8px; text-align: center;';
                table += `<td style="${style}">${cell}</td>`;
            });
            table += '</tr>';
        });
        table += '</table>';
        return table;
    });

    // Supprimer les commandes LaTeX résiduelles qui n'ont pas été converties
    html = html.replace(/\\begin\{description\}/gi, '');
    html = html.replace(/\\end\{description\}/gi, '');
    html = html.replace(/\\begin\{minipage\}[\s\S]*?\{[\s\S]*?\}/gi, '');
    html = html.replace(/\\end\{minipage\}/gi, '');
    html = html.replace(/\\item\s*/g, ''); // Nettoyer les \item orphelins
    // Supprimer les commandes multicols (non supportées par KaTeX)
    html = html.replace(/\\begin\{multicols\}\{[^}]*\}/gi, '');
    html = html.replace(/\\end\{multicols\}/gi, '');
    html = html.replace(/\\columnbreak/gi, ' ');
    html = html.replace(/\\newline/gi, '<br>');
    html = html.replace(/\\break/gi, '<br>');
    html = html.replace(/\\vspace\{[^}]*\}/gi, '');
    html = html.replace(/\\hspace\{[^}]*\}/gi, ' ');
    html = html.replace(/\\hline/gi, ''); // Nettoyer les \hline orphelins

    // Nettoyer les caractères invisibles (zero-width space, etc.)
    html = html.replace(/[\u200B-\u200D\uFEFF]/g, '');

    // Réparer les formules mathématiques coupées (ajouter le délimiteur manquant)
    // Remplacer \$ échappé par $ simple dans les formules mathématiques
    // Pattern $...\$ devient $...$
    html = html.replace(/\$([^$]*?)\\$/g, '$$1$');

    // Si on a $... sans le $ de fermeture, l'ajouter
    // Compter les $ non échappés
    let dollarCount = 0;
    for (let i = 0; i < html.length; i++) {
        if (html[i] === '$' && (i === 0 || html[i-1] !== '\\')) {
            dollarCount++;
        }
    }
    if (dollarCount % 2 !== 0) {
        // Nombre impair de $, il en manque un
        html += '$';
    }
    // Même chose pour \( \)
    const parenMatches = (html.match(/\\\(/g) || []).length;
    const closeParenMatches = (html.match(/\\\)/g) || []).length;
    if (parenMatches > closeParenMatches) {
        html += '\\)';
    }
    // Même chose pour \[ \]
    const bracketMatches = (html.match(/\\\[/g) || []).length;
    const closeBracketMatches = (html.match(/\\\]/g) || []).length;
    if (bracketMatches > closeBracketMatches) {
        html += '\\]';
    }

    // Nettoyer les sauts de ligne
    html = html.replace(/\n\s*\n/g, '<br>');

    // Nettoyage final des artefacts résiduels
    html = html.replace(/\$\s*\}/g, '');  // $ suivis de }
    html = html.replace(/\{\s*\$\s*\}/g, '');  // {$}
    html = html.replace(/_[a-zA-Z]\$\}/g, '');  // _x$}
    html = html.replace(/\}\s*\$\s*\}/g, '}');  // }$}
    html = html.replace(/\s{3,}/g, ' ');  // Espaces multiples
    html = html.replace(/\(\s*\)\s*\(\s*\)/g, '');  // ()() vides
    html = html.replace(/\{\s*\}\s*\{\s*\}/g, '');  // {}{} vides

    html = html.trim();

    return html;
}

/**
 * Nettoie le LaTeX complexe en supprimant les environnements non supportés
 *
 * Supprime les figures PST, tableaux, arbres et autres éléments complexes
 * et les remplace par des badges indicatifs. Traite également les blocs Scratch.
 *
 * @param {string} latex - Le code LaTeX à nettoyer
 * @param {string} exerciceId - L'ID de l'exercice (pour le contexte)
 * @returns {string} Le LaTeX nettoyé
 *
 * @example
 * const cleaned = cleanComplexLatex("\\begin{pspicture}...\\end{pspicture}", "ex1");
 * // Retourne: "<span>📐 Figure</span>"
 *
 * @dependencies
 * - Aucune (fonction pure de transformation)
 *
 * @module exercises
 */
function cleanComplexLatex(latex, exerciceId) {
    let cleaned = latex;

    const badge = (emoji, label) =>
        `<span style="display: inline-flex; align-items: center; gap: 4px; padding: 4px 8px; background: #e3f2fd; border: 1px solid #90caf9; border-radius: 12px; font-size: 11px; color: #1976d2; font-weight: 600;">
            <span>${emoji}</span>
            <span>${label}</span>
        </span>`;

    // Supprimer TOUS les environnements complexes
    cleaned = cleaned.replace(/\\begin\{center\}[\s\S]*?\\end\{center\}/gi, '');

    // Gérer les environnements pspicture et pspicture* (graphiques PSTricks)
    // Utiliser un regex plus robuste qui capture même du contenu mal formaté
    cleaned = cleaned.replace(/\\begin\{pspicture\*?\}[\s\S]*?\\end\{pspicture\*?\}/gi, badge('📐', 'Figure graphique'));

    // Nettoyer les fragments de pspicture isolés (cas où le \begin ou \end manque)
    cleaned = cleaned.replace(/\\begin\{pspicture\*?\}[\s\S]{0,500}?(?=\\begin|$)/gi, badge('📐', 'Figure graphique'));

    // Nettoyer les commandes PST résiduelles qui pourraient rester
    cleaned = cleaned.replace(/\\pspicture\*?\([^)]*\)\([^)]*\)/gi, '');
    cleaned = cleaned.replace(/\\psplot[\s\S]*?\}/gi, '');
    cleaned = cleaned.replace(/\\ps[a-z]+\{[^}]*\}/gi, '');
    cleaned = cleaned.replace(/\\ps[a-z]+\[[^\]]*\]/gi, '');

    // Nettoyer les $ isolés ou mal formés qui restent après suppression de graphiques
    cleaned = cleaned.replace(/\$\s*\}/g, '');
    cleaned = cleaned.replace(/\{\s*\$\s*\}/g, '');

    // Traiter les blocs Scratch avec scratchblocks
    cleaned = cleaned.replace(/\\begin\{scratch\}([\s\S]*?)\\end\{scratch\}/gi, (match, content) => {
        // Nettoyer le contenu : soit c'est déjà du texte scratchblocks, soit ce sont des commandes LaTeX
        let scratchCode = content.trim();

        // Si le contenu contient des commandes LaTeX (\block...), les convertir
        if (scratchCode.includes('\\block')) {
            scratchCode = scratchCode
                .replace(/\\blockinitclone/g, 'when I start as a clone')
                .replace(/\\blockinit/g, 'when green flag clicked')
                .replace(/\\blockrepeat\{([^}]*)\}\{/g, 'repeat ($1)\n')
                .replace(/\\blockmove\{([^}]*)\}/g, 'move ($1) steps')
                .replace(/\\blockif\{([^}]*)\}\{/g, 'if <$1> then\n')
                .replace(/\\blockelse\{([^}]*)\}\{([^}]*)\}\{/g, 'if <$1> then\n$2\nelse\n')
                .replace(/\\blockturn\{([^}]*)\}/g, 'turn cw ($1) degrees')
                .replace(/\\blocksay\{([^}]*)\}/g, 'say [$1]')
                .replace(/\\blockwait\{([^}]*)\}/g, 'wait ($1) seconds')
                .replace(/\\blockglide\{([^}]*)\}\{([^}]*)\}\{([^}]*)\}/g, 'glide ($1) secs to x: ($2) y: ($3)')
                .replace(/\\blockgoto\{([^}]*)\}\{([^}]*)\}/g, 'go to x: ($1) y: ($2)')
                .replace(/\\blocksetvar\{([^}]*)\}\{([^}]*)\}/g, 'set [$1 v] to ($2)')
                .replace(/\\blockchangevar\{([^}]*)\}\{([^}]*)\}/g, 'change [$1 v] by ($2)')
                .replace(/\}/g, '\nend')
                .replace(/\n+/g, '\n')
                .trim();
        }

        // Retourner un élément pre avec classe "blocks" pour scratchblocks
        return `<pre class="blocks" style="margin: 10px 0;">${scratchCode}</pre>`;
    });

    // Remplacer les tableaux complexes (tabularx, longtable) par un badge
    // Les tableaux simples seront gérés par latexToHtml()
    cleaned = cleaned.replace(/\\begin\{tabular[x]\}[\s\S]*?\\end\{tabular[x]\}/gi, badge('📊', 'Tableau'));
    cleaned = cleaned.replace(/\\begin\{longtable\}[\s\S]*?\\end\{longtable\}/gi, badge('📊', 'Tableau'));

    // Remplacer les environnements graphiques complexes
    cleaned = cleaned.replace(/\\pstree[\s\S]*?(?=\\item|\\end|$)/gi, badge('🌳', 'Arbre'));
    cleaned = cleaned.replace(/\\psset\{[^}]*\}/gi, '');
    cleaned = cleaned.replace(/\\ps[a-z]+(\[[^\]]*\])?(\([^\)]*\))?(\{[^}]*\})?/gi, '');
    cleaned = cleaned.replace(/\\parbox[\s\S]*?\{[\s\S]*?\}/gi, '');
    cleaned = cleaned.replace(/\\rput[\s\S]*?\{[^}]*\}/gi, '');
    cleaned = cleaned.replace(/\\uput[\s\S]*?\{[^}]*\}/gi, '');

    // Remplacer les array en mode math par un badge (car complexe avec KaTeX)
    cleaned = cleaned.replace(/\\begin\{array\}[\s\S]*?\\end\{array\}/gi, badge('📐', 'Matrice'));

    // Les listes enumerate/itemize seront converties en HTML par latexToHtml()
    // Donc on ne les supprime PAS ici (contrairement à avant)

    // Supprimer les commentaires LaTeX
    cleaned = cleaned.replace(/%[^\n]*/g, '');

    // Nettoyer les commandes PST avancées (souvent mal fermées)
    cleaned = cleaned.replace(/\\psplot[\s\S]*?\}/gi, '');
    cleaned = cleaned.replace(/\\psline[\s\S]*?\}/gi, '');
    cleaned = cleaned.replace(/\\psaxes[\s\S]*?\}/gi, '');
    cleaned = cleaned.replace(/\\psgrid[\s\S]*?\}/gi, '');
    cleaned = cleaned.replace(/\\psdot[\s\S]*?\}/gi, '');

    // Nettoyer les définitions de fonctions PostScript (comme dans ton exemple)
    cleaned = cleaned.replace(/\{[^}]*mul[^}]*add[^}]*\}/gi, ''); // {x 2 neg mul 4 add}
    cleaned = cleaned.replace(/_[a-zA-Z]\$/gi, ''); // _f$

    // Nettoyer les espaces LaTeX spéciaux
    cleaned = cleaned.replace(/\\,/g, ' ');
    cleaned = cleaned.replace(/~+/g, ' ');
    cleaned = cleaned.replace(/\\\s+/g, ' ');

    // Nettoyer les retours à la ligne multiples
    cleaned = cleaned.replace(/\n\s*\n\s*\n/g, '\n\n');

    // Nettoyer les artefacts résiduels (parenthèses vides, accolades orphelines)
    cleaned = cleaned.replace(/\(\s*\)/g, '');
    cleaned = cleaned.replace(/\{\s*\}/g, '');
    cleaned = cleaned.replace(/\[\s*\]/g, '');

    // Nettoyer les $ orphelins (souvent après vspace)
    cleaned = cleaned.replace(/\$\s*$/gm, ''); // $ en fin de ligne
    cleaned = cleaned.replace(/^\s*\$/gm, ''); // $ en début de ligne

    // Nettoyer les coordonnées orphelines de type (x,y)(x,y)
    cleaned = cleaned.replace(/\(-?\d+\.?\d*,-?\d+\.?\d*\)\s*\(-?\d+\.?\d*,-?\d+\.?\d*\)/g, '');
    cleaned = cleaned.replace(/\(-?\d+\.?\d*,-?\d+\.?\d*\)/g, '');

    // Nettoyer les accolades avec juste des nombres (restes de coordonnées PST)
    cleaned = cleaned.replace(/\{\d+\.?\d*\}/g, '');

    // Nettoyer les séquences d'accolades multiples
    cleaned = cleaned.replace(/\}\s*\{/g, ' ');

    cleaned = cleaned.trim();

    return cleaned;
}

/**
 * Parse un fichier LaTeX d'exercice DNB et extrait les questions
 *
 * Analyse le code LaTeX de l'énoncé et de la correction pour extraire
 * individuellement chaque question (détectées via les \item dans enumerate).
 * Si aucun environnement enumerate n'est trouvé, l'exercice est considéré
 * comme une question unique.
 *
 * @param {string} latexContent - Le contenu LaTeX de l'énoncé
 * @param {string} latexCorrection - Le contenu LaTeX de la correction
 * @param {string} exerciceId - L'ID de l'exercice DNB
 * @returns {Object|null} Objet avec {enonces: string[], corrections: string[]} ou null si erreur
 *
 * @example
 * const parsed = parseLatexQuestions(texContent, corrContent, "dnb_2024_01");
 * // Retourne: { enonces: ["Question 1...", "Question 2..."], corrections: ["Réponse 1...", "Réponse 2..."] }
 *
 * @dependencies
 * - appState.dnbData (global) : pour récupérer l'année de l'exercice
 * - cleanComplexLatex() (local)
 * - latexToHtml() (local)
 *
 * @module exercises
 */
function parseLatexQuestions(latexContent, latexCorrection, exerciceId) {
    // Vérifier si le contenu est du HTML (erreur 404)
    if (latexContent.trim().toLowerCase().startsWith('<!doctype') || latexContent.trim().toLowerCase().startsWith('<html')) {
        console.warn('⚠️ Fichier LaTeX non disponible (erreur 404)');
        return null;
    }

    if (latexCorrection && (latexCorrection.trim().toLowerCase().startsWith('<!doctype') || latexCorrection.trim().toLowerCase().startsWith('<html'))) {
        console.warn('⚠️ Fichier LaTeX de correction non disponible (erreur 404)');
        latexCorrection = '';
    }

    const enonces = [];
    const corrections = [];

    // Fonction helper pour extraire les items
    function extractItems(content, isEnonce) {
        const items = [];

        // Trouver le bloc enumerate
        const enumerateMatch = content.match(/\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/i);
        if (!enumerateMatch) {
            // Pas de enumerate = exercice en bloc unique
            // Nettoyer le contenu et le retourner comme une seule question
            let cleanContent = cleanComplexLatex(content, exerciceId);
            cleanContent = latexToHtml(cleanContent, exerciceId);

            // Si le contenu est trop court ou vide, utiliser le PNG
            if (cleanContent.trim().length < 50) {
                const pngUrl = `https://coopmaths.fr/alea/static/dnb/${appState.dnbData[exerciceId].annee}/tex/png/${exerciceId}.png`;
                return [`<div style="padding: 15px; background: #e3f2fd; border: 2px solid #2196F3; border-radius: 8px; text-align: center;">
                    <p style="margin-bottom: 10px; font-weight: 600;">📋 Exercice complet (avec graphiques/tableaux)</p>
                    <img src="${pngUrl}" style="max-width: 100%; border-radius: 8px;" alt="Exercice complet">
                </div>`];
            }

            return [cleanContent];
        }

        const enumerateContent = enumerateMatch[1];

        // Protéger les enumerates imbriqués en les remplaçant par des marqueurs
        let protectedContent = enumerateContent;
        const nestedEnumerates = [];
        let nestIndex = 0;

        // Remplacer récursivement tous les \begin{enumerate}...\end{enumerate} imbriqués
        while (protectedContent.match(/\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/i)) {
            protectedContent = protectedContent.replace(
                /\\begin\{enumerate\}(?:\[[^\]]*\])?([\s\S]*?)\\end\{enumerate\}/i,
                (match) => {
                    const marker = `___NESTED_ENUM_${nestIndex}___`;
                    nestedEnumerates[nestIndex] = match;
                    nestIndex++;
                    return marker;
                }
            );
        }

        // Découper par \item (maintenant les \item imbriqués sont protégés)
        const parts = protectedContent.split(/\\item[\s\n\r\t]*/);

        // Ignorer le premier élément (avant le premier \item)
        for (let i = 1; i < parts.length; i++) {
            let itemContent = parts[i].trim();
            if (itemContent) {
                // Restaurer les enumerates imbriqués
                for (let j = 0; j < nestedEnumerates.length; j++) {
                    itemContent = itemContent.replace(`___NESTED_ENUM_${j}___`, nestedEnumerates[j]);
                }

                // Nettoyer le LaTeX complexe
                itemContent = cleanComplexLatex(itemContent, exerciceId);
                const htmlContent = latexToHtml(itemContent, exerciceId);

                // Si le contenu converti contient encore beaucoup de commandes LaTeX non résolues
                // ou est trop court, utiliser l'image PNG comme fallback
                const hasUnresolvedLatex = (htmlContent.match(/\\[a-zA-Z]+/g) || []).length > 5;
                const hasBadges = htmlContent.includes('📐') || htmlContent.includes('📊') || htmlContent.includes('🌳');
                const isTooShort = htmlContent.trim().replace(/<[^>]*>/g, '').length < 30;

                if (hasUnresolvedLatex || (hasBadges && isTooShort)) {
                    // Fallback: utiliser le PNG de l'exercice complet
                    const year = appState.dnbData[exerciceId]?.annee;
                    if (year) {
                        const pngUrl = `https://coopmaths.fr/alea/static/dnb/${year}/tex/png/${exerciceId}.png`;
                        items.push(`<div style="padding: 10px; background: #f8f9fa; border-radius: 8px; margin: 5px 0;">
                            <img src="${pngUrl}" style="max-width: 100%; border-radius: 4px;" alt="Question ${items.length + 1}">
                        </div>`);
                    } else {
                        items.push(htmlContent); // Pas d'année, on garde le HTML même s'il est imparfait
                    }
                } else {
                    items.push(htmlContent);
                }
            }
        }

        return items;
    }

    // Extraire les énoncés
    const enonceItems = extractItems(latexContent, true);

    // Extraire les corrections
    const correctionItems = latexCorrection ? extractItems(latexCorrection, false) : [];

    console.log(`📄 Parser: ${enonceItems.length} question(s) détectée(s) pour ${exerciceId}`);
    console.log(`📝 Parser: ${correctionItems.length} correction(s) trouvée(s) pour ${exerciceId}`);

    // Avertir si mismatch entre questions et corrections
    if (correctionItems.length > 0 && enonceItems.length !== correctionItems.length) {
        console.warn(`⚠️ Mismatch: ${enonceItems.length} questions mais ${correctionItems.length} corrections pour ${exerciceId}`);
    }

    return {
        enonces: enonceItems,
        corrections: correctionItems
    };
}

/**
 * Déclenche le rendu KaTeX sur un élément DOM
 *
 * Parcourt l'élément et rend toutes les formules mathématiques en utilisant KaTeX.
 * Supporte les délimiteurs : $...$ (inline), $$...$$ (display), \(...\) (inline), \[...\] (display).
 *
 * @param {HTMLElement} element - L'élément DOM à traiter
 *
 * @example
 * const div = document.getElementById('question1');
 * renderKatexInElement(div);
 *
 * @dependencies
 * - renderMathInElement (bibliothèque KaTeX auto-render)
 *
 * @module exercises
 */
function renderKatexInElement(element) {
    if (typeof renderMathInElement !== 'undefined') {
        renderMathInElement(element, {
            delimiters: [
                { left: '\\[', right: '\\]', display: true },
                { left: '\\(', right: '\\)', display: false },
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false }
            ],
            throwOnError: false,
            errorColor: '#CC0000',
            strict: 'warn',
            trust: false
        });
    }
}

/**
 * Déclenche le rendu Scratchblocks sur un élément DOM
 *
 * Recherche tous les blocs <pre class="blocks"> et les rend visuellement
 * en utilisant la bibliothèque scratchblocks.
 *
 * @param {HTMLElement} element - L'élément DOM à traiter
 *
 * @example
 * const div = document.getElementById('exerciceContent');
 * renderScratchblocksInElement(div);
 *
 * @dependencies
 * - scratchblocks (bibliothèque externe)
 *
 * @module exercises
 */
function renderScratchblocksInElement(element) {
    if (typeof scratchblocks !== 'undefined') {
        // Trouver tous les éléments <pre class="blocks"> dans l'élément
        const blocks = element.querySelectorAll('pre.blocks');
        blocks.forEach(block => {
            try {
                // Rendre le bloc Scratch
                scratchblocks.renderMatching('pre.blocks', {
                    style: 'scratch3',
                    languages: ['fr', 'en'],
                    scale: 0.75
                });
            } catch (e) {
                console.error('Erreur rendu scratchblocks:', e);
            }
        });
    }
}

// === GESTION DES AUTOMATISMES ===

/**
 * Initialise les données des automatismes depuis le dictionnaire MathALÉA
 *
 * Charge le dictionnaire des automatismes et déclenche le rendu de la grille.
 * Si le dictionnaire n'est pas encore chargé, réessaye après 1 seconde.
 *
 * @example
 * initAutomatismesData();
 *
 * @dependencies
 * - window.dictionnaireAutomatismes (global) : dictionnaire des automatismes MathALÉA
 * - appState.automatismesData (global)
 * - renderAutomatismes() (local)
 *
 * @module exercises
 */
function initAutomatismesData() {
    console.log('🚀 initAutomatismesData appelée');
    console.log('📦 dictionnaireAutomatismes défini?', typeof window.dictionnaireAutomatismes !== 'undefined');

    if (typeof window.dictionnaireAutomatismes !== 'undefined') {
        appState.automatismesData = window.dictionnaireAutomatismes;
        console.log(`✅ ${Object.keys(appState.automatismesData).length} automatismes chargés`);
        renderAutomatismes();
    } else {
        console.error('❌ dictionnaireAutomatismes non chargé');
        console.log('⏳ Nouvel essai dans 1 seconde...');
        setTimeout(() => {
            if (typeof window.dictionnaireAutomatismes !== 'undefined') {
                appState.automatismesData = window.dictionnaireAutomatismes;
                console.log(`✅ ${Object.keys(appState.automatismesData).length} automatismes chargés (retry)`);
                renderAutomatismes();
            } else {
                console.error('❌ dictionnaireAutomatismes toujours non chargé');
            }
        }, 1000);
    }
}

/**
 * Affiche les automatismes dans la grille de sélection
 *
 * Applique les filtres (catégorie, recherche) et déduplique les automatismes
 * par groupe avant de les afficher sous forme de cartes sélectionnables.
 *
 * @example
 * renderAutomatismes();
 *
 * @dependencies
 * - appState.automatismesData (global)
 * - appState.selectedAutomatismes (global)
 * - toggleAutomatisme() (local)
 * - updateAutomatismesDisplay() (local)
 *
 * @module exercises
 */
function renderAutomatismes() {
    // Protection: ne render que si la page automatismes est active
    const autoPage = document.getElementById('automatismesSelectionPage');
    if (!autoPage || !autoPage.classList.contains('active')) {
        console.log('⚠️ renderAutomatismes() ignoré - page automatismes non active');
        return;
    }

    console.log('🎨 renderAutomatismes appelée - page automatismes active ✅');
    const grid = document.getElementById('automatismesGrid');
    console.log('📍 Grid element:', grid);
    if (!grid) {
        console.error('❌ automatismesGrid introuvable !');
        return;
    }

    const searchFilter = document.getElementById('searchAutomatismes')?.value.toLowerCase() || '';
    const categorieFilter = document.getElementById('categorieFilterAutomatismes')?.value || '';

    console.log('🔍 Filtres:', { searchFilter, categorieFilter });
    console.log('📦 automatismesData:', appState.automatismesData);

    let filtered = Object.entries(appState.automatismesData || {});
    console.log(`📊 Nombre total d'automatismes: ${filtered.length}`);

    // Filtrer par catégorie
    if (categorieFilter) {
        filtered = filtered.filter(([id, data]) => data.categorie === categorieFilter);
        console.log(`📊 Après filtre catégorie: ${filtered.length}`);
    }

    // Filtrer par recherche
    if (searchFilter) {
        filtered = filtered.filter(([id, data]) => {
            const searchLower = searchFilter.toLowerCase();
            return id.toLowerCase().includes(searchLower) ||
                   data.titre.toLowerCase().includes(searchLower);
        });
        console.log(`📊 Après filtre recherche: ${filtered.length}`);
    }

    // DÉDUPLIQUER : Regrouper par groupe et ne garder qu'un seul représentant
    const groupes = {};
    filtered.forEach(([id, data]) => {
        const groupe = data.groupe || id.replace(/-\d+$/, ''); // Ex: 3AutoP01-1 -> 3AutoP01
        if (!groupes[groupe]) {
            groupes[groupe] = [id, data];
        }
    });
    filtered = Object.values(groupes);
    console.log(`📊 Après déduplication (groupes uniques): ${filtered.length}`);

    grid.innerHTML = '';
    console.log(`✅ Affichage de ${filtered.length} automatismes dans la grille`);

    filtered.forEach(([id, data]) => {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        if (appState.selectedAutomatismes?.includes(id)) {
            card.classList.add('selected');
        }

        card.addEventListener('click', () => toggleAutomatisme(id));

        const categorieLabel = {
            '3AutoN': '🔢 Nombres',
            '3AutoG': '📐 Géométrie',
            '3AutoP': '📊 Proportionnalité',
            '3AutoI': '💻 Informatique'
        }[data.categorie] || data.categorie;

        card.innerHTML = `
            <div class="exercise-card-header">
                <div class="exercise-title">${id}</div>
                <input type="checkbox" ${appState.selectedAutomatismes?.includes(id) ? 'checked' : ''}
                       style="pointer-events: none;">
            </div>
            <div class="exercise-meta">
                <span class="exercise-badge">${categorieLabel}</span>
            </div>
            <div style="margin-top: 10px; color: #495057; font-size: 0.9em;">
                ${data.titre}
            </div>
        `;

        grid.appendChild(card);
    });

    updateAutomatismesDisplay();
}

/**
 * Toggle la sélection d'un automatisme
 *
 * Ajoute ou retire un automatisme de la liste de sélection.
 *
 * @param {string} automatismeId - L'ID de l'automatisme à toggle
 *
 * @example
 * toggleAutomatisme("3AutoN01");
 *
 * @dependencies
 * - appState.selectedAutomatismes (global)
 * - updateAutomatismesDisplay() (local)
 * - renderAutomatismes() (local)
 *
 * @module exercises
 */
async function toggleAutomatisme(automatismeId) {
    if (!appState.selectedAutomatismes) {
        appState.selectedAutomatismes = [];
    }
    const index = appState.selectedAutomatismes.indexOf(automatismeId);
    if (index > -1) {
        appState.selectedAutomatismes.splice(index, 1);
    } else {
        appState.selectedAutomatismes.push(automatismeId);
    }
    updateAutomatismesDisplay();
    renderAutomatismes();
}

/**
 * Met à jour l'affichage de la sélection des automatismes
 *
 * Actualise le compteur, le total de points et l'état du bouton de continuation.
 * Déclenche également la mise à jour de l'aperçu de l'exercice 1.
 *
 * @example
 * updateAutomatismesDisplay();
 *
 * @dependencies
 * - appState.selectedAutomatismes (global)
 * - updateExercice1Preview() (local)
 *
 * @module exercises
 */
function updateAutomatismesDisplay() {
    const count = appState.selectedAutomatismes?.length || 0;
    const countSpan = document.getElementById('automatismesCount');
    const pointsSpan = document.getElementById('automatismesPoints');
    const btnContinue = document.getElementById('btnContinueAutomatismes');

    if (countSpan) {
        countSpan.textContent = `${count} automatisme${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`;
    }

    // Calculer les points (1 point par automatisme par défaut)
    const totalPoints = count;
    if (pointsSpan) {
        const color = totalPoints > 6 ? '#dc3545' : (totalPoints === 6 ? '#28a745' : '#495057');
        pointsSpan.innerHTML = `Total: <strong style="color: ${color}">${totalPoints} / 6 points</strong>`;
    }

    if (btnContinue) {
        if (count > 0) {
            btnContinue.innerHTML = `Continuer avec les exercices DNB (${count} automatisme${count > 1 ? 's' : ''}) →`;
            btnContinue.disabled = false;
        } else {
            btnContinue.innerHTML = 'Continuer avec les exercices DNB →';
            btnContinue.disabled = false;
        }
    }

    // Afficher/masquer l'aperçu et le mettre à jour
    updateExercice1Preview();
}

/**
 * Met à jour l'aperçu de l'Exercice 1 (automatismes)
 *
 * Génère et affiche un aperçu des questions de l'exercice 1 basé sur
 * les automatismes sélectionnés. Utilise les générateurs locaux si disponibles.
 *
 * @example
 * updateExercice1Preview();
 *
 * @dependencies
 * - appState.selectedAutomatismes (global)
 * - appState.automatismesData (global)
 * - window.genererAutomatisme (fonction globale) : générateur d'automatismes
 * - renderMathInElement (bibliothèque KaTeX) : rendu des formules
 *
 * @module exercises
 */
function updateExercice1Preview() {
    const previewDiv = document.getElementById('exercice1Preview');
    const contentDiv = document.getElementById('exercice1PreviewContent');

    if (!previewDiv || !contentDiv) return;

    const selected = appState.selectedAutomatismes || [];

    if (selected.length === 0) {
        previewDiv.style.display = 'none';
        return;
    }

    previewDiv.style.display = 'block';

    let html = '<div style="display: flex; flex-direction: column; gap: 15px;">';

    selected.forEach((autoId, index) => {
        const autoData = appState.automatismesData[autoId];
        if (!autoData) return;

        // GÉNÉRATION INSTANTANÉE de la question
        let questionPreview = '';
        let hasGenerator = false;

        if (typeof window.genererAutomatisme === 'function') {
            const generated = window.genererAutomatisme(autoId);
            if (generated !== null) {
                hasGenerator = true;
                // Garder le HTML avec les formules LaTeX
                questionPreview = generated.question;
            }
        }

        html += `
            <div style="border-left: 4px solid #4285f4; padding-left: 15px; background: white; padding: 12px; border-radius: 6px;">
                <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                    <strong style="color: #2c3e50;">Question ${index + 1}</strong>
                    <span style="background: #4285f4; color: white; padding: 3px 8px; border-radius: 12px; font-size: 0.85em; font-weight: bold;">1 pt</span>
                </div>
                <div style="color: #495057; margin-top: 5px;">
                    <strong>${autoId}:</strong> ${autoData.titre}
                </div>
                ${hasGenerator ? `
                    <div style="margin-top: 10px; padding: 10px; background: #e8f5e9; border-radius: 6px; border: 1px solid #4caf50;">
                        <div style="font-size: 0.85em; color: #2e7d32; line-height: 1.5;">
                            ✅ <strong>Aperçu :</strong> ${questionPreview}
                        </div>
                    </div>
                ` : `
                    <div style="margin-top: 10px; padding: 8px; background: #fff3cd; border-radius: 6px; font-size: 0.85em; color: #856404;">
                        ⚠️ Générateur à implémenter
                    </div>
                `}
                <div style="margin-top: 8px;">
                    <span style="background: #e3f2fd; color: #1565c0; padding: 4px 8px; border-radius: 12px; font-size: 0.8em;">
                        ${autoData.categorie === '3AutoN' ? '🔢 Nombres' :
                          autoData.categorie === '3AutoG' ? '📐 Géométrie' :
                          autoData.categorie === '3AutoP' ? '📊 Proportionnalité' :
                          autoData.categorie === '3AutoI' ? '💻 Informatique' : autoData.categorie}
                    </span>
                </div>
            </div>
        `;
    });

    const totalPoints = selected.length;
    const pointsStatus = totalPoints > 6 ? '⚠️ Trop de points !' :
                        totalPoints === 6 ? '✅ Parfait (6/6 points)' :
                        `ℹ️ Il reste ${6 - totalPoints} point${6 - totalPoints > 1 ? 's' : ''} à attribuer`;

    html += `
        <div style="padding: 12px; background: ${totalPoints > 6 ? '#fff3cd' : totalPoints === 6 ? '#d4edda' : '#d1ecf1'};
                    border-radius: 6px; border-left: 4px solid ${totalPoints > 6 ? '#ffc107' : totalPoints === 6 ? '#28a745' : '#17a2b8'};">
            <strong style="color: ${totalPoints > 6 ? '#856404' : totalPoints === 6 ? '#155724' : '#0c5460'};">
                ${pointsStatus}
            </strong>
        </div>
    `;

    html += '</div>';
    contentDiv.innerHTML = html;

    // Rendre les formules LaTeX avec KaTeX
    if (typeof renderMathInElement !== 'undefined') {
        setTimeout(() => {
            renderMathInElement(contentDiv, {
                delimiters: [
                    {left: "$$", right: "$$", display: true},
                    {left: "$", right: "$", display: false},
                    {left: "\\[", right: "\\]", display: true},
                    {left: "\\(", right: "\\)", display: false}
                ],
                throwOnError: false
            });
        }, 100);
    }
}

/**
 * Toggle l'affichage de l'aperçu de l'exercice 1 (plier/déplier)
 *
 * @example
 * toggleExercice1Preview();
 *
 * @module exercises
 */
function toggleExercice1Preview() {
    const contentDiv = document.getElementById('exercice1PreviewContent');
    const toggleText = document.getElementById('previewToggleText');

    if (contentDiv.style.display === 'none') {
        contentDiv.style.display = 'block';
        toggleText.textContent = '▼';
    } else {
        contentDiv.style.display = 'none';
        toggleText.textContent = '▶';
    }
}

/**
 * Filtre les automatismes selon les critères de recherche
 *
 * Déclenche un nouveau rendu de la grille avec les filtres appliqués.
 *
 * @example
 * filterAutomatismes();
 *
 * @dependencies
 * - renderAutomatismes() (local)
 *
 * @module exercises
 */
function filterAutomatismes() {
    renderAutomatismes();
}

/**
 * Efface tous les filtres des automatismes
 *
 * Réinitialise les champs de filtrage et déclenche un nouveau rendu.
 *
 * @example
 * clearAutomatismesFilters();
 *
 * @dependencies
 * - renderAutomatismes() (local)
 *
 * @module exercises
 */
function clearAutomatismesFilters() {
    document.getElementById('searchAutomatismes').value = '';
    document.getElementById('categorieFilterAutomatismes').value = '';
    renderAutomatismes();
}

/**
 * Continue vers la sélection DNB après avoir sélectionné les automatismes
 *
 * Valide la sélection (max 6 points) puis génère l'exercice 1
 * et passe à l'étape suivante du workflow.
 *
 * @example
 * continueFromAutomatismes();
 *
 * @dependencies
 * - appState.selectedAutomatismes (global)
 * - createExercise1FromAutomatismes() (local)
 * - completeStepAndNext() (fonction externe du workflow)
 *
 * @module exercises
 */
function continueFromAutomatismes() {
    if (!appState.selectedAutomatismes || appState.selectedAutomatismes.length === 0) {
        alert('⚠️ Veuillez sélectionner au moins un automatisme pour l\'exercice 1');
        return;
    }

    const totalPoints = appState.selectedAutomatismes.length;

    if (totalPoints > 6) {
        alert('❌ Vous avez sélectionné trop d\'automatismes (max 6 points)');
        return;
    }

    console.log('🔄 Génération des questions pour les automatismes sélectionnés...');

    // Créer l'exercice 1 directement (génération locale via notre code)
    createExercise1FromAutomatismes();

    console.log('✅ Exercice 1 créé avec génération locale');

    // Passer à l'étape suivante du workflow
    completeStepAndNext(1);
}

/**
 * Crée l'exercice 1 (Automatismes) à partir des automatismes sélectionnés
 *
 * Génère les questions en utilisant les générateurs locaux (window.genererAutomatisme)
 * et construit la structure de exercisesData[1] avec répartition automatique des 6 points.
 *
 * @example
 * createExercise1FromAutomatismes();
 *
 * @dependencies
 * - appState.selectedAutomatismes (global)
 * - appState.automatismesData (global)
 * - exercisesData (global) : modifié par cette fonction
 * - window.genererAutomatisme (fonction globale) : générateur d'automatismes
 * - distributePoints() (local)
 *
 * @module exercises
 */
function createExercise1FromAutomatismes() {
    const selected = appState.selectedAutomatismes || [];
    const nbQuestions = selected.length;

    console.log('🔧🔧🔧 createExercise1FromAutomatismes APPELÉE 🔧🔧🔧');
    console.log('📊 Automatismes sélectionnés:', selected);
    console.log('📦 parsedAutomatismes:', appState.parsedAutomatismes);

    // Répartition automatique des 6 points
    const pointsPerQuestion = distributePoints(6, nbQuestions);

    console.log(`📝 Création Exercice 1: ${nbQuestions} questions, répartition: [${pointsPerQuestion.join(', ')}]`);

    // Construire les questions de l'exercice 1
    const questions = [];
    selected.forEach((autoId, index) => {
        const autoData = appState.automatismesData[autoId];

        if (!autoData) {
            console.warn(`⚠️ Automatisme ${autoId} introuvable`);
            return;
        }

        // Génération avec nos générateurs locaux (PRODUCTION)
        let statement, answer;

        if (typeof window.genererAutomatisme === 'function') {
            const generated = window.genererAutomatisme(autoId);
            if (generated !== null) {
                statement = generated.question;
                answer = generated.correction;
                console.log(`  ✅ ${autoId} généré localement`);
            } else {
                // Fallback : utiliser le titre
                statement = `<p><strong>${autoData.titre}</strong></p>`;
                answer = `<p><em>Compétence à évaluer : ${autoData.titre}</em></p>`;
                console.warn(`  ⚠️ ${autoId} : pas de générateur`);
            }
        } else {
            console.warn('⚠️ genererAutomatisme non disponible');
            statement = `<p><strong>${autoData.titre}</strong></p>`;
            answer = `<p><em>Compétence à évaluer : ${autoData.titre}</em></p>`;
        }

        questions.push({
            id: `q${index + 1}`,
            title: `Question ${index + 1}`,
            points: pointsPerQuestion[index],
            statement: statement,
            answer: answer,
            competences: [], // Pas de compétences par défaut, elles seront ajoutées via le barème
            metadata: {
                autoId: autoId,
                categorie: autoData.categorie,
                titre: autoData.titre,
                uuid: autoData.uuid,
                url: autoData.url
            }
        });
    });

    // Remplacer l'exercice 1 dans exercisesData
    exercisesData[1] = {
        title: "📝 Exercice 1 - Automatismes",
        totalPoints: 6,
        questions: questions,
        isAutomatismes: true
    };

    console.log('✅ Exercice 1 créé:', exercisesData[1]);
    console.log(`✅ ${questions.length} questions créées pour Ex1`);
    questions.forEach((q, i) => {
        console.log(`  Q${i+1}: ${q.points}pts - ${q.metadata.titre}`);
    });
}

/**
 * Distribue équitablement des points entre plusieurs questions
 *
 * Répartit le total de points entre n questions, en distribuant d'abord
 * équitablement puis en ajoutant les points restants aux premières questions.
 *
 * @param {number} totalPoints - Le total de points à distribuer
 * @param {number} nbQuestions - Le nombre de questions
 * @returns {number[]} Tableau avec le nombre de points par question
 *
 * @example
 * distributePoints(6, 4);
 * // Retourne: [2, 2, 1, 1]
 *
 * @module exercises
 */
function distributePoints(totalPoints, nbQuestions) {
    if (nbQuestions === 0) return [];

    const basePoints = Math.floor(totalPoints / nbQuestions);
    const remainder = totalPoints - (basePoints * nbQuestions);

    const distribution = new Array(nbQuestions).fill(basePoints);

    // Distribuer le reste point par point sur les premières questions
    for (let i = 0; i < remainder; i++) {
        distribution[i]++;
    }

    return distribution;
}

// === GESTION DES EXERCICES DNB ===

/**
 * Initialise les données des exercices DNB
 *
 * Charge le dictionnaire DNB et prépare les filtres.
 * Le rendu sera effectué automatiquement lors de la navigation vers la page DNB.
 *
 * @example
 * initDNBData();
 *
 * @dependencies
 * - dictionnaireDNB (global) : dictionnaire des exercices DNB
 * - appState.dnbData (global)
 * - populateFilters() (local)
 *
 * @module exercises
 */
function initDNBData() {
    console.log('🚀 initDNBData appelée');
    console.log('📦 dictionnaireDNB défini?', typeof dictionnaireDNB !== 'undefined');

    if (typeof dictionnaireDNB !== 'undefined') {
        appState.dnbData = dictionnaireDNB;
        console.log(`✅ ${Object.keys(appState.dnbData).length} exercices DNB chargés`);

        // Préparer les filtres (mais ne pas render encore, la page n'est pas active)
        populateFilters();
        // renderExercises() sera appelé automatiquement quand l'utilisateur navigera vers la page DNB
    } else {
        console.error('❌ dictionnaireDNB non chargé');
    }
}

/**
 * Remplit les filtres de la page de sélection DNB
 *
 * Extrait toutes les années et tous les thèmes des exercices DNB
 * et remplit les éléments <select> correspondants.
 *
 * @example
 * populateFilters();
 *
 * @dependencies
 * - appState.dnbData (global)
 *
 * @module exercises
 */
function populateFilters() {
    const years = new Set();
    const themes = new Set();

    Object.values(appState.dnbData).forEach(ex => {
        years.add(ex.annee);
        if (ex.tags && ex.tags.length > 0) {
            ex.tags.forEach(tag => themes.add(tag));
        }
    });

    const yearSelect = document.getElementById('filterYear');
    Array.from(years).sort().reverse().forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearSelect.appendChild(option);
    });

    const themeSelect = document.getElementById('filterTheme');
    Array.from(themes).sort().forEach(theme => {
        const option = document.createElement('option');
        option.value = theme;
        option.textContent = theme;
        themeSelect.appendChild(option);
    });
}

/**
 * Supprime les accents d'une chaîne de caractères
 *
 * Utilisé pour les recherches insensibles aux accents.
 *
 * @param {string} str - La chaîne à traiter
 * @returns {string} La chaîne sans accents
 *
 * @example
 * removeAccents("Élémentaire");
 * // Retourne: "Elementaire"
 *
 * @module exercises
 */
function removeAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

/**
 * Effectue une recherche avancée dans les exercices DNB
 *
 * Implémente une logique de recherche avec opérateurs ET/OU.
 * Les mots séparés par des espaces sont en ET logique.
 * Les mots séparés par + sont en OU logique.
 *
 * @param {string} input - La chaîne de recherche
 * @param {Object} data - Le dictionnaire des exercices DNB
 * @returns {Array} Tableau de paires [id, exercice] correspondant aux critères
 *
 * @example
 * advancedSearch("2024 Pythagore+Thalès", dictionnaireDNB);
 * // Retourne les exercices de 2024 contenant "Pythagore" OU "Thalès"
 *
 * @dependencies
 * - removeAccents() (local)
 *
 * @module exercises
 */
function advancedSearch(input, data) {
    if (!input || input.length === 0) return Object.entries(data);

    // Parser l'input : séparer les mots et identifier les opérateurs + (OU)
    const words = [];
    const tempWords = input.trim().split(/\s+/);

    for (const w of tempWords) {
        if (w.includes('+')) {
            const parts = w.split('+');
            const first = parts.shift();
            if (first) words.push({ word: first, connector: 'ET' });
            for (const p of parts) {
                words.push({ word: p, connector: 'OU' });
            }
        } else {
            words.push({ word: w, connector: 'ET' });
        }
    }

    // Fonction pour tester si un exercice matche un mot
    function matchesWord(word, id, ex) {
        const wordNoAccent = removeAccents(word.toLowerCase());

        // Match ID
        if (removeAccents(id.toLowerCase()).includes(wordNoAccent)) return true;

        // Match année
        if (ex.annee.toString().includes(wordNoAccent)) return true;

        // Match lieu
        if (removeAccents(ex.lieu.toLowerCase()).includes(wordNoAccent)) return true;

        // Match mois
        if (ex.mois && removeAccents(ex.mois.toLowerCase()).includes(wordNoAccent)) return true;

        // Match tags
        if (ex.tags && ex.tags.some(tag =>
            removeAccents(tag.toLowerCase()).includes(wordNoAccent)
        )) return true;

        return false;
    }

    // Appliquer la logique ET/OU
    return Object.entries(data).filter(([id, ex]) => {
        let currentGroupMatches = [];
        let allGroups = [];

        for (let i = 0; i < words.length; i++) {
            const { word, connector } = words[i];
            const matches = matchesWord(word, id, ex);

            if (i === 0 || connector === 'OU') {
                currentGroupMatches.push(matches);
            } else {
                // Connector ET : on finalise le groupe précédent
                allGroups.push(currentGroupMatches.some(m => m));
                currentGroupMatches = [matches];
            }
        }

        // Finaliser le dernier groupe
        allGroups.push(currentGroupMatches.some(m => m));

        // Tous les groupes ET doivent être vrais
        return allGroups.every(g => g);
    });
}

/**
 * Efface le champ de recherche DNB et relance le filtrage
 *
 * @example
 * clearSearch();
 *
 * @dependencies
 * - applyFilters() (local)
 *
 * @module exercises
 */
function clearSearch() {
    document.getElementById('filterSearch').value = '';
    applyFilters();
}

/**
 * Réinitialise tous les filtres DNB et relance le rendu
 *
 * @example
 * clearAllFilters();
 *
 * @dependencies
 * - applyFilters() (local)
 *
 * @module exercises
 */
function clearAllFilters() {
    document.getElementById('filterYear').value = '';
    document.getElementById('filterTheme').value = '';
    document.getElementById('filterSearch').value = '';
    applyFilters();
}

/**
 * Applique les filtres DNB en relançant le rendu
 *
 * @example
 * applyFilters();
 *
 * @dependencies
 * - renderExercises() (local)
 *
 * @module exercises
 */
function applyFilters() {
    renderExercises();
}

/**
 * Affiche les exercices DNB filtrés dans la grille de sélection
 *
 * Applique tous les filtres actifs (année, thème, recherche avancée),
 * trie les résultats par année décroissante puis par mois, et affiche
 * les cartes d'exercices avec leurs métadonnées.
 *
 * @example
 * renderExercises();
 *
 * @dependencies
 * - appState.dnbData (global)
 * - appState.selectedExercises (global)
 * - advancedSearch() (local)
 * - toggleExercise() (local)
 * - previewExercise() (local)
 *
 * @module exercises
 */
function renderExercises() {
    // Protection: ne render que si la page DNB est active
    const dnbPage = document.getElementById('dnbSelectionPage');
    if (!dnbPage || !dnbPage.classList.contains('active')) {
        console.log('⚠️ renderExercises() ignoré - page DNB non active');
        return;
    }

    console.log('🔍 renderExercises appelée');
    const grid = document.getElementById('exercisesGrid');

    const yearFilter = document.getElementById('filterYear').value;
    const themeFilter = document.getElementById('filterTheme').value;
    const searchFilter = document.getElementById('filterSearch').value;

    // Gérer l'affichage du bouton "×" dans le champ de recherche
    const btnClearSearch = document.getElementById('btnClearSearch');
    if (searchFilter && searchFilter.trim().length > 0) {
        btnClearSearch.style.display = 'block';
    } else {
        btnClearSearch.style.display = 'none';
    }

    let filtered = Object.entries(appState.dnbData);
    const totalExercises = filtered.length;

    // Filtre par recherche avancée (si présent)
    if (searchFilter && searchFilter.trim().length > 0) {
        filtered = advancedSearch(searchFilter, appState.dnbData);
    }

    // Filtre par année
    if (yearFilter) {
        filtered = filtered.filter(([id, ex]) => ex.annee == yearFilter);
    }

    // Filtre par thème
    if (themeFilter) {
        filtered = filtered.filter(([id, ex]) => ex.tags && ex.tags.includes(themeFilter));
    }

    // Détecter si des filtres sont actifs
    const hasActiveFilters = yearFilter || themeFilter || (searchFilter && searchFilter.trim().length > 0);

    // Afficher/masquer le bouton "Réinitialiser les filtres"
    const btnClearFilters = document.getElementById('btnClearFilters');
    if (hasActiveFilters) {
        btnClearFilters.style.display = 'block';
    } else {
        btnClearFilters.style.display = 'none';
    }

    // Afficher/masquer l'indicateur de filtres actifs
    const activeFiltersIndicator = document.getElementById('activeFiltersIndicator');
    const activeFiltersList = document.getElementById('activeFiltersList');
    if (hasActiveFilters) {
        const activeFiltersText = [];
        if (yearFilter) activeFiltersText.push(`Année: ${yearFilter}`);
        if (themeFilter) activeFiltersText.push(`Thème: ${themeFilter}`);
        if (searchFilter && searchFilter.trim().length > 0) activeFiltersText.push(`Recherche: "${searchFilter}"`);

        activeFiltersList.textContent = activeFiltersText.join(' | ');
        activeFiltersIndicator.style.display = 'block';
    } else {
        activeFiltersIndicator.style.display = 'none';
    }

    // TRI : Plus récents en premier (année décroissante, puis mois)
    filtered.sort((a, b) => {
        const [idA, dataA] = a;
        const [idB, dataB] = b;

        // Priorité 1 : Année (décroissante)
        if (dataA.annee !== dataB.annee) {
            return dataB.annee - dataA.annee;
        }

        // Priorité 2 : Mois (décroissant si possible)
        const moisOrdre = {
            'Janvier': 1, 'Février': 2, 'Mars': 3, 'Avril': 4,
            'Mai': 5, 'Juin': 6, 'Juillet': 7, 'Août': 8,
            'Septembre': 9, 'Octobre': 10, 'Novembre': 11, 'Décembre': 12
        };
        const moisA = moisOrdre[dataA.mois] || 0;
        const moisB = moisOrdre[dataB.mois] || 0;
        if (moisA !== moisB) {
            return moisB - moisA;
        }

        // Priorité 3 : Lieu (alphabétique)
        return (dataA.lieu || '').localeCompare(dataB.lieu || '');
    });

    // Afficher le compteur de résultats de manière plus claire
    const filterResultsEl = document.getElementById('filterResults');
    if (hasActiveFilters) {
        filterResultsEl.innerHTML = `
            <span style="color: #856404; font-weight: 600;">
                📊 ${filtered.length} exercice(s) trouvé(s)
            </span>
            <span style="color: #999; font-weight: normal; margin-left: 8px;">
                (sur ${totalExercises} au total)
            </span>
        `;
    } else {
        filterResultsEl.innerHTML = `
            <span style="color: #28a745; font-weight: 600;">
                📚 ${filtered.length} exercice(s) disponible(s)
            </span>
        `;
    }

    console.log(`📊 Affichage de ${filtered.length} exercices`);

    grid.innerHTML = '';

    filtered.forEach(([id, data]) => {
        const card = document.createElement('div');
        card.className = 'exercise-card';
        if (appState.selectedExercises.includes(id)) {
            card.classList.add('selected');
        }

        // Clic sur la carte pour sélectionner
        card.addEventListener('click', (e) => {
            // Ne pas sélectionner si on clique sur le bouton Aperçu
            if (e.target.closest('.btn-preview')) return;
            toggleExercise(id);
        });

        // Filtrer les tags valides (non vides)
        const validTags = data.tags ? data.tags.filter(tag => tag && tag.trim().length > 0) : [];

        card.innerHTML = `
            <div class="exercise-card-header">
                <div class="exercise-title">${id}</div>
                <input type="checkbox" ${appState.selectedExercises.includes(id) ? 'checked' : ''}
                       style="pointer-events: none;">
            </div>
            <div class="exercise-meta">
                <span class="exercise-badge">📅 ${data.annee}</span>
                <span class="exercise-badge">📍 ${data.lieu}</span>
                ${data.mois ? `<span class="exercise-badge">📆 ${data.mois}</span>` : ''}
            </div>
            ${validTags.length > 0 ? `
                <div style="margin-top: 10px; display: flex; flex-wrap: wrap; gap: 6px;">
                    ${validTags.map(tag => `
                        <span style="
                            display: inline-block;
                            padding: 4px 10px;
                            background: #e3f2fd;
                            color: #1565c0;
                            border-radius: 12px;
                            font-size: 0.75em;
                            font-weight: 600;
                            line-height: 1.2;
                        ">${tag}</span>
                    `).join('')}
                </div>
            ` : ''}
            <div class="exercise-actions">
                <button class="btn-preview" onclick="event.stopPropagation(); previewExercise('${id}')">
                    👁️ Aperçu
                </button>
            </div>
        `;

        grid.appendChild(card);
    });
}

/**
 * Toggle la sélection d'un exercice DNB
 *
 * Ajoute ou retire un exercice de la liste de sélection.
 *
 * @param {string} exerciseId - L'ID de l'exercice à toggle
 *
 * @example
 * toggleExercise("dnb_2024_09_metropole_1");
 *
 * @dependencies
 * - appState.selectedExercises (global)
 * - updateSelectionDisplay() (local)
 * - renderExercises() (local)
 *
 * @module exercises
 */
function toggleExercise(exerciseId) {
    const index = appState.selectedExercises.indexOf(exerciseId);
    if (index > -1) {
        appState.selectedExercises.splice(index, 1);
        console.log(`➖ Exercice retiré: ${exerciseId}`);
    } else {
        appState.selectedExercises.push(exerciseId);
        console.log(`➕ Exercice ajouté: ${exerciseId}`);
    }
    console.log(`📋 Total sélectionné: ${appState.selectedExercises.length}`, appState.selectedExercises);
    updateSelectionDisplay();
    renderExercises();
}

/**
 * Met à jour l'affichage de la sélection DNB
 *
 * Actualise le compteur et l'état du bouton de continuation.
 *
 * @example
 * updateSelectionDisplay();
 *
 * @dependencies
 * - appState.selectedExercises (global)
 *
 * @module exercises
 */
function updateSelectionDisplay() {
    const count = appState.selectedExercises.length;
    const countEl = document.getElementById('selectionCount');
    const btnContinue = document.getElementById('btnContinue');

    console.log(`📊 updateSelectionDisplay: ${count} exercices sélectionnés`);

    countEl.textContent = `${count} exercice${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''}`;
    btnContinue.disabled = count === 0;

    console.log(`🔘 Bouton btnContinue.disabled = ${btnContinue.disabled}`);

    // Mettre à jour le texte du bouton avec le nombre en couleur
    if (count > 0) {
        btnContinue.innerHTML = `Continuer avec les <span style="color: #ff6b35; font-weight: bold;">${count}</span> exercice${count > 1 ? 's' : ''} sélectionné${count > 1 ? 's' : ''} →`;
    } else {
        btnContinue.innerHTML = 'Continuer avec les exercices sélectionnés →';
    }
}

/**
 * Prévisualise un exercice DNB
 *
 * Charge le fichier LaTeX de l'exercice et affiche son aperçu
 * (extrait LaTeX + image PNG) dans une modale.
 *
 * @param {string} exerciseId - L'ID de l'exercice à prévisualiser
 *
 * @example
 * previewExercise("dnb_2024_09_metropole_1");
 *
 * @dependencies
 * - appState.dnbData (global)
 *
 * @module exercises
 */
async function previewExercise(exerciseId) {
    const data = appState.dnbData[exerciseId];
    const year = data.annee;
    const texPath = `dnb/${year}/tex/${exerciseId}.tex`;
    const pngUrl = `https://coopmaths.fr/alea/static/dnb/${year}/tex/png/${exerciseId}.png`;

    try {
        const latexContent = await fetch(texPath).then(r => r.text());
        const modal = document.getElementById('previewModal');
        const body = document.getElementById('previewBody');

        body.innerHTML = `
            <h2>${exerciseId}</h2>
            <p><strong>Année:</strong> ${data.annee} | <strong>Lieu:</strong> ${data.lieu}</p>
            <img src="${pngUrl}" class="preview-image" alt="Aperçu exercice">
            <div class="preview-questions">
                <h3>Questions détectées:</h3>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 8px; overflow-x: auto;">${latexContent.substring(0, 500)}...</pre>
            </div>
        `;

        modal.classList.add('active');
    } catch (error) {
        alert('❌ Impossible de charger l\'aperçu. Serveur local requis (python3 server.py)');
    }
}

/**
 * Ferme la modale d'aperçu d'exercice DNB
 *
 * @example
 * closePreview();
 *
 * @module exercises
 */
function closePreview() {
    document.getElementById('previewModal').classList.remove('active');
}

// === GÉNÉRATION FINALE DE EXERCISESDATA ===

/**
 * Continue vers la page de configuration du barème
 *
 * Charge et parse tous les exercices DNB sélectionnés, crée la structure
 * finale de exercisesData (Ex1 + Ex2-5), initialise le barème et navigue
 * vers la page de conception du barème.
 *
 * @example
 * continueToSetup();
 *
 * @dependencies
 * - appState.selectedExercises (global)
 * - appState.baremeConfig (global)
 * - loadAndParseSelectedExercises() (fonction externe, non définie dans ce module)
 * - createFinalExercisesData() (local)
 * - renderBaremeDesignPage() (fonction externe, module bareme)
 * - completeStepAndNext() (fonction externe du workflow)
 *
 * @module exercises
 */
async function continueToSetup() {
    console.log('🎯 continueToSetup() appelé');
    console.log('📋 selectedExercises:', appState.selectedExercises);

    if (appState.selectedExercises.length === 0) {
        alert('⚠️ Veuillez sélectionner au moins un exercice');
        return;
    }

    console.log(`🔄 Chargement de ${appState.selectedExercises.length} exercices...`);

    // Charger et parser tous les exercices sélectionnés
    try {
        await loadAndParseSelectedExercises();

        console.log(`✅ ${appState.selectedExercises.length} exercices chargés`);

        // Créer exercisesData avec Ex1 (automatismes) + Ex2-5 (DNB)
        createFinalExercisesData();

        // Initialiser le barème pour tous les exercices (1-5)
        appState.baremeConfig.exercises = {};
        appState.baremeConfig.totalMax = 20; // DNB 2025 est sur 20 points

        // Ex1 (Automatismes) : totalPoints = nombre de questions, 1 pt/question par défaut
        if (exercisesData[1]) {
            const nbQuestions = exercisesData[1].questions.length;
            const questionPoints = {};
            for (let i = 0; i < nbQuestions; i++) {
                questionPoints[`q${i}`] = 1; // 1 point par question par défaut
            }

            appState.baremeConfig.exercises['1'] = {
                totalPoints: nbQuestions, // Total = nombre de questions
                selectedCompetences: [], // Pas de pré-sélection, l'utilisateur choisit par question
                pointsPerCompetence: {},
                questionCompetences: {}, // q{index}: ['Calculer', ...]
                questionPoints: questionPoints, // Points par question
                isFixed: false // Modifiable dans le barème
            };
        }

        // Ex2-5 (DNB) : totalPoints = nombre de questions, 1 pt/question par défaut
        console.log('🔧 Initialisation du barème pour les exercices DNB...');
        appState.selectedExercises.forEach((exerciseId, index) => {
            const exerciseNum = index + 2; // Ex2, Ex3, Ex4, Ex5
            const exerciseData = exercisesData[exerciseNum];
            const nbQuestions = exerciseData ? exerciseData.questions.length : 0;

            console.log(`📊 Ex${exerciseNum} (${exerciseId}): ${nbQuestions} questions`);
            console.log('  - exerciseData:', exerciseData);

            const questionPoints = {};
            for (let i = 0; i < nbQuestions; i++) {
                questionPoints[`q${i}`] = 1; // 1 point par question par défaut
            }

            appState.baremeConfig.exercises[exerciseNum.toString()] = {
                totalPoints: nbQuestions, // Total = nombre de questions
                selectedCompetences: [], // Pas de pré-sélection, l'utilisateur choisit par question
                pointsPerCompetence: {},
                questionPoints: questionPoints, // Points par question
                dnbId: exerciseId
            };

            console.log(`  ✅ Barème Ex${exerciseNum}: ${nbQuestions} pts (${nbQuestions} questions × 1 pt)`);
        });

        // Masquer la sélection, afficher la page de barème
        console.log('🔄 Transition vers le barème...');

        // Rendre la page de conception du barème
        console.log('🎨 Appel de renderBaremeDesignPage()...');
        renderBaremeDesignPage();
        console.log('✅ continueToSetup() terminé avec succès');

        // Passer à l'étape suivante du workflow
        completeStepAndNext(2);

    } catch (error) {
        console.error('❌ Erreur lors du chargement des exercices:', error);
        alert('❌ Impossible de charger les exercices. Assurez-vous que le serveur tourne.');
    }
}

/**
 * Crée la structure finale de exercisesData (Ex1 + Ex2-5)
 *
 * Recrée l'exercice 1 (automatismes) et ajoute les exercices DNB (Ex2-5)
 * parsés précédemment. Configure les points et compétences depuis le barème.
 *
 * @example
 * createFinalExercisesData();
 *
 * @dependencies
 * - appState.selectedAutomatismes (global)
 * - appState.selectedExercises (global)
 * - appState.parsedExercises (global)
 * - appState.dnbData (global)
 * - exercisesData (global) : modifié par cette fonction
 * - distributePoints() (local)
 *
 * @module exercises
 */
function createFinalExercisesData() {
    // Ex1 est déjà dans exercisesData (créé par createExercise1FromAutomatismes)

    console.log('🔧 createFinalExercisesData - Début');
    console.log('📋 selectedExercises:', appState.selectedExercises);
    console.log('📊 parsedExercises:', appState.parsedExercises);

    appState.selectedExercises.forEach((exerciseId, index) => {
        const exerciseNum = index + 2; // Ex2, Ex3, Ex4, Ex5
        const parsedExercise = appState.parsedExercises[exerciseId];
        const dnbData = appState.dnbData[exerciseId];

        console.log(`📝 Exercice ${exerciseNum} (${exerciseId}):`);
        console.log('  - parsedExercise:', parsedExercise);
        console.log('  - dnbData:', dnbData);
        console.log('  - questions:', parsedExercise?.questions?.length || 0);

        if (parsedExercise && dnbData) {
            exercisesData[exerciseNum] = {
                title: `Exercice ${exerciseNum} - ${exerciseId}`,
                totalPoints: 3.5, // Sera remplacé par la config du barème
                questions: parsedExercise.questions.map((q, qIndex) => ({
                    id: `q${qIndex + 1}`,
                    title: `Question ${qIndex + 1}`,
                    points: 1,
                    statement: q,
                    answer: parsedExercise.corrections[qIndex] || "Correction à venir",
                    competences: [] // Pas de compétences par défaut, elles seront ajoutées via le barème
                })),
                dnbId: exerciseId,
                metadata: {
                    annee: dnbData.annee,
                    lieu: dnbData.lieu
                }
            };
            console.log(`  ✅ Exercice ${exerciseNum} créé avec ${exercisesData[exerciseNum].questions.length} questions`);
        } else {
            console.warn(`  ⚠️ Exercice ${exerciseNum} NON créé (parsedExercise=${!!parsedExercise}, dnbData=${!!dnbData})`);
        }
    });

    console.log('✅ exercisesData final créé:', exercisesData);
}

/**
 * Génère exercisesData depuis la configuration du barème
 *
 * Recrée complètement exercisesData en appliquant les points et compétences
 * configurés dans le barème pour chaque question de chaque exercice.
 *
 * @returns {Object} Le nouvel objet exercisesData avec barème appliqué
 *
 * @example
 * const newData = generateExercisesDataFromSelection();
 *
 * @dependencies
 * - appState.selectedAutomatismes (global)
 * - appState.selectedExercises (global)
 * - appState.parsedExercises (global)
 * - appState.baremeConfig (global)
 * - defaultCompetences (global)
 * - distributePoints() (local)
 *
 * @module exercises
 */
function generateExercisesDataFromSelection() {
    console.log('🔧 Génération de exercisesData depuis le barème...');
    console.log('📋 exercisesData AVANT:', Object.keys(exercisesData), exercisesData);
    console.log('📋 appState.selectedAutomatismes:', appState.selectedAutomatismes);
    const newData = {};

    // 🎯 RECRÉER L'EXERCICE 1 (AUTOMATISMES) depuis appState
    if (appState.selectedAutomatismes && appState.selectedAutomatismes.length > 0) {
        console.log('✅ Recréation de l\'exercice 1 (automatismes) depuis appState');

        // Recréer l'exercice 1 exactement comme dans createExercise1FromAutomatismes()
        const selected = appState.selectedAutomatismes;
        const nbQuestions = selected.length;
        const pointsPerQuestion = distributePoints(6, nbQuestions);

        const questions = [];
        selected.forEach((autoId, index) => {
            const autoData = appState.automatismesData[autoId];

            if (!autoData) {
                console.warn(`⚠️ Automatisme ${autoId} introuvable`);
                return;
            }

            let statement, answer;

            if (typeof window.genererAutomatisme === 'function') {
                const generated = window.genererAutomatisme(autoId);
                if (generated !== null) {
                    statement = generated.question;
                    answer = generated.correction;
                } else {
                    statement = `<p><strong>${autoData.titre}</strong></p>`;
                    answer = `<p><em>Compétence à évaluer : ${autoData.titre}</em></p>`;
                }
            } else {
                statement = `<p><strong>${autoData.titre}</strong></p>`;
                answer = `<p><em>Compétence à évaluer : ${autoData.titre}</em></p>`;
            }

            questions.push({
                id: `q${index + 1}`,
                title: `Question ${index + 1}`,
                points: pointsPerQuestion[index],
                statement: statement,
                answer: answer,
                competences: [], // Pas de compétences par défaut, elles seront ajoutées via le barème
                metadata: {
                    autoId: autoId,
                    categorie: autoData.categorie,
                    titre: autoData.titre,
                    uuid: autoData.uuid,
                    url: autoData.url
                }
            });
        });

        newData[1] = {
            title: "📝 Exercice 1 - Automatismes",
            totalPoints: 6,
            questions: questions,
            isAutomatismes: true
        };

        console.log('✅ Exercice 1 recréé:', newData[1]);
    } else {
        console.warn('⚠️ Aucun automatisme sélectionné, exercice 1 non créé');
    }

    appState.selectedExercises.forEach((exerciseId, index) => {
        const parsed = appState.parsedExercises[exerciseId];
        if (!parsed) {
            console.warn(`⚠️ Exercice ${exerciseId} non parsé, ignoré`);
            return;
        }

        // 🔧 Commencer à 2 si l'exercice 1 existe, sinon à 1
        const exerciseNum = newData[1] ? index + 2 : index + 1;

        // 🔧 FIX: Le barème est stocké avec exerciseNum (ex: "2"), pas avec exerciseId (ex: "dnb_2025_09_metropole_2")
        const baremeData = appState.baremeConfig.exercises[exerciseNum.toString()];
        console.log(`🔍 Récupération barème pour Ex${exerciseNum}:`, baremeData);

        const questions = [];
        let totalPoints = baremeData ? baremeData.totalPoints : 0;

        console.log(`📊 Ex${exerciseNum} (${exerciseId}): totalPoints=${totalPoints}, baremeData exists=${!!baremeData}`);

        // Si pas de questions, créer une question unique avec le PNG
        if (!parsed.questions || parsed.questions.length === 0) {
            const pngUrl = `https://coopmaths.fr/alea/static/dnb/${parsed.metadata.annee}/tex/png/${exerciseId}.png`;
            questions.push({
                id: 'q1',
                title: 'Exercice complet',
                points: totalPoints,
                statement: `<img src="${pngUrl}" style="max-width: 100%; border-radius: 8px;" alt="Exercice ${exerciseId}">`,
                answer: "Voir correction complète",
                competences: []
            });
        } else {
            // Créer une question par item parsé avec les points et compétences du barème
            parsed.questions.forEach((qText, qIndex) => {
                const qKey = `q${qIndex}`;
                const qId = `q${qIndex + 1}`;
                const correction = parsed.corrections && parsed.corrections[qIndex] ? parsed.corrections[qIndex] : '';

                // Récupérer les points de la question depuis le barème
                const questionPoints = baremeData && baremeData.questionPoints && baremeData.questionPoints[qKey]
                    ? baremeData.questionPoints[qKey]
                    : 1;

                // Récupérer les compétences de la question depuis le barème
                const questionCompetences = [];
                if (baremeData && baremeData.questionCompetences && baremeData.questionCompetences[qKey]) {
                    const selectedCompNames = baremeData.questionCompetences[qKey];

                    selectedCompNames.forEach(compName => {
                        const defaultComp = defaultCompetences.find(dc => dc.name === compName);
                        if (defaultComp) {
                            // Récupérer les points de la compétence depuis le barème
                            const compPoints = baremeData.questionCompetencePoints &&
                                             baremeData.questionCompetencePoints[qKey] &&
                                             baremeData.questionCompetencePoints[qKey][compName]
                                ? baremeData.questionCompetencePoints[qKey][compName]
                                : (questionPoints / selectedCompNames.length);

                            questionCompetences.push({
                                name: compName,
                                color: defaultComp.color,
                                description: defaultComp.description,
                                tooltip: defaultComp.tooltip,
                                points: compPoints,
                                increment: 0.5  // Incrément de 0.5 pour correspondre aux points configurés
                            });
                        }
                    });
                }

                console.log(`  📝 Q${qIndex + 1}: ${questionPoints} pts, ${questionCompetences.length} compétences`);

                questions.push({
                    id: qId,
                    title: `Question ${qIndex + 1}`,
                    points: questionPoints,
                    statement: qText,
                    answer: correction || "Pas de correction disponible",
                    competences: questionCompetences
                });
            });
        }

        // Titre de l'exercice : utiliser le premier tag (thème) si disponible
        const metadata = parsed.metadata;
        let exerciseTitle = `Exercice ${exerciseNum}`;
        if (metadata.tags && metadata.tags.length > 0) {
            exerciseTitle = `Exercice ${exerciseNum} : ${metadata.tags[0]}`;
        }

        // Extraire les compétences uniques utilisées dans l'exercice
        const usedCompetences = [...new Set(
            questions.flatMap(q => q.competences.map(c => c.name))
        )];

        newData[exerciseNum] = {
            title: exerciseTitle,
            totalPoints: totalPoints,
            questions: questions,
            selectedCompetences: usedCompetences // Pré-sélectionner les compétences utilisées
        };
    });

    return newData;
}

// ============================================================================
// FIN DU MODULE EXERCISES
// ============================================================================
