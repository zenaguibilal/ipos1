'use client';

import { v4 as uuidv4 } from 'uuid';
import type { Customer, Sale, ImportAnalysis, Payment, ProductReturn } from '@/lib/types';
import { db } from '@/lib/db';
import Papa from 'papaparse';
import { startOfMonth, subMonths, format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { safeNumber, roundFinancial } from '@/lib/utils';

const triggerSync = () => {
    if (typeof window !== 'undefined') {
        import('@/stores/appStore').then(mod => {
            mod.useAppStore.getState().actions.triggerSmartSync();
        });
    }
};

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
                collection = collection.filter(c => !!c.isBreadClient);
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
            customers.sort((a, b) => {
                const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                return dateB - dateA;
            });
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

        const initialBal = roundFinancial(safeNumber(customerData.initialBalance));

        const newCustomer: Customer = {
            uuid: uuidv4(),
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            searchName,
            phone: customerData.phone,
            address: customerData.address,
            settlementDay: customerData.settlementDay,
            creditLimit: roundFinancial(safeNumber(customerData.creditLimit)),
            initialBalance: initialBal,
            totalSpent: initialBal, 
            outstandingBalance: initialBal,
            isBreadClient: false,
            createdAt: now,
            updatedAt: now,
        };

        const id = await db.customers.add(newCustomer);
        newCustomer.id = id;

        triggerSync();
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
            dataToUpdate.initialBalance = roundFinancial(safeNumber(customerData.initialBalance));
        }
        if (customerData.creditLimit !== undefined) {
            dataToUpdate.creditLimit = roundFinancial(safeNumber(customerData.creditLimit));
        }

        await db.customers.update(existing.id, dataToUpdate);
        
        const updated = await this.recalculateCustomerStatus(uuid);

        triggerSync();
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
            triggerSync();
        }
    }

    /**
     * محرك إعادة حساب الوضع المالي للعميل بدقة محاسبية.
     */
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

        // الحساب بالـ Cents لتجنب أخطاء الفاصلة العائمة
        const currentSalesDebt = sales.reduce((sum, s) => sum + safeNumber(s.remainingBalance), 0);
        const totalSalesInvoiced = sales.reduce((sum, s) => sum + safeNumber(s.total), 0);
        const totalPaymentsFromLogs = payments.reduce((sum, p) => sum + safeNumber(p.amount), 0);
        const netCreditFromReturns = returns.reduce((sum, r) => sum + (safeNumber(r.totalReturnValue) - safeNumber(r.amountRefunded)), 0);

        const initial = safeNumber(customer.initialBalance);
        const newBalance = roundFinancial(initial + currentSalesDebt - totalPaymentsFromLogs - netCreditFromReturns);
        const totalSpent = roundFinancial(totalSalesInvoiced + initial);

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
        triggerSync();
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
                        const existingMap = new Map(
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
                            const existingCustomer = existingMap.get(searchName);

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
                                    id: existingCustomer.id,
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
            const initialBal = roundFinancial(safeNumber(c.initialBalance));
            return {
                ...c,
                uuid: uuidv4(),
                searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
                totalSpent: initialBal,
                initialBalance: initialBal,
                outstandingBalance: initialBal,
                isBreadClient: false,
                createdAt: now,
                updatedAt: now,
            };
        });

        const toUpdate = confirmedData.toUpdate.map(c => ({
            ...c,
            initialBalance: roundFinancial(safeNumber(c.initialBalance)),
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

        triggerSync();
    }
}

export const customerService = new CustomerService();
