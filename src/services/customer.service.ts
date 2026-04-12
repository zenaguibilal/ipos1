'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Customer, Sale, ImportAnalysis, Payment, ProductReturn } from '@/lib/types';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { startOfMonth, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useAppStore } from '@/stores/appStore';
import { safeNumber } from '@/lib/utils';

class CustomerService {

    async getCustomers(): Promise<Customer[]> {
        return db.customers.toArray();
    }

    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        return db.customers.where('uuid').equals(uuid).first();
    }

    async filterCustomers(filters: {
        query?: string;
        status?: string;
        sortBy?: string;
    }): Promise<Customer[]> {
        let collection = db.customers.toCollection();

        if (filters.status) {
            if (filters.status === 'has_debt')
                collection = collection.filter(c => safeNumber(c.outstandingBalance) > 0.01);
            if (filters.status === 'overdue')
                collection = collection.filter(c => c.debtStatus === 'overdue');
            if (filters.status === 'over_limit')
                collection = collection.filter(c => c.isOverLimit === true);
            if (filters.status === 'is_bread_client')
                collection = collection.filter(c => c.isBreadClient === true);
        }

        let customers = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            customers = customers.filter(c => {
                const searchableName = (
                    c.searchName || `${c.firstName} ${c.lastName}`
                ).toLowerCase();
                return (
                    searchableName.includes(lowerQuery) ||
                    (c.phone || '').includes(lowerQuery)
                );
            });
        }

        if (filters.sortBy) {
            const [field, order] = filters.sortBy.split('_');
            const isAsc = order === 'asc';
            customers.sort((a: any, b: any) => {
                const valA = a[field] ?? 0;
                const valB = b[field] ?? 0;
                if (valA < valB) return isAsc ? -1 : 1;
                if (valA > valB) return isAsc ? 1 : -1;
                return 0;
            });
        } else {
            customers.sort(
                (a, b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0),
            );
        }

        return customers;
    }

    async addCustomer(
        customerData: Partial<Omit<Customer, 'uuid'>>,
    ): Promise<Customer> {
        if (!customerData.firstName || !customerData.lastName) {
            throw new Error('Prénom et nom requis.');
        }

        const now = new Date();
        const searchName =
            `${customerData.firstName} ${customerData.lastName}`.toLowerCase();

        const existing = await db.customers
            .where('searchName')
            .equals(searchName)
            .first();
        if (existing) {
            throw new Error('Un client avec ce nom existe déjà.');
        }

        const initialBal = safeNumber(customerData.initialBalance);

        const newCustomer: Customer = {
            uuid: uuidv4(),
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            searchName,
            phone: customerData.phone,
            address: customerData.address,
            settlementDay: customerData.settlementDay,
            creditLimit: safeNumber(customerData.creditLimit),
            initialBalance: initialBal,
            totalSpent: 0,
            outstandingBalance: initialBal,
            isBreadClient: false,
            createdAt: now,
            updatedAt: now,
        };

        const id = await db.customers.add(newCustomer);
        newCustomer.id = id;

        useAppStore.getState().actions.triggerSmartSync();
        return newCustomer;
    }

    async updateCustomer(
        uuid: string,
        customerData: Partial<Customer>,
    ): Promise<Customer> {
        const existing = await this.getCustomerByUuid(uuid);
        if (!existing?.id) throw new Error('Client non trouvé.');

        const searchName = `${customerData.firstName || existing.firstName} ${
            customerData.lastName || existing.lastName
        }`.toLowerCase();

        const dataToUpdate: Partial<Customer> = {
            ...customerData,
            searchName,
            updatedAt: new Date(),
        };

        if (customerData.initialBalance !== undefined) {
            dataToUpdate.initialBalance = safeNumber(customerData.initialBalance);
        }
        if (customerData.creditLimit !== undefined) {
            dataToUpdate.creditLimit = safeNumber(customerData.creditLimit);
        }

        await db.customers.update(existing.id, dataToUpdate);
        
        // Final re-calculation to ensure consistency
        const updated = await this.recalculateCustomerStatus(uuid);

        useAppStore.getState().actions.triggerSmartSync();
        return updated;
    }

    async deleteCustomer(uuid: string): Promise<void> {
        const customer = await this.getCustomerByUuid(uuid);
        if (!customer) return;

        const [salesCount, returnsCount, paymentsCount, breadOrdersCount] =
            await Promise.all([
                db.sales.where('customerUuid').equals(uuid).count(),
                db.product_returns.where('customerUuid').equals(uuid).count(),
                db.payments.where('customerUuid').equals(uuid).count(),
                db.bread_orders.where('customerUuid').equals(uuid).count(),
            ]);

        if (
            salesCount > 0 ||
            returnsCount > 0 ||
            paymentsCount > 0 ||
            breadOrdersCount > 0
        ) {
            throw new Error(
                "Suppression impossible: historique de transactions existant.",
            );
        }

        if (Math.abs(safeNumber(customer.outstandingBalance)) > 0.01) {
            throw new Error(
                "Suppression impossible: le solde n'est pas nul.",
            );
        }

        if (customer.id) {
            await db.customers.delete(customer.id);
            useAppStore.getState().actions.triggerSmartSync();
        }
    }

    async bulkDelete(uuids: string[]): Promise<void> {
        for (const uuid of uuids) {
            const customer = await this.getCustomerByUuid(uuid);
            if (!customer) continue;

            const [salesCount, returnsCount, paymentsCount, breadOrdersCount] =
                await Promise.all([
                    db.sales.where('customerUuid').equals(uuid).count(),
                    db.product_returns.where('customerUuid').equals(uuid).count(),
                    db.payments.where('customerUuid').equals(uuid).count(),
                    db.bread_orders.where('customerUuid').equals(uuid).count(),
                ]);

            if (
                salesCount > 0 ||
                returnsCount > 0 ||
                paymentsCount > 0 ||
                breadOrdersCount > 0 ||
                Math.abs(safeNumber(customer.outstandingBalance)) > 0.01
            ) {
                throw new Error(
                    `Suppression impossible: le client "${customer.firstName} ${customer.lastName}" a un historique ou un solde non nul.`,
                );
            }
        }
        const customersToDelete = await db.customers
            .where('uuid')
            .anyOf(uuids)
            .toArray();
        const idsToDelete = customersToDelete.map(c => c.id!);
        await db.customers.bulkDelete(idsToDelete);
        useAppStore.getState().actions.triggerSmartSync();
    }

    async getStats(): Promise<{
        total: number;
        overdue: number;
        overLimit: number;
        totalOutstanding: number;
    }> {
        const allCustomers = await db.customers.toArray();
        return {
            total: allCustomers.length,
            overdue: allCustomers.filter(c => c.debtStatus === 'overdue').length,
            overLimit: allCustomers.filter(c => c.isOverLimit === true).length,
            totalOutstanding: allCustomers.reduce(
                (sum, c) => sum + safeNumber(c.outstandingBalance),
                0,
            ),
        };
    }

    async getCustomerActivity(
        customerUuid: string,
        page: number,
        pageSize: number,
    ): Promise<any[]> {
        const customer = await this.getCustomerByUuid(customerUuid);
        const [sales, payments, returns] = await Promise.all([
            db.sales.where('customerUuid').equals(customerUuid).toArray(),
            db.payments.where('customerUuid').equals(customerUuid).toArray(),
            db.product_returns
                .where('customerUuid')
                .equals(customerUuid)
                .toArray(),
        ]);

        const activity = [
            ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt })),
        ];

        if (customer && Math.abs(safeNumber(customer.initialBalance)) > 0.001) {
            activity.push({
                uuid: 'initial-balance-' + customer.uuid,
                type: 'initial_balance',
                date: customer.createdAt || new Date(0),
                amount: safeNumber(customer.initialBalance),
                notes: 'Report de solde historique'
            });
        }

        activity.sort(
            (a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime(),
        );

        const startIndex = (page - 1) * pageSize;
        return activity.slice(startIndex, startIndex + pageSize);
    }

    async getCustomerStatementData(
        customerUuid: string,
    ): Promise<{ customer: Customer; unpaidSales: Sale[] }> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer) throw new Error('Client non trouvé');
        const unpaidSales = await db.sales
            .where('customerUuid')
            .equals(customerUuid)
            .and(s => s.paymentStatus !== 'paid')
            .sortBy('createdAt');
        return { customer, unpaidSales };
    }

    async getCustomerMonthlySpending(
        customerUuid: string,
    ): Promise<{ month: string; total: number }[]> {
        const now = new Date();
        const sixMonthsAgo = startOfMonth(subMonths(now, 5));

        const sales = await db.sales
            .where('customerUuid')
            .equals(customerUuid)
            .and(s => new Date(s.createdAt!) >= sixMonthsAgo)
            .toArray();

        const spendingByMonth = new Map<string, number>();
        for (let i = 0; i < 6; i++) {
            const date = subMonths(now, i);
            spendingByMonth.set(format(date, 'MMM yyyy', { locale: fr }), 0);
        }

        sales.forEach(sale => {
            const monthKey = format(new Date(sale.createdAt!), 'MMM yyyy', {
                locale: fr,
            });
            if (spendingByMonth.has(monthKey)) {
                spendingByMonth.set(
                    monthKey,
                    (spendingByMonth.get(monthKey) || 0) + safeNumber(sale.total),
                );
            }
        });

        return Array.from(spendingByMonth.entries())
            .map(([month, total]) => ({ month, total }))
            .reverse();
    }

    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer?.id)
            throw new Error('Client non trouvé lors du recalcul.');

        const now = new Date();
        const currentDayOfMonth = now.getDate();
        const currentMonthStart = startOfMonth(now);

        const [sales, payments, returns] = await Promise.all([
            db.sales.where('customerUuid').equals(customerUuid).toArray(),
            db.payments.where('customerUuid').equals(customerUuid).toArray(),
            db.product_returns
                .where('customerUuid')
                .equals(customerUuid)
                .toArray(),
        ]);

        // Robust arithmetic with safety casting
        const totalInvoiced = sales.reduce((sum, s) => sum + safeNumber(s.total), 0);
        const totalPaidAtSale = sales.reduce((sum, s) => sum + safeNumber(s.amountPaid), 0);
        const totalPaidViaPayments = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const netCreditFromReturns = returns.reduce((sum, r) => sum + (safeNumber(r.totalReturnValue) - safeNumber(r.amountRefunded)), 0);

        // FINAL FORMULA: Balance = InitialBalance + (SalesInvoiced - PaidAtTimeOfSale) - ExternalPayments - ReturnCredits
        const initial = safeNumber(customer.initialBalance);
        const newBalance = initial + totalInvoiced - totalPaidAtSale - totalPaidViaPayments - netCreditFromReturns;
            
        const totalSpent = totalInvoiced;

        const creditLimit = safeNumber(customer.creditLimit);
        const isOverLimit = creditLimit > 0 ? newBalance > (creditLimit + 0.01) : false;

        const hasPaymentThisMonth = payments.some(
            p => new Date(p.paymentDate) >= currentMonthStart,
        );

        let debtStatus: Customer['debtStatus'] = 'none';
        if (newBalance > 0.01) {
            if (
                customer.settlementDay &&
                currentDayOfMonth > customer.settlementDay &&
                !hasPaymentThisMonth
            ) {
                debtStatus = 'overdue';
            } else {
                const unpaidSales = sales.filter(s => s.paymentStatus !== 'paid');
                const isOverdueByDate = unpaidSales.some(
                    s => s.dueDate && new Date(s.dueDate) < now,
                );
                debtStatus = isOverdueByDate ? 'overdue' : 'due_soon';
            }
        }

        const customerUpdate: Partial<Customer> = {
            totalSpent,
            outstandingBalance: newBalance,
            lastActivityDate: now,
            isOverLimit,
            debtStatus,
            updatedAt: now,
        };

        await db.customers.update(customer.id, customerUpdate);
        useAppStore.getState().actions.triggerSmartSync();
        return { ...customer, ...customerUpdate };
    }

    async analyzeImport(file: File): Promise<ImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async results => {
                    try {
                        const existingCustomers = await this.getCustomers();
                        const existingNames = new Map(
                            existingCustomers.map(c => [c.searchName, c]),
                        );

                        const analysis: ImportAnalysis = {
                            customersToAdd:    [],
                            customersToUpdate: [],
                            skippedRows:       [],
                            errorRows:         [],
                            totalRows:         results.data.length,
                        };

                        for (const row of results.data as any[]) {
                            const firstName =
                                row.firstName || row.prenom || row.first_name || row.Prénom;
                            const lastName =
                                row.lastName || row.nom || row.last_name || row.Nom;

                            if (!firstName || !lastName) {
                                analysis.errorRows.push({
                                    ...row,
                                    error: 'Identité manquante',
                                });
                                continue;
                            }

                            const searchName =
                                `${firstName} ${lastName}`.toLowerCase().trim();
                            const existingCustomer = existingNames.get(searchName);

                            const customerData = {
                                firstName,
                                lastName,
                                phone: row.phone || row.telephone || row.Téléphone,
                                address: row.address || row.adresse || row.Adresse,
                                creditLimit: safeNumber(row.creditLimit || row.limite || row.Limite_Crédit),
                                settlementDay: parseInt(row.settlementDay || row.echeance || '0'),
                                initialBalance: safeNumber(row.initialBalance || row.solde || row.dette || row.debt || row.Solde_Impayé || '0'),
                            };

                            if (existingCustomer) {
                                analysis.customersToUpdate.push({
                                    ...customerData,
                                    uuid: existingCustomer.uuid,
                                });
                            } else {
                                analysis.customersToAdd.push(customerData);
                            }
                        }
                        resolve(analysis);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: error => {
                    reject(new Error('Erreur CSV: ' + error.message));
                },
            });
        });
    }

    async executeImport(confirmedData: {
        toAdd: any[];
        toUpdate: any[];
    }): Promise<void> {
        const now = new Date();

        const toAdd = confirmedData.toAdd.map(c => {
            const initialBal = safeNumber(c.initialBalance);
            return {
                ...c,
                uuid: uuidv4(),
                searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
                totalSpent: 0,
                initialBalance: initialBal,
                outstandingBalance: initialBal,
                isBreadClient: false,
                createdAt: now,
                updatedAt: now,
            };
        });

        const toUpdate = confirmedData.toUpdate.map(c => ({
            ...c,
            initialBalance: safeNumber(c.initialBalance),
            searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
            updatedAt: now,
        }));

        await db.transaction('rw', [db.customers], async () => {
            if (toAdd.length > 0)   await db.customers.bulkAdd(toAdd);
            if (toUpdate.length > 0) await db.customers.bulkPut(toUpdate);
        });

        for (const c of toUpdate) {
            await this.recalculateCustomerStatus(c.uuid);
        }
        for (const c of toAdd) {
            await this.recalculateCustomerStatus(c.uuid);
        }

        useAppStore.getState().actions.triggerSmartSync();
    }
}

export const customerService = new CustomerService();
