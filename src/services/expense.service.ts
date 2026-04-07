'use client';

import type { Expense } from '@/lib/types';
import { db } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { useAppStore } from '@/stores/appStore';

class ExpenseService {

    async filter(params: { category?: string; from?: Date; to?: Date }): Promise<Expense[]> {
        let collection = db.expenses.toCollection();
        if (params.category && params.category !== 'all') {
            collection = collection.filter(e => e.category === params.category);
        }
        if (params.from) {
            collection = collection.filter(e => new Date(e.expenseDate) >= params.from!);
        }
        if (params.to) {
            collection = collection.filter(e => new Date(e.expenseDate) <= params.to!);
        }
        const expenses = await collection.toArray();
        return expenses.sort((a,b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
    }

    async getCategories(): Promise<string[]> {
        const expenses = await db.expenses.toArray();
        const categories = new Set(expenses.map(e => e.category));
        return Array.from(categories);
    }
    
    async addExpense(expenseData: Omit<Expense, 'uuid' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
        const newExpense: Expense = {
            ...expenseData,
            uuid: uuidv4(),
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        const id = await db.expenses.add(newExpense);
        newExpense.id = id;

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();

        return newExpense;
    }

    async updateExpense(uuid: string, expenseData: Partial<Expense>): Promise<Expense> {
        const existing = await db.expenses.where('uuid').equals(uuid).first();
        if (!existing?.id) {
            throw new Error("Dépense non trouvée");
        }
        const dataToUpdate: Partial<Expense> = {
            ...expenseData,
            updatedAt: new Date(),
        };
        await db.expenses.update(existing.id, dataToUpdate);

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();

        return { ...existing, ...dataToUpdate };
    }

    async deleteExpense(uuid: string): Promise<void> {
        const existing = await db.expenses.where('uuid').equals(uuid).first();
        if (existing?.id) {
            await db.expenses.delete(existing.id);
            // Trigger Cloud Sync
            useAppStore.getState().actions.triggerSmartSync();
        }
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        const expensesToDelete = await db.expenses.where('uuid').anyOf(uuids).toArray();
        const idsToDelete = expensesToDelete.map(e => e.id!);
        await db.expenses.bulkDelete(idsToDelete);

        // Trigger Cloud Sync
        useAppStore.getState().actions.triggerSmartSync();
    }
}

export const expenseService = new ExpenseService();