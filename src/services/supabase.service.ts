'use client';

import { db } from '@/lib/db';
import { getSupabaseClient } from '@/lib/supabase';

class SupabaseSyncService {
    
    /**
     * Tests connection to Supabase and checks if tables are accessible
     */
    async testConnection(url: string, key: string): Promise<boolean> {
        try {
            const supabase = getSupabaseClient(url, key);
            if (!supabase) return false;
            
            // Check connection by trying to reach the profile table
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

    /**
     * Synchronizes a single table from IndexedDB to Supabase
     */
    private async syncTable(supabase: any, tableName: string, dexieTable: any) {
        const records = await dexieTable.toArray();
        if (records.length === 0) return;

        // Strip internal Dexie auto-increment IDs before upserting to Supabase
        const dataToSync = records.map((r: any) => {
            const { id, ...rest } = r;
            return rest;
        });

        const { error } = await supabase
            .from(tableName)
            .upsert(dataToSync, { onConflict: 'uuid' });

        if (error) {
            console.error(`Error syncing table ${tableName}:`, error);
            throw new Error(`Échec de la synchro pour ${tableName}: ${error.message}`);
        }
    }

    /**
     * Performs a full push sync of all critical tables
     */
    async pushAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error("Supabase non configuré.");

        const syncList = [
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

        for (const item of syncList) {
            await this.syncTable(supabase, item.name, item.table);
        }
    }

    /**
     * Pulls data from Supabase and merges into IndexedDB using UUID as reference
     */
    async pullAllData(url: string, key: string): Promise<void> {
        const supabase = getSupabaseClient(url, key);
        if (!supabase) throw new Error("Supabase non configuré.");

        const tables = [
            'company_profile', 'suppliers', 'customers', 'products', 
            'expenses', 'stock_intakes', 'sales', 'product_returns', 
            'payments', 'bread_orders', 'inventory_logs', 'supplier_payments'
        ];

        for (const tableName of tables) {
            const { data, error } = await supabase.from(tableName).select('*');
            if (error) throw new Error(`Erreur Pull ${tableName}: ${error.message}`);
            
            if (data && data.length > 0) {
                const dexieTable = (db as any)[tableName];
                
                // Transactional merge logic to avoid duplicates
                await db.transaction('rw', dexieTable, async () => {
                    for (const remoteRecord of data) {
                        const localRecord = await dexieTable.where('uuid').equals(remoteRecord.uuid).first();
                        if (localRecord) {
                            // Update existing record using its local ID
                            await dexieTable.update(localRecord.id, remoteRecord);
                        } else {
                            // Add new record (IndexedDB will generate a new local ID)
                            await dexieTable.add(remoteRecord);
                        }
                    }
                });
            }
        }
    }
}

export const supabaseSyncService = new SupabaseSyncService();
