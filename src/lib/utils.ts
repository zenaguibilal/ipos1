import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product } from "./types";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Constant for high-precision financial comparisons.
 * Prevents floating point errors from blocking logical operations.
 */
export const FINANCIAL_EPSILON = 0.00001;

/**
 * Safely converts a Date object or an ISO string to a JavaScript Date.
 * @param date - The Date or string to convert.
 * @returns A JavaScript Date object.
 */
export function safeToDate(date: Date | string): Date {
    if (date instanceof Date) {
        return date;
    }
    return new Date(date);
}

export function formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
}

export function formatCurrency(value: number | string, currency = 'DA') {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  // Use fixed precision for financial display
  const formattedValue = (typeof numValue !== 'number' || isNaN(numValue)) ? '0.00' : numValue.toFixed(2);
  return `${formattedValue} ${currency}`;
}

interface CalculableCart {
    items: { price: number; cartQuantity: number }[];
    discount: { type: 'fixed' | 'percentage'; value: number };
}

/**
 * Hardened financial calculator using scaled integer arithmetic.
 * Prevents IEEE 754 floating point errors common in JS.
 */
export function calculateCartTotals(cart: CalculableCart) {
    // Scaling factor for 3 decimal precision (useful for weights/grams)
    const SCALE = 1000;
    
    const subtotalRaw = cart.items.reduce((acc, item) => {
        const priceCents = Math.round((item.price || 0) * SCALE);
        const qty = item.cartQuantity || 0;
        return acc + Math.round(priceCents * qty);
    }, 0);

    const subtotal = subtotalRaw / SCALE;
    
    let discountAmountRaw = 0;
    if (cart.discount.type === 'percentage') {
        discountAmountRaw = Math.round(subtotalRaw * ((cart.discount.value || 0) / 100));
    } else {
        discountAmountRaw = Math.round((cart.discount.value || 0) * SCALE);
    }
    
    const totalRaw = Math.max(0, subtotalRaw - discountAmountRaw);

    return { 
        subtotal: subtotal, 
        discountAmount: discountAmountRaw / SCALE, 
        total: totalRaw / SCALE 
    };
}

export function calculateStockStatus(quantity: number, minStockLevel: number): Product['stockStatus'] {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= minStockLevel) return 'low_stock';
  return 'in_stock';
}
