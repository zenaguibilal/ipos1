
import Dexie, { type EntityTable } from 'dexie';
import type {
    Product, Customer, Sale, Expense, Supplier, SupplierPayment,
    StockIntake, ProductReturn, Payment, BreadOrder, CompanyProfile, InventoryLog,
} from './types';

/**
 * Configuration de la base de données locale IndexedDB via Dexie.js.
 * Structure "Elite" optimisée pour la synchronisation cloud et l'intégrité relationnelle.
 * Les index sont conçus pour supporter des jointures logiques rapides via UUID.
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
        
        // Version 2 : Définition des schémas de stockage avec indexation stratégique
        this.version(2).stores({
            // Indexation sur UUID pour la synchro, barcodes pour la vente, supplierUuid pour le lien fournisseur
            products:         '++id, &uuid, name, *barcodes, supplierUuid, stockStatus, dateExpiration',
            
            // searchName pour la recherche rapide, outstandingBalance pour les alertes dettes
            customers:        '++id, &uuid, searchName, debtStatus, isOverLimit, isBreadClient, bread_type_recurrence, outstandingBalance',
            
            // customerUuid pour lier les ventes aux clients, invoiceNumber pour l'unicité
            sales:            '++id, &uuid, invoiceNumber, customerUuid, createdAt, paymentStatus',
            
            // category pour l'analyse des charges
            expenses:         '++id, &uuid, category, expenseDate',
            
            // name unique pour éviter les doublons de partenaires
            suppliers:        '++id, &uuid, &name',
            
            // supplierUuid pour le suivi des règlements
            supplier_payments:'++id, &uuid, supplierUuid, paymentDate',
            
            // supplierUuid pour lier les arrivages aux fournisseurs
            stock_intakes:    '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            
            // Liens vers la vente d'origine et le client
            product_returns:  '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            
            // customerUuid pour le rapprochement bancaire client
            payments:         '++id, &uuid, customerUuid, paymentDate',
            
            // venteUuid pour savoir si une commande de pain a été facturée
            bread_orders:     '++id, &uuid, date, customerUuid, venteUuid',
            
            company_profile:  '++id, &uuid',
            
            // productUuid pour l'audit d'un article, relatedUuid pour lier au mouvement source (Vente/Réception)
            inventory_logs:   '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
        });
    }
}

export const db = new iPOSDatabase();
