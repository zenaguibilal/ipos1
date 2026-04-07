export interface Product {
    id?: number;
    uuid: string;
    name: string;
    category?: string;
    price: number;
    purchasePrice: number;
    quantity: number;
    minStockLevel: number;
    barcodes?: string[];
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
    dateExpiration?: Date;
    supplierUuid?: string;
    dateMajPrix?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
}

export interface Customer {
    id?: number;
    uuid: string;
    firstName: string;
    lastName: string;
    searchName?: string;
    phone?: string;
    address?: string;
    settlementDay?: number;
    creditLimit?: number;
    totalSpent: number;
    outstandingBalance: number;
    lastActivityDate?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    debtStatus?: 'none' | 'due_soon' | 'overdue';
    isOverLimit?: boolean;
    // Bread feature fields
    isBreadClient?: boolean;
    bread_type_recurrence?: 'quotidien' | 'jours_specifiques' | 'aucun';
    bread_quantite_defaut?: number;
    bread_jours_semaine?: {
        [key: string]: { actif: boolean; quantite: number };
    };
}

export interface SaleItem {
    id?: number;
    productUuid: string | null;
    name: string;
    price: number;
    purchasePrice: number;
    quantity: number;
}

export interface CartItem extends Product {
    cartQuantity: number;
    flash?: boolean; // For UI animation
}

export interface Cart {
    id: string;
    name: string;
    items: CartItem[];
    customerUuid: string | null;
    discount: {
        type: 'fixed' | 'percentage';
        value: number;
    };
}

export interface Sale {
    id?: number;
    uuid: string;
    invoiceNumber: string;
    items: SaleItem[];
    subtotal: number;
    discountType?: 'percentage' | 'fixed';
    discountAmount?: number;
    total: number;
    amountPaid: number;
    remainingBalance: number;
    paymentStatus: 'paid' | 'partial' | 'unpaid';
    customerUuid?: string;
    createdAt?: Date;
    updatedAt?: Date;
    dueDate?: Date;
}

export interface Payment {
    id?: number;
    uuid: string;
    customerUuid: string;
    amount: number;
    paymentDate: Date;
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface CompanyProfile {
    id?: number;
    uuid: string;
    companyName: string;
    address?: string;
    city?: string;
    zipCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    vatNumber?: string;
    rcNumber?: string;
    goldPricePerGram?: number;
    prix_pain?: number;
    updatedAt?: Date;
    // Supabase Sync Settings
    supabase_url?: string;
    supabase_key?: string;
    last_sync_at?: Date;
}

export interface StockIntakeItem {
    id: string; // Unique ID for the item row in UI, not persisted
    productUuid?: string;
    barcodes: string[];
    name: string;
    category?: string;
    quantity: number;
    quantityDamaged: number;
    purchasePrice: number;
    price: number;
    isNew: boolean;
    unite?: 'Pièce' | 'Kg' | 'Litre' | 'Boîte' | 'Carton' | 'Sachet' | 'Bouteille';
}

export interface StockIntake {
    id?: number;
    uuid: string;
    supplierUuid?: string;
    invoiceNumber: string;
    invoiceDate: Date;
    shippingCost: number;
    items: {
        productUuid?: string;
        productName: string;
        quantityReceived: number;
        quantityDamaged: number;
        purchasePrice: number;
        landingCost: number;
    }[];
    totalValue: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface ReturnItem {
    id?: number;
    productUuid: string | null;
    productName: string;
    quantity: number;
    price: number;
    purchasePrice: number;
    wasRestocked: boolean;
}

export interface ProductReturn {
    id?: number;
    uuid: string;
    originalSaleUuid?: string;
    originalInvoiceNumber: string;
    items: ReturnItem[];
    totalReturnValue: number;
    amountRefunded: number;
    customerUuid?: string;
    createdAt?: Date;
    updatedAt?: Date;
    notes?: string;
}

export type ExpenseCategory =
    | 'Loyer'
    | 'Salaires'
    | 'Fournisseurs'
    | 'Services Publics'
    | 'Marketing'
    | 'Maintenance'
    | 'Autre'
    | string;

export interface Expense {
    id?: number;
    uuid: string;
    description: string;
    category: ExpenseCategory;
    amount: number;
    expenseDate: Date;
    createdAt?: Date;
    updatedAt?: Date;
}

export type InventoryLogReason =
    | 'sale'
    | 'return'
    | 'stock_intake'
    | 'cancellation'
    | 'manual_adjustment';

export interface InventoryLog {
    id?: number;
    uuid: string;
    productUuid: string;
    change: number;
    newQuantity: number;
    reason: InventoryLogReason;
    relatedUuid?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface Supplier {
    id?: number;
    uuid: string;
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    balance: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface SupplierPayment {
    id?: number;
    uuid: string;
    supplierUuid: string;
    amount: number;
    paymentDate: Date;
    method: 'cash' | 'check' | 'transfer';
    notes?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BreadOrder {
    id?: number;
    uuid: string;
    customerUuid: string | null;
    customName?: string;
    date: string;
    quantite: number;
    quantite_origine?: number;
    est_paye: boolean;
    est_livre: boolean;
    venteUuid: string | null;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface BreadOrderWithCustomer extends BreadOrder {
    customer: Pick<Customer, 'uuid' | 'firstName' | 'lastName'> | null;
}

export interface ImportAnalysis {
    customersToAdd: any[];
    customersToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

export interface ProductImportAnalysis {
    productsToAdd: any[];
    productsToUpdate: any[];
    skippedRows: any[];
    errorRows: any[];
    totalRows: number;
}

export interface RecentSale
    extends Pick<Sale, 'uuid' | 'invoiceNumber' | 'total' | 'createdAt'> {
    customerName: string;
}

export interface RecentReturn
    extends Pick<
        ProductReturn,
        'uuid' | 'originalInvoiceNumber' | 'totalReturnValue' | 'createdAt'
    > {
    customerName: string;
}

export interface SalesByDay {
    date: string;
    total: number;
    profit: number;
}

export interface TopProduct {
    productUuid: string;
    name: string;
    quantitySold: number;
    revenueGenerated: number;
    category?: string;
}

export interface TopCustomer {
    customerUuid: string;
    name: string;
    totalSpent: number;
}

export interface LowStockProduct
    extends Pick<
        Product,
        'uuid' | 'name' | 'quantity' | 'minStockLevel' | 'category' | 'unite'
    > {}

export interface DashboardData {
    stats: {
        totalRevenue: number;
        totalExpenses: number;
        netProfit: number;
        saleCount: number;
        totalOutstandingDebt: number;
        totalInventoryValue: number;
        averageBasket: number;
        profitMargin: number;
        totalRevenueChange?: number;
        netProfitChange?: number;
        totalExpensesChange?: number;
        saleCountChange?: number;
    };
    salesByDay: SalesByDay[];
    recentSales: RecentSale[];
    recentReturns: RecentReturn[];
    topProducts: TopProduct[];
    topCustomers: TopCustomer[];
    lowStockProducts: LowStockProduct[];
}