
'use client';

import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Database, Copy, Check, Terminal } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

const SUPABASE_SQL_SCRIPT = `-- iPOS Luxury - Elite Cloud Schema (Verified v1.9.5)
-- Ce script initialise votre coffre-fort Cloud avec une précision de type absolue.
-- Note: La sécurité RLS est désactivée pour faciliter la synchronisation locale-first.

-- 1. Identité de l'Etablissement
CREATE TABLE IF NOT EXISTS company_profile (
    uuid UUID PRIMARY KEY,
    "companyName" TEXT NOT NULL,
    address TEXT,
    city TEXT,
    "zipCode" TEXT,
    country TEXT,
    phone TEXT,
    email TEXT,
    website TEXT,
    "vatNumber" TEXT,
    "rcNumber" TEXT,
    "goldPricePerGram" NUMERIC,
    prix_pain NUMERIC,
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    last_sync_at TIMESTAMPTZ,
    supabase_url TEXT,
    supabase_key TEXT
);
ALTER TABLE company_profile DISABLE ROW LEVEL SECURITY;

-- 2. Réseau Partenaires (Fournisseurs)
CREATE TABLE IF NOT EXISTS suppliers (
    uuid UUID PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    "contactPerson" TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance NUMERIC DEFAULT 0,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE suppliers DISABLE ROW LEVEL SECURITY;

-- 3. Fichier Clients & CRM
CREATE TABLE IF NOT EXISTS customers (
    uuid UUID PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "searchName" TEXT,
    phone TEXT,
    address TEXT,
    "settlementDay" INTEGER,
    "creditLimit" NUMERIC,
    "totalSpent" NUMERIC DEFAULT 0,
    "outstandingBalance" NUMERIC DEFAULT 0,
    "lastActivityDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "debtStatus" TEXT,
    "isOverLimit" BOOLEAN DEFAULT FALSE,
    "isBreadClient" BOOLEAN DEFAULT FALSE,
    bread_type_recurrence TEXT,
    bread_quantite_defaut INTEGER,
    bread_jours_semaine JSONB
);
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;

-- 4. Catalogue Produits Elite
CREATE TABLE IF NOT EXISTS products (
    uuid UUID PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    price NUMERIC NOT NULL,
    "purchasePrice" NUMERIC NOT NULL,
    quantity NUMERIC DEFAULT 0,
    "minStockLevel" NUMERIC DEFAULT 10,
    barcodes TEXT[], 
    unite TEXT,
    "dateExpiration" TIMESTAMPTZ,
    "supplierUuid" UUID,
    "dateMajPrix" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW(),
    "stockStatus" TEXT
);
ALTER TABLE products DISABLE ROW LEVEL SECURITY;

-- 5. Registre des Charges
CREATE TABLE IF NOT EXISTS expenses (
    uuid UUID PRIMARY KEY,
    description TEXT NOT NULL,
    category TEXT,
    amount NUMERIC NOT NULL,
    "expenseDate" TIMESTAMPTZ NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE expenses DISABLE ROW LEVEL SECURITY;

-- 6. Manifestes de Réception Stock
CREATE TABLE IF NOT EXISTS stock_intakes (
    uuid UUID PRIMARY KEY,
    "supplierUuid" UUID,
    "invoiceNumber" TEXT,
    "invoiceDate" TIMESTAMPTZ,
    "shippingCost" NUMERIC DEFAULT 0,
    items JSONB NOT NULL,
    "totalValue" NUMERIC NOT NULL,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE stock_intakes DISABLE ROW LEVEL SECURITY;

-- 7. Grand Livre des Ventes
CREATE TABLE IF NOT EXISTS sales (
    uuid UUID PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL UNIQUE,
    items JSONB NOT NULL,
    subtotal NUMERIC NOT NULL,
    "discountType" TEXT,
    "discountAmount" NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    "amountPaid" NUMERIC NOT NULL,
    "remainingBalance" NUMERIC NOT NULL,
    "paymentStatus" TEXT NOT NULL,
    "customerUuid" UUID,
    "dueDate" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sales DISABLE ROW LEVEL SECURITY;

-- 8. Registre des Retours Clients
CREATE TABLE IF NOT EXISTS product_returns (
    uuid UUID PRIMARY KEY,
    "originalSaleUuid" UUID,
    "originalInvoiceNumber" TEXT NOT NULL,
    items JSONB NOT NULL,
    "totalReturnValue" NUMERIC NOT NULL,
    "amountRefunded" NUMERIC DEFAULT 0,
    "customerUuid" UUID,
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE product_returns DISABLE ROW LEVEL SECURITY;

-- 9. Journal des Encaissements Clients
CREATE TABLE IF NOT EXISTS payments (
    uuid UUID PRIMARY KEY,
    "customerUuid" UUID,
    amount NUMERIC NOT NULL,
    "paymentDate" TIMESTAMPTZ NOT NULL,
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;

-- 10. Logistique du Pain
CREATE TABLE IF NOT EXISTS bread_orders (
    uuid UUID PRIMARY KEY,
    "customerUuid" UUID,
    "customName" TEXT,
    date TEXT NOT NULL,
    quantite INTEGER NOT NULL,
    quantite_origine INTEGER,
    est_paye BOOLEAN DEFAULT FALSE,
    est_livre BOOLEAN DEFAULT FALSE,
    "venteUuid" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE bread_orders DISABLE ROW LEVEL SECURITY;

-- 11. Journal d'Audit des Stocks
CREATE TABLE IF NOT EXISTS inventory_logs (
    uuid UUID PRIMARY KEY,
    "productUuid" UUID NOT NULL,
    change NUMERIC NOT NULL,
    "newQuantity" NUMERIC NOT NULL,
    reason TEXT NOT NULL,
    "relatedUuid" UUID,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inventory_logs DISABLE ROW LEVEL SECURITY;

-- 12. Journal des Règlements Fournisseurs
CREATE TABLE IF NOT EXISTS supplier_payments (
    uuid UUID PRIMARY KEY,
    "supplierUuid" UUID,
    amount NUMERIC NOT NULL,
    "paymentDate" TIMESTAMPTZ NOT NULL,
    method TEXT NOT NULL,
    notes TEXT,
    "createdAt" TIMESTAMPTZ DEFAULT NOW(),
    "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE supplier_payments DISABLE ROW LEVEL SECURITY;
`;

