'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';
import { safeToDate, safeNumber, roundFinancial, preciseMultiply } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

/**
 * خدمة إدارة المبيعات Elite.
 * هندسة مالية دقيقة تضمن توازن المخزن ودفاتر الحسابات.
 */
class SalesService {

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return db.sales.where('uuid').equals(uuid).first();
    }

    async getSaleByInvoiceNumber(
        invoiceNumber: string,
    ): Promise<Sale | undefined> {
        return db.sales.where('invoiceNumber').equals(invoiceNumber).first();
    }

    /**
     * تصفية المبيعات مع دعم "Période d'Analyse" الذكي.
     * تم تحسين المحرك لاستخدام الفهارس (Indexed Querying) لأقصى أداء مع الأرشيف الكامل.
     */
    async filterSales(filters: {
        query?: string;
        from?: Date;
        to?: Date;
        status?: 'all' | 'paid' | 'partial' | 'unpaid';
    }): Promise<Sale[]> {
        let collection;

        // ELITE OPTIMIZATION: تحديد نطاق الاستعلام الأساسي باستخدام الفهرس الزمني
        if (filters.from && filters.to) {
            const start = startOfDay(filters.from);
            const end = endOfDay(filters.to);
            collection = db.sales.where('createdAt').between(start, end, true, true);
        } else if (filters.from) {
            const start = startOfDay(filters.from);
            collection = db.sales.where('createdAt').aboveOrEqual(start);
        } else if (filters.to) {
            const end = endOfDay(filters.to);
            collection = db.sales.where('createdAt').belowOrEqual(end);
        } else {
            // FIX: استرجاع الأرشيف الكامل (بما في ذلك الفواتير القديمة) عند مسح الفلتر الزمني تماماً
            collection = db.sales.toCollection();
        }

        // تطبيق فلتر الحالة إذا وجد
        if (filters.status && filters.status !== 'all') {
            collection = collection.filter(s => s.paymentStatus === filters.status);
        }

        let sales = await collection.toArray();

        // تطبيق محرك البحث النصي المتقدم
        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            
            // جلب أسماء العملاء للمطابقة
            const customers = await db.customers.toArray();
            const customerUuids = new Set(
                customers
                    .filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(lowerQuery))
                    .map(c => c.uuid)
            );
            
            sales = sales.filter(
                s =>
                    s.invoiceNumber.toLowerCase().includes(lowerQuery) ||
                    (s.customerUuid && customerUuids.has(s.customerUuid)),
            );
        }

        // الترتيب التنازلي (الأحدث أولاً) لضمان تدفق بصري منطقي
        return sales.sort(
            (a, b) =>
                safeToDate(b.createdAt!).getTime() -
                safeToDate(a.createdAt!).getTime(),
        );
    }

    private async generateInvoiceNumber(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.invoice_counter || 1;
        const prefix = profile?.invoice_prefix || String(year);

        const invoiceNumber = `${prefix}-${String(currentCounter).padStart(6, '0')}`;

        if (profile?.id) {
            await db.company_profile.update(profile.id, {
                invoice_counter: currentCounter + 1,
                updatedAt: new Date()
            });
        }

        return invoiceNumber;
    }

    async createSale(saleData: {
        items: CartItem[];
        discountType: 'fixed' | 'percentage';
        discountValue: number;
        amountPaid: number;
        customerUuid?: string | null;
        dueDate?: Date;
    }): Promise<Sale> {
        const now = new Date();
        
        const subtotalCents = saleData.items.reduce(
            (acc, item) => acc + Math.round(preciseMultiply(item.price, item.cartQuantity) * 100),
            0,
        );
        
        let discountCents = 0;
        if (saleData.discountType === 'percentage') {
            discountCents = Math.round((subtotalCents * safeNumber(saleData.discountValue)) / 100);
        } else {
            discountCents = Math.round(safeNumber(saleData.discountValue) * 100);
        }
        
        const totalCents = Math.max(0, subtotalCents - discountCents);
        const amountPaidCents = Math.round(safeNumber(saleData.amountPaid) * 100);
        const remainingCents = Math.max(0, totalCents - amountPaidCents);

        const paymentStatus =
            remainingCents <= 0.9 
                ? 'paid'
                : amountPaidCents > 0
                  ? 'partial'
                  : 'unpaid';

        const profile = await db.company_profile.toCollection().first();

        const saleItems: SaleItem[] = saleData.items.map(item => ({
            productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
            name: item.name,
            price: safeNumber(item.price),
            purchasePrice: safeNumber(item.purchasePrice),
            quantity: safeNumber(item.cartQuantity),
            tva_rate: profile?.tva_rate || 19
        }));

        const invoiceNumber = await this.generateInvoiceNumber();

        const newSale: Sale = {
            uuid: uuidv4(),
            invoiceNumber,
            items: saleItems,
            subtotal: subtotalCents / 100,
            discountType: saleData.discountType,
            discountAmount: discountCents / 100,
            total: totalCents / 100,
            amountPaid: amountPaidCents / 100,
            remainingBalance: remainingCents / 100,
            paymentStatus,
            customerUuid: saleData.customerUuid || undefined,
            createdAt: now,
            updatedAt: now,
            dueDate: saleData.dueDate,
        };

        await db.transaction(
            'rw',
            [
                db.sales,
                db.products,
                db.inventory_logs,
                db.customers,
                db.payments,
                db.product_returns,
                db.company_profile
            ],
            async () => {
                await db.sales.add(newSale);

                for (const item of saleData.items) {
                    await inventoryService.adjustStock(
                        item.uuid,
                        -item.cartQuantity,
                        'sale',
                        newSale.uuid,
                    );
                }

                if (newSale.customerUuid) {
                    await customerService.recalculateCustomerStatus(
                        newSale.customerUuid,
                    );
                }
            },
        );

        useAppStore.getState().actions.triggerSmartSync();
        return newSale;
    }

    async processSaleCancellation(uuid: string): Promise<void> {
        await db.transaction(
            'rw',
            [
                db.sales,
                db.products,
                db.customers,
                db.inventory_logs,
                db.payments,
                db.product_returns,
            ],
            async () => {
                const sale = await this.getSaleByUuid(uuid);
                if (!sale || !sale.id) throw new Error('Vente non trouvée.');

                await db.sales.delete(sale.id);

                for (const item of sale.items) {
                    if (item.productUuid) {
                        await inventoryService.adjustStock(
                            item.productUuid,
                            item.quantity,
                            'cancellation',
                            sale.uuid,
                        );
                    }
                }

                if (sale.customerUuid) {
                    await customerService.recalculateCustomerStatus(
                        sale.customerUuid,
                    );
                }
            },
        );

        useAppStore.getState().actions.triggerSmartSync();
    }
}

export const salesService = new SalesService();

