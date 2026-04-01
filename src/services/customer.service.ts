
'use client';
import { v4 as uuidv4 } from 'uuid';
import type { Customer, Sale, ImportAnalysis, Payment, ProductReturn } from '@/lib/types';
import { db } from '@/lib/db';
import Papa from 'papaparse';

class CustomerService {
    
    async getCustomers(): Promise<Customer[]> {
        return db.customers.toArray();
    }
    
    async getCustomerByUuid(uuid: string): Promise<Customer | undefined> {
        return db.customers.where('uuid').equals(uuid).first();
    }

    async filterCustomers(filters: { query?: string; status?: string; sortBy?: string }): Promise<Customer[]> {
        let collection = db.customers.toCollection();

        if (filters.status) {
            if(filters.status === 'has_debt') collection = collection.filter(c => c.outstandingBalance > 0);
            if(filters.status === 'overdue') collection = collection.filter(c => c.debtStatus === 'overdue');
            if(filters.status === 'over_limit') collection = collection.filter(c => c.isOverLimit === true);
            if(filters.status === 'is_bread_client') collection = collection.filter(c => c.isBreadClient === true);
            if(filters.status === 'is_manual_bread_client') collection = collection.filter(c => c.bread_type_recurrence === 'aucun');
        }
        
        let customers = await collection.toArray();

        if (filters.query) {
            const lowerQuery = filters.query.toLowerCase().trim();
            customers = customers.filter(c => 
                c.searchName?.toLowerCase().includes(lowerQuery) || 
                c.phone?.includes(lowerQuery)
            );
        }

        // Sorting Logic
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
            customers.sort((a,b) => (b.createdAt?.getTime() || 0) - (a.createdAt?.getTime() || 0));
        }

