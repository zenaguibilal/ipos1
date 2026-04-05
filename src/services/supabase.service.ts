
'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Service de synchronisation souverain pour iPOS Luxury.
 * Gère le transfert bidirectionnel des données entre IndexedDB et Supabase.
 */
class SupabaseSyncService {
    
    /**
     * Ordonnancement strict des tables pour garantir l'intégrité référentielle.
     */
    private readonly tableSyncOrder = [
        { name: 'company_profile', table: db.company_profile },
        { name: 'suppliers', table: db.suppliers },
        { name: 'customers', table: db.customers },
        { name: 'products', table: db.products },
        { name: 'expenses', table: db.expenses },
        { name: 'stock_intakes', table: db.stock_intakes },
        { name: 'sales', table: db.sales },
        { name: 'product_returns', table: db.product_returns },
        { name: 'payments', table: db.payments },
        { name: 'bread_orders', table: db.bread_orders },
        { name: 'inventory_logs', table: db.inventory_logs },
        { name: 'supplier_payments', table: db.supplier_payments },
    ];

    /**
     * Teste la validité des identifiants Supabase.
     */
    async testConnection(url: string, key: string): Promise<boolean> {
        try {
            const supabase = getSupabaseClient(url, key);
            if (!supabase) return false;
            
            const { error } = await supabase.from('company_profile').select('uuid').limit(1);
            if (error && error.code !== 'PGRST116') { 
                console.error("Supabase connection error:", error);
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Pousse l'intégralité des données locales vers le cloud.
     */
    async pushAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error("Supabase non configuré.");

        for (const item of this.tableSyncOrder) {
            const records = await item.table.toArray();
            if (records.length === 0) continue;

            // Préparation des données : on retire l'ID local auto-incrémenté
            const dataToSync = records.map((r: any) => {
                const { id, ...rest } = r;
                return rest;
            });

            const { error } = await supabase
                .from(item.name)
                .upsert(dataToSync, { onConflict: 'uuid' });

            if (error) {
                throw new Error(`Échec Push [${item.name}]: ${error.message}`);
            }
        }
    }

    /**
     * Récupère les données du cloud et fusionne avec la base locale intelligemment.
     * Utilise updatedAt pour éviter d'écraser des données locales plus récentes.
     */
    async pullAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error("Supabase non configuré.");

        for (const item of this.tableSyncOrder) {
            const { data, error } = await supabase.from(item.name).select('*');
            if (error) throw new Error(`Échec Pull [${item.name}]: ${error.message}`);
            
            if (data && data.length > 0) {
                await db.transaction('rw', item.table, async () => {
                    for (const remoteRecord of data) {
                        const localRecord = await item.table.where('uuid').equals(remoteRecord.uuid).first();
                        
                        if (localRecord) {
                            // Comparaison intelligente des timestamps
                            const localUpdate = localRecord.updatedAt ? new Date(localRecord.updatedAt).getTime() : 0;
                            const remoteUpdate = remoteRecord.updatedAt ? new Date(remoteRecord.updatedAt).getTime() : 0;
                            
                            if (remoteUpdate > localUpdate) {
                                const { id } = localRecord;
                                await item.table.update(id, remoteRecord);
                            }
                        } else {
                            await item.table.add(remoteRecord);
                        }
                    }
                });
            }
        }
    }
}

export const supabaseSyncService = new SupabaseSyncService();
