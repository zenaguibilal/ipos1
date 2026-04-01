'use client';
import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus } from '@/lib/utils';

class InventoryService {

    async adjustStock(productUuid: string | null | undefined, quantityChange: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        if (!productUuid || productUuid === 'BREAD_PRODUCT') {
            return; // Do not track stock for special/custom products
        }

        const product = await db.products.where('uuid').equals(productUuid).first();
        if (!product || !product.id) {
            console.warn(`Attempted to adjust stock for a non-existent product UUID: ${productUuid}`);
            return;
        }

        const newQuantity = product.quantity + quantityChange;

        await db.products.update(product.id, {
            quantity: newQuantity,
            stockStatus: calculateStockStatus(newQuantity, product.minStockLevel),
            updatedAt: new Date()
        });

        await this.logChange(productUuid, quantityChange, newQuantity, reason, relatedUuid);
    }
    
    private async logChange(productUuid: string, change: number, newQuantity: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        const logEntry: InventoryLog = {
            uuid: uuidv4(),
            productUuid: productUuid,
            change: change,
            newQuantity: newQuantity,
            reason: reason,
            relatedUuid: relatedUuid,
            createdAt: new Date(),
        };

        await db.inventory_logs.add(logEntry);
    }

    async getProductInfo(productUuid: string): Promise<Product | undefined> {
        return db.products.where('uuid').equals(productUuid).first();
    }
    
    async hasLogs(productUuid: string): Promise<boolean> {
        const count = await db.inventory_logs.where('productUuid').equals(productUuid).count();
        return count > 0;
    }
}

export const inventoryService = new InventoryService();
