'use client';

import type { Expense } from '@/lib/types';
import { expenseRepository } from '@/repositories/expense.repository';
import { v4 as uuidv4 } from 'uuid';

class ExpenseService {

    async filter(params: { category?: string; from?: Date; to?: Date }): Promise<Expense[]> {
        try {
            return await expenseRepository.filter(params);
        } catch (error) {
            throw error;
        }
    }

    async getCategories(): Promise<string[]> {
        try {
            return await expenseRepository.getUniqueCategories();
        } catch (error) {
            throw error;
        }
    }
    
    async addExpense(expenseData: Omit<Expense, 'uuid' | 'createdAt' | 'updatedAt'>): Promise<Expense> {
        try {
            const newExpense: Expense = {
                ...expenseData,
                uuid: uuidv4(),
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            return await expenseRepository.add(newExpense);
        } catch (error) {
            throw error;
        }
    }

    async updateExpense(uuid: string, expenseData: Partial<Expense>): Promise<Expense> {
        try {
            const dataToUpdate: Partial<Expense> = {
                ...expenseData,
                updatedAt: new Date(),
            };
            return await expenseRepository.update(uuid, dataToUpdate);
        } catch (error) {
            throw error;
        }
    }

    async deleteExpense(uuid: string): Promise<void> {
        try {
            await expenseRepository.delete(uuid);
        } catch (error) {
            throw error;
        }
    }
}

export const expenseService = new ExpenseService();
