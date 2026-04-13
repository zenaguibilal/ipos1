
/**
 * @fileOverview Utilitaire de conversion de montants numériques en lettres (Arabe Algérien).
 * Gère les Dinars et les Centimes avec une précision comptable.
 */

const ones = ["", "واحد", "اثنان", "ثلاثة", "أربعة", "خمسة", "ستة", "سبعة", "ثمانية", "تسعة", "عشرة", "أحد عشر", "اثنا عشر", "ثلاثة عشر", "أربعة عشر", "خمسة عشر", "ستة عشر", "سبعة عشر", "ثمانية عشر", "تسعة عشر"];
const tens = ["", "", "عشرون", "ثلاثون", "أربعون", "خمسون", "ستون", "سبعون", "ثمانون", "تسعون"];
const hundreds = ["", "مائة", "مائتان", "ثلاثمائة", "أربعمائة", "خمسمائة", "ستمائة", "سبعمائة", "ثمانمائة", "تسعمائة"];

function convertGroup(n: number): string {
    let res = "";
    if (n >= 100) {
        res += hundreds[Math.floor(n / 100)] + " ";
        n %= 100;
    }
    if (n >= 20) {
        const unit = n % 10;
        if (unit > 0) res += ones[unit] + " و";
        res += tens[Math.floor(n / 10)];
    } else if (n > 0) {
        res += ones[n];
    }
    return res.trim();
}

/**
 * Convertit un nombre en lettres arabes.
 * @param amount Le montant à convertir
 * @returns Le montant en lettres (ex: مائة دينار جزائري)
 */
export function numberToArabicWords(amount: number): string {
    if (amount === 0) return "صفر دينار جزائري";

    const integerPart = Math.floor(amount);
    const decimalPart = Math.round((amount - integerPart) * 100);

    let result = "";

    if (integerPart > 0) {
        let n = integerPart;
        const millions = Math.floor(n / 1000000);
        n %= 1000000;
        const thousands = Math.floor(n / 1000);
        const units = n % 1000;

        if (millions > 0) {
            if (millions === 1) result += "مليون ";
            else if (millions === 2) result += "مليونان ";
            else result += convertGroup(millions) + " ملايين ";
        }

        if (thousands > 0) {
            if (result) result += "و ";
            if (thousands === 1) result += "ألف ";
            else if (thousands === 2) result += "ألفان ";
            else result += convertGroup(thousands) + " آلاف ";
        }

        if (units > 0) {
            if (result) result += "و ";
            result += convertGroup(units);
        }

        result += " دينار جزائري";
    }

    if (decimalPart > 0) {
        if (result) result += " و ";
        result += convertGroup(decimalPart) + " سنتيم";
    }

    return result.trim();
}

// Tests internes (commentaires) :
// 100 -> مائة دينار جزائري
// 1250.50 -> ألف و مائتان و خمسون دينار جزائري و خمسون سنتيم
// 1000000 -> مليون دينار جزائري
