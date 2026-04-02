'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Save, AlertTriangle, ChevronsUpDown, Plus, Truck } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { DatePicker } from '@/components/ui/date-picker';
import type { StockIntakeItem, Supplier, Product } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Loader2 } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductIntakeCombobox } from '@/components/stock/ProductIntakeCombobox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supplierService } from '@/services/supplier.service';
import { useAppActions } from '@/stores/appStore';

const units: NonNullable<Product['unite']>[] = ['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille'];

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
                toast.error("Impossible de charger les fournisseurs.", { description: error.message });
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
            toast.info(`Quantité de "${product.name}" augmentée.`);
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
            toast.error("Veuillez remplir le nom du fournisseur.");
            return;
        }
        if (items.length === 0) {
            toast.error("Veuillez ajouter au moins un produit à la réception.");
            return;
        }

        // --- Validation ---
        for (const item of items) {
            if (!item.name || item.quantity <= 0 || item.purchasePrice < 0) {
                toast.error(`Veuillez remplir les informations pour l'article "${item.name || 'Nouvel article'}". La quantité doit être > 0 et le prix d'achat >= 0.`);
                return;
            }
             if (item.quantityDamaged > item.quantity) {
                toast.error(`La quantité endommagée ne peut pas dépasser la quantité reçue pour "${item.name}".`);
                return;
            }
            if (item.isNew && item.price <= 0) {
                toast.error(`Veuillez définir un prix de vente pour le nouvel article "${item.name}".`);
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
        <div className="p-4 sm:p-6 space-y-6">
            <PageHeader
                title="Nouvelle Réception de Stock"
                description="Enregistrez les marchandises reçues et répartissez les frais de transport."
            >
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" asChild>
                        <Link href="/stock"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Enregistrement...' : 'Enregistrer la réception'}
                    </Button>
                </div>
            </PageHeader>

            <Card>
                <CardContent className="p-6 grid md:grid-cols-4 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="supplier">Fournisseur</Label>
                         <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className="w-full justify-between"
                                >
                                    {supplierName || "Sélectionner ou créer..."}
                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                <Command>
                                    <CommandInput 
                                        placeholder="Rechercher ou créer..." 
                                        onValueChange={setSupplierSearch}
                                    />
                                    <CommandList>
                                        <CommandEmpty>
                                            <Button 
                                                variant="link" 
                                                className="w-full"
                                                onClick={handleSupplierCreate}>
                                                <Plus className="mr-2 h-4 w-4" />
                                                Créer "{supplierSearch}"
                                            </Button>
                                        </CommandEmpty>
                                        <CommandGroup>
                                            {supplierOptions?.map((supplier) => (
                                                <CommandItem
                                                    key={supplier.uuid}
                                                    value={supplier.uuid}
                                                    onSelect={() => handleSupplierSelect(supplier.uuid)}
                                                >
                                                    {supplier.name}
                                                </CommandItem>
                                            ))}
                                        </CommandGroup>
                                    </CommandList>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="invoiceNumber">N° Facture/Bon</Label>
                        <Input id="invoiceNumber" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="INV-12345" />
                    </div>
                    <div className="space-y-2">
                        <Label>Date Facture</Label>
                        <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="shippingCost" className="flex items-center gap-2 text-primary font-bold">
                            <Truck className="h-4 w-4" /> Frais de Transport (DA)
                        </Label>
                        <Input 
                            id="shippingCost" 
                            type="number" 
                            className="border-primary/30 focus-visible:ring-primary font-bold"
                            value={shippingCost} 
                            onChange={e => setShippingCost(Number(e.target.value) || 0)} 
                            placeholder="0.00" 
                        />
                    </div>
                </CardContent>
            </Card>

             <Card>
                <CardContent className="p-6 space-y-4">
                    <h3 className="font-semibold text-lg">Articles Reçus</h3>
                    
                    <ProductIntakeCombobox 
                        onProductSelected={handleAddProduct}
                        onNewProductCreated={handleAddNewItem}
                    />
                    
                     <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b">
                                    <th className="p-2 text-left min-w-[200px]">Produit</th>
                                    <th className="p-2 text-left w-24 text-center">Unité</th>
                                    <th className="p-2 text-left w-24 text-center">Qté</th>
                                    <th className="p-2 text-left w-32 text-right">P.U Achat</th>
                                    <th className="p-2 text-left w-32 text-right bg-primary/5 text-primary">Coût de Revient</th>
                                    <th className="p-2 text-left w-32 text-right">P.U Vente</th>
                                    <th className="p-2 text-right w-12"></th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map(item => {
                                    const landingCost = item.purchasePrice * (1 + shippingFactor);
                                    const isLoss = item.price > 0 && landingCost > 0 && item.price < landingCost;
                                    
                                    return (
                                        <tr key={item.id} className="border-b hover:bg-muted/20 transition-colors">
                                            <td className="p-2">
                                                {item.isNew ? (
                                                    <Input placeholder="Nom produit" value={item.name} onChange={e => handleItemChange(item.id, 'name', e.target.value)} />
                                                ) : (
                                                    <div className="flex flex-col">
                                                        <span className="font-bold">{item.name}</span>
                                                        <span className="text-[10px] text-muted-foreground uppercase">{item.category || 'N/A'}</span>
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-2">
                                                {item.isNew ? (
                                                    <Select value={item.unite} onValueChange={(value) => handleItemChange(item.id, 'unite', value)}>
                                                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                                                        <SelectContent>
                                                            {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                ) : <div className="text-center">{item.unite || 'N/A'}</div>}
                                            </td>
                                            <td className="p-2"><Input type="number" className="h-8 text-center" value={item.quantity} onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value) || 0)} /></td>
                                            <td className="p-2"><Input type="number" step="0.1" className="h-8 text-right" value={item.purchasePrice} onChange={e => handleItemChange(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)} /></td>
                                            <td className="p-2 text-right bg-primary/5 font-black text-primary">
                                                {landingCost.toFixed(1)}
                                            </td>
                                            <td className="p-2">
                                                <div className="relative">
                                                     <Input type="number" step="0.1" className="h-8 text-right font-bold" value={item.price} onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)} disabled={!item.isNew} />
                                                     {isLoss && (
                                                        <div className="absolute -bottom-5 left-0 text-[10px] text-destructive flex items-center gap-1 font-bold uppercase">
                                                          <AlertTriangle className="h-3 w-3" /> Vente à perte
                                                        </div>
                                                     )}
                                                </div>
                                            </td>
                                            <td className="p-2 text-right">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleRemoveItem(item.id)}><Trash2 className="h-4 w-4" /></Button>
                                            </td>
                                        </tr>
                                    )
                                })}
                                {items.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">Aucun article ajouté.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                        <div className="p-4 rounded-xl bg-muted/30 border space-y-2">
                            <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Résumé Distribution</h4>
                            <div className="flex justify-between text-sm">
                                <span>Part du transport par DA d'achat:</span>
                                <span className="font-bold text-primary">{(shippingFactor * 100).toFixed(2)}%</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground">
                                * Les frais de transport sont répartis automatiquement sur le prix d'achat de chaque produit pour calculer le coût de revient réel.
                            </p>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center text-sm text-muted-foreground px-1">
                                <span>Valeur Marchandise:</span>
                                <span className="font-bold">{formatCurrency(itemsTotalValue)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm text-primary px-1">
                                <span>Frais Transport:</span>
                                <span className="font-bold">+ {formatCurrency(shippingCost)}</span>
                            </div>
                            <div className="flex justify-between items-center p-4 bg-primary/10 rounded-xl border border-primary/20">
                                <span className="font-black uppercase tracking-tighter">Total à Payer:</span>
                                <span className="text-2xl font-black text-primary">{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>
                    </div>
                </CardContent>
             </Card>
        </div>
    );
}
