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
  // Use fixed precision for financial display to avoid floating point noise
  const formattedValue = (typeof numValue !== 'number' || isNaN(numValue)) ? '0.0' : numValue.toFixed(2);
  return `${formattedValue} ${currency}`;
}

interface CalculableCart {
    items: { price: number; cartQuantity: number }[];
    discount: { type: 'fixed' | 'percentage'; value: number };
}

/**
 * Calculates cart totals with fixed precision to avoid JS floating point errors.
 */
export function calculateCartTotals(cart: CalculableCart) {
    const subtotal = cart.items.reduce((acc, item) => {
        // Multiply by 100 to work with integers, then divide back (standard financial practice)
        return acc + Math.round(item.price * item.cartQuantity * 100);
    }, 0) / 100;
    
    let discountAmount = 0;
    if (cart.discount.type === 'percentage') {
        discountAmount = Math.round(subtotal * (cart.discount.value || 0)) / 100;
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
