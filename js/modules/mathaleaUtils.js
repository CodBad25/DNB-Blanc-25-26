/**
 * Fonctions utilitaires MathALÉA simplifiées
 * Version adaptée pour la génération d'automatismes DNB
 */

/**
 * Génère un entier aléatoire entre min et max (inclus)
 * @param {number} min - borne inférieure
 * @param {number} max - borne supérieure
 * @param {number|number[]} listeAEviter - valeur(s) à éviter
 * @returns {number}
 */
function randint(min, max, listeAEviter = []) {
    if (!Number.isInteger(min) || !Number.isInteger(max)) {
        min = Math.floor(min);
        max = Math.ceil(max);
    }
    
    // Convertir listeAEviter en tableau
    if (typeof listeAEviter === 'number') {
        listeAEviter = [listeAEviter];
    }
    if (!Array.isArray(listeAEviter)) {
        listeAEviter = [];
    }
    
    const range = max - min;
    let tentatives = 0;
    let rand;
    
    do {
        rand = Math.floor(Math.random() * (range + 1)) + min;
        tentatives++;
        if (tentatives > 1000) {
            console.warn('randint: trop de tentatives, abandon de l\'évitement');
            break;
        }
    } while (listeAEviter.includes(rand));
    
    return rand;
}

/**
 * Mélange un tableau (Fisher-Yates shuffle)
 * @param {Array} array - tableau à mélanger
 * @returns {Array} - nouveau tableau mélangé
 */
function shuffle(array) {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
}

/**
 * Choisit un élément aléatoire dans un tableau
 * @param {Array} array
 * @returns {*}
 */
function choice(array) {
    return array[Math.floor(Math.random() * array.length)];
}

/**
 * Génère une fraction irréductible
 * @param {number} num - numérateur
 * @param {number} den - dénominateur
 * @returns {Object}
 */
function fraction(num, den) {
    const pgcd = (a, b) => b === 0 ? Math.abs(a) : pgcd(b, a % b);
    const d = pgcd(num, den);
    return {
        num: num / d,
        den: den / d,
        toString() {
            return this.den === 1 ? `${this.num}` : `\\dfrac{${this.num}}{${this.den}}`;
        },
        toLatex() {
            return this.toString();
        }
    };
}

/**
 * Arrondit un nombre à n décimales
 * @param {number} nombre
 * @param {number} decimales
 * @returns {number}
 */
function arrondi(nombre, decimales = 0) {
    const facteur = Math.pow(10, decimales);
    return Math.round(nombre * facteur) / facteur;
}

/**
 * Calcule le PGCD de deux nombres
 * @param {number} a
 * @param {number} b
 * @returns {number}
 */
function pgcd(a, b) {
    return b === 0 ? Math.abs(a) : pgcd(b, a % b);
}

/**
 * Simplifie une fraction
 * @param {number} num
 * @param {number} den
 * @returns {Object}
 */
function simplifierFraction(num, den) {
    const d = pgcd(num, den);
    return { num: num / d, den: den / d };
}

/**
 * Convertit un nombre décimal en fraction
 * @param {number} decimal
 * @param {number} precision
 * @returns {Object}
 */
function decimalToFraction(decimal, precision = 4) {
    const sign = decimal < 0 ? -1 : 1;
    decimal = Math.abs(decimal);
    
    for (let den = 1; den <= Math.pow(10, precision); den++) {
        const num = Math.round(decimal * den);
        if (Math.abs(num / den - decimal) < 0.0001) {
            return simplifierFraction(num * sign, den);
        }
    }
    
    return { num: decimal * sign, den: 1 };
}

// Exposer globalement
window.mathaleaUtils = {
    randint,
    shuffle,
    choice,
    fraction,
    arrondi,
    pgcd,
    simplifierFraction,
    decimalToFraction
};


