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
     * Plus flexible : initialise les segments manquants à vide.
     */
    async validateAndParseBackup(file: File): Promise<Record<string, any[]>> {
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            
            // On s'assure que toutes les tables attendues existent au moins en tant qu'entrées (même vides)
            // pour éviter les crashs de l'interface d'aperçu.
            const allTableNames = db.tables.map(t => t.name);
            allTableNames.forEach(tableName => {
                if (!data[tableName]) {
                    data[tableName] = [];
                }
            });
            
            return data;
        } catch (error: any) {
            throw new Error("Manifeste corrompu ou invalide : " + error.message);
        }
    }

    /**
     * Restaure les données sélectionnées dans IndexedDB.
     */
    async restoreBackup(data: Record<string, any[]>): Promise<void> {
        try {
            const tablesToRestore = Object.keys(data);
            const dexieTables = tablesToRestore.map(t => db.table(t));

            await db.transaction('rw', dexieTables, async () => {
                for (const tableName of tablesToRestore) {
                    const table = db.table(tableName);
                    const records = data[tableName];

                    if (records && Array.isArray(records)) {
                        // Purge de la table existante avant injection pour garantir l'intégrité de la sélection
                        await table.clear();
                        
                        // Nettoyage des IDs locaux pour éviter les collisions
                        const cleanData = records.map(r => {
                            const { id, ...rest } = r;
                            return rest;
                        });

                        if (cleanData.length > 0) {
                            await table.bulkAdd(cleanData);
                        }
                    }
                }
            });

            toast.success("Restauration sélective terminée.");

        } catch (error: any) {
            console.error("Restore failed:", error);
            throw new Error("Échec critique de la restauration : " + error.message);
        }
    }
}

export const backupService = new BackupService();