export function SupabaseSqlDialog() {
    const [isOpen, setIsOpen] = useState(false);
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (typeof window !== 'undefined') {
            navigator.clipboard.writeText(SUPABASE_SQL_SCRIPT);
            setCopied(true);
            toast.success("Code SQL copié pour Supabase.");
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <>
            <Button 
                type="button"
                variant="outline" 
                size="sm" 
                onClick={() => setIsOpen(true)}
                className="h-10 rounded-xl border-primary/20 bg-primary/5 text-primary hover:bg-primary hover:text-white transition-all gap-2 px-4"
            >
                <Terminal className="h-4 w-4" />
                Générer SQL Supabase
            </Button>

            <Dialog open={isOpen} onOpenChange={setIsOpen}>
                <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-[2.5rem] bg-card">
                    <DialogHeader className="bg-primary/5 p-8 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                    <Database className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight">Initialisation Supabase</DialogTitle>
                                    <DialogDescription className="font-medium">Script SQL Elite certifié pour votre coffre-fort Cloud.</DialogDescription>
                                </div>
                            </div>
                            <Button onClick={handleCopy} className="rounded-2xl h-12 px-6 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 gap-2 transition-all active:scale-95">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copié !' : 'Copier le script'}
                            </Button>
                        </div>
                    </DialogHeader>

                    <div className="flex-grow p-8 bg-black/40 overflow-hidden">
                        <ScrollArea className="h-full rounded-2xl border border-white/5 bg-black/60 p-6 font-mono text-sm leading-relaxed text-emerald-500/80 custom-scrollbar">
                            <pre className="whitespace-pre-wrap">{SUPABASE_SQL_SCRIPT}</pre>
                        </ScrollArea>
                    </div>

                    <div className="p-6 bg-muted/5 border-t border-white/5 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground opacity-40">
                            Précision de type absolue : Garanti compatible avec le moteur de synchronisation iPOS Luxury.
                        </p>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
