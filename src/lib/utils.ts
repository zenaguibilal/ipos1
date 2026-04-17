import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { Product } from './types';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Epsilon pour les comparaisons financières haute précision.
 */
export const FINANCIAL_EPSILON = 0.00001;

/**
 * Arrondi financier standard à 2 décimales.
 */
export function roundFinancial(val: number): number {
    return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Convertit un Date ou une ISO string en objet Date fiable.
 */
export function safeToDate(date: Date | string | undefined | null): Date {
    if (!date) return new Date();
    if (date instanceof Date) return date;
    const d = new Date(date);
    return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * محرك الأرقام الفولاذي: يقرأ المبالغ المالية بأمان تام ويدعم كافة التنسيقات.
 * يدعم المسافات كفواصل آلاف (الجزائر/فرنسا) والفواصل العشرية المتنوعة.
 */
export function safeNumber(val: any): number {
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (val === null || val === undefined || val === '') return 0;
    
    // تنظيف السلسلة من المسافات وعلامات العملات
    let str = String(val).trim().replace(/\s/g, '').replace(/[^\d.,-]/g, '');
    
    // التعامل مع الفاصلة كعلامة عشرية إذا لم تكن النقطة موجودة
    if (str.includes(',') && !str.includes('.')) {
        str = str.replace(',', '.');
    } else if (str.includes(',') && str.includes('.')) {
        // إذا كانا موجودين، فالأخير هو الفاصل العشري
        const lastDot = str.lastIndexOf('.');
        const lastComma = str.lastIndexOf(',');
        if (lastDot > lastComma) {
            str = str.replace(/,/g, ''); 
        } else {
            str = str.replace(/\./g, '').replace(',', '.');
        }
    }
    
    const parsed = parseFloat(str);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Multiplie deux nombres باحترافية لتجنب أخطاء الفاصلة العائمة.
 */
export function preciseMultiply(a: number, b: number): number {
    const valA = safeNumber(a);
    const valB = safeNumber(b);
    // On يستخدم الأعداد الصحيحة داخلياً لضمان الدقة
    return (Math.round(valA * 1000) * Math.round(valB * 1000)) / 1000000;
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
 * محرك الحسابات المتقدم للفاتورة - دقة السنتيم المحاسبية.
 */
export function calculateCartTotals(cart: CalculableCart) {
    const subtotalCents = cart.items.reduce((acc, item) => {
        return acc + Math.round(preciseMultiply(item.price, item.cartQuantity) * 100);
    }, 0);

    const subtotal = subtotalCents / 100;

    let discountAmountCents = 0;
    if (cart.discount.type === 'percentage') {
        discountAmountCents = Math.round((subtotalCents * safeNumber(cart.discount.value)) / 100);
    } else {
        discountAmountCents = Math.round(safeNumber(cart.discount.value) * 100);
    }

    const totalCents = Math.max(0, subtotalCents - discountAmountCents);

    return {
        subtotal: subtotal,
        discountAmount: discountAmountCents / 100,
        total: totalCents / 100,
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
