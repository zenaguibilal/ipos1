'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * Service de synchronisation souverain pour iPOS Luxury.
 * Gère le transfert bidirectionnel intelligent entre IndexedDB et Supabase.
 * Utilise une logique de fusion temporelle Elite (updatedAt).
 */
class SupabaseSyncService {

    /**
     * Ordonnancement strict des tables pour garantir l'intégrité référentielle.
     */
    private readonly tableSyncOrder = [
        { name: 'company_profile',   table: db.company_profile },
        { name: 'suppliers',         table: db.suppliers },
        { name: 'customers',         table: db.customers },
        { name: 'products',          table: db.products },
        { name: 'expenses',          table: db.expenses },
        { name: 'stock_intakes',     table: db.stock_intakes },
        { name: 'sales',             table: db.sales },
        { name: 'product_returns',   table: db.product_returns },
        { name: 'payments',          table: db.payments },
        { name: 'bread_orders',      table: db.bread_orders },
        { name: 'inventory_logs',    table: db.inventory_logs },
        { name: 'supplier_payments', table: db.supplier_payments },
    ];

    /**
     * Nettoie et formate les données pour le transport JSON vers Postgres.
     * Convertit les objets Date en chaînes ISO et supprime l'ID local Dexie.
     */
    private sanitizeForCloud(data: any): any {
        if (data === null || data === undefined) return data;
        if (data instanceof Date) return data.toISOString();
        if (Array.isArray(data)) return data.map(i => this.sanitizeForCloud(i));
        if (typeof data === 'object') {
            const clean: any = {};
            for (const key in data) {
                if (key === 'id') continue; // Never push the local auto-increment id
                clean[key] = this.sanitizeForCloud(data[key]);
            }
            return clean;
        }
        return data;
    }

    /**
     * FIX #10: strip the remote `id` field before inserting / updating in Dexie.
     * Supabase tables may have their own serial `id` column. If we pass that
     * value to Dexie's auto-increment key, it creates conflicts or corrupts the
     * local auto-increment sequence.
     */
    private stripRemoteId(record: any): any {
        const { id: _ignored, ...rest } = record;
        return rest;
    }

    async testConnection(url: string, key: string): Promise<boolean> {
        try {
            const supabase = getSupabaseClient(url, key);
            if (!supabase) return false;
            const { error } = await supabase
                .from('company_profile')
                .select('uuid')
                .limit(1);
            if (error && error.code !== 'PGRST116') {
                console.error('Supabase connection error:', error);
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    async pushAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error('Supabase non configuré.');

        for (const item of this.tableSyncOrder) {
            const records = await item.table.toArray();
            if (records.length === 0) continue;

            const dataToSync = this.sanitizeForCloud(records);
            const { error } = await supabase
                .from(item.name)
                .upsert(dataToSync, { onConflict: 'uuid' });

            if (error) {
                console.warn(
                    `iPOS Sync Elite - Échec Push [${item.name}]: ${error.message}`,
                );
                if (error.code === '42501') {
                    throw new Error(
                        `Permission refusée sur la table ${item.name}. Avez-vous exécuté le script SQL avec DISABLE RLS ?`,
                    );
                }
            }
        }
    }

    async pullAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error('Supabase non configuré.');

        for (const item of this.tableSyncOrder) {
            const { data, error } = await supabase
                .from(item.name)
                .select('*');
            if (error) {
                console.warn(
                    `iPOS Sync Elite - Échec Pull [${item.name}]: ${error.message}`,
                );
                continue;
            }

            if (data && data.length > 0) {
                await db.transaction('rw', item.table, async () => {
                    for (const remoteRecord of data) {
                        const localRecord = await item.table
                            .where('uuid')
                            .equals(remoteRecord.uuid)
                            .first();

                        if (localRecord) {
                            const localUpdate = localRecord.updatedAt
                                ? new Date(localRecord.updatedAt).getTime()
                                : 0;
                            const remoteUpdate = remoteRecord.updatedAt
                                ? new Date(remoteRecord.updatedAt).getTime()
                                : 0;

                            if (remoteUpdate > localUpdate) {
                                const { id } = localRecord;
                                // FIX #10: strip remote id to avoid corrupting local auto-increment
                                await item.table.update(
                                    id,
                                    this.stripRemoteId(remoteRecord),
                                );
                            }
                        } else {
                            // FIX #10: strip remote id before inserting so Dexie
                            // assigns its own auto-increment id cleanly.
                            await item.table.add(
                                this.stripRemoteId(remoteRecord),
                            );
                        }
                    }
                });
            }
        }
    }
}

export const supabaseSyncService = new SupabaseSyncService();