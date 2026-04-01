'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Supplier } from '@/lib/types';
import { db } from '@/lib/db';

class SupplierService {

    async getSuppliers(): Promise<Supplier[]> {
        return db.suppliers.toArray();
    }

    async getSupplierByUuid(uuid: string): Promise<Supplier | undefined> {
        return db.suppliers.where('uuid').equals(uuid).first();
    }

    async findOrCreateSupplier(name: string, uuid?: string): Promise<Supplier> {
        if (uuid) {
            const existing = await this.getSupplierByUuid(uuid);
            if (existing) return existing;
        }

        const existingByName = await db.suppliers.where('name').equals(name).first();
        if (existingByName) return existingByName;

        const newSupplier: Supplier = {
            uuid: uuidv4(),
            name: name,
            balance: 0,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const id = await db.suppliers.add(newSupplier);
        newSupplier.id = id;
        return newSupplier;
    }

    async updateSupplierBalance(uuid: string, amountChange: number): Promise<void> {
        const supplier = await this.getSupplierByUuid(uuid);
        if (!supplier || !supplier.id) throw new Error("Fournisseur non trouvé.");
        
        const newBalance = supplier.balance + amountChange;
        await db.suppliers.update(supplier.id, { balance: newBalance, updatedAt: new Date() });
    }
}

export const supplierService = new SupplierService();
