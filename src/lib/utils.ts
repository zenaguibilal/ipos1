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
 * Supporte les espaces comme séparateurs de milliers (format DZ/FR).
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === null || val === undefined || val === '') return 0;
    
    // Nettoyage agressif des espaces et caractères non numériques sauf , et .
    let str = String(val).trim().replace(/\s/g, '');
    
    // Détection et standardisation du séparateur décimal
    if (str.includes(',') && str.includes('.')) {
        const lastDot = str.lastIndexOf('.');
        const lastComma = str.lastIndexOf(',');
        if (lastDot > lastComma) {
            str = str.replace(/,/g, ''); // Format US: 1,250.50 -> 1250.50
        } else {
            str = str.replace(/\./g, '').replace(',', '.'); // Format FR: 1.250,50 -> 1250.50
        }
    } else if (str.includes(',')) {
        str = str.replace(',', '.'); // Simple comma: 1250,50 -> 1250.50
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
 * Calculateur financier durci — arithmétique entière mise à l'échelle (Cents).
 * Élimine les erreurs IEEE 754 communes en JS.
 */
export function calculateCartTotals(cart: CalculableCart) {
    const SCALE = 100; // Travailler en centimes

    const subtotalRaw = cart.items.reduce((acc, item) => {
        const priceCents = Math.round(safeNumber(item.price) * SCALE);
        const qty = safeNumber(item.cartQuantity);
        return acc + Math.round(priceCents * qty);
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
        subtotal: Number(subtotal.toFixed(2)),
        discountAmount: Number((discountAmountRaw / SCALE).toFixed(2)),
        total: Number(finalTotal.toFixed(2)),
    };
}

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
