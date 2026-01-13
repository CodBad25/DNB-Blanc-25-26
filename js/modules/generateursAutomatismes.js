/**
 * Générateurs d'automatismes DNB 2025
 * Versions simplifiées des exercices MathALÉA
 */

// Attendre que mathaleaUtils soit chargé
(function() {
    // Vérifier que mathaleaUtils est disponible
    if (typeof window.mathaleaUtils === 'undefined') {
        console.error('❌ mathaleaUtils non chargé !');
        return;
    }

    const { randint, shuffle, choice, fraction, arrondi, pgcd, simplifierFraction } = window.mathaleaUtils;

    /**
     * Générateur principal pour tous les automatismes
     */
    const generateurs = {
    // === NOMBRES ET CALCULS ===
    
    '3AutoN01-1': function() {
        // Déterminer la valeur décimale d'une fraction
        const num = randint(1, 20);
        const denoms = [2, 4, 5, 8, 10, 20, 25, 50];
        const den = choice(denoms);
        const resultat = arrondi(num / den, 2);
        
        return {
            question: `<p>Donner la valeur décimale de la fraction $\\dfrac{${num}}{${den}}$.</p>`,
            correction: `<p>$\\dfrac{${num}}{${den}} = ${resultat}$</p>`
        };
    },
    
    '3AutoN01-2': function() {
        // Calculer la fraction d'une quantité
        const frac = choice([{n:1,d:2}, {n:1,d:3}, {n:1,d:4}, {n:2,d:3}, {n:3,d:4}, {n:1,d:5}, {n:2,d:5}]);
        const quantite = randint(12, 100);
        const resultat = arrondi(quantite * frac.n / frac.d, 2);
        
        return {
            question: `<p>Calculer $\\dfrac{${frac.n}}{${frac.d}}$ de ${quantite}.</p>`,
            correction: `<p>$\\dfrac{${frac.n}}{${frac.d}} \\times ${quantite} = \\dfrac{${frac.n * quantite}}{${frac.d}} = ${resultat}$</p>`
        };
    },
    
    '3AutoN02-1': function() {
        // Multiplier/diviser par 10, 100, 1000
        const nombre = arrondi(randint(1, 999) / 10, 2);
        const operations = [
            {op: '×', mult: 10},
            {op: '×', mult: 100},
            {op: '×', mult: 1000},
            {op: '÷', mult: 10},
            {op: '÷', mult: 100}
        ];
        const choix = choice(operations);
        const resultat = choix.op === '×' ? nombre * choix.mult : arrondi(nombre / choix.mult, 4);
        
        return {
            question: `<p>Calculer : $${nombre} ${choix.op === '×' ? '\\times' : '\\div'} ${choix.mult}$</p>`,
            correction: `<p>$${nombre} ${choix.op === '×' ? '\\times' : '\\div'} ${choix.mult} = ${resultat}$</p>`
        };
    },
    
    '3AutoN02-2': function() {
        // Additionner/soustraire des nombres relatifs
        const a = randint(-10, 10, [0]);
        const b = randint(-10, 10, [0]);
        const op = choice(['+', '-']);
        const resultat = op === '+' ? a + b : a - b;
        
        return {
            question: `<p>Calculer : $${a} ${op} (${b})$</p>`,
            correction: `<p>$${a} ${op} (${b}) = ${resultat}$</p>`
        };
    },
    
    '3AutoN04-1': function() {
        // Calculer avec des fractions (addition/soustraction)
        const den = choice([2, 3, 4, 5, 6]);
        const num1 = randint(1, den - 1);
        const num2 = randint(1, den - 1);
        const op = choice(['+', '-']);
        const resultatNum = op === '+' ? num1 + num2 : num1 - num2;
        const frac = simplifierFraction(resultatNum, den);
        
        return {
            question: `<p>Calculer : $\\dfrac{${num1}}{${den}} ${op} \\dfrac{${num2}}{${den}}$</p>`,
            correction: `<p>$\\dfrac{${num1}}{${den}} ${op} \\dfrac{${num2}}{${den}} = \\dfrac{${resultatNum}}{${den}}${frac.num !== resultatNum ? ` = \\dfrac{${frac.num}}{${frac.den}}` : ''}$</p>`
        };
    },
    
    // === GÉOMÉTRIE ===
    
    '3AutoG01-1': function() {
        // VRAI code MathALÉA : Placer des points dans un repère
        // Génération des coordonnées selon la logique MathALÉA
        let x1 = randint(-6, -1);
        let x2 = randint(1, 6, [x1]);
        let x3 = randint(-6, 6, [0, x1, x2]);
        let x4 = 0;
        let y1 = randint(-6, -1);
        let y2 = randint(1, 6, [y1]);
        let y3 = randint(-6, 6, [0, y1, y2]);
        let y4 = 0;
        
        // Mélange pour éviter (0,0) - logique MathALÉA
        while (
            [
                [x1, y1],
                [x2, y2],
                [x3, y3],
                [x4, y4],
            ].some((e) => e[0] === 0 && e[1] === 0)
        ) {
            [x1, x2, x3, x4] = shuffle([x1, x2, x3, x4]);
            [y1, y2, y3, y4] = shuffle([y1, y2, y3, y4]);
        }
        
        // Créer le repère SVG
        const svgWidth = 400;
        const svgHeight = 400;
        const scale = 30;
        const centerX = svgWidth / 2;
        const centerY = svgHeight / 2;
        
        function coordToPixel(x, y) {
            return {
                x: centerX + x * scale,
                y: centerY - y * scale
            };
        }
        
        const A = coordToPixel(x1, y1);
        const B = coordToPixel(x2, y2);
        const C = coordToPixel(x3, y3);
        const D = coordToPixel(x4, y4);
        
        const question = `Placer les points suivants : $A(${x1}\\;;\\;${y1})$ ; $B(${x2}\\;;\\;${y2})$ ; $C(${x3}\\;;\\;${y3})$ et $D(${x4}\\;;\\;${y4})$ dans le repère ci-dessous.<br><br>
        <div style="text-align: center; margin: 20px;">
            <svg width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
                <!-- Grille -->
                <defs>
                    <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
                        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#ddd" stroke-width="1"/>
                    </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />
                
                <!-- Axes -->
                <line x1="0" y1="${centerY}" x2="${svgWidth}" y2="${centerY}" stroke="black" stroke-width="2"/>
                <line x1="${centerX}" y1="0" x2="${centerX}" y2="${svgHeight}" stroke="black" stroke-width="2"/>
                
                <!-- Graduations -->
                ${Array.from({length: 7}, (_, i) => {
                    const x = centerX + (i - 3) * scale;
                    return `<line x1="${x}" y1="${centerY - 5}" x2="${x}" y2="${centerY + 5}" stroke="black" stroke-width="1"/>
                            <text x="${x}" y="${centerY + 20}" text-anchor="middle" font-size="12">${i - 3}</text>`;
                }).join('')}
                
                ${Array.from({length: 7}, (_, i) => {
                    const y = centerY - (i - 3) * scale;
                    return `<line x1="${centerX - 5}" y1="${y}" x2="${centerX + 5}" y2="${y}" stroke="black" stroke-width="1"/>
                            <text x="${centerX - 20}" y="${y + 5}" text-anchor="middle" font-size="12">${i - 3}</text>`;
                }).join('')}
                
                <!-- Points à placer -->
                <circle cx="${A.x}" cy="${A.y}" r="4" fill="red" stroke="black" stroke-width="2"/>
                <text x="${A.x + 8}" y="${A.y - 8}" font-size="14" fill="red" font-weight="bold">A</text>
                
                <circle cx="${B.x}" cy="${B.y}" r="4" fill="red" stroke="black" stroke-width="2"/>
                <text x="${B.x + 8}" y="${B.y - 8}" font-size="14" fill="red" font-weight="bold">B</text>
                
                <circle cx="${C.x}" cy="${C.y}" r="4" fill="red" stroke="black" stroke-width="2"/>
                <text x="${C.x + 8}" y="${C.y - 8}" font-size="14" fill="red" font-weight="bold">C</text>
                
                <circle cx="${D.x}" cy="${D.y}" r="4" fill="red" stroke="black" stroke-width="2"/>
                <text x="${D.x + 8}" y="${D.y - 8}" font-size="14" fill="red" font-weight="bold">D</text>
            </svg>
        </div>`;
        
        const correction = `Les points sont placés dans le repère orthonormé selon leurs coordonnées :<br>
        • A(${x1}; ${y1})<br>
        • B(${x2}; ${y2})<br>
        • C(${x3}; ${y3})<br>
        • D(${x4}; ${y4})`;
        
        return { question, correction };
    },
    
    '3AutoG01-2': function() {
        // VRAI code MathALÉA : Déterminer les coordonnées d'un point
        // Génération selon la logique MathALÉA (coordonnées entières)
        const xmin = -5, xmax = 5, ymin = -5, ymax = 5;
        const k = 1; // Niveau 1 : coordonnées entières
        
        // Générer des coordonnées entières
        const x = randint(xmin + 1, xmax - 1);
        const y = randint(ymin + 1, ymax - 1);
        
        // Nom du point (lettre aléatoire)
        const lettres = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
        const nom = choice(lettres);
        
        // Question exacte MathALÉA
        const question = `Déterminer les coordonnées du point $${nom}$ représenté ci-dessous.`;
        
        // Correction avec mise en évidence
        const correction = `Les coordonnées du point $${nom}$ sont : $${nom}(${x};${y})$`;
        
        return { question, correction };
    },
    
    '3AutoG02-1': function() {
        // VRAI code MathALÉA : Utiliser le codage pour décrire une figure
        // Version simplifiée basée sur le code MathALÉA
        
        const typesQuestions = [
            {
                type: 'longueurs',
                question: "À l'aide du schéma ci-dessous, déterminer :<br>- deux segments de même longueur ;<br>- le milieu d'un segment ;<br>- un triangle rectangle ;<br>- un triangle isocèle.",
                correction: "- Deux segments de même mesure : [AB] et [BC] ou [AC] et [CD]<br>- E est le milieu du segment [AC]<br>- ABC est un triangle rectangle en A<br>- ABE est un triangle isocèle en E"
            },
            {
                type: 'carre',
                question: "ABCD est un carré et CDE est un triangle équilatéral (E est à l'intérieur du carré ABCD).<br>BCF est un triangle isocèle en F (F est à l'extérieur du carré ABCD).<br>Représenter cette configuration par un schéma à main levée et ajouter les codages nécessaires.",
                correction: "Voilà ci-dessous un schéma qui pourrait convenir à la situation.<br>Le carré ABCD avec les angles droits marqués, le triangle équilatéral CDE avec les côtés égaux marqués, et le triangle isocèle BCF avec les côtés égaux marqués."
            },
            {
                type: 'rectangle',
                question: "ABCD est un rectangle. Ses diagonales se coupent en E.<br>EBFC est un losange.<br>Représenter cette configuration par un schéma à main levée et ajouter les codages nécessaires.",
                correction: "Voilà ci-dessous un schéma qui pourrait convenir à la situation.<br>Le rectangle ABCD avec les angles droits marqués, les diagonales qui se coupent en E, et le losange EBFC avec les côtés égaux marqués."
            }
        ];
        
        const questionType = choice(typesQuestions);
        
        return {
            question: questionType.question,
            correction: questionType.correction
        };
    },
    
    '3AutoG02-2': function() {
        // VRAI code MathALÉA : Reconnaitre un parallélogramme à partir du codage
        // Implémentation complète basée sur le code MathALÉA
        
        const typesQuestions = [
            'cotesOpposesMemeLongueur',
            'cotesConsecutifsMemeLongueur', 
            'diagonalesMemeLongueur',
            '2cotesOpposesMemeLongueur',
            'anglesOpposesEgaux'
        ];
        
        const typeQuestion = choice(typesQuestions);
        const nom = creerNomPolygone();
        const estUnParallelogramme = ['cotesOpposesMemeLongueur', 'diagonalesMemeLongueur', 'anglesOpposesEgaux'].includes(typeQuestion);
        
        let question, correction;
        
        switch (typeQuestion) {
            case 'cotesOpposesMemeLongueur':
                question = `Pour la figure suivante, tracée à main levée, préciser s'il s'agit d'un parallélogramme.<br><br>
                <div style="text-align: center; margin: 20px;">
                    <svg width="200" height="120" viewBox="0 0 200 120">
                        <polygon points="20,20 80,20 100,80 40,80" fill="none" stroke="black" stroke-width="2"/>
                        <text x="15" y="15" font-size="12">${nom[0]}</text>
                        <text x="85" y="15" font-size="12">${nom[1]}</text>
                        <text x="105" y="85" font-size="12">${nom[2]}</text>
                        <text x="35" y="85" font-size="12">${nom[3]}</text>
                        <!-- Codages côtés opposés -->
                        <line x1="25" y1="15" x2="35" y2="15" stroke="blue" stroke-width="3"/>
                        <line x1="45" y1="15" x2="55" y2="15" stroke="blue" stroke-width="3"/>
                        <line x1="50" y1="75" x2="60" y2="75" stroke="blue" stroke-width="3"/>
                        <line x1="70" y1="75" x2="80" y2="75" stroke="blue" stroke-width="3"/>
                        <!-- Codages autres côtés -->
                        <line x1="15" y1="25" x2="15" y2="35" stroke="green" stroke-width="3"/>
                        <line x1="15" y1="45" x2="15" y2="55" stroke="green" stroke-width="3"/>
                        <line x1="85" y1="25" x2="85" y2="35" stroke="green" stroke-width="3"/>
                        <line x1="85" y1="45" x2="85" y2="55" stroke="green" stroke-width="3"/>
                    </svg>
                </div>`;
                correction = `On sait que $${nom[0]}${nom[1]} = ${nom[2]}${nom[3]}$ et $${nom[1]}${nom[2]} = ${nom[3]}${nom[0]}$.<br>
                Or, « si un quadrilatère a ses côtés opposés de même longueur, alors c'est un parallélogramme ».<br>
                Donc $${nom}$ <strong style="color: green;">est un parallélogramme</strong>.`;
                break;
                
            case 'cotesConsecutifsMemeLongueur':
                question = `Pour la figure suivante, tracée à main levée, préciser s'il s'agit d'un parallélogramme.<br><br>
                <div style="text-align: center; margin: 20px;">
                    <svg width="200" height="120" viewBox="0 0 200 120">
                        <polygon points="20,20 80,20 100,80 40,80" fill="none" stroke="black" stroke-width="2"/>
                        <text x="15" y="15" font-size="12">${nom[0]}</text>
                        <text x="85" y="15" font-size="12">${nom[1]}</text>
                        <text x="105" y="85" font-size="12">${nom[2]}</text>
                        <text x="35" y="85" font-size="12">${nom[3]}</text>
                        <!-- Codages côtés consécutifs -->
                        <line x1="25" y1="15" x2="35" y2="15" stroke="blue" stroke-width="3"/>
                        <line x1="45" y1="15" x2="55" y2="15" stroke="blue" stroke-width="3"/>
                        <line x1="15" y1="25" x2="15" y2="35" stroke="blue" stroke-width="3"/>
                        <line x1="15" y1="45" x2="15" y2="55" stroke="blue" stroke-width="3"/>
                        <!-- Codages autres côtés -->
                        <line x1="50" y1="75" x2="60" y2="75" stroke="red" stroke-width="3"/>
                        <line x1="70" y1="75" x2="80" y2="75" stroke="red" stroke-width="3"/>
                        <line x1="85" y1="25" x2="85" y2="35" stroke="red" stroke-width="3"/>
                        <line x1="85" y1="45" x2="85" y2="55" stroke="red" stroke-width="3"/>
                    </svg>
                </div>`;
                correction = `Les côtés consécutifs de $${nom}$ sont de même longueur deux par deux, $${nom}$ <strong style="color: red;">n'est donc pas forcément un parallélogramme</strong> comme le montre le contre-exemple suivant (il s'agit d'un cerf-volant).`;
                break;
                
            case 'diagonalesMemeLongueur':
                question = `Pour la figure suivante, tracée à main levée, préciser s'il s'agit d'un parallélogramme.<br><br>
                <div style="text-align: center; margin: 20px;">
                    <svg width="200" height="120" viewBox="0 0 200 120">
                        <polygon points="20,20 80,20 100,80 40,80" fill="none" stroke="black" stroke-width="2"/>
                        <line x1="20" y1="20" x2="100" y2="80" stroke="gray" stroke-dasharray="5,5"/>
                        <line x1="80" y1="20" x2="40" y2="80" stroke="gray" stroke-dasharray="5,5"/>
                        <circle cx="60" cy="50" r="3" fill="red"/>
                        <text x="65" y="55" font-size="10">O</text>
                        <text x="15" y="15" font-size="12">${nom[0]}</text>
                        <text x="85" y="15" font-size="12">${nom[1]}</text>
                        <text x="105" y="85" font-size="12">${nom[2]}</text>
                        <text x="35" y="85" font-size="12">${nom[3]}</text>
                        <!-- Codages diagonales -->
                        <line x1="25" y1="25" x2="35" y2="35" stroke="blue" stroke-width="3"/>
                        <line x1="45" y1="45" x2="55" y2="55" stroke="blue" stroke-width="3"/>
                        <line x1="75" y1="25" x2="85" y2="35" stroke="blue" stroke-width="3"/>
                        <line x1="95" y1="45" x2="105" y2="55" stroke="blue" stroke-width="3"/>
                    </svg>
                </div>`;
                correction = `On sait que les diagonales de $${nom}$ se coupent en leur milieu O.<br>
                Or, « si un quadrilatère a ses diagonales qui se coupent en leur milieu, alors c'est un parallélogramme ».<br>
                Donc $${nom}$ <strong style="color: green;">est un parallélogramme</strong>.`;
                break;
                
            case 'anglesOpposesEgaux':
                question = `Pour la figure suivante, tracée à main levée, préciser s'il s'agit d'un parallélogramme.<br><br>
                <div style="text-align: center; margin: 20px;">
                    <svg width="200" height="120" viewBox="0 0 200 120">
                        <polygon points="20,20 80,20 100,80 40,80" fill="none" stroke="black" stroke-width="2"/>
                        <text x="15" y="15" font-size="12">${nom[0]}</text>
                        <text x="85" y="15" font-size="12">${nom[1]}</text>
                        <text x="105" y="85" font-size="12">${nom[2]}</text>
                        <text x="35" y="85" font-size="12">${nom[3]}</text>
                        <!-- Codages angles -->
                        <path d="M 20 20 L 30 15 L 25 25 Z" fill="blue"/>
                        <path d="M 100 80 L 90 85 L 95 75 Z" fill="blue"/>
                        <path d="M 80 20 L 90 15 L 85 25 Z" fill="red"/>
                        <path d="M 40 80 L 30 85 L 35 75 Z" fill="red"/>
                    </svg>
                </div>`;
                correction = `On sait que les angles opposés de $${nom}$ sont égaux.<br>
                Or, « si un quadrilatère a ses angles opposés égaux, alors c'est un parallélogramme ».<br>
                Donc $${nom}$ <strong style="color: green;">est un parallélogramme</strong>.`;
                break;
        }
        
        return { question, correction };
        
        function creerNomPolygone() {
            const lettres = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T'];
            return [choice(lettres), choice(lettres), choice(lettres), choice(lettres)];
        }
    },
    
    '3AutoG06-1': function() {
        // Convertir des longueurs
        const conversions = [
            {from: 'km', to: 'm', mult: 1000},
            {from: 'm', to: 'cm', mult: 100},
            {from: 'cm', to: 'mm', mult: 10},
            {from: 'dm', to: 'cm', mult: 10},
            {from: 'g', to: 'mg', mult: 1000},
            {from: 'kg', to: 'g', mult: 1000}
        ];
        const conv = choice(conversions);
        const valeur = randint(1, 99);
        const resultat = valeur * conv.mult;
        
        return {
            question: `<p>Convertir : $${valeur}$ ${conv.from} $= ... $ ${conv.to}</p>`,
            correction: `<p>$${valeur}$ ${conv.from} $= ${resultat}$ ${conv.to}</p>`
        };
    },
    
    '3AutoG06-5': function() {
        // Convertir des durées
        const types = [
            {q: 'heures en minutes', h: randint(1, 5), mult: 60},
            {q: 'minutes en secondes', h: randint(1, 30), mult: 60},
            {q: 'heures en secondes', h: randint(1, 3), mult: 3600}
        ];
        const type = choice(types);
        const resultat = type.h * type.mult;
        
        return {
            question: `<p>Convertir ${type.h} ${type.q.split(' en ')[0]} en ${type.q.split(' en ')[1]}.</p>`,
            correction: `<p>${type.h} ${type.q.split(' en ')[0]} $= ${resultat}$ ${type.q.split(' en ')[1]}</p>`
        };
    },
    
    '3AutoG11-1': function() {
        // Calculer l'hypoténuse avec Pythagore
        const a = randint(3, 12);
        const b = randint(3, 12, [a]);
        const c = arrondi(Math.sqrt(a*a + b*b), 2);
        
        return {
            question: `<p>Un triangle rectangle a pour côtés de l'angle droit $${a}$ cm et $${b}$ cm. Calculer la longueur de l'hypoténuse.</p>`,
            correction: `<p>D'après le théorème de Pythagore : $c^2 = ${a}^2 + ${b}^2 = ${a*a} + ${b*b} = ${a*a + b*b}$<br>Donc $c = \\sqrt{${a*a + b*b}} \\approx ${c}$ cm</p>`
        };
    },
    
    '3AutoG11-2': function() {
        // Calculer un côté avec Pythagore
        const b = randint(3, 12);
        const c = randint(b + 1, 15);
        const a = arrondi(Math.sqrt(c*c - b*b), 2);
        
        return {
            question: `<p>Un triangle rectangle a pour hypoténuse $${c}$ cm et un côté de l'angle droit de $${b}$ cm. Calculer la longueur de l'autre côté.</p>`,
            correction: `<p>D'après le théorème de Pythagore : $a^2 = ${c}^2 - ${b}^2 = ${c*c} - ${b*b} = ${c*c - b*b}$<br>Donc $a = \\sqrt{${c*c - b*b}} \\approx ${a}$ cm</p>`
        };
    },
    
    // === PROPORTIONNALITÉ ===
    
    '3AutoP01-1': function() {
        // Reconnaître une situation de proportionnalité
        const isProp = choice([true, false]);
        let x1, x2, y1, y2;
        
        if (isProp) {
            const k = randint(2, 5);
            x1 = randint(2, 10);
            x2 = randint(2, 10, [x1]);
            y1 = x1 * k;
            y2 = x2 * k;
        } else {
            x1 = randint(2, 10);
            x2 = randint(2, 10, [x1]);
            y1 = randint(5, 20);
            y2 = randint(5, 20, [y1, Math.round(y1 * x2 / x1)]);
        }
        
        return {
            question: `<p>Le tableau ci-dessous représente-t-il une situation de proportionnalité ?</p>
                      <table border="1"><tr><td>${x1}</td><td>${x2}</td></tr><tr><td>${y1}</td><td>${y2}</td></tr></table>`,
            correction: `<p>${isProp ? 'Oui' : 'Non'}, ${isProp ? `coefficient de proportionnalité : ${y1/x1}` : `${y1}/${x1} ≠ ${y2}/${x2}`}</p>`
        };
    },
    
    '3AutoP06-1': function() {
        // Reconnaître une situation de proportionnalité (version tableau)
        // Génère un tableau à 2 lignes avec soit un coefficient constant, soit un piège
        const isProportionnel = choice([true, false]);
        const base = randint(2, 9);
        const k = randint(2, 9);
        const n = 3; // 3 colonnes
        const x = [];
        const y = [];
        for (let i = 0; i < n; i++) {
            const xi = base + i * randint(1, 4);
            x.push(xi);
            if (isProportionnel) {
                y.push(xi * k);
            } else {
                // Introduire une incohérence sur une colonne
                const yi = xi * k;
                if (i === 1) {
                    y.push(yi + choice([-1, 1]) * randint(1, 3));
                } else {
                    y.push(yi);
                }
            }
        }
        
        const tableHtml = `
            <table style="border-collapse: collapse; width: 100%; max-width: 520px; text-align: center">
                <tr>
                    <th style="border:1px solid #ccc; padding:6px">x</th>
                    ${x.map(v => `<td style=\"border:1px solid #ccc; padding:6px\">${v}</td>`).join('')}
                </tr>
                <tr>
                    <th style="border:1px solid #ccc; padding:6px">y</th>
                    ${y.map(v => `<td style=\"border:1px solid #ccc; padding:6px\">${v}</td>`).join('')}
                </tr>
            </table>`;
        
        const question = `On considère le tableau suivant : <br><br>${tableHtml}<br>
        Cette situation est-elle une situation de proportionnalité entre x et y ? Justifier.`;
        
        let correction;
        if (isProportionnel) {
            correction = `Oui, la situation est proportionnelle car le rapport 
            $y/x$ est constant et vaut $${k}$. En effet: ${x.map((xi, i) => `\\dfrac{${y[i]}}{${xi}}=${k}`).join(', ')}.`;
        } else {
            // trouver la colonne fautive
            const badIndex = 1;
            const ratios = x.map((xi, i) => `${y[i]}/${xi}`);
            correction = `Non, ce n'est pas proportionnel car les rapports $y/x$ ne sont pas tous égaux.
            Par exemple, ici: ${ratios.map((r, i) => i === badIndex ? `<strong>${r}</strong>` : r).join(', ')} ne sont pas constants.`;
        }
        
        return { question, correction };
    },
    
    '3AutoP05-1': function() {
        // Lire des données dans un diagramme (diagramme en barres)
        const categories = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];
        const valeurs = Array.from({length: 5}, () => randint(10, 50));
        const jourMax = categories[valeurs.indexOf(Math.max(...valeurs))];
        const somme = valeurs.reduce((a, b) => a + b, 0);
        
        // Créer un diagramme en barres simple
        const maxVal = Math.max(...valeurs);
        const barWidth = 60;
        const spacing = 80;
        const svgHeight = 250;
        const barMaxHeight = 150;
        
        const diagramme = `
            <svg width="500" height="${svgHeight}" style="border: 1px solid #ccc; margin: 10px;">
                <!-- Axes -->
                <line x1="40" y1="200" x2="460" y2="200" stroke="black" stroke-width="2"/>
                <line x1="40" y1="50" x2="40" y2="200" stroke="black" stroke-width="2"/>
                
                <!-- Barres -->
                ${categories.map((cat, i) => {
                    const h = (valeurs[i] / maxVal) * barMaxHeight;
                    const x = 60 + i * spacing;
                    return `
                        <rect x="${x}" y="${200 - h}" width="${barWidth}" height="${h}" fill="#4CAF50" stroke="black"/>
                        <text x="${x + barWidth/2}" y="${210}" text-anchor="middle" font-size="12">${cat}</text>
                        <text x="${x + barWidth/2}" y="${195 - h}" text-anchor="middle" font-size="12" font-weight="bold">${valeurs[i]}</text>
                    `;
                }).join('')}
            </svg>
        `;
        
        const questionType = choice(['max', 'somme']);
        let question, correction;
        
        if (questionType === 'max') {
            question = `<p>Le diagramme suivant représente les ventes d'un magasin sur une semaine :</p>${diagramme}<p>Quel jour a eu le plus de ventes ?</p>`;
            correction = `<p>Le jour avec le plus de ventes est <strong>${jourMax}</strong> avec ${Math.max(...valeurs)} ventes.</p>`;
        } else {
            question = `<p>Le diagramme suivant représente les ventes d'un magasin sur une semaine :</p>${diagramme}<p>Quel est le total des ventes sur la semaine ?</p>`;
            correction = `<p>Total des ventes : ${valeurs.map(v => v).join(' + ')} = ${somme}</p>`;
        }
        
        return { question, correction };
    },
    
    // === INFORMATIQUE ===
    
    '3AutoI01-1': function() {
        // Dessiner avec Scratch
        const cotes = randint(3, 6);
        const longueur = randint(50, 150, [100]);
        
        return {
            question: `<p>Écrire un script Scratch qui dessine un polygone régulier à ${cotes} côtés de ${longueur} pixels de côté.</p>`,
            correction: `<p>Répéter ${cotes} fois : avancer de ${longueur}, tourner de ${360/cotes}°</p>`
        };
    },
    
    // === GÉNÉRATEURS SUPPLÉMENTAIRES ===
    
    '3AutoG02-3': function() {
        // Déterminer la nature de parallélogrammes
        const types = [
            { nom: 'rectangle', props: 'Les 4 angles sont droits. Les diagonales ont la même longueur.' },
            { nom: 'losange', props: 'Les 4 côtés ont la même longueur. Les diagonales sont perpendiculaires.' },
            { nom: 'carré', props: 'Les 4 côtés ont la même longueur ET les 4 angles sont droits.' }
        ];
        const type = choice(types);
        
        return {
            question: `<p>Un parallélogramme possède les propriétés suivantes :</p><p>${type.props}</p><p>Quelle est sa nature précise ?</p>`,
            correction: `<p>C'est un <strong>${type.nom}</strong>.</p>`
        };
    },
    
    '3AutoG03-1': function() {
        // Reconnaître un angle particulier
        const angles = [
            { mesure: randint(10, 85), type: 'aigu' },
            { mesure: 90, type: 'droit' },
            { mesure: randint(95, 175), type: 'obtus' },
            { mesure: 180, type: 'plat' }
        ];
        const angle = choice(angles);
        
        return {
            question: `<p>Un angle mesure ${angle.mesure}°. De quel type d'angle s'agit-il ?</p>`,
            correction: `<p>C'est un angle <strong>${angle.type}</strong>.</p>`
        };
    },
    
    '3AutoG03-2': function() {
        // Angles complémentaires/supplémentaires
        const type = choice([
            { nom: 'complémentaires', somme: 90 },
            { nom: 'supplémentaires', somme: 180 }
        ]);
        const angle1 = randint(20, type.somme - 20);
        const angle2 = type.somme - angle1;
        
        return {
            question: `<p>Deux angles ${type.nom} mesurent ${angle1}° et ?°. Calculer la mesure du second angle.</p>`,
            correction: `<p>${type.somme}° - ${angle1}° = ${angle2}°</p>`
        };
    },
    
    '3AutoG06-4': function() {
        // Convertir des volumes
        const conversions = [
            { from: 'L', to: 'mL', mult: 1000 },
            { from: 'mL', to: 'L', mult: 0.001 },
            { from: 'L', to: 'dm³', mult: 1 },
            { from: 'cm³', to: 'mL', mult: 1 }
        ];
        const conv = choice(conversions);
        const val = randint(1, 100);
        const res = arrondi(val * conv.mult, 3);
        
        return {
            question: `<p>Convertir : ${val} ${conv.from} = ? ${conv.to}</p>`,
            correction: `<p>${val} ${conv.from} = ${res} ${conv.to}</p>`
        };
    },
    
    '3AutoG06-5': function() {
        // Convertir des durées
        const conversions = [
            { q: 'Combien de minutes dans ${h} heures ?', val: randint(2, 5), mult: 60, unit: 'h' },
            { q: 'Combien de secondes dans ${m} minutes ?', val: randint(2, 10), mult: 60, unit: 'min' },
            { q: 'Combien d\'heures dans ${min} minutes ?', val: choice([120, 180, 240, 300]), mult: 1/60, unit: 'min' }
        ];
        const conv = choice(conversions);
        const res = arrondi(conv.val * conv.mult, 2);
        const question = conv.q.replace('${h}', conv.val).replace('${m}', conv.val).replace('${min}', conv.val);
        
        return {
            question: `<p>${question}</p>`,
            correction: `<p>Réponse : ${res}</p>`
        };
    },
    
    '3AutoG07-1': function() {
        // Reconnaître des solides
        const solides = [
            { nom: 'cube', desc: '6 faces carrées identiques' },
            { nom: 'pavé droit', desc: '6 faces rectangulaires' },
            { nom: 'cylindre', desc: '2 bases circulaires, 1 surface latérale courbe' },
            { nom: 'cône', desc: '1 base circulaire, 1 sommet' },
            { nom: 'pyramide', desc: '1 base polygonale, plusieurs faces triangulaires' },
            { nom: 'sphère', desc: 'surface courbe sans arête' }
        ];
        const solide = choice(solides);
        
        return {
            question: `<p>Quel solide a : ${solide.desc} ?</p>`,
            correction: `<p>C'est un <strong>${solide.nom}</strong>.</p>`
        };
    },
    
    '3AutoG08-1': function() {
        // Périmètres
        const formes = [
            { type: 'carré', c: randint(3, 12), calcul: (c) => 4 * c, texte: (c) => `un carré de côté ${c} cm` },
            { type: 'rectangle', L: randint(5, 15), l: randint(3, 10), calcul: (L, l) => 2 * (L + l), texte: (L, l) => `un rectangle ${L} cm × ${l} cm` },
            { type: 'cercle', r: randint(3, 10), calcul: (r) => arrondi(2 * Math.PI * r, 2), texte: (r) => `un cercle de rayon ${r} cm` }
        ];
        const forme = choice(formes);
        let p, txt;
        
        if (forme.type === 'carré') {
            p = forme.calcul(forme.c);
            txt = forme.texte(forme.c);
        } else if (forme.type === 'rectangle') {
            p = forme.calcul(forme.L, forme.l);
            txt = forme.texte(forme.L, forme.l);
        } else {
            p = forme.calcul(forme.r);
            txt = forme.texte(forme.r);
        }
        
        return {
            question: `<p>Calculer le périmètre de ${txt}.</p>`,
            correction: `<p>Périmètre = ${p} cm</p>`
        };
    },
    
    '3AutoG09-1': function() {
        // Aires
        const formes = [
            { type: 'carré', c: randint(3, 12), calcul: (c) => c * c, texte: (c) => `un carré de côté ${c} cm` },
            { type: 'rectangle', L: randint(5, 15), l: randint(3, 10), calcul: (L, l) => L * l, texte: (L, l) => `un rectangle ${L} cm × ${l} cm` },
            { type: 'triangle', b: randint(4, 12), h: randint(3, 10), calcul: (b, h) => arrondi((b * h) / 2, 2), texte: (b, h) => `un triangle de base ${b} cm et hauteur ${h} cm` },
            { type: 'disque', r: randint(3, 10), calcul: (r) => arrondi(Math.PI * r * r, 2), texte: (r) => `un disque de rayon ${r} cm` }
        ];
        const forme = choice(formes);
        let a, txt;
        
        if (forme.type === 'carré') {
            a = forme.calcul(forme.c);
            txt = forme.texte(forme.c);
        } else if (forme.type === 'rectangle') {
            a = forme.calcul(forme.L, forme.l);
            txt = forme.texte(forme.L, forme.l);
        } else if (forme.type === 'triangle') {
            a = forme.calcul(forme.b, forme.h);
            txt = forme.texte(forme.b, forme.h);
        } else {
            a = forme.calcul(forme.r);
            txt = forme.texte(forme.r);
        }
        
        return {
            question: `<p>Calculer l'aire de ${txt}.</p>`,
            correction: `<p>Aire = ${a} cm²</p>`
        };
    },
    
    '3AutoG10-1': function() {
        // Volumes
        const solides = [
            { type: 'cube', a: randint(3, 10), calcul: (a) => a * a * a, texte: (a) => `un cube d'arête ${a} cm` },
            { type: 'pavé', L: randint(5, 12), l: randint(3, 8), h: randint(2, 6), calcul: (L, l, h) => L * l * h, texte: (L, l, h) => `un pavé ${L} cm × ${l} cm × ${h} cm` }
        ];
        const solide = choice(solides);
        let v, txt;
        
        if (solide.type === 'cube') {
            v = solide.calcul(solide.a);
            txt = solide.texte(solide.a);
        } else {
            v = solide.calcul(solide.L, solide.l, solide.h);
            txt = solide.texte(solide.L, solide.l, solide.h);
        }
        
        return {
            question: `<p>Calculer le volume de ${txt}.</p>`,
            correction: `<p>Volume = ${v} cm³</p>`
        };
    },
    
    '3AutoG11-1': function() {
        // Pythagore - hypoténuse
        const a = randint(3, 12);
        const b = randint(4, 12);
        const c = arrondi(Math.sqrt(a * a + b * b), 2);
        
        return {
            question: `<p>Triangle rectangle : côtés ${a} cm et ${b} cm. Calculer l'hypoténuse.</p>`,
            correction: `<p>$c^2 = ${a}^2 + ${b}^2 = ${a*a + b*b}$ donc $c \\approx ${c}$ cm</p>`
        };
    },
    
    '3AutoG11-2': function() {
        // Pythagore - côté
        const b = randint(3, 8);
        const c = randint(b + 2, 15);
        const a = arrondi(Math.sqrt(c * c - b * b), 2);
        
        return {
            question: `<p>Triangle rectangle : hypoténuse ${c} cm, un côté ${b} cm. Calculer l'autre côté.</p>`,
            correction: `<p>$a^2 = ${c}^2 - ${b}^2 = ${c*c - b*b}$ donc $a \\approx ${a}$ cm</p>`
        };
    },
    
    '3AutoG13-1': function() {
        // Cosinus
        const angle = choice([30, 45, 60]);
        const hyp = randint(8, 20);
        const adj = arrondi(hyp * Math.cos(angle * Math.PI / 180), 2);
        
        return {
            question: `<p>Triangle rectangle : hypoténuse ${hyp} cm, angle ${angle}°. Calculer le côté adjacent.</p>`,
            correction: `<p>adjacent = $${hyp} \\times \\cos(${angle}°) \\approx ${adj}$ cm</p>`
        };
    },
    
    '3AutoN03-1': function() {
        // Simplifier fractions
        const facteur = choice([2, 3, 5, 7]);
        const num = facteur * randint(2, 12);
        const den = facteur * randint(2, 15);
        
        return {
            question: `<p>Simplifier : $\\dfrac{${num}}{${den}}$</p>`,
            correction: `<p>$\\dfrac{${num}}{${den}} = \\dfrac{${num/facteur}}{${den/facteur}}$</p>`
        };
    },
    
    '3AutoN03-2': function() {
        // Opérations fractions
        const num1 = randint(1, 5), den = randint(2, 8);
        const num2 = randint(1, 5);
        const type = choice(['addition', 'multiplication']);
        
        if (type === 'addition') {
            const res = num1 + num2;
            return {
                question: `<p>$\\dfrac{${num1}}{${den}} + \\dfrac{${num2}}{${den}}$</p>`,
                correction: `<p>$\\dfrac{${res}}{${den}}$</p>`
            };
        } else {
            const den2 = randint(2, 8);
            const numRes = num1 * num2;
            const denRes = den * den2;
            const { num, den: denSimp } = simplifierFraction(numRes, denRes);
            return {
                question: `<p>$\\dfrac{${num1}}{${den}} \\times \\dfrac{${num2}}{${den2}}$</p>`,
                correction: `<p>$\\dfrac{${numRes}}{${denRes}} = \\dfrac{${num}}{${denSimp}}$</p>`
            };
        }
    },
    
    '3AutoN05': function() {
        // Pourcentages spéciaux
        const pc = choice([{p:100, m:1}, {p:50, m:0.5}, {p:25, m:0.25}, {p:10, m:0.1}, {p:1, m:0.01}]);
        const q = randint(20, 200);
        const res = arrondi(q * pc.m, 2);
        
        return {
            question: `<p>Calculer ${pc.p}% de ${q}.</p>`,
            correction: `<p>${res}</p>`
        };
    },
    
    '3AutoN06': function() {
        // Puissances de 10
        const exp1 = choice([-2, -1, 0, 1, 2, 3]);
        const exp2 = choice([-2, -1, 0, 1, 2]);
        const op = choice([{s:'\\times', c:(a,b)=>a+b}, {s:'\\div', c:(a,b)=>a-b}]);
        const res = op.c(exp1, exp2);
        
        return {
            question: `<p>$10^{${exp1}} ${op.s} 10^{${exp2}}$</p>`,
            correction: `<p>$10^{${res}}$</p>`
        };
    },
    
    '3AutoN08': function() {
        // a × 10^n
        const a = arrondi(randint(10, 999) / 10, 1);
        const n = choice([-2, -1, 1, 2, 3]);
        const res = arrondi(a * Math.pow(10, n), 4);
        
        return {
            question: `<p>$${a} \\times 10^{${n}}$</p>`,
            correction: `<p>$${res}$</p>`
        };
    },
    
    '3AutoP01-1': function() {
        // Tableau de proportionnalité
        const prop = choice([true, false]);
        const coeff = choice([2, 3, 4, 0.5]);
        const v1 = randint(2, 8), v2 = randint(3, 10), v3 = randint(4, 12);
        
        if (prop) {
            return {
                question: `<p>Tableau de proportionnalité ?</p><table border="1" style="margin:auto"><tr><td>${v1}</td><td>${v2}</td><td>${v3}</td></tr><tr><td>${v1*coeff}</td><td>${v2*coeff}</td><td>${v3*coeff}</td></tr></table>`,
                correction: `<p>OUI (coefficient ${coeff})</p>`
            };
        } else {
            return {
                question: `<p>Tableau de proportionnalité ?</p><table border="1" style="margin:auto"><tr><td>${v1}</td><td>${v2}</td><td>${v3}</td></tr><tr><td>${v1*2}</td><td>${v2*3}</td><td>${v3*2}</td></tr></table>`,
                correction: `<p>NON</p>`
            };
        }
    },
    
    '3AutoP02-1': function() {
        // Compléter tableau
        const coeff = choice([2, 3, 4, 1.5]);
        const v1 = randint(2, 8), v2 = randint(3, 10), vInc = randint(5, 15);
        const res = arrondi(vInc * coeff, 2);
        
        return {
            question: `<p>Compléter :</p><table border="1" style="margin:auto"><tr><td>${v1}</td><td>${v2}</td><td>${vInc}</td></tr><tr><td>${v1*coeff}</td><td>${v2*coeff}</td><td>?</td></tr></table>`,
            correction: `<p>${res}</p>`
        };
    },
    
    '3AutoP03-1': function() {
        // Pourcentage
        const partie = randint(5, 40);
        const total = randint(partie + 10, 100);
        const pc = arrondi((partie / total) * 100, 1);
        
        return {
            question: `<p>${partie} sur ${total}. Quel pourcentage ?</p>`,
            correction: `<p>${pc}%</p>`
        };
    },
    
    '3AutoG06-2': function() {
        // Convertir des volumes ou capacités
        const conversions = [
            { from: 'L', to: 'mL', factor: 1000 },
            { from: 'mL', to: 'L', factor: 0.001 },
            { from: 'L', to: 'cL', factor: 100 },
            { from: 'dm³', to: 'L', factor: 1 },
            { from: 'm³', to: 'L', factor: 1000 }
        ];
        const conv = choice(conversions);
        const val = randint(1, 500);
        const res = val * conv.factor;
        
        return {
            question: `Convertir : $${val}$ ${conv.from} = ? ${conv.to}`,
            correction: `$${val}$ ${conv.from} $= ${res}$ ${conv.to}`
        };
    },
    
    '3AutoG06-3': function() {
        // Convertir des aires
        const conversions = [
            { from: 'm²', to: 'cm²', factor: 10000 },
            { from: 'cm²', to: 'm²', factor: 0.0001 },
            { from: 'km²', to: 'm²', factor: 1000000 },
            { from: 'dam²', to: 'm²', factor: 100 }
        ];
        const conv = choice(conversions);
        const val = randint(1, 100);
        const res = val * conv.factor;
        
        return {
            question: `Convertir : $${val}$ ${conv.from} = ? ${conv.to}`,
            correction: `$${val}$ ${conv.from} $= ${res}$ ${conv.to}`
        };
    },
    
    '3AutoP01': function() {
        // Calculer une probabilité (version générique)
        const total = randint(10, 30);
        const favorable = randint(1, total - 1);
        const prob = fraction(favorable, total);
        
        return {
            question: `On tire au hasard une boule dans un sac contenant ${total} boules numérotées. 
            ${favorable} boules sont rouges. Quelle est la probabilité de tirer une boule rouge ?`,
            correction: `La probabilité est $\\dfrac{${favorable}}{${total}}$ ${prob.simplified ? `$= ${prob.simplified}$` : ''}`
        };
    },
    
    '3AutoP01-2': function() {
        // Calculer une probabilité (version dés)
        const faces = choice([6, 8, 10]);
        const condition = randint(1, Math.floor(faces / 2));
        const favorable = condition;
        const prob = fraction(favorable, faces);
        
        return {
            question: `On lance un dé à ${faces} faces numérotées de 1 à ${faces}. 
            Quelle est la probabilité d'obtenir un nombre inférieur ou égal à ${condition} ?`,
            correction: `Les issues favorables sont : 1, 2, ..., ${condition}. 
            La probabilité est $\\dfrac{${favorable}}{${faces}}$ ${prob.simplified ? `$= ${prob.simplified}$` : ''}`
        };
    },
    
    '3AutoP04-1': function() {
        // Calculer une probabilité (événement simple)
        const total = randint(20, 50);
        const rouge = randint(5, 15);
        const bleu = randint(5, 15);
        const vert = total - rouge - bleu;
        
        return {
            question: `Un sac contient ${rouge} boules rouges, ${bleu} boules bleues et ${vert} boules vertes. 
            On tire une boule au hasard. Quelle est la probabilité de tirer une boule rouge ?`,
            correction: `Il y a ${total} boules au total. La probabilité de tirer une boule rouge est 
            $\\dfrac{${rouge}}{${total}}$`
        };
    },
    
    '3AutoP05-2': function() {
        // Déterminer un pourcentage (évolution)
        const prixInitial = randint(50, 200);
        const reduction = choice([10, 15, 20, 25, 30]);
        const montantReduc = (prixInitial * reduction) / 100;
        const prixFinal = prixInitial - montantReduc;
        
        return {
            question: `Un article coûte ${prixInitial}€. On applique une réduction de ${reduction}%. 
            Quel est le nouveau prix ?`,
            correction: `Réduction : $${prixInitial} \\times \\dfrac{${reduction}}{100} = ${montantReduc}$€. 
            Nouveau prix : $${prixInitial} - ${montantReduc} = ${prixFinal}$€`
        };
    },
    
    '3AutoP07-1': function() {
        // Vitesse moyenne
        const distance = randint(100, 500);
        const temps = choice([2, 2.5, 3, 4, 5]);
        const vitesse = distance / temps;
        
        return {
            question: `Un véhicule parcourt ${distance} km en ${temps} heures. 
            Quelle est sa vitesse moyenne ?`,
            correction: `Vitesse moyenne : $v = \\dfrac{d}{t} = \\dfrac{${distance}}{${temps}} = ${vitesse}$ km/h`
        };
    },
    
    '3AutoP08-1': function() {
        // Échelle
        const distanceReelle = randint(10, 100) * 1000; // en mètres
        const echelle = choice([10000, 25000, 50000]);
        const distanceCarte = (distanceReelle / echelle) * 100; // en cm
        
        return {
            question: `Sur une carte à l'échelle $\\dfrac{1}{${echelle}}$, 
            quelle distance sur la carte représente ${distanceReelle/1000} km sur le terrain ?`,
            correction: `Distance sur la carte : $${distanceReelle/1000} \\text{ km} = ${distanceReelle} \\text{ m}$. 
            Sur la carte : $\\dfrac{${distanceReelle}}{${echelle}} \\times 100 = ${distanceCarte}$ cm`
        };
    },
    
    '3AutoP09-1': function() {
        // Densité de population
        const population = randint(10000, 100000);
        const superficie = randint(50, 500);
        const densite = arrondi(population / superficie, 1);
        
        return {
            question: `Une ville compte ${population} habitants pour une superficie de ${superficie} km². 
            Quelle est sa densité de population ?`,
            correction: `Densité : $\\dfrac{${population}}{${superficie}} \\approx ${densite}$ habitants/km²`
        };
    }
};

/**
 * Fonction principale pour générer un automatisme
 * @param {string} autoId - ID de l'automatisme (ex: '3AutoG01-1')
 * @returns {Object} - {question: string, correction: string}
 */
function genererAutomatisme(autoId) {
    const generateur = generateurs[autoId];
    
    if (generateur) {
        try {
            return generateur();
        } catch (error) {
            console.error(`Erreur génération ${autoId}:`, error);
            return null;
        }
    }
    
    return null; // Pas de générateur pour cet automatisme
}

    // Exposer globalement
    window.genererAutomatisme = genererAutomatisme;
    window.generateurs = generateurs;
    
    console.log(`✅ ${Object.keys(generateurs).length} générateurs d'automatismes chargés`);
})();