        return customers;
    }
    
    async addCustomer(customerData: Partial<Omit<Customer, 'uuid'>>): Promise<Customer> {
        if (!customerData.firstName || !customerData.lastName) {
            throw new Error("Le prénom et le nom sont requis.");
        }

        const now = new Date();
        const searchName = `${customerData.firstName} ${customerData.lastName}`.toLowerCase();
        
        const existing = await db.customers.where('searchName').equals(searchName).first();
        if (existing) {
            throw new Error("Un client avec ce nom et prénom existe déjà.");
        }
        
        const newCustomer: Customer = {
            uuid: uuidv4(),
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            searchName,
            phone: customerData.phone,
            address: customerData.address,
            settlementDay: customerData.settlementDay,
            creditLimit: customerData.creditLimit,
            totalSpent: 0,
            outstandingBalance: 0,
            createdAt: now,
            updatedAt: now,
        };

        const id = await db.customers.add(newCustomer);
        newCustomer.id = id;
        return newCustomer;
    }

    async updateCustomer(uuid: string, customerData: Partial<Customer>): Promise<Customer> {
        const existing = await this.getCustomerByUuid(uuid);
        if (!existing?.id) {
            throw new Error("Client non trouvé.");
        }
        
        const searchName = `${customerData.firstName || existing.firstName} ${customerData.lastName || existing.lastName}`.toLowerCase();
        
        const dataToUpdate: Partial<Customer> = {
            ...customerData,
            searchName,
            updatedAt: new Date(),
        };
        
        await db.customers.update(existing.id, dataToUpdate);
        return { ...existing, ...dataToUpdate };
    }

    async deleteCustomer(uuid: string): Promise<void> {
        const customer = await this.getCustomerByUuid(uuid);
        if (!customer) return;

        const [salesCount, returnsCount, paymentsCount, breadOrdersCount] = await Promise.all([
            db.sales.where('customerUuid').equals(uuid).count(),
            db.product_returns.where('customerUuid').equals(uuid).count(),
            db.payments.where('customerUuid').equals(uuid).count(),
            db.bread_orders.where('customerUuid').equals(uuid).count()
        ]);
        
        if (salesCount > 0 || returnsCount > 0 || paymentsCount > 0 || breadOrdersCount > 0) {
            throw new Error("Suppression impossible: ce client a un historique de transactions.");
        }

        if (customer.outstandingBalance !== 0) {
            throw new Error("Suppression impossible: le solده du client n'est pas à zéro.");
        }
        
        if (customer.id) {
            await db.customers.delete(customer.id);
        }
    }
    
    async getStats(): Promise<{ total: number; overdue: number; overLimit: number; totalOutstanding: number }> {
        const allCustomers = await db.customers.toArray();
        return {
            total: allCustomers.length,
            overdue: allCustomers.filter(c => c.debtStatus === 'overdue').length,
            overLimit: allCustomers.filter(c => c.isOverLimit === true).length,
            totalOutstanding: allCustomers.reduce((sum, c) => sum + (c.outstandingBalance || 0), 0)
        };
    }
    
    async getCustomerActivity(customerUuid: string, page: number, pageSize: number): Promise<any[]> {
        const [sales, payments, returns] = await Promise.all([
            db.sales.where('customerUuid').equals(customerUuid).toArray(),
            db.payments.where('customerUuid').equals(customerUuid).toArray(),
            db.product_returns.where('customerUuid').equals(customerUuid).toArray()
        ]);

        const activity = [
            ...sales.map(s => ({ ...s, type: 'sale', date: s.createdAt })),
            ...payments.map(p => ({ ...p, type: 'payment', date: p.paymentDate })),
            ...returns.map(r => ({ ...r, type: 'return', date: r.createdAt })),
        ];

        activity.sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;

        return activity.slice(startIndex, endIndex);
    }

    async getCustomerStatementData(customerUuid: string): Promise<{ customer: Customer, unpaidSales: Sale[] }> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer) throw new Error("Client non trouvé");

        const unpaidSales = await db.sales.where('customerUuid').equals(customerUuid).and(s => s.paymentStatus !== 'paid').sortBy('createdAt');
        return { customer, unpaidSales };
    }

    async recalculateCustomerStatus(customerUuid: string): Promise<Customer> {
        const customer = await this.getCustomerByUuid(customerUuid);
        if (!customer?.id) throw new Error("Customer not found during recalculation.");

        const now = new Date();

        const [sales, payments, returns] = await Promise.all([
             db.sales.where('customerUuid').equals(customerUuid).toArray(),
             db.payments.where('customerUuid').equals(customerUuid).toArray(),
             db.product_returns.where('customerUuid').equals(customerUuid).toArray(),
        ]);
        
        const totalInvoiced = sales.reduce((sum, s) => sum + s.total, 0);
        const totalPaidViaPayments = payments.reduce((sum, p) => sum + p.amount, 0);
        const netCreditFromReturns = returns.reduce((sum, r) => sum + (r.totalReturnValue - r.amountRefunded), 0);
        
        const newBalance = totalInvoiced - totalPaidViaPayments - netCreditFromReturns;
        const totalSpent = totalInvoiced;

        const isOverLimit = customer.creditLimit != null && customer.creditLimit > 0 ? newBalance > customer.creditLimit : false;

        let debtStatus: Customer['debtStatus'] = 'none';
        if (newBalance > 0.01) {
            const unpaidSales = sales.filter(s => s.paymentStatus !== 'paid');
            const isOverdue = unpaidSales.some(s => s.dueDate && new Date(s.dueDate) < now);
            debtStatus = isOverdue ? 'overdue' : 'due_soon';
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
        return { ...customer, ...customerUpdate };
    }

    async analyzeImport(file: File): Promise<ImportAnalysis> {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                header: true,
                skipEmptyLines: true,
                complete: async (results) => {
                    try {
                        const existingCustomers = await this.getCustomers();
                        const existingNames = new Map(existingCustomers.map(c => [c.searchName, c]));

                        const analysis: ImportAnalysis = {
                            customersToAdd: [],
                            customersToUpdate: [],
                            skippedRows: [],
                            errorRows: [],
                            totalRows: results.data.length,
                        };

                        for (const row of results.data as any[]) {
                            const firstName = row.firstName || row.prenom || row.first_name;
                            const lastName = row.lastName || row.nom || row.last_name;

                            if (!firstName || !lastName) {
                                analysis.errorRows.push({ ...row, error: "Prénom ou nom manquant" });
                                continue;
                            }
                            
                            const searchName = `${firstName} ${lastName}`.toLowerCase().trim();
                            const existingCustomer = existingNames.get(searchName);

                            const customerData = {
                                firstName,
                                lastName,
                                phone: row.phone || row.telephone,
                                address: row.address || row.adresse,
                                creditLimit: row.creditLimit ? parseFloat(row.creditLimit) : undefined,
                                outstandingBalance: row.outstandingBalance ? parseFloat(row.outstandingBalance) : undefined,
                            };

                            if (existingCustomer) {
                                analysis.customersToUpdate.push({ ...customerData, uuid: existingCustomer.uuid });
                            } else {
                                analysis.customersToAdd.push(customerData);
                            }
                        }
                        resolve(analysis);
                    } catch (error) {
                        reject(error);
                    }
                },
                error: (error) => {
                    reject(new Error("Erreur de parsing CSV: " + error.message));
                }
            });
        });
    }

    async executeImport(confirmedData: { toAdd: any[], toUpdate: any[] }): Promise<void> {
        const now = new Date();

        const toAdd = confirmedData.toAdd.map(c => ({
            ...c,
            uuid: uuidv4(),
            searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
            totalSpent: 0,
            outstandingBalance: c.outstandingBalance || 0,
            createdAt: now,
            updatedAt: now,
        }));

         const toUpdate = confirmedData.toUpdate.map(c => ({
            ...c,
            searchName: `${c.firstName} ${c.lastName}`.toLowerCase().trim(),
            updatedAt: now,
        }));
        
        await db.transaction('rw', db.customers, async () => {
            if (toAdd.length > 0) await db.customers.bulkAdd(toAdd);
            if (toUpdate.length > 0) await db.customers.bulkPut(toUpdate);
        });
    }
}

export const customerService = new CustomerService();
