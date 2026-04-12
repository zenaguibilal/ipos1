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
    if (date instanceof Date) return date;
    return new Date(date);
}

/**
 * Convertit n'importe quelle valeur en nombre sain.
 * Gère les espaces (milliers), les virgules (décimales) et les valeurs nulles.
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === null || val === undefined || val === '') return 0;
    
    // Nettoyage de la chaîne : suppression des espaces et remplacement de la virgule par un point
    const sanitized = String(val)
        .replace(/\s/g, '')
        .replace(/,/g, '.');
        
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
}

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function formatCurrency(value: number | string, currency = 'DA') {
    const numValue = safeNumber(value);
    return `${numValue.toFixed(2)} ${currency}`;
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
    const SCALE = 1000;

    const subtotalRaw = cart.items.reduce((acc, item) => {
        const priceCents = Math.round(safeNumber(item.price) * SCALE);
        const qty        = safeNumber(item.cartQuantity);
        return acc + Math.round(priceCents * qty);
    }, 0);

    const subtotal = subtotalRaw / SCALE;

    let discountAmountRaw = 0;
    if (cart.discount.type === 'percentage') {
        discountAmountRaw = Math.round(
            subtotalRaw * (safeNumber(cart.discount.value) / 100),
        );
    } else {
        discountAmountRaw = Math.round(safeNumber(cart.discount.value) * SCALE);
    }

    const totalRaw = Math.max(0, subtotalRaw - discountAmountRaw);

    return {
        subtotal,
        discountAmount: discountAmountRaw / SCALE,
        total:          totalRaw / SCALE,
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
