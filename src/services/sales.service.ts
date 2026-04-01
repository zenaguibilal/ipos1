'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Sale, CartItem, SaleItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';

class SalesService {

    async getAllSales(): Promise<Sale[]> {
        return db.sales.orderBy('createdAt').reverse().toArray();
    }

    async getSaleByUuid(uuid: string): Promise<Sale | undefined> {
        return db.sales.where('uuid').equals(uuid).first();
    }
    
    async getSaleByInvoiceNumber(invoiceNumber: string): Promise<Sale | undefined> {
        return db.sales.where('invoiceNumber').equals(invoiceNumber).first();
    }

    async findSalesByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        return db.sales.where('customerUuid').equals(customerUuid).sortBy('createdAt');
    }
    
    async findUnpaidByCustomerUuid(customerUuid: string): Promise<Sale[]> {
        return db.sales.where({ customerUuid }).and(s => s.paymentStatus !== 'paid').sortBy('createdAt');
    }

    async filterSales(filters: { query?: string, from?: Date, to?: Date }): Promise<Sale[]> {
        let collection = db.sales.toCollection();

        if (filters.from) {
            collection = collection.filter(s => new Date(s.createdAt!) >= filters.from!);
        }
        if (filters.to) {
            collection = collection.filter(s => new Date(s.createdAt!) <= filters.to!);
        }

        let sales = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase();
            const customerUuids = (await db.customers.filter(c => c.searchName!.toLowerCase().includes(lowerQuery)).toArray()).map(c => c.uuid);

            sales = sales.filter(s => 
                s.invoiceNumber.toLowerCase().includes(lowerQuery) ||
                (s.customerUuid && customerUuids.includes(s.customerUuid))
            );
        }

        return sales.sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
    }

    async createSale(saleData: {
        items: CartItem[],
        discountType: 'fixed' | 'percentage',
        discountValue: number,
        amountPaid: number,
        customerUuid?: string | null,
        dueDate?: Date,
    }): Promise<Sale> {
        const now = new Date();
        const subtotal = saleData.items.reduce((acc, item) => acc + item.price * item.cartQuantity, 0);
        const discountAmount = saleData.discountType === 'percentage'
            ? (subtotal * saleData.discountValue) / 100
            : saleData.discountValue;
        const total = Math.max(0, subtotal - discountAmount);

        const remainingBalance = total - saleData.amountPaid;
        const paymentStatus = remainingBalance <= 0.01 ? 'paid' : (saleData.amountPaid > 0 ? 'partial' : 'unpaid');
        
        const saleItems: SaleItem[] = saleData.items.map(item => ({
            productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
            name: item.name,
            price: item.price,
            purchasePrice: item.purchasePrice,
            quantity: item.cartQuantity
        }));
        
        const datePrefix = now.toISOString().slice(2, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const invoiceNumber = `${datePrefix}-${randomSuffix}`;

        const newSale: Sale = {
            uuid: uuidv4(),
            invoiceNumber,
            items: saleItems,
            subtotal,
            discountType: saleData.discountType,
            discountAmount: discountAmount,
            total,
            amountPaid: saleData.amountPaid,
            remainingBalance,
            paymentStatus,
            customerUuid: saleData.customerUuid || undefined,
            createdAt: now,
            updatedAt: now,
            dueDate: saleData.dueDate,
        };
        
        const id = await db.sales.add(newSale);
        newSale.id = id;
        return newSale;
    }

    async processSaleCancellation(uuid: string): Promise<void> {
        await db.transaction('rw', db.sales, db.products, db.customers, db.inventory_logs, async () => {
            const sale = await this.getSaleByUuid(uuid);
            if (!sale || !sale.id) {
                throw new Error("Vente non trouvée.");
            }

            // Delete the sale
            await db.sales.delete(sale.id);

            // Restore stock
            for (const item of sale.items) {
                if (item.productUuid) {
                    await inventoryService.adjustStock(item.productUuid, item.quantity, 'cancellation', sale.uuid);
                }
            }

            // Update customer status
            if (sale.customerUuid) {
                await customerService.recalculateCustomerStatus(sale.customerUuid);
            }
        });
    }
}

export const salesService = new SalesService();
