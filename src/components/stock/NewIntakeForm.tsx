'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ShoppingBag, Truck, FileText, Building, Hash, Loader2, PackagePlus, Calculator, Coins, Sparkles, AlertTriangle } from 'lucide-react';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import { OcrInvoiceScanner, type OcrLineItem } from './OcrInvoiceScanner';
import type { Product, StockIntakeItem } from '@/lib/types';
import { formatCurrency, cn, safeNumber } from '@/lib/utils';
import { useAppActions } from '@/stores/appStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DatePicker } from '../ui/date-picker';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

export function NewIntakeForm() {
    const router = useRouter();
    const { processStockIntake } = useAppActions();

    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSubmitting, setIsSaving] = useState(false);

    const itemsTotalValue = useMemo(() => {
        return items.reduce((sum, item) => sum + (safeNumber(item.quantity) * safeNumber(item.purchasePrice)), 0);
    }, [items]);

    const shippingFactor = useMemo(() => {
        return itemsTotalValue > 0 ? shippingCost / itemsTotalValue : 0;
    }, [itemsTotalValue, shippingCost]);

    const totalValue = itemsTotalValue + shippingCost;

    const handleAddProduct = (product: Product) => {
        const existing = items.find(i => i.productUuid === product.uuid);
        if (existing) {
            toast.info(`"${product.name}" est déjà dans le manifeste.`);
            return;
        }

        const newItem: StockIntakeItem = {
            id: uuidv4(),
            productUuid: product.uuid,
            name: product.name,
            barcodes: product.barcodes || [],
            quantity: 1,
            quantityDamaged: 0,
            purchasePrice: product.purchasePrice || 0,
            price: product.price,
            unite: product.unite || 'Pièce',
            isNew: false
        };
        setItems(prev => [newItem, ...prev]);
    };

    const handleCreateNewProduct = (name: string) => {
        const newItem: StockIntakeItem = {
            id: uuidv4(),
            name: name.trim(),
            barcodes: [],
            quantity: 1,
            quantityDamaged: 0,
            purchasePrice: 0,
            price: 0,
            unite: 'Pièce',
            isNew: true,
            category: 'Général'
        };
        setItems(prev => [newItem, ...prev]);
    };

    const handleOcrExtracted = (ocrItems: OcrLineItem[]) => {
        const newItems: StockIntakeItem[] = ocrItems.map(ocr => ({
            id: uuidv4(),
            name: ocr.name,
            barcodes: [],
            quantity: ocr.quantity,
            quantityDamaged: 0,
            purchasePrice: ocr.purchasePrice,
            price: Number((ocr.purchasePrice * 1.3).toFixed(2)), 
            unite: 'Pièce',
            isNew: true,
            category: 'Général'
        }));
        setItems(prev => [...newItems, ...prev]);
    };

    const updateItem = (id: string, field: keyof StockIntakeItem, value: any) => {
        setItems(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const handleSave = async () => {
        if (!supplierName.trim()) {
            toast.error("Veuillez identifier le fournisseur.");
            return;
        }
        if (items.length === 0) {
            toast.error("Le manifeste est vide.");
            return;
        }
        if (items.some(i => safeNumber(i.quantity) <= 0 || safeNumber(i.purchasePrice) < 0)) {
            toast.error("Données invalides dans le tableau.");
            return;
        }

        setIsSaving(true);
        try {
            const success = await processStockIntake({
                supplierName: supplierName.trim(),
                invoiceNumber: invoiceNumber.trim() || `INT-${Date.now().toString().slice(-6)}`,
                invoiceDate: invoiceDate || new Date(),
                shippingCost,
                items,
                totalValue
            });

            if (success) {
                toast.success("Manifeste validé avec succès.");
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Erreur de validation.");
        } finally {
            setIsSaving(false);
        }
    };

    useKeyboardShortcuts([
        {
            key: 'Enter',
            ctrl: true,
            action: handleSave,
            description: 'Valider le manifeste de réception',
            ignoreInputFocus: true
        }
    ], 'Logistique', items.length > 0);

    return (
        <div className="grid lg:grid-cols-12 gap-6 animate-in slide-in-from-bottom-4 duration-700">
            <div className="lg:col-span-9 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden shadow-sm">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-black tracking-tighter">Manifeste de Flux Entrants</CardTitle>
                        </div>
                        <div className="max-w-md flex-grow">
                            <ProductIntakeCombobox 
                                onProductSelected={handleAddProduct}
                                onNewProductCreated={handleCreateNewProduct}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-black/20 border-none">
                                    <TableRow className="border-white/5">
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 p-4">Désignation</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-center">Qté Flux</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">P. Achat HT</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-primary/60 text-right">C. Revient</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">P. Vente Elite</TableHead>
                                        <TableHead className="font-black text-[10px] uppercase text-muted-foreground/60 text-right">Total HT</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} className="h-80 text-center p-6 opacity-20">
                                                <div className="flex flex-col items-center justify-center gap-6">
                                                    <div className="p-6 rounded-3xl bg-muted/20 border-2 border-dashed border-white/10">
                                                        <PackagePlus className="h-16 w-16" />
                                                    </div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">Scannez ou sélectionnez des flux pour alimenter le manifeste</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => {
                                            const qty = safeNumber(item.quantity);
                                            const cost = safeNumber(item.purchasePrice);
                                            const landingCost = cost * (1 + shippingFactor);
                                            const rowTotal = qty * cost;
                                            
                                            return (
                                                <TableRow key={item.id} className="border-white/5 group hover:bg-white/5 transition-all">
                                                    <TableCell className="p-4">
                                                        <div className="flex flex-col gap-1 min-w-[200px]">
                                                            <span className="font-black text-sm tracking-tight truncate">{item.name}</span>
                                                            {item.isNew && (
                                                                <span className="text-[8px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-lg w-fit border border-primary/20 tracking-tighter">Injection Catalogue</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <Input 
                                                            type="number" 
                                                            step="0.001"
                                                            value={item.quantity} 
                                                            onChange={e => updateItem(item.id, 'quantity', e.target.value)}
                                                            className="w-20 h-9 text-center bg-black/20 border-none shadow-inner mx-auto font-black text-lg focus-visible:ring-primary/20"
                                                            onFocus={e => e.target.select()}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <div className="relative group/price">
                                                            <Input 
                                                                type="number" 
                                                                step="0.01"
                                                                value={item.purchasePrice || ''} 
                                                                onChange={e => updateItem(item.id, 'purchasePrice', e.target.value)}
                                                                className={cn(
                                                                    "w-24 h-9 text-right bg-black/20 border-none shadow-inner font-mono font-black ml-auto focus-visible:ring-primary/20 pr-6",
                                                                    cost === 0 && "text-destructive animate-pulse"
                                                                )}
                                                                placeholder="0.00"
                                                                onFocus={e => e.target.select()}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold opacity-20">DA</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-mono text-xs font-black text-primary tracking-tighter">{landingCost.toFixed(2)}</span>
                                                            <span className="text-[7px] text-muted-foreground/30 font-black uppercase tracking-tighter">PRÉVISIONNEL</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right">
                                                        <div className="relative">
                                                            <Input 
                                                                type="number" 
                                                                step="0.01"
                                                                value={item.price || ''} 
                                                                onChange={e => updateItem(item.id, 'price', e.target.value)}
                                                                className="w-24 h-9 text-right bg-black/20 border-none shadow-inner font-mono font-black text-emerald-500 ml-auto focus-visible:ring-primary/20 pr-6"
                                                                placeholder="0.00"
                                                                onFocus={e => e.target.select()}
                                                            />
                                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-emerald-500/40">DA</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="p-4 text-right font-mono font-black text-sm tracking-tighter">
                                                        {formatCurrency(rowTotal)}
                                                    </TableCell>
                                                    <TableCell className="p-4">
                                                        <button onClick={() => removeItem(item.id)} className="text-destructive/20 hover:text-destructive transition-all hover:scale-110">
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-3 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden sticky top-24 shadow-xl">
                    <CardHeader className="bg-primary/5 border-b border-white/5 p-4">
                        <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 flex items-center gap-2">
                            <Sparkles className="h-3.5 w-3.5" /> Synthèse Élite
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase text-muted-foreground/60 ml-1 tracking-widest">Partenaire Fournisseur *</Label>
                                <div className="relative group">
                                    <Building className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20 group-focus-within:text-primary transition-all duration-500" />
                                    <Input 
                                        placeholder="Établissement source..." 
                                        className="pl-11 h-12 rounded-xl bg-black/20 border-none shadow-inner font-black focus-visible:ring-primary/20"
                                        value={supplierName}
                                        onChange={e => setSupplierName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 p-4 bg-muted/20 rounded-2xl border border-white/5 shadow-inner">
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground/40 ml-1 tracking-widest">Référence Facture</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 opacity-20" />
                                        <Input 
                                            placeholder="N° FAC..." 
                                            className="pl-9 h-10 rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold"
                                            value={invoiceNumber}
                                            onChange={e => setInvoiceNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[9px] font-black uppercase text-muted-foreground/40 ml-1 tracking-widest">Date Émission</Label>
                                    <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                                </div>
                            </div>

                            <div className="p-5 bg-primary/5 rounded-2xl border border-primary/10 space-y-4 shadow-inner relative overflow-hidden group/shipping">
                                <Truck className="absolute -right-4 -top-4 h-20 w-20 opacity-[0.03] group-hover/shipping:opacity-10 transition-opacity" />
                                <div className="flex items-center justify-between relative z-10">
                                    <Label className="text-[10px] font-black uppercase text-primary/60 flex items-center gap-2">
                                        <Truck className="h-3.5 w-3.5" /> Logistique / Transport
                                    </Label>
                                    <div className="relative">
                                        <Input 
                                            type="number" 
                                            step="0.01"
                                            value={shippingCost || ''} 
                                            onChange={e => setShippingCost(safeNumber(e.target.value))}
                                            className="w-24 h-9 text-right rounded-lg bg-black/20 border-none shadow-inner font-mono font-black"
                                            placeholder="0.00"
                                            onFocus={e => e.target.select()}
                                        />
                                        <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold opacity-20">DA</span>
                                    </div>
                                </div>
                                <p className="text-[8px] text-muted-foreground/40 leading-relaxed italic border-l-2 border-primary/20 pl-3 uppercase tracking-tighter">
                                    Amortissement automatique sur le coût de revient.
                                </p>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-white/5 space-y-4">
                            <div className="flex justify-between items-center text-xs font-black uppercase text-muted-foreground/40 tracking-widest">
                                <span>Valorisation HT</span>
                                <span className="font-mono text-foreground font-black tabular-nums">{formatCurrency(itemsTotalValue)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-6 bg-black/40 p-5 rounded-2xl border border-white/5 shadow-inner">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">Dette Fournisseur</span>
                                    <span className="text-[8px] font-bold text-muted-foreground/30">Facture Net à Payer</span>
                                </div>
                                <span className="text-3xl font-black text-primary tracking-tighter tabular-nums">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>

                        <div className="pt-8 space-y-4">
                            <OcrInvoiceScanner onItemsExtracted={handleOcrExtracted} />
                            <Button 
                                onClick={handleSave} 
                                disabled={isSubmitting || items.length === 0}
                                className="w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-[0.98] gap-3"
                            >
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
                                Valider Flux [Enter]
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
