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
     * On synchronise d'abord les entités racines (Profil, Fournisseurs) avant les transactions.
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
            // Ignore error if it's just "no rows found", but error code PGRST116 means exactly that.
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

            // Préparation des données : on retire l'ID local auto-incrémenté pour laisser Supabase gérer par UUID
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
     * Récupère les données du cloud et fusionne avec la base locale.
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
                        // On cherche si l'enregistrement existe déjà localement via son UUID
                        const localRecord = await item.table.where('uuid').equals(remoteRecord.uuid).first();
                        
                        if (localRecord) {
                            // Mise à jour de l'existant en conservant l'ID Dexie local pour la stabilité de l'index
                            const { id } = localRecord;
                            await item.table.update(id, remoteRecord);
                        } else {
                            // Nouvel enregistrement venant du cloud : Dexie générera un nouvel ID local (id)
                            await item.table.add(remoteRecord);
                        }
                    }
                });
            }
        }
    }
}

export const supabaseSyncService = new SupabaseSyncService();
