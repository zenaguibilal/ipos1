
'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';

class SalesService {

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return db.sales.where('uuid').equals(uuid).first();
    }

    async getSaleByInvoiceNumber(
        invoiceNumber: string,
    ): Promise<Sale | undefined> {
        return db.sales.where('invoiceNumber').equals(invoiceNumber).first();
    }

    async filterSales(filters: {
        query?: string;
        from?: Date;
        to?: Date;
        status?: 'all' | 'paid' | 'partial' | 'unpaid';
    }): Promise<Sale[]> {
        let collection = db.sales.toCollection();

        if (filters.from)
            collection = collection.filter(
                s => new Date(s.createdAt!) >= filters.from!,
            );
        if (filters.to)
            collection = collection.filter(
                s => new Date(s.createdAt!) <= filters.to!,
            );
        if (filters.status && filters.status !== 'all')
            collection = collection.filter(
                s => s.paymentStatus === filters.status,
            );

        let sales = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            const customers = await db.customers
                .filter(c => (c.firstName + ' ' + c.lastName).toLowerCase().includes(lowerQuery))
                .toArray();
            const customerUuids = customers.map(c => c.uuid);
            sales = sales.filter(
                s =>
                    s.invoiceNumber.toLowerCase().includes(lowerQuery) ||
                    (s.customerUuid && customerUuids.includes(s.customerUuid)),
            );
        }

        return sales.sort(
            (a, b) =>
                new Date(b.createdAt!).getTime() -
                new Date(a.createdAt!).getTime(),
        );
    }

    /**
     * Génère un numéro de facture séquentiel conforme à la loi algérienne.
     * Format : AAAA-NNNNNN (ex: 2025-000142)
     */
    private async generateInvoiceNumber(): Promise<string> {
        const now = new Date();
        const year = now.getFullYear();
        
        // Récupérer le compteur depuis le profil
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.invoice_counter || 1;
        const prefix = profile?.invoice_prefix || String(year);

        const invoiceNumber = `${prefix}-${String(currentCounter).padStart(6, '0')}`;

        // Mettre à jour le compteur dans Dexie
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
        const subtotal = saleData.items.reduce(
            (acc, item) => acc + item.price * item.cartQuantity,
            0,
        );
        const discountAmount =
            saleData.discountType === 'percentage'
                ? (subtotal * saleData.discountValue) / 100
                : saleData.discountValue;
        const total = Math.max(0, subtotal - discountAmount);

        const remainingBalance = total - saleData.amountPaid;
        const paymentStatus =
            remainingBalance <= 0.01
                ? 'paid'
                : saleData.amountPaid > 0
                  ? 'partial'
                  : 'unpaid';

        const profile = await db.company_profile.toCollection().first();

        const saleItems: SaleItem[] = saleData.items.map(item => ({
            productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice,
            quantity: item.cartQuantity,
            tva_rate: profile?.tva_rate || 19
        }));

        const invoiceNumber = await this.generateInvoiceNumber();

        const newSale: Sale = {
            uuid: uuidv4(),
            invoiceNumber,
            items: saleItems,
            subtotal,
            discountType: saleData.discountType,
            discountAmount,
            total,
            amountPaid: saleData.amountPaid,
            remainingBalance,
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
