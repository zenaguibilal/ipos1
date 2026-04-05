import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Product } from "./types";
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

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
 * Calculates cart totals using integer arithmetic to avoid IEEE 754 floating point issues.
 */
export function calculateCartTotals(cart: CalculableCart) {
    // We work with 1000 to support up to 3 decimal places for weights and precision
    const PRECISION = 1000;
    
    const subtotalRaw = cart.items.reduce((acc, item) => {
        const itemPrice = Math.round((item.price || 0) * PRECISION);
        const itemQty = item.cartQuantity || 0;
        return acc + (itemPrice * itemQty);
    }, 0);

    const subtotal = subtotalRaw / PRECISION;
    
    let discountAmount = 0;
    if (cart.discount.type === 'percentage') {
        // Percentage discount calculated on the scaled integer
        discountAmount = Math.round(subtotalRaw * ((cart.discount.value || 0) / 100)) / PRECISION;
    } else {
        discountAmount = cart.discount.value || 0;
    }
    
    const total = Math.max(0, subtotal - discountAmount);

    return { 
        subtotal: Number(subtotal.toFixed(2)), 
        discountAmount: Number(discountAmount.toFixed(2)), 
        total: Number(total.toFixed(2)) 
    };
}

export function calculateStockStatus(quantity: number, minStockLevel: number): Product['stockStatus'] {
  if (quantity <= 0) return 'out_of_stock';
  if (quantity <= minStockLevel) return 'low_stock';
  return 'in_stock';
}
