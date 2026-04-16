import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from './types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Epsilon pour les comparaisons financières haute précision.
 * Évite les erreurs floating-point bloquant des opérations logiques.
 */
export const FINANCIAL_EPSILON = 0.00001;

/**
 * Convertit un Date ou une ISO string en objet Date fiable.
 */
export function safeToDate(date: Date | string): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * Convertit n'importe quelle valeur en nombre sain.
 * Gère les formats internationaux (1.250,50 ou 1,250.50).
 * Élimine les espaces et nettoie les caractères non numériques sauf point/virgule.
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === null || val === undefined || val === '') return 0;
    
    let str = String(val).trim().replace(/\s/g, '');
    
    // Détection du séparateur décimal
    if (str.includes(',') && str.includes('.')) {
        const lastDot = str.lastIndexOf('.');
        const lastComma = str.lastIndexOf(',');
        if (lastDot > lastComma) {
            // Le point est le séparateur décimal (format US: 1,250.50)
            str = str.replace(/,/g, '');
        } else {
            // La virgule est le séparateur décimal (format FR: 1.250,50)
            str = str.replace(/\./g, '').replace(',', '.');
        }
    } else if (str.includes(',')) {
        // Uniquement une virgule (1250,50)
        str = str.replace(',', '.');
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Multiplie deux nombres avec une précision fixe pour éviter les erreurs de virgule flottante.
 */
export function preciseMultiply(a: number, b: number): number {
    const valA = safeNumber(a);
    const valB = safeNumber(b);
    // Utilisation d'un multiplicateur pour traiter les entiers
    return Math.round((valA * valB) * 1000) / 1000;
}

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function formatCurrency(value: number | string, currency = 'DA') {
    const numValue = safeNumber(value);
    return `${numValue.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

interface CalculableCart {
    items: { price: number; cartQuantity: number }[];
    discount: { type: 'fixed' | 'percentage'; value: number };
}

/**
 * Calculateur financier durci — arithmétique entière mise à l'échelle.
 * Élimine les erreurs IEEE 754 communes en JS.
 */
export function calculateCartTotals(cart: CalculableCart) {
    const SCALE = 1000; // Travailler en millièmes pour la précision (3 décimales)

    const subtotalRaw = cart.items.reduce((acc, item) => {
        const priceScale = Math.round(safeNumber(item.price) * SCALE);
        const qty = safeNumber(item.cartQuantity);
        return acc + Math.round(priceScale * qty);
    }, 0);

    const subtotal = subtotalRaw / SCALE;

    let discountAmountRaw = 0;
    if (cart.discount.type === 'percentage') {
        discountAmountRaw = Math.round(subtotalRaw * (safeNumber(cart.discount.value) / 100));
    } else {
        discountAmountRaw = Math.round(safeNumber(cart.discount.value) * SCALE);
    }

    const totalRaw = Math.max(0, subtotalRaw - discountAmountRaw);
    const finalTotal = totalRaw / SCALE;

    return {
        subtotal: Math.round(subtotal * 100) / 100,
        discountAmount: Math.round((discountAmountRaw / SCALE) * 100) / 100,
        total: Math.round(finalTotal * 100) / 100,
    };
}

/**
 * Calcule le statut de stock de manière robuste.
 */
export function calculateStockStatus(
    quantity:      number | string,
    minStockLevel: number | string,
): Product['stockStatus'] {
    const qty = safeNumber(quantity);
    const min = safeNumber(minStockLevel);
    if (qty <= 0)   return 'out_of_stock';
    if (qty <= min) return 'low_stock';
    return 'in_stock';
}
