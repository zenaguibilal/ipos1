'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
    ArrowLeft, Trash2, AlertTriangle, ChevronsUpDown,
    Truck, BadgeCheck, Loader2, Building, Hash,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { StockIntakeItem, Supplier } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductIntakeCombobox } from '@/components/stock/ProductIntakeCombobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { supplierService } from '@/services/supplier.service';
import { useAppActions } from '@/stores/appStore';
import { OcrInvoiceScanner, type OcrLineItem } from '@/components/stock/OcrInvoiceScanner';

export default function NewStockIntakePage() {
    const router = useRouter();
    const { processStockIntake } = useAppActions();

    const [isMounted, setIsMounted]          = useState(false);
    const [supplierUuid, setSupplierUuid]    = useState('');
    const [supplierName, setSupplierName]    = useState('');
    const [supplierSearch, setSupplierSearch]= useState('');
    const [supplierOpen, setSupplierOpen]    = useState(false);
    const [invoiceNumber, setInvoiceNumber]  = useState('');
    const [shippingCost, setShippingCost]    = useState<number>(0);
    const [invoiceDate, setInvoiceDate]      = useState<Date | undefined>();
    const [items, setItems]                  = useState<StockIntakeItem[]>([]);
    const [isSaving, setIsSaving]            = useState(false);
    const [suppliers, setSuppliers]          = useState<Supplier[] | undefined>();

    useEffect(() => {
        setIsMounted(true);
        setInvoiceDate(new Date());
        supplierService.getSuppliers()
            .then(setSuppliers)
            .catch(() => toast.error('Impossible de charger les fournisseurs.'));
    }, []);

    const supplierOptions = useMemo(() => {
        if (!suppliers) return [];
        const q = supplierSearch.toLowerCase();
        return q ? suppliers.filter(s => s.name.toLowerCase().includes(q)) : suppliers;
    }, [suppliers, supplierSearch]);

    const handleAddProduct = useCallback((product: any) => {
        setItems(prev => {
            const idx = prev.findIndex(i => i.productUuid === product.uuid);
            if (idx > -1) {
                const next = [...prev];
                next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
                toast.info(`Quantité augmentée pour "${product.name}".`);
                return next;
            }
            return [...prev, {
                id: uuidv4(), productUuid: product.uuid, name: product.name,
                barcodes: product.barcodes || [], category: product.category || '',
                quantity: 1, quantityDamaged: 0,
                purchasePrice: product.purchasePrice, price: product.price,
                isNew: false, unite: product.unite || 'Pièce',
            }];
        });
    }, []);

    const handleAddNewItem = useCallback((name: string) => {
        setItems(prev => [...prev, {
            id: uuidv4(), name, barcodes: [], category: '',
            quantity: 1, quantityDamaged: 0,
            purchasePrice: 0, price: 0, isNew: true, unite: 'Pièce',
        }]);
    }, []);

    const handleOcrItems = useCallback((lines: OcrLineItem[]) => {
        setItems(prev => {
            const next = [...prev];
            for (const line of lines) {
                const idx = next.findIndex(
                    i => i.name.toLowerCase().trim() === line.name.toLowerCase().trim(),
                );
                if (idx > -1) {
                    next[idx] = {
                        ...next[idx],
                        quantity:      line.quantity,
                        purchasePrice: line.purchasePrice || next[idx].purchasePrice,
                    };
                } else {
                    next.push({
                        id: uuidv4(), name: line.name, barcodes: [], category: '',
                        quantity: line.quantity, quantityDamaged: 0,
                        purchasePrice: line.purchasePrice, price: 0,
                        isNew: true, unite: 'Pièce',
                    });
                }
            }
            return next;
        });
    }, []);

    const handleItemChange = (id: string, field: keyof StockIntakeItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id !== id) return item;
            const u = { ...item, [field]: value };
            if ((field === 'purchasePrice' || field === 'quantity') && u.isNew && u.price === 0)
                u.price = parseFloat(String(u.purchasePrice)) * 1.2;
            return u;
        }));
    };

    const handleRemoveItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

    const itemsTotal     = items.reduce((a, i) => a + i.quantity * i.purchasePrice, 0);
    const grandTotal     = itemsTotal + (Number(shippingCost) || 0);
    const shippingFactor = itemsTotal > 0 ? (Number(shippingCost) || 0) / itemsTotal : 0;

    const handleSave = async () => {
        if (!supplierName) { toast.error('Fournisseur requis.'); return; }
        if (items.length === 0) { toast.error('Ajoutez au moins un article.'); return; }
        for (const item of items) {
            if (!item.name || item.quantity <= 0 || item.purchasePrice < 0) {
                toast.error(`Données invalides : "${item.name || 'Nouvel article'}".`); return;
            }
            if (item.isNew && item.price <= 0) {
                toast.error(`Prix de vente requis : "${item.name}".`); return;
            }
        }
        setIsSaving(true);
        const ok = await processStockIntake({
            supplierName, supplierUuid: supplierUuid || undefined,
            invoiceNumber, invoiceDate: invoiceDate || new Date(),
            items, totalValue: itemsTotal, shippingCost: Number(shippingCost) || 0,
        });
        if (ok) router.push('/stock');
        setIsSaving(false);
    };

    if (!isMounted) return null;

    return (
        <div className="p-3 space-y-3 max-w-6xl mx-auto">
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                    <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                </Button>
                <PageHeader title="Réception de stock" className="flex-1 mb-0" />
                <Button onClick={handleSave} disabled={isSaving || items.length === 0} size="sm" className="gap-1.5">
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                    {isSaving ? 'Enregistrement…' : 'Valider'}
                </Button>
            </div>

            <div className="grid lg:grid-cols-3 gap-3 items-start">
                {/* Info card */}
                <Card className="app-card">
                    <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center gap-1.5">
                            <Building className="h-4 w-4 text-primary" /> Bon de réception
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 pb-4 space-y-3">
                        <div className="space-y-1">
                            <Label className="text-xs">Fournisseur</Label>
                            <Popover open={supplierOpen} onOpenChange={setSupplierOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-8 text-sm font-normal">
                                        {supplierName || 'Choisir ou créer…'}
                                        <ChevronsUpDown className="ml-2 h-3 w-3 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                    <Command>
                                        <CommandInput placeholder="Rechercher…" onValueChange={setSupplierSearch} />
                                        <CommandList>
                                            <CommandEmpty>
                                                <Button variant="link" className="w-full text-xs" onClick={() => {
                                                    setSupplierUuid(''); setSupplierName(supplierSearch); setSupplierOpen(false);
                                                }}>
                                                    Créer "{supplierSearch}"
                                                </Button>
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {supplierOptions.map(s => (
                                                    <CommandItem key={s.uuid} value={s.uuid} onSelect={() => {
                                                        setSupplierUuid(s.uuid); setSupplierName(s.name); setSupplierOpen(false);
                                                    }}>
                                                        {s.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <Label className="text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> N° Facture</Label>
                                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-001" className="h-8 text-sm" />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Date</Label>
                                <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <Label className="text-xs flex items-center gap-1"><Truck className="h-3 w-3" /> Transport (DA)</Label>
                            <Input type="number" value={shippingCost || ''} onChange={e => setShippingCost(Number(e.target.value) || 0)} placeholder="0.0" className="h-8 text-sm" />
                        </div>

                        <div className="pt-2 border-t border-border text-xs space-y-1">
                            <div className="flex justify-between text-muted-foreground">
                                <span>Marchandise</span><span className="tabular-nums">{formatCurrency(itemsTotal)}</span>
                            </div>
                            <div className="flex justify-between text-muted-foreground">
                                <span>Transport</span><span className="tabular-nums">+ {formatCurrency(shippingCost)}</span>
                            </div>
                            <div className="flex justify-between font-semibold border-t border-border pt-1">
                                <span>Total</span>
                                <span className="tabular-nums text-primary">{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Items table */}
                <Card className="app-card lg:col-span-2">
                    <CardHeader className="py-3 px-4">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                            <CardTitle className="text-sm">{items.length} article(s)</CardTitle>
                            <div className="flex items-center gap-2">
                                <OcrInvoiceScanner onItemsExtracted={handleOcrItems} />
                                <div className="w-52">
                                    <ProductIntakeCombobox onProductSelected={handleAddProduct} onNewProductCreated={handleAddNewItem} />
                                </div>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="px-0 pb-0">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/50 text-xs text-muted-foreground">
                                        <th className="text-left px-3 py-2 font-medium">Article</th>
                                        <th className="text-center px-2 py-2 font-medium w-16">Qté</th>
                                        <th className="text-right px-2 py-2 font-medium w-20">P.U Achat</th>
                                        <th className="text-right px-2 py-2 font-medium w-20 text-primary">C.Revient</th>
                                        <th className="text-right px-2 py-2 font-medium w-20">P.U Vente</th>
                                        <th className="w-9 px-1 py-2" />
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border">
                                    {items.map(item => {
                                        const lc    = item.purchasePrice * (1 + shippingFactor);
                                        const isLoss = item.price > 0 && lc > 0 && item.price < lc;
                                        return (
                                            <tr key={item.id} className="hover:bg-muted/30">
                                                <td className="px-3 py-1.5">
                                                    {item.isNew
                                                        ? <Input value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} placeholder="Désignation…" className="h-7 text-sm" />
                                                        : <div><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-muted-foreground">{item.category || '—'}</p></div>
                                                    }
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <Input type="number" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} className="h-7 text-center text-sm w-14 mx-auto" />
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <Input type="number" step="0.1" value={item.purchasePrice || ''} onChange={e => handleItemChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)} className="h-7 text-right text-sm" />
                                                </td>
                                                <td className="px-2 py-1.5 text-right tabular-nums text-primary text-sm font-medium">
                                                    {lc.toFixed(1)}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <TooltipProvider>
                                                        <div className="flex items-center gap-1">
                                                            <Input type="number" step="0.1" value={item.price || ''} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} disabled={!item.isNew} className={cn('h-7 text-right text-sm', isLoss && 'border-destructive')} />
                                                            {isLoss && <Tooltip><TooltipTrigger><AlertTriangle className="h-3.5 w-3.5 text-destructive" /></TooltipTrigger><TooltipContent><p className="text-xs">Vente à perte !</p></TooltipContent></Tooltip>}
                                                        </div>
                                                    </TooltipProvider>
                                                </td>
                                                <td className="px-1 py-1.5">
                                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleRemoveItem(item.id)}>
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                    {items.length === 0 && (
                                        <tr><td colSpan={6} className="text-center py-10 text-sm text-muted-foreground">
                                            Ajoutez des articles manuellement ou scannez une facture via OCR
                                        </td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
