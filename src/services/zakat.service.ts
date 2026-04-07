'use client';

import { db } from '@/lib/db';
import { companyProfileService } from './profile.service';

/**
 * Service de calcul de la Zakat pour iPOS Luxury.
 * Analyse les actifs circulants (Stock + Créances) et soustrait les dettes
 * (Fournisseurs).
 */
class ZakatService {
    async getZakatData() {
        const [products, customers, suppliers, profile] = await Promise.all([
            db.products.toArray(),
            db.customers.toArray(),
            db.suppliers.toArray(),
            companyProfileService.getProfile(),
        ]);

        const inventoryValueCost = products.reduce(
            (sum, p) => sum + (p.quantity > 0 ? p.quantity * p.purchasePrice : 0),
            0,
        );
        const inventoryValueSale = products.reduce(
            (sum, p) => sum + (p.quantity > 0 ? p.quantity * p.price : 0),
            0,
        );
        const customerDebts = customers.reduce(
            (sum, c) => sum + (c.outstandingBalance || 0),
            0,
        );
        const supplierDebts = suppliers.reduce(
            (sum, s) => sum + (s.balance || 0),
            0,
        );

        const goldPrice = profile?.goldPricePerGram || 0;

        /**
         * FIX #14: When goldPricePerGram is 0 (not configured), nisabThreshold
         * was 0, making isEligible = (base >= 0) which is almost always true.
         * This meant Zakat appeared always due, even on empty businesses.
         *
         * Fix: return nisabThreshold = null when goldPrice is not set,
         * so the page can display a "configure gold price" warning instead
         * of showing an incorrect "Zakat is due" result.
         */
        const nisabThreshold = goldPrice > 0 ? goldPrice * 85 : null;

        return {
            inventoryValueCost,
            inventoryValueSale,
            customerDebts,
            supplierDebts,
            nisabThreshold, // null = not configured
            goldPrice,
        };
    }
}

export const zakatService = new ZakatService();