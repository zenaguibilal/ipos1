import Dexie, { type EntityTable } from 'dexie';
import type { Product, Customer, Sale, Expense, Supplier, SupplierPayment, StockIntake, ProductReturn, Payment, BreadOrder, CompanyProfile, InventoryLog } from './types';

/**
 * Configuration de la base de données locale IndexedDB via Dexie.js.
 * Cette structure est optimisée pour la synchronisation cloud via UUID.
 */
class iPOSDatabase extends Dexie {
    products!: EntityTable<Product, 'id'>;
    customers!: EntityTable<Customer, 'id'>;
    sales!: EntityTable<Sale, 'id'>;
    expenses!: EntityTable<Expense, 'id'>;
    suppliers!: EntityTable<Supplier, 'id'>;
    supplier_payments!: EntityTable<SupplierPayment, 'id'>;
    stock_intakes!: EntityTable<StockIntake, 'id'>;
    product_returns!: EntityTable<ProductReturn, 'id'>;
    payments!: EntityTable<Payment, 'id'>;
    bread_orders!: EntityTable<BreadOrder, 'id'>;
    company_profile!: EntityTable<CompanyProfile, 'id'>;
    inventory_logs!: EntityTable<InventoryLog, 'id'>;

    constructor() {
        super('iPOSDatabase');
        this.version(1).stores({
            // CRITICAL FIX: Added outstandingBalance to indexes to allow .where() queries
            products: '++id, &uuid, name, *barcodes, category, supplierUuid, stockStatus, dateExpiration',
            customers: '++id, &uuid, searchName, debtStatus, isOverLimit, isBreadClient, bread_type_recurrence, outstandingBalance',
            sales: '++id, &uuid, invoiceNumber, customerUuid, createdAt, paymentStatus',
            expenses: '++id, &uuid, category, expenseDate',
            suppliers: '++id, &uuid, &name',
            supplier_payments: '++id, &uuid, supplierUuid, paymentDate',
            stock_intakes: '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            product_returns: '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            payments: '++id, &uuid, customerUuid, paymentDate',
            bread_orders: '++id, &uuid, date, customerUuid, venteUuid',
            company_profile: '++id, &uuid',
            inventory_logs: '++id, &uuid, productUuid, reason, createdAt'
        });
    }
}

export const db = new iPOSDatabase();
