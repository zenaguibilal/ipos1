
import Dexie, { type EntityTable } from 'dexie';
import type {
    Product, Customer, Sale, Expense, Supplier, SupplierPayment,
    StockIntake, ProductReturn, Payment, BreadOrder, CompanyProfile, InventoryLog,
} from './types';

/**
 * @fileOverview معمارية قاعدة البيانات المركزية iPOS Zen.
 * تم تصميم الفهارس لضمان "ربط علاقتي" فائق السرعة بين الجداول.
 * تعتمد المعمارية على UUID كفتاح ربط أساسي لضمان سلامة البيانات عند المزامنة السحابية.
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
         * تعريف المخطط (Schema) مع الفهارس الاستراتيجية:
         * - الحقل المسبوق بـ '&' هو مفتاح فريد (Unique).
         * - الحقل المسبوق بـ '++' هو مفتاح تلقائي الزيادة (Auto-increment).
         * - باقي الحقول هي فهارس للبحث السريع (Indices).
         */
        this.version(2).stores({
            // المنتجات: مربوطة بالموردين وبحالة المخزون
            products:         '++id, &uuid, name, *barcodes, supplierUuid, stockStatus, dateExpiration',
            
            // العملاء: مربوطة بالأرصدة وحالة الديون ونظام الخبز
            customers:        '++id, &uuid, searchName, debtStatus, isOverLimit, isBreadClient, bread_type_recurrence, outstandingBalance',
            
            // المبيعات: مربوطة بالعملاء وبالتاريخ (Index للتقارير)
            sales:            '++id, &uuid, invoiceNumber, customerUuid, createdAt, paymentStatus',
            
            // المصاريف: مفهرسة حسب النوع والتاريخ لتحليل السيولة
            expenses:         '++id, &uuid, category, expenseDate',
            
            // الموردون: مفتاح فريد على الاسم لمنع تكرار الشركاء
            suppliers:        '++id, &uuid, &name',
            
            // مدفوعات الموردين: مربوطة بالمورد وبالتاريخ
            supplier_payments:'++id, &uuid, supplierUuid, paymentDate',
            
            // استلام المخزون: مربوط بالمورد وبالفاتورة الأصلية
            stock_intakes:    '++id, &uuid, supplierUuid, createdAt, invoiceNumber',
            
            // مرتجعات المنتجات: مربوطة بالفاتورة الأصلية وبالعميل
            product_returns:  '++id, &uuid, originalSaleUuid, customerUuid, createdAt',
            
            // مقبوضات العملاء: مربوطة بالعميل وبالتاريخ للتسوية المالية
            payments:         '++id, &uuid, customerUuid, paymentDate',
            
            // طلبات الخبز: مربوطة بالعميل وبالفاتورة الناتجة عنها
            bread_orders:     '++id, &uuid, date, customerUuid, venteUuid',
            
            // ملف المؤسسة: سجل وحيد لإعدادات النظام
            company_profile:  '++id, &uuid',
            
            // سجلات المخزن: الربط الجوهري بين المنتج ومصدر الحركة (فاتورة/وصل)
            inventory_logs:   '++id, &uuid, productUuid, relatedUuid, reason, createdAt',
        });
    }
}

export const db = new iPOSDatabase();
