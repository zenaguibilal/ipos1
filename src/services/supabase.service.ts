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

    private camelToSnake(str: string): string {
        return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    }

    private snakeToCamel(str: string): string {
        return str.replace(/(_\w)/g, m => m[1].toUpperCase());
    }

    private sanitizeForCloud(data: any): any {
        if (data === null || data === undefined) return data;
        if (data instanceof Date) return data.toISOString();
        if (Array.isArray(data)) return data.map(i => this.sanitizeForCloud(i));
        
        if (typeof data === 'object') {
            const clean: any = {};
            for (const key in data) {
                if (key === 'id') continue;
                const snakeKey = this.camelToSnake(key);
                clean[snakeKey] = this.sanitizeForCloud(data[key]);
            }
            return clean;
        }
        return data;
    }

    private mapToLocal(record: any): any {
        if (!record) return record;
        const clean: any = {};
        for (const key in record) {
            if (key === 'id') continue;
            const camelKey = this.snakeToCamel(key);
            let value = record[key];

            // Détection des champs de date pour IndexedDB (format local-first)
            const dateFields = [
                'created_at', 'updated_at', 'expense_date', 'invoice_date', 
                'payment_date', 'due_date', 'date_expiration', 'date_maj_prix', 'last_sync_at'
            ];

            if (typeof value === 'string' && (dateFields.includes(key) || key.endsWith('_at') || key.endsWith('_date'))) {
                const d = new Date(value);
                if (!isNaN(d.getTime())) {
                    value = d; // Conversion impérative en objet Date pour les index Dexie
                }
            }

            clean[camelKey] = value;
        }
        return clean;
    }

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
            if (error && error.code !== 'PGRST116') return false;
            return true;
        } catch {
            return false;
        }
    }

    async pushAllData(url: string, key: string): Promise<void> {
        if (this.isSyncing) return;
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
                    const { error } = await supabase.from(item.name).upsert(dataToSync, { onConflict: 'uuid' });
                    if (error) throw new Error(`Échec de transfert [${item.name}]: ${error.message}`);
                });
            }
        } finally {
            this.isSyncing = false;
        }
    }

    async pullAllData(url: string, key: string): Promise<void> {
        if (this.isSyncing) return;
        this.isSyncing = true;
        const supabase = getSupabaseClient(url, key);
        if (!supabase) {
            this.isSyncing = false;
            throw new Error('Supabase non configuré.');
        }
        try {
            for (const item of this.tableSyncOrder) {
                const { data, error } = await this.withRetry(() => supabase.from(item.name).select('*'));
                if (error) continue;
                if (data && data.length > 0) {
                    await db.transaction('rw', item.table, async () => {
                        for (const remoteRecord of data) {
                            const sanitizedLocal = this.mapToLocal(remoteRecord);
                            const localRecord = await item.table.where('uuid').equals(sanitizedLocal.uuid).first();
                            if (localRecord) {
                                const localUpdate = localRecord.updatedAt ? new Date(localRecord.updatedAt).getTime() : 0;
                                const remoteUpdate = remoteRecord.updated_at ? new Date(remoteRecord.updated_at).getTime() : 0;
                                if (remoteUpdate > localUpdate) {
                                    await item.table.update(localRecord.id, sanitizedLocal);
                                }
                            } else {
                                await item.table.add(sanitizedLocal);
                            }
                        }
                    });
                }
            }
        } finally {
            this.isSyncing = false;
        }
    }
}

export const supabaseSyncService = new SupabaseSyncService();
