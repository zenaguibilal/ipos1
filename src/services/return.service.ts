
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { ProductReturn, ReturnItem } from '@/lib/types';
import { db } from '@/lib/db';
import { inventoryService } from './inventory.service';
import { customerService } from './customer.service';
import { useAppStore } from '@/stores/appStore';

class ReturnService {

    async getReturnByUuid(uuid: string): Promise<ProductReturn | undefined> {
        return db.product_returns.where('uuid').equals(uuid).first();
    }

    async filterReturns(filters: { query?: string; from?: Date; to?: Date }): Promise<ProductReturn[]> {
        let collection = db.product_returns.toCollection();

        if (filters.from) {
             collection = collection.filter(r => new Date(r.createdAt!) >= filters.from!);
        }
        if (filters.to) {
            collection = collection.filter(r => new Date(r.createdAt!) <= filters.to!);
        }

        let returns = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase();
            returns = returns.filter(r => r.originalInvoiceNumber.toLowerCase().includes(lowerQuery));
        }
        
        returns.sort((a,b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
        return returns;
    }
    
    async addReturn(returnData: {
        originalSaleUuid: string,
        items: ReturnItem[],
        totalReturnValue: number,
        amountRefunded: number,
        customerUuid?: string,
        notes?: string
    }): Promise<ProductReturn> {
        const sale = await db.sales.where('uuid').equals(returnData.originalSaleUuid).first();
        if (!sale) {
            throw new Error("La vente originale est introuvable.");
        }

        const now = new Date();
        const newReturn: ProductReturn = {
            uuid: uuidv4(),
            originalSaleUuid: returnData.originalSaleUuid,
            originalInvoiceNumber: sale.invoiceNumber,
            items: returnData.items,
            totalReturnValue: returnData.totalReturnValue,
            amountRefunded: returnData.amountRefunded,
            customerUuid: returnData.customerUuid,
            createdAt: now,
            updatedAt: now,
            notes: returnData.notes,
        };

        const id = await db.product_returns.add(newReturn);
        newReturn.id = id;

        // Note: The appStore.processReturn wrapper also calls triggerSmartSync
        // But adding it here ensures direct service calls also sync.
        useAppStore.getState().actions.triggerSmartSync();

        return newReturn;
    }

    async processReturnCancellation(uuid: string): Promise<void> {
        await db.transaction('rw', [db.product_returns, db.products, db.customers, db.inventory_logs], async () => {
            const productReturn = await this.getReturnByUuid(uuid);
            if (!productReturn || !productReturn.id) {
                throw new Error("Retour non trouvé.");
            }

            await db.product_returns.delete(productReturn.id);
            
            for (const item of productReturn.items) {
                if (item.wasRestocked && item.productUuid) {
                    await inventoryService.adjustStock(item.productUuid, -item.quantity, 'cancellation', productReturn.uuid);
                }
            }
            
            if (productReturn.customerUuid) {
                await customerService.recalculateCustomerStatus(productReturn.customerUuid);
            }
        });

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();
    }
}

export const returnService = new ReturnService();
