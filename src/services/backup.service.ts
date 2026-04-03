'use client';

import { db } from '@/lib/db';
import { toast } from 'sonner';

class BackupService {

    private async exportData(): Promise<Record<string, any[]>> {
        const data: Record<string, any[]> = {};
        for (const table of db.tables) {
            data[table.name] = await table.toArray();
        }
        return data;
    }

    async createBackup(): Promise<File> {
        try {
            const data = await this.exportData();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `ipos-backup-${timestamp}.json`;
            const file = new File([JSON.stringify(data)], fileName, { type: 'application/json' });
            return file;
        } catch (error) {
            console.error("Backup creation failed:", error);
            throw new Error("La création de la sauvegarde a échoué.");
        }
    }

    async validateAndParseBackup(file: File): Promise<Record<string, any[]>> {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Basic validation: check if at least some expected tables exist
            if (!data.products && !data.customers && !data.sales && !data.company_profile) {
                throw new Error("Le fichier ne semble pas être une sauvegarde iPOS valide.");
            }
            
            return data;
        } catch (error: any) {
            throw new Error("Fichier invalide : " + error.message);
        }
    }

    async restoreBackup(data: Record<string, any[]>): Promise<void> {
        try {
            toast.info("Restauration souveraine en cours... Purge du cache local.");

            await db.transaction('rw', db.tables, async () => {
                // Clear all tables
                for (const table of db.tables) {
                    await table.clear();
                }

                // Restore data in order
                if (data.company_profile?.length) await db.company_profile.bulkPut(data.company_profile);
                if (data.suppliers?.length) await db.suppliers.bulkPut(data.suppliers);
                if (data.customers?.length) await db.customers.bulkPut(data.customers);
                if (data.products?.length) await db.products.bulkPut(data.products);
                if (data.expenses?.length) await db.expenses.bulkPut(data.expenses);
                if (data.stock_intakes?.length) await db.stock_intakes.bulkPut(data.stock_intakes);
                if (data.sales?.length) await db.sales.bulkPut(data.sales);
                if (data.product_returns?.length) await db.product_returns.bulkPut(data.product_returns);
                if (data.payments?.length) await db.payments.bulkPut(data.payments);
                if (data.bread_orders?.length) await db.bread_orders.bulkPut(data.bread_orders);
                if (data.inventory_logs?.length) await db.inventory_logs.bulkPut(data.inventory_logs);
                if (data.supplier_payments?.length) await db.supplier_payments.bulkPut(data.supplier_payments);
            });

        } catch (error: any) {
            console.error("Restore failed:", error);
            throw new Error("Échec de la restauration : " + error.message);
        }
    }
}

export const backupService = new BackupService();
