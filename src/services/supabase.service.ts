
'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

class SupabaseSyncService {
    
    /**
     * Ordonnancement des tables pour garantir l'intégrité référentielle
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

    async testConnection(url: string, key: string): Promise<boolean> {
        try {
            const supabase = getSupabaseClient(url, key);
            if (!supabase) return false;
            
            const { error } = await supabase.from('company_profile').select('uuid').limit(1);
            if (error) {
                console.error("Supabase connection error:", error);
                return false;
            }
            return true;
        } catch (e) {
            return false;
        }
    }

    private async syncTable(supabase: any, tableName: string, dexieTable: any) {
        const records = await dexieTable.toArray();
        if (records.length === 0) return;

        // Préparation des données (suppression de l'ID auto-incrémenté local)
        const dataToSync = records.map((r: any) => {
            const { id, ...rest } = r;
            return rest;
        });

        const { error } = await supabase
            .from(tableName)
            .upsert(dataToSync, { onConflict: 'uuid' });

        if (error) {
            throw new Error(`Échec Push [${tableName}]: ${error.message}`);
        }
    }

    async pushAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error("Supabase non configuré.");

        for (const item of this.tableSyncOrder) {
            await this.syncTable(supabase, item.name, item.table);
        }
    }

    async pullAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error("Supabase non configuré.");

        for (const item of this.tableSyncOrder) {
            const { data, error } = await supabase.from(item.name).select('*');
            if (error) throw new Error(`Échec Pull [${item.name}]: ${error.message}`);
            
            if (data && data.length > 0) {
                const dexieTable = item.table;
                
                await db.transaction('rw', dexieTable, async () => {
                    for (const remoteRecord of data) {
                        const localRecord = await dexieTable.where('uuid').equals(remoteRecord.uuid).first();
                        if (localRecord) {
                            await dexieTable.update(localRecord.id, remoteRecord);
                        } else {
                            // Dexie gérera l'ID auto-incrémenté local
                            await dexieTable.add(remoteRecord);
                        }
                    }
                });
            }
        }
    }
}

export const supabaseSyncService = new SupabaseSyncService();
