'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';
import { toast } from 'sonner';

/**
 * Service de synchronisation souverain pour iPOS Zen.
 * Gère le transfert bidirectionnel intelligent entre IndexedDB et Supabase.
 */
class SupabaseSyncService {

    private isSyncing = false;

    /** Ordonnancement strict pour l'intégrité référentielle */
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

    /** Nettoyage des données pour le stockage Cloud */
    private sanitizeForCloud(data: any): any {
        if (data === null || data === undefined) return data;
        if (data instanceof Date) return data.toISOString();
        if (Array.isArray(data)) return data.map(i => this.sanitizeForCloud(i));
        if (typeof data === 'object') {
            const clean: any = {};
            for (const key in data) {
                if (key === 'id') continue;
                clean[key] = this.sanitizeForCloud(data[key]);
            }
            return clean;
        }
        return data;
    }

    /** Suppression des IDs distants pour IndexedDB */
    private stripRemoteId(record: any): any {
        const { id: _ignored, ...rest } = record;
        return rest;
    }

    /** Mécanisme de retry intelligent */
    private async withRetry<T>(
        fn: () => Promise<T>,
        attempts = 3,
        delayMs = 800,
    ): Promise<T> {
        let lastError: any;
        for (let i = 0; i < attempts; i++) {
            try {
                return await fn();
            } catch (err) {
                lastError = err;
                if (i < attempts - 1)
                    await new Promise(r => setTimeout(r, delayMs * (i + 1)));
            }
        }
        throw lastError;
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
        if (this.isSyncing) {
            toast.info('Synchronisation déjà en cours…');
            return;
        }
        this.isSyncing = true;

        const supabase = getSupabaseClient(url, key);
        if (!supabase) {
            this.isSyncing = false;
            throw new Error('Supabase non configuré.');
        }

        try {
            for (const item of this.tableSyncOrder) {
                const records = await item.table.toArray();
                if (records.length === 0) continue;

                const dataToSync = this.sanitizeForCloud(records);

                await this.withRetry(async () => {
                    const { error } = await supabase
                        .from(item.name)
                        .upsert(dataToSync, { onConflict: 'uuid' });

                    if (error) {
                        if (error.code === '42501')
                            throw new Error(
                                `Permission refusée sur ${item.name}. Vérifiez les politiques RLS.`,
                            );
                        throw new Error(
                            `Push [${item.name}] échoué: ${error.message}`,
                        );
                    }
                });
            }

            toast.success('Sauvegarde cloud réussie ✓', {
                description: `${this.tableSyncOrder.length} tables synchronisées.`,
            });
        } catch (err: any) {
            toast.error('Échec de la sauvegarde cloud', {
                description: err.message,
            });
            throw err;
        } finally {
            this.isSyncing = false;
        }
    }

    async pullAllData(url: string, key: string): Promise<void> {
        if (this.isSyncing) {
            toast.info('Synchronisation déjà en cours…');
            return;
        }
        this.isSyncing = true;

        const supabase = getSupabaseClient(url, key);
        if (!supabase) {
            this.isSyncing = false;
            throw new Error('Supabase non configuré.');
        }

        try {
            for (const item of this.tableSyncOrder) {
                const { data, error } = await this.withRetry(() =>
                    supabase.from(item.name).select('*'),
                );

                if (error) {
                    console.warn(`Pull [${item.name}] échoué: ${error.message}`);
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
                                    await item.table.update(
                                        localRecord.id,
                                        this.stripRemoteId(remoteRecord),
                                    );
                                }
                            } else {
                                await item.table.add(
                                    this.stripRemoteId(remoteRecord),
                                );
                            }
                        }
                    });
                }
            }

            toast.success('Restauration cloud réussie ✓', {
                description: 'Données locales mises à jour.',
            });
        } catch (err: any) {
            toast.error('Échec de la restauration cloud', {
                description: err.message,
            });
            throw err;
        } finally {
            this.isSyncing = false;
        }
    }
}

export const supabaseSyncService = new SupabaseSyncService();
