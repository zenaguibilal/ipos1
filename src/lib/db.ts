import Dexie, { type EntityTable } from 'dexie';
import type {
    Product, Customer, Sale, Expense, Supplier, SupplierPayment,
    StockIntake, ProductReturn, Payment, BreadOrder, CompanyProfile, InventoryLog,
} from './types';

/**
 * @fileOverview Architecture de la base de données centrale iPOS Zen.
 * Les index sont conçus pour garantir une relation rapide entre les tables.
 * Utilise des UUID comme clés de liaison pour assurer l'intégrité lors de la synchronisation Cloud.
 */
class iPOSDatabase extends Dexie {
    products!:          EntityTable<Product,        'id'>;
    customers!:         EntityTable<Customer,       'id'>;
    sales!:             EntityTable<Sale,           'id'>;
    expenses!:          EntityTable<Expense,        'id'>;
    suppliers!:         EntityTable<Supplier,       'id'>;
    supplier_payments!: EntityTable<SupplierPayment,'id'>;
    stock_intakes!:     EntityTable<StockIntake,    'id'>;
    product_returns!:   EntityTable<ProductReturn,  'id'>;
    payments!:          EntityTable<Payment,        'id'>;
    bread_orders!:      EntityTable<BreadOrder,     'id'>;
    company_profile!:   EntityTable<CompanyProfile, 'id'>;
    inventory_logs!:    EntityTable<InventoryLog,   'id'>;

    constructor() {
        super('iPOSDatabase');
        
        /**
         * Définition du schéma avec index stratégiques :
         * - '&' prefixe une clé unique.
         * - '++' prefixe une clé auto-incrémentée.
         */
        this.version(2).stores({
            // Produits liés aux fournisseurs et à l'état du stock
            products:         '++id, &uuid, name, *barcodes, supplierUuid, stockStatus, dateExpiration',
            
            // Clients liés aux balances, statuts de dette et logistique pain
            customers:        '++id, &uuid, searchName, debtStatus, isOverLimit, isBreadClient, bread_type_recurrence, outstandingBalance',
            
            // Ventes liées aux clients et indexées par date pour les rapports
            sales:            '++id, &uuid, invoiceNumber, customerUuid, createdAt, paymentStatus',
            
            // Dépenses indexées par catégorie et date
            expenses:         '++id, &uuid, category, expenseDate',
            
            // Fournisseurs avec nom unique
            suppliers:        '++id, &uuid, &name',
            
            // Paiements fournisseurs liés au fournisseur et à la date
            supplier_payments:'++id, &uuid, supplierUuid, paymentDate',
            
            // Réceptions de stock liées au fournisseur et au numéro de facture
            stock_intakes:    '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            
            // Retours produits liés à la vente d'origine et au client
            product_returns:  '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            
            // Paiements clients liés au client pour rapprochement
            payments:         '++id, &uuid, customerUuid, paymentDate',
            
            // Commandes de pain liées au client et à la vente générée
            bread_orders:     '++id, &uuid, date, customerUuid, venteUuid',
            
            // Profil établissement : réglages système
            company_profile:  '++id, &uuid',
            
            // Logs d'inventaire : lien entre produit et source du mouvement (vente/réception)
            inventory_logs:   '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
        });
    }
}

export const db = new iPOSDatabase();
