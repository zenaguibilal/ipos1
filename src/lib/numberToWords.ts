
/**
 * @fileOverview Utilitaire de conversion de montants numériques en lettres (Français).
 * Gère les Dinars et les Centimes avec une précision comptable.
 */

const units = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];
const teens = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];

function convertGroup(n: number): string {
    let res = "";
    
    if (n >= 100) {
        const h = Math.floor(n / 100);
        if (h > 1) res += units[h] + " cent ";
        else res += "cent ";
        n %= 100;
    }

    if (n >= 20) {
        const t = Math.floor(n / 10);
        const u = n % 10;
        
        if (t === 7 || t === 9) {
            res += tens[t - 1] + "-" + (u === 1 ? "et-" : "") + teens[u];
        } else {
            res += tens[t];
            if (u === 1) res += "-et-" + units[u];
            else if (u > 1) res += "-" + units[u];
        }
    } else if (n >= 10) {
        res += teens[n - 10];
    } else if (n > 0) {
        res += units[n];
    }

    return res.trim();
}

/**
 * Convertit un nombre en lettres françaises.
 * @param amount Le montant à convertir
 * @returns Le montant en lettres (ex: Cent Dinars Algériens)
 */
export function numberToFrenchWords(amount: number): string {
    if (amount === 0) return "zéro Dinars Algérien";

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = "";

    if (integerPart > 0) {
        let n = integerPart;
        const millions = Math.floor(n / 1000000);
        n %= 1000000;
        const thousands = Math.floor(n / 1000);
        const unitsPart = n % 1000;

        if (millions > 0) {
            result += convertGroup(millions) + (millions > 1 ? " millions " : " million ");
        }

        if (thousands > 0) {
            if (thousands === 1) result += "mille ";
            else result += convertGroup(thousands) + " mille ";
        }

        if (unitsPart > 0) {
            result += convertGroup(unitsPart);
        }

        result += " Dinars Algériens";
    }

    if (decimalPart > 0) {
        if (result) result += " et ";
        result += convertGroup(decimalPart) + " Centimes";
    }

    // Capitalize first letter
    return result.charAt(0).toUpperCase() + result.slice(1).trim();
}
