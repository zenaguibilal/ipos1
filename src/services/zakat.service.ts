'use client';

import { db } from '@/lib/db';
import { companyProfileService } from './profile.service';

/**
 * Service de calcul de la Zakat pour iPOS Luxury.
 * Analyse les actifs circulants (Stock + Créances) et soustrait les dettes (Fournisseurs).
 */
class ZakatService {
    async getZakatData() {
        const [products, customers, suppliers, profile] = await Promise.all([
            db.products.toArray(),
            db.customers.toArray(),
            db.suppliers.toArray(),
            companyProfileService.getProfile()
        ]);

        const inventoryValueCost = products.reduce((sum, p) => sum + (p.quantity > 0 ? p.quantity * p.purchasePrice : 0), 0);
        const inventoryValueSale = products.reduce((sum, p) => sum + (p.quantity > 0 ? p.quantity * p.price : 0), 0);
        const customerDebts = customers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0);
        const supplierDebts = suppliers.reduce((sum, s) => sum + (s.balance || 0), 0);

        const goldPrice = profile?.goldPricePerGram || 0;
        const nisabThreshold = goldPrice * 85; // 85g d'or est le seuil standard

        return {
            inventoryValueCost,
            inventoryValueSale,
            customerDebts,
            supplierDebts,
            nisabThreshold,
            goldPrice
        };
    }
}

export const zakatService = new ZakatService();
