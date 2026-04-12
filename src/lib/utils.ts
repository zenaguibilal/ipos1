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

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function formatCurrency(value: number | string, currency = 'DA') {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    const formattedValue =
        typeof numValue !== 'number' || isNaN(numValue)
            ? '0.00'
            : numValue.toFixed(2);
    return `${formattedValue} ${currency}`;
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
        const priceCents = Math.round((item.price || 0) * SCALE);
        const qty        = item.cartQuantity || 0;
        return acc + Math.round(priceCents * qty);
    }, 0);

    const subtotal = subtotalRaw / SCALE;

    let discountAmountRaw = 0;
    if (cart.discount.type === 'percentage') {
        discountAmountRaw = Math.round(
            subtotalRaw * ((cart.discount.value || 0) / 100),
        );
    } else {
        discountAmountRaw = Math.round((cart.discount.value || 0) * SCALE);
    }

    const totalRaw = Math.max(0, subtotalRaw - discountAmountRaw);

    return {
        subtotal,
        discountAmount: discountAmountRaw / SCALE,
        total:          totalRaw / SCALE,
    };
}

/**
 * FIX #15 : coercion explicite en Number avant comparaison.
 * Sans Number(), les valeurs string du formulaire produisent une comparaison
 * lexicographique incorrecte ("10" <= "5" → true).
 */
export function calculateStockStatus(
    quantity:      number | string,
    minStockLevel: number | string,
): Product['stockStatus'] {
    const qty = Number(quantity);
    const min = Number(minStockLevel);
    if (qty <= 0)   return 'out_of_stock';
    if (qty <= min) return 'low_stock';
    return 'in_stock';
}
