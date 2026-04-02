'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { 
    ArrowLeft, 
    Trash2, 
    AlertTriangle, 
    ChevronsUpDown, 
    Plus, 
    Truck, 
    BadgeCheck, 
    Loader2,
    Building,
    Hash,
    Calendar,
    ShoppingBag,
    Landmark,
    Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
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

export default function NewStockIntakePage() {
    const router = useRouter();
    const { processStockIntake } = useAppActions();
    
    const [isMounted, setIsMounted] = useState(false);
    const [supplierUuid, setSupplierUuid] = useState<string>('');
    const [supplierName, setSupplierName] = useState('');
    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);
    
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(undefined);
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    
    const [suppliers, setSuppliers] = useState<Supplier[] | undefined>(undefined);

    useEffect(() => {
        setIsMounted(true);
        setInvoiceDate(new Date());
        
        const fetchSuppliers = async () => {
            try {
                const data = await supplierService.getSuppliers();
                setSuppliers(data);
            } catch (error: any) {
                toast.error("Impossible de charger les partenaires.");
            }
        };
        fetchSuppliers();
    }, []);

    const supplierOptions = useMemo(() => {
        if (!suppliers) return [];
        if (!supplierSearch) return suppliers;
        return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
    }, [suppliers, supplierSearch]);


    const handleAddProduct = useCallback((product: any) => {
        const existingItemIndex = items.findIndex(item => item.productUuid === product.uuid);
        if (existingItemIndex > -1) {
            const newItems = [...items];
            newItems[existingItemIndex].quantity += 1;
            setItems(newItems);
            toast.info(`Quantité augmentée pour "${product.name}".`);
        } else {
            setItems(prev => [
                ...prev,
                {
                    id: uuidv4(),
                    productUuid: product.uuid,
                    name: product.name,
                    barcodes: product.barcodes || [],
                    category: product.category,
                    quantity: 1,
                    quantityDamaged: 0,
                    purchasePrice: product.purchasePrice,
                    price: product.price,
                    isNew: false,
                    unite: product.unite || 'Pièce',
                }
            ]);
        }
    }, [items]);
    
    const handleAddNewItem = useCallback((name: string) => {
        const newItem: StockIntakeItem = {
            id: uuidv4(),
            name: name,
            barcodes: [],
            category: '',
            quantity: 1,
            quantityDamaged: 0,
            purchasePrice: 0,
            price: 0,
            isNew: true,
            unite: 'Pièce',
        };
        setItems(prev => [...prev, newItem]);
    }, []);

    const handleItemChange = (id: string, field: keyof StockIntakeItem, value: any) => {
        setItems(prev => prev.map(item => {
            if (item.id === id) {
                const updatedItem = { ...item, [field]: value };
                if (field === 'purchasePrice' || field === 'quantity') {
                    if (updatedItem.isNew && updatedItem.price === 0) {
                        updatedItem.price = parseFloat(String(updatedItem.purchasePrice)) * 1.2;
                    }
                }
                return updatedItem;
            }
            return item;
        }));
    };

    const handleRemoveItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const itemsTotalValue = items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0);
    const grandTotal = itemsTotalValue + (Number(shippingCost) || 0);
    const shippingFactor = itemsTotalValue > 0 ? (Number(shippingCost) || 0) / itemsTotalValue : 0;

    const handleSave = async () => {
        if (!supplierName) {
            toast.error("Identité du fournisseur requise.");
            return;
        }
        if (items.length === 0) {
            toast.error("Veuillez lister au moins un article.");
            return;
        }

        for (const item of items) {
            if (!item.name || item.quantity <= 0 || item.purchasePrice < 0) {
                toast.error(`Informations invalides pour "${item.name || 'Nouvel article'}".`);
                return;
            }
            if (item.isNew && item.price <= 0) {
                toast.error(`Prix de vente manquant pour "${item.name}".`);
                return;
            }
        }

        setIsSaving(true);
        const success = await processStockIntake({
            supplierName,
            supplierUuid: supplierUuid || undefined,
            invoiceNumber,
            invoiceDate: invoiceDate || new Date(),
            items,
            totalValue: itemsTotalValue,
            shippingCost: Number(shippingCost) || 0
        });

        if (success) {
            router.push('/stock');
        }
        setIsSaving(false);
    };

    const handleSupplierSelect = (uuid: string) => {
        const selected = suppliers?.find(s => s.uuid === uuid);
        if (selected) {
            setSupplierUuid(selected.uuid);
            setSupplierName(selected.name);
        }
        setSupplierPopoverOpen(false);
    };

    const handleSupplierCreate = () => {
        setSupplierUuid('');
        setSupplierName(supplierSearch);
        setSupplierPopoverOpen(false);
    };
    
    if (!isMounted) return null;

    return (
        <div className="p-6 sm:p-10 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-1000">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-12 w-12 rounded-2xl border-white/5 bg-card/40 backdrop-blur-md" asChild>
                    <Link href="/stock"><ArrowLeft className="h-5 w-5" /></Link>
                 </Button>
                 <PageHeader
                    title="Réception de Stock"
                    description="Traitement Elite des entrées de marchandises"
                 />
                 <Button 
                    onClick={handleSave} 
                    disabled={isSaving || items.length === 0}
                    className="ml-auto h-12 px-8 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                 >
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <BadgeCheck className="h-4 w-4" />}
                    {isSaving ? 'Finalisation...' : 'Valider la Réception'}
                 </Button>
            </div>

            <div className="grid lg:grid-cols-12 gap-8 items-start">
                <Card className="lg:col-span-4 rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden shadow-2xl">
                    <CardHeader className="bg-primary/5 p-8 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Building className="h-6 w-6" />
                            </div>
                            <div>
                                <CardTitle className="text-xl font-black tracking-tighter">Entête du Bon</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Détails administratifs</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                <Building className="h-3 w-3 text-primary" /> Partenaire Fournisseur
                            </Label>
                             <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" role="combobox" className="w-full justify-between h-14 rounded-2xl bg-muted/20 border-none shadow-inner font-bold text-base px-6">
                                        {supplierName || "Choisir ou créer..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-30" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 rounded-2xl shadow-2xl border-white/5 overflow-hidden">
                                    <Command>
                                        <CommandInput placeholder="Rechercher..." onValueChange={setSupplierSearch} />
                                        <CommandList>
                                            <CommandEmpty>
                                                <Button variant="link" className="w-full text-xs" onClick={handleSupplierCreate}>
                                                    <Plus className="mr-2 h-4 w-4" /> Créer "{supplierSearch}"
                                                </Button>
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {supplierOptions?.map((supplier) => (
                                                    <CommandItem key={supplier.uuid} value={supplier.uuid} onSelect={() => handleSupplierSelect(supplier.uuid)} className="font-bold p-3">
                                                        {supplier.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Hash className="h-3 w-3" /> N° Facture
                                </Label>
                                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="Ex: INV-Elite" className="h-12 rounded-xl bg-muted/20 border-none shadow-inner font-bold" />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-2">
                                    <Calendar className="h-3 w-3" /> Date
                                </Label>
                                <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                            </div>
                        </div>

                        <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 space-y-4">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Truck className="h-4 w-4" /> Logistique (Transport)
                            </Label>
                            <div className="relative">
                                <Input 
                                    type="number" 
                                    className="h-16 rounded-2xl bg-background border-none shadow-inner font-black text-2xl text-primary text-center focus-visible:ring-primary/20"
                                    value={shippingCost || ''} 
                                    onChange={e => setShippingCost(Number(e.target.value) || 0)} 
                                    placeholder="0.0" 
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-xs opacity-20">DA</div>
                            </div>
                            <p className="text-[9px] text-muted-foreground italic leading-relaxed text-center px-4">
                                Ce montant sera réparti proportionnellement sur le coût de revient.
                            </p>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-8 space-y-8">
                    <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden shadow-2xl">
                        <CardHeader className="bg-muted/20 p-8 border-b border-white/5 flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-xl font-black tracking-tighter">Manifeste des Marchandises</CardTitle>
                                <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">{items.length} positions identifiées</CardDescription>
                            </div>
                            <div className="w-full max-w-xs">
                                <ProductIntakeCombobox onProductSelected={handleAddProduct} onNewProductCreated={handleAddNewItem} />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-white/5">
                                            <th className="p-6 text-left">Article / Rayon</th>
                                            <th className="p-6 text-center">Qté</th>
                                            <th className="p-6 text-right">P.U Achat</th>
                                            <th className="p-6 text-right text-primary">C. Revient</th>
                                            <th className="p-6 text-right">P.U Vente</th>
                                            <th className="p-6 w-12"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {items.map(item => {
                                            const landingCost = item.purchasePrice * (1 + shippingFactor);
                                            const isLoss = item.price > 0 && landingCost > 0 && item.price < landingCost;
                                            
                                            return (
                                                <tr key={item.id} className="hover:bg-primary/5 transition-colors group">
                                                    <td className="p-6">
                                                        {item.isNew ? (
                                                            <Input placeholder="Désignation..." value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} className="h-10 bg-muted/20 border-none shadow-inner rounded-xl font-bold" />
                                                        ) : (
                                                            <div className="flex flex-col">
                                                                <span className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">{item.name}</span>
                                                                <span className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest">{item.category || 'Stock Général'}</span>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex items-center gap-2 justify-center">
                                                            <Input type="number" className="h-10 w-20 text-center font-black rounded-xl bg-background/50 border-none shadow-inner" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} />
                                                            <span className="text-[9px] font-black text-muted-foreground/30 uppercase">{item.unite || 'pcs'}</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <Input type="number" step="0.1" className="h-10 w-24 text-right font-bold rounded-xl bg-background/50 border-none shadow-inner ml-auto" value={item.purchasePrice || ''} onChange={e => handleItemChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)} />
                                                    </td>
                                                    <td className="p-6 text-right">
                                                        <div className="flex flex-col items-end">
                                                            <span className="font-black text-primary tracking-tighter text-sm">{landingCost.toFixed(1)}</span>
                                                            {shippingCost > 0 && <span className="text-[8px] font-black text-primary/40 uppercase tracking-tighter">Inclus</span>}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="relative flex items-center justify-end">
                                                            <Input type="number" step="0.1" className={cn("h-10 w-24 text-right font-black rounded-xl bg-primary/5 border-none shadow-inner", isLoss && "text-destructive ring-1 ring-destructive/20")} value={item.price || ''} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} disabled={!item.isNew} />
                                                            {isLoss && (
                                                                <TooltipProvider>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <AlertTriangle className="absolute -right-6 h-4 w-4 text-destructive animate-pulse" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent className="bg-destructive text-white rounded-xl border-none shadow-xl font-bold">Vente à perte !</TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                        {items.length === 0 && (
                                            <tr>
                                                <td colSpan={6} className="p-20 text-center">
                                                    <div className="flex flex-col items-center gap-4 opacity-20">
                                                        <ShoppingBag className="h-16 w-16" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.4em]">Le manifeste est vide</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-10 bg-muted/10 border-t border-white/5">
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="p-6 rounded-[2rem] bg-black/20 border border-white/5 space-y-4">
                                        <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-primary/60">Analyse de Rentabilité</h4>
                                        <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                            <span className="text-xs font-bold text-muted-foreground">Logistique (DA) :</span>
                                            <span className="text-xl font-black text-primary">{(shippingFactor * 100).toFixed(2)}%</span>
                                        </div>
                                        <p className="text-[9px] text-muted-foreground/50 leading-relaxed italic">
                                            Calcul automatique du surcoût logistique réparti.
                                        </p>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center text-xs font-bold text-muted-foreground px-2">
                                            <span className="uppercase tracking-widest opacity-50">Marchandise Pure</span>
                                            <span className="font-mono">{formatCurrency(itemsTotalValue)}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-xs font-bold text-primary px-2">
                                            <span className="uppercase tracking-widest opacity-50">Logistique Totale</span>
                                            <span className="font-mono">+ {formatCurrency(shippingCost)}</span>
                                        </div>
                                        <div className="h-px bg-white/10 my-2" />
                                        <div className="flex justify-between items-center p-6 rounded-[2rem] bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Total à Facturer</span>
                                                <span className="text-3xl font-black tracking-tighter">{formatCurrency(grandTotal)}</span>
                                            </div>
                                            <Landmark className="h-8 w-8 opacity-20" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
