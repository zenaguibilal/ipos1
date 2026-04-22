
'use client';

import { v4 as uuidv4 } from 'uuid';
import { db } from '@/lib/db';
import type { ProformaInvoice, Cart, SaleItem } from '@/lib/types';
import { safeNumber, preciseMultiply } from '@/lib/utils';
import { useAppStore } from '@/stores/appStore';

/**
 * Service de gestion des factures proforma (Devis).
 * Système purement documentaire sans impact sur les stocks réels.
 */
class ProformaService {
    
    private triggerSync() {
        if (typeof window !== 'undefined') {
            useAppStore.getState().actions.triggerSmartSync();
        }
    }

    async generateProformaNumber(): Promise<string> {
        const profile = await db.company_profile.toCollection().first();
        const currentCounter = profile?.proforma_counter || 1;
        const number = `PF-${String(currentCounter).padStart(6, '0')}`;

        if (profile?.id) {
            await db.company_profile.update(profile.id, {
                proforma_counter: currentCounter + 1,
                updatedAt: new Date()
            });
        }
        return number;
    }

    async createProformaFromCart(cart: Cart): Promise<ProformaInvoice> {
        if (!cart.items || cart.items.length === 0) {
            throw new Error("Le panier est vide");
        }

        const now = new Date();
        const proformaNumber = await this.generateProformaNumber();

        const subtotalCents = cart.items.reduce(
            (acc, item) => acc + Math.round(preciseMultiply(item.price, item.cartQuantity) * 100),
            0,
        );
        
        let discountCents = 0;
        if (cart.discount.type === 'percentage') {
            discountCents = Math.round((subtotalCents * safeNumber(cart.discount.value)) / 100);
        } else {
            discountCents = Math.round(safeNumber(cart.discount.value) * 100);
        }
        
        const totalCents = Math.max(0, subtotalCents - discountCents);

        const items: SaleItem[] = cart.items.map(item => ({
            productUuid: item.uuid.startsWith('custom-') ? null : item.uuid,
            name: item.name,
            price: safeNumber(item.price),
            purchasePrice: safeNumber(item.purchasePrice),
            quantity: safeNumber(item.cartQuantity),
        }));

        const newProforma: ProformaInvoice = {
            uuid: uuidv4(),
            proformaNumber,
            items,
            subtotal: subtotalCents / 100,
            total: totalCents / 100,
            customerUuid: cart.customerUuid || undefined,
            status: 'draft',
            createdAt: now,
            updatedAt: now,
        };

        // Utilisation d'une transaction pour garantir l'intégrité et le logging
        await db.transaction('rw', [db.proforma_invoices, db.inventory_logs, db.company_profile], async () => {
            await db.proforma_invoices.add(newProforma);
            
            // Traçabilité obligatoire dans le journal d'audit
            await db.inventory_logs.add({
                uuid: uuidv4(),
                productUuid: null,
                change: 0,
                newQuantity: 0,
                reason: 'create_proforma_from_pos',
                relatedUuid: newProforma.uuid,
                createdAt: now,
                updatedAt: now,
            });
        });

        this.triggerSync();
        return newProforma;
    }

    async getProformaByUuid(uuid: string): Promise<ProformaInvoice | undefined> {
        return db.proforma_invoices.where('uuid').equals(uuid).first();
    }
}

export const proformaService = new ProformaService();
