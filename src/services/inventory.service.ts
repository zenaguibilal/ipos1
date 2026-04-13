'use client';
import { v4 as uuidv4 } from 'uuid';
import type { InventoryLog, InventoryLogReason, Product } from '@/lib/types';
import { db } from '@/lib/db';
import { calculateStockStatus, safeNumber } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

/**
 * @fileOverview Service de gestion fine des stocks et de l'audit trail.
 * Garantit la précision décimale et l'atomicité des mouvements.
 */
class InventoryService {

    /**
     * Ajuste le stock d'un produit de manière atomique et consigne le mouvement.
     * Applique un arrondi à 3 décimales pour garantir la précision (poids/volume).
     */
    async adjustStock(productUuid: string | null | undefined, quantityChange: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        if (!productUuid || productUuid === 'BREAD_PRODUCT' || productUuid.startsWith('custom-')) {
            return; 
        }

        // Exécution dans une transaction pour garantir l'intégrité de l'audit trail
        await db.transaction('rw', [db.products, db.inventory_logs], async () => {
            const product = await db.products.where('uuid').equals(productUuid).first();
            if (!product || !product.id) return;

            const currentQty = safeNumber(product.quantity);
            const change = safeNumber(quantityChange);
            
            // Calcul financier durci (3 décimales) pour éviter les erreurs IEEE 754
            const newQuantity = Number((currentQty + change).toFixed(3));

            await db.products.update(product.id, {
                quantity: newQuantity,
                stockStatus: calculateStockStatus(newQuantity, product.minStockLevel),
                updatedAt: new Date()
            });

            const logEntry: InventoryLog = {
                uuid: uuidv4(),
                productUuid: productUuid,
                change: Number(change.toFixed(3)),
                newQuantity: newQuantity,
                reason: reason,
                relatedUuid: relatedUuid,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            await db.inventory_logs.add(logEntry);
        });

        // Déclencher la synchronisation intelligente (debounced)
        useAppStore.getState().actions.triggerSmartSync();
    }
    
    async logChange(productUuid: string, change: number, newQuantity: number, reason: InventoryLogReason, relatedUuid?: string): Promise<void> {
        const logEntry: InventoryLog = {
            uuid: uuidv4(),
            productUuid: productUuid,
            change: Number(safeNumber(change).toFixed(3)),
            newQuantity: Number(safeNumber(newQuantity).toFixed(3)),
            reason: reason,
            relatedUuid: relatedUuid,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        await db.inventory_logs.add(logEntry);
    }

    async getLogs(filters: { query?: string, from?: Date, to?: Date, productUuid?: string }): Promise<(InventoryLog & { productName: string, reference?: string })[]> {
        let collection = db.inventory_logs.toCollection();

        if (filters.productUuid) {
            collection = db.inventory_logs.where('productUuid').equals(filters.productUuid);
        }

        if (filters.from) {
            collection = collection.filter(l => new Date(l.createdAt) >= filters.from!);
        }
        if (filters.to) {
            collection = collection.filter(l => new Date(l.createdAt) <= filters.to!);
        }

        const logs = await collection.toArray();
        const productUuids = [...new Set(logs.map(l => l.productUuid))];
        const products = await db.products.where('uuid').anyOf(productUuids).toArray();
        const productMap = new Map(products.map(p => [p.uuid, p.name]));

        const intakeUuids = logs.filter(l => l.reason === 'stock_intake' || l.reason === 'cancellation').map(l => l.relatedUuid).filter(Boolean) as string[];
        const saleUuids = logs.filter(l => l.reason === 'sale' || l.reason === 'cancellation').map(l => l.relatedUuid).filter(Boolean) as string[];
        
        const [intakes, sales] = await Promise.all([
            db.stock_intakes.where('uuid').anyOf(intakeUuids).toArray(),
            db.sales.where('uuid').anyOf(saleUuids).toArray()
        ]);

        const referenceMap = new Map<string, string>();
        intakes.forEach(i => referenceMap.set(i.uuid, i.invoiceNumber || 'Réception'));
        sales.forEach(s => referenceMap.set(s.uuid, s.invoiceNumber));

        let result = logs.map(l => ({
            ...l,
            productName: productMap.get(l.productUuid) || 'Produit inconnu',
            reference: l.relatedUuid ? referenceMap.get(l.relatedUuid) : undefined
        }));

        if (filters.query) {
            const q = filters.query.toLowerCase();
            result = result.filter(l => l.productName.toLowerCase().includes(q));
        }

        return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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