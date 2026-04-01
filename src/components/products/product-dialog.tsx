
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import type { Product, Supplier } from '@/lib/types';
import { Loader2, X, AlertTriangle, ChevronsUpDown, Plus, ImageIcon, Package, Tag, ShieldCheck, Box } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DatePicker } from '../ui/date-picker';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { productService } from '@/services/product.service';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import Image from 'next/image';
import placeholders from '@/app/lib/placeholder-images.json';
import { cn } from '@/lib/utils';

interface ProductDialogProps {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    product: Product | null;
    categories: string[];
    suppliers: Supplier[];
    onSuccess: () => void;
}

const initialFormState: Partial<Product> & { supplierName?: string } = {
    name: '',
    category: '',
    price: 0,
    purchasePrice: 0,
    quantity: 0,
    minStockLevel: 10,
    barcodes: [],
    unite: 'Pièce',
    imageUrl: '',
    dateExpiration: undefined,
    supplierUuid: undefined,
    supplierName: '',
};

const units: NonNullable<Product['unite']>[] = ['Pièce', 'Kg', 'Litre', 'Boîte', 'Carton', 'Sachet', 'Bouteille'];

export function ProductDialog({ isOpen, onOpenChange, product, categories, suppliers, onSuccess }: ProductDialogProps) {
    const [formState, setFormState] = useState(initialFormState);
    const [currentBarcode, setCurrentBarcode] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [showPriceConfirm, setShowPriceConfirm] = useState(false);

    const [supplierSearch, setSupplierSearch] = useState('');
    const [supplierPopoverOpen, setSupplierPopoverOpen] = useState(false);

    useEffect(() => {
        if (product && isOpen) {
            const supplier = suppliers.find(s => s.uuid === product.supplierUuid);
            setFormState({
                ...product,
                dateExpiration: product.dateExpiration ? new Date(product.dateExpiration) : undefined,
                supplierName: supplier?.name || '',
            });
        } else if (!product && isOpen) {
            setFormState(initialFormState);
        }
        setSupplierSearch('');
    }, [product, isOpen, suppliers]);
    
    const priceNum = Number(formState.price);
    const purchasePriceNum = Number(formState.purchasePrice);
    const priceWarning = !isNaN(priceNum) && !isNaN(purchasePriceNum) && priceNum > 0 && purchasePriceNum > 0 && priceNum < purchasePriceNum;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        setFormState(prev => ({ ...prev, [id]: value }));
    };

    const handleAddBarcode = () => {
        if (currentBarcode.trim() && !formState.barcodes?.includes(currentBarcode.trim())) {
            setFormState(prev => ({ ...prev, barcodes: [...(prev.barcodes || []), currentBarcode.trim()] }));
            setCurrentBarcode('');
        }
    };
    
    const handleRemoveBarcode = (barcodeToRemove: string) => {
        setFormState(prev => ({...prev, barcodes: prev.barcodes?.filter(b => b !== barcodeToRemove)}));
    };

    const supplierOptions = useMemo(() => {
        if (!suppliers) return [];
        if (!supplierSearch) return suppliers;
        return suppliers.filter(s => s.name.toLowerCase().includes(supplierSearch.toLowerCase()));
    }, [suppliers, supplierSearch]);

    const handleSupplierSelect = (uuid: string) => {
        const selected = suppliers.find(s => s.uuid === uuid);
        if (selected) {
            setFormState(prev => ({ ...prev, supplierUuid: selected.uuid, supplierName: selected.name }));
        }
        setSupplierPopoverOpen(false);
    };

    const handleSupplierCreate = () => {
        setFormState(prev => ({ ...prev, supplierUuid: undefined, supplierName: supplierSearch }));
        setSupplierPopoverOpen(false);
    };

    const handleClearSupplier = () => {
        setFormState(prev => ({ ...prev, supplierUuid: undefined, supplierName: ''}));
        setSupplierPopoverOpen(false);
    }

    const proceedWithSubmit = async () => {
        setError(null);
        setIsLoading(true);

        const productData: Omit<Product, 'uuid' | 'id'> & { supplierName?: string } = {
            name: formState.name!,
            category: formState.category || 'Non classé',
            price: Number(formState.price) || 0,
            purchasePrice: Number(formState.purchasePrice) || 0,
            quantity: Number(formState.quantity) || 0,
            minStockLevel: Number(formState.minStockLevel) || 0,
            barcodes: formState.barcodes || [],
            unite: formState.unite || 'Pièce',
            imageUrl: formState.imageUrl || undefined,
            dateExpiration: formState.dateExpiration || undefined,
            supplierUuid: formState.supplierUuid || undefined,
            supplierName: formState.supplierName || undefined,
        };

        try {
            if (product) {
                await productService.updateProduct(product.uuid, productData);
                toast.success(`Produit ${productData.name} mis à jour.`);
            } else {
                await productService.addProduct(productData as Product);
                toast.success(`Produit ${productData.name} ajouté.`);
            }
            onSuccess();
            onOpenChange(false);
        } catch (err: any) {
            setError(err.message || "Une erreur est survenue.");
            toast.error("Échec de l'opération.");
        } finally {
            setIsLoading(false);
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (priceWarning) {
            setShowPriceConfirm(true);
        } else {
            await proceedWithSubmit();
        }
    };

    const handleImageSelect = (url: string) => {
        setFormState(prev => ({ ...prev, imageUrl: url }));
    };
    
    return (
        <>
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-3xl rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
                <form onSubmit={handleSubmit}>
                    <DialogHeader className="bg-primary/5 p-6 border-b border-primary/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                <Package className="h-5 w-5" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight">{product ? 'Modifier le produit' : 'Nouveau Produit'}</DialogTitle>
                                <DialogDescription className="font-medium">Remplissez les informations techniques du produit.</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="grid md:grid-cols-[280px_1fr] gap-0">
                        {/* Sidebar: Image & Meta */}
                        <div className="bg-muted/30 p-6 space-y-6 border-r border-border/50">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Photo du produit</Label>
                                <div className="relative aspect-square w-full rounded-2xl bg-background border-2 border-dashed border-border/50 overflow-hidden flex items-center justify-center group">
                                    {formState.imageUrl ? (
                                        <Image src={formState.imageUrl} alt="" fill className="object-cover" />
                                    ) : (
                                        <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                                        <p className="text-[10px] text-white font-black uppercase text-center">Changer la photo</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-4 gap-2 pt-2">
                                    {placeholders.products.map(ph => (
                                        <button 
                                            key={ph.id} 
                                            type="button" 
                                            onClick={() => handleImageSelect(ph.url)}
                                            className={cn(
                                                "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                                                formState.imageUrl === ph.url ? "border-primary scale-110 shadow-lg" : "border-transparent opacity-60 hover:opacity-100"
                                            )}
                                        >
                                            <Image src={ph.url} alt={ph.label} fill className="object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unite" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Unité de mesure</Label>
                                <Select value={formState.unite} onValueChange={(value) => setFormState(s => ({ ...s, unite: value as Product['unite'] }))}>
                                    <SelectTrigger id="unite" className="rounded-xl border-none shadow-sm bg-background"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {units.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Expiration</Label>
                                <DatePicker date={formState.dateExpiration} setDate={(date) => setFormState(s => ({...s, dateExpiration: date }))}/>
                            </div>
                        </div>

                        {/* Main Content: Info & Pricing */}
                        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Désignation *</Label>
                                    <Input id="name" value={formState.name} onChange={handleInputChange} className="h-11 rounded-xl bg-muted/30 border-none shadow-inner text-base font-bold" placeholder="Nom du produit..." required />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="category" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Catégorie</Label>
                                        <Select value={formState.category} onValueChange={(value) => setFormState(s => ({ ...s, category: value }))}>
                                            <SelectTrigger id="category" className="rounded-xl border-none shadow-sm bg-muted/30"><SelectValue placeholder="Sélectionner..." /></SelectTrigger>
                                            <SelectContent>
                                                {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                                                <SelectItem value="Autre">Autre...</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fournisseur</Label>
                                        <Popover open={supplierPopoverOpen} onOpenChange={setSupplierPopoverOpen}>
                                            <PopoverTrigger asChild>
                                                <Button variant="outline" role="combobox" className="w-full justify-between rounded-xl h-10 border-none shadow-sm bg-muted/30">
                                                    <span className="truncate">{formState.supplierName || "Choisir..."}</span>
                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                </Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0">
                                                <Command>
                                                    <CommandInput placeholder="Rechercher..." onValueChange={setSupplierSearch} />
                                                    <CommandList>
                                                        <CommandEmpty>
                                                            <Button variant="link" className="w-full text-xs" onClick={handleSupplierCreate}><Plus className="mr-1 h-3 w-3" /> Créer "{supplierSearch}"</Button>
                                                        </CommandEmpty>
                                                        <CommandGroup>
                                                            <CommandItem onSelect={handleClearSupplier} className="text-muted-foreground italic">Aucun</CommandItem>
                                                            {supplierOptions?.map((supplier) => (
                                                                <CommandItem key={supplier.uuid} onSelect={() => handleSupplierSelect(supplier.uuid)}>{supplier.name}</CommandItem>
                                                            ))}
                                                        </CommandGroup>
                                                    </CommandList>
                                                </Command>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6 p-4 bg-muted/30 rounded-2xl border border-border/50">
                                <div className="space-y-2">
                                    <Label htmlFor="purchasePrice" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prix d'Achat (DA)</Label>
                                    <Input id="purchasePrice" type="number" step="0.1" value={formState.purchasePrice} onChange={handleInputChange} className="h-11 rounded-xl bg-background border-none shadow-inner font-mono font-bold" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="price" className="text-[10px] font-black uppercase tracking-widest text-primary tracking-tighter ml-1">Prix de Vente (DA)</Label>
                                    <Input id="price" type="number" step="0.1" value={formState.price} onChange={handleInputChange} className="h-11 rounded-xl bg-background border-none shadow-inner font-mono font-black text-primary text-lg" required />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="quantity" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Stock Actuel</Label>
                                    <Input id="quantity" type="number" value={formState.quantity} onChange={handleInputChange} className="h-11 rounded-xl bg-muted/30 border-none shadow-inner font-bold" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="minStockLevel" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Alerte Stock Bas</Label>
                                    <Input id="minStockLevel" type="number" value={formState.minStockLevel} onChange={handleInputChange} className="h-11 rounded-xl bg-muted/30 border-none shadow-inner font-bold text-yellow-600" required />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="barcodes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Gestion des Codes-barres</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        id="barcode-input" 
                                        value={currentBarcode}
                                        onChange={(e) => setCurrentBarcode(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddBarcode(); } }}
                                        className="h-10 rounded-xl bg-muted/30 border-none"
                                        placeholder="Scanner ou saisir..."
                                    />
                                    <Button type="button" variant="outline" onClick={handleAddBarcode} className="rounded-xl h-10 border-none bg-muted/50"><Plus className="h-4 w-4" /></Button>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {formState.barcodes?.map(barcode => (
                                        <Badge key={barcode} variant="secondary" className="pl-3 pr-1 py-1 rounded-lg bg-background border-none shadow-sm font-mono text-[10px] font-black tracking-tight">
                                            {barcode}
                                            <button type="button" onClick={() => handleRemoveBarcode(barcode)} className="ml-2 rounded-md p-0.5 hover:bg-destructive/10 text-destructive transition-colors">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-card border-t flex gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-12 font-bold flex-1" disabled={isLoading}>Annuler</Button>
                        <Button type="submit" disabled={isLoading} className="rounded-xl h-12 font-bold flex-1 shadow-lg shadow-primary/20">
                             {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {product ? 'Mettre à jour' : 'Créer le produit'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>

        <AlertDialog open={showPriceConfirm} onOpenChange={setShowPriceConfirm}>
            <AlertDialogContent className="rounded-3xl border-none shadow-2xl">
                <AlertDialogHeader>
                    <div className="flex items-center gap-3 mb-2 text-destructive">
                        <AlertTriangle className="h-6 w-6" />
                        <AlertDialogTitle className="text-xl font-black">Vente à perte détectée</AlertDialogTitle>
                    </div>
                    <AlertDialogDescription className="font-medium">
                        Le prix de vente (<b>{formState.price} DA</b>) est inférieur au prix d'achat (<b>{formState.purchasePrice} DA</b>). Voulez-vous vraiment continuer ?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="gap-2">
                    <AlertDialogCancel className="rounded-xl font-bold">Réviser le prix</AlertDialogCancel>
                    <AlertDialogAction onClick={proceedWithSubmit} className="bg-destructive hover:bg-destructive/90 rounded-xl font-bold">Confirmer quand même</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        </>
    );
}
