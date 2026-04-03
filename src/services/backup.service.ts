
'use client';

import { db } from '@/lib/db';
import { toast } from 'sonner';

/**
 * Service de gestion des archives et de la souveraineté des données.
 */
class BackupService {

    private async exportData(): Promise<Record<string, any[]>> {
        const data: Record<string, any[]> = {};
        for (const table of db.tables) {
            data[table.name] = await table.toArray();
        }
        return data;
    }

    /**
     * Génère un fichier de sauvegarde JSON.
     */
    async createBackup(): Promise<File> {
        try {
            const data = await this.exportData();
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const fileName = `ipos-elite-backup-${timestamp}.json`;
            const file = new File([JSON.stringify(data)], fileName, { type: 'application/json' });
            return file;
        } catch (error) {
            console.error("Backup creation failed:", error);
            throw new Error("La compression des archives a échoué.");
        }
    }

    /**
     * Valide et analyse une archive avant aperçu.
     */
    async validateAndParseBackup(file: File): Promise<Record<string, any[]>> {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // Vérification des segments critiques
            const mandatorySegments = ['products', 'customers', 'company_profile'];
            const missing = mandatorySegments.filter(s => !data[s]);
            
            if (missing.length > 0) {
                throw new Error(`Segments manquants: ${missing.join(', ')}`);
            }
            
            return data;
        } catch (error: any) {
            throw new Error("Manifeste invalide : " + error.message);
        }
    }

    /**
     * Restaure les données dans IndexedDB après validation manuelle dans l'aperçu.
     */
    async restoreBackup(data: Record<string, any[]>): Promise<void> {
        try {
            toast.info("Restauration souveraine initiée... Purge du cache en cours.");

            await db.transaction('rw', db.tables, async () => {
                // Étape 1 : Purge complète pour éviter les doublons ou conflits d'index
                for (const table of db.tables) {
                    await table.clear();
                }

                // Étape 2 : Injection séquencée pour respecter l'intégrité
                const restoreOrder = [
                    'company_profile',
                    'suppliers',
                    'customers',
                    'products',
                    'expenses',
                    'stock_intakes',
                    'sales',
                    'product_returns',
                    'payments',
                    'bread_orders',
                    'inventory_logs',
                    'supplier_payments'
                ];

                for (const segment of restoreOrder) {
                    if (data[segment] && Array.isArray(data[segment]) && data[segment].length > 0) {
                        // On réinjecte avec bulkPut pour écraser tout conflit résiduel (sécurité double)
                        await db.table(segment).bulkPut(data[segment]);
                    }
                }
            });

            toast.success("Manifeste déployé. Redémarrage imminent.");

        } catch (error: any) {
            console.error("Restore failed:", error);
            throw new Error("Échec du déploiement : " + error.message);
        }
    }
}

export const backupService = new BackupService();
