'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Save, ShoppingBag, Truck, FileText, Building, Hash, Calendar, Loader2, PackagePlus, ScanLine } from 'lucide-react';
import { ProductIntakeCombobox } from './ProductIntakeCombobox';
import { OcrInvoiceScanner, type OcrLineItem } from './OcrInvoiceScanner';
import type { Product, StockIntakeItem } from '@/lib/types';
import { formatCurrency, cn } from '@/lib/utils';
import { useAppActions } from '@/stores/appStore';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { DatePicker } from '../ui/date-picker';

export function NewIntakeForm() {
    const router = useRouter();
    const { processStockIntake } = useAppActions();

    const [supplierName, setSupplierName] = useState('');
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date());
    const [shippingCost, setShippingCost] = useState<number>(0);
    const [items, setItems] = useState<StockIntakeItem[]>([]);
    const [isSubmitting, setIsSaving] = useState(false);

    const itemsTotal = useMemo(() => {
        return items.reduce((sum, item) => sum + (item.quantity * item.purchasePrice), 0);
    }, [items]);

    const totalValue = itemsTotal + shippingCost;

    const handleAddProduct = (product: Product) => {
        const existing = items.find(i => i.productUuid === product.uuid);
        if (existing) {
            toast.info(`"${product.name}" est déjà dans la liste.`);
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
            unite: product.unite,
            isNew: false
        };
        setItems(prev => [newItem, ...prev]);
    };

    const handleCreateNewProduct = (name: string) => {
        const newItem: StockIntakeItem = {
            id: uuidv4(),
            name: name,
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
            price: ocr.purchasePrice * 1.3, // Suggerer 30% marge par défaut
            unite: 'Pièce',
            isNew: true, // Par défaut on traite comme nouveau ou à mapper plus tard
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
            toast.error("Veuillez renseigner le nom du fournisseur.");
            return;
        }
        if (items.length === 0) {
            toast.error("Veuillez ajouter au moins un produit.");
            return;
        }
        if (items.some(i => i.quantity <= 0 || i.purchasePrice < 0)) {
            toast.error("Vérifiez les quantités et prix d'achat.");
            return;
        }

        setIsSaving(true);
        try {
            const success = await processStockIntake({
                supplierName,
                invoiceNumber,
                invoiceDate: invoiceDate || new Date(),
                shippingCost,
                items,
                totalValue
            });

            if (success) {
                router.push('/stock');
            }
        } catch (error: any) {
            toast.error("Erreur critique lors de l'enregistrement.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="bg-muted/20 border-b border-white/5 p-4 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-sm">
                                <ShoppingBag className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-lg font-semibold tracking-tight">Articles Réceptionnés</CardTitle>
                        </div>
                        <div className="max-w-xs flex-grow">
                            <ProductIntakeCombobox 
                                onProductSelected={handleAddProduct}
                                onNewProductCreated={handleCreateNewProduct}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-black/20">
                                    <TableRow className="border-white/5">
                                        <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 p-4">Produit</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-center">Qté</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-center">Rebut</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-right">P.U Achat</TableHead>
                                        <TableHead className="font-bold text-[10px] uppercase text-muted-foreground/60 text-right">P.U Vente</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {items.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="h-60 text-center text-muted-foreground/30 font-semibold uppercase text-[10px] italic">
                                                Aucun article dans le manifeste
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        items.map((item) => (
                                            <TableRow key={item.id} className="border-white/5 group hover:bg-white/5 transition-all">
                                                <TableCell className="p-4">
                                                    <div className="flex flex-col">
                                                        <span className="font-bold text-sm">{item.name}</span>
                                                        {item.isNew && (
                                                            <span className="text-[8px] font-bold text-primary uppercase bg-primary/10 px-1.5 py-0.5 rounded-md w-fit mt-1">Nouveau Produit</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <Input 
                                                        type="number" 
                                                        value={item.quantity} 
                                                        onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                                                        className="w-20 h-8 text-center bg-black/20 border-none shadow-inner mx-auto font-bold"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <Input 
                                                        type="number" 
                                                        value={item.quantityDamaged} 
                                                        onChange={e => updateItem(item.id, 'quantityDamaged', parseFloat(e.target.value) || 0)}
                                                        className="w-20 h-8 text-center bg-black/20 border-none shadow-inner mx-auto font-bold text-destructive"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Input 
                                                            type="number" 
                                                            value={item.purchasePrice} 
                                                            onChange={e => updateItem(item.id, 'purchasePrice', parseFloat(e.target.value) || 0)}
                                                            className="w-24 h-8 text-right bg-black/20 border-none shadow-inner font-mono font-bold"
                                                        />
                                                    </div>
                                                </TableCell>
                                                <TableCell className="p-4 text-right">
                                                    <Input 
                                                        type="number" 
                                                        value={item.price} 
                                                        onChange={e => updateItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                                                        className="w-24 h-8 text-right bg-black/20 border-none shadow-inner font-mono font-bold text-primary"
                                                    />
                                                </TableCell>
                                                <TableCell className="p-4">
                                                    <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="h-8 w-8 text-destructive/20 hover:text-destructive hover:bg-destructive/10">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="lg:col-span-4 space-y-6">
                <Card className="app-card rounded-lg border-white/5 bg-card/40 backdrop-blur-sm overflow-hidden sticky top-24">
                    <CardHeader className="bg-primary/5 border-b border-white/5 p-4">
                        <CardTitle className="text-sm font-semibold uppercase tracking-wide opacity-60 flex items-center gap-2">
                            <FileText className="h-4 w-4" /> Détails du Manifeste
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-semibold uppercase text-muted-foreground ml-1">Fournisseur / Partenaire *</Label>
                                <div className="relative">
                                    <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20" />
                                    <Input 
                                        placeholder="Ex: Grossiste Principal" 
                                        className="pl-10 h-11 rounded-xl bg-black/20 border-none shadow-inner font-bold"
                                        value={supplierName}
                                        onChange={e => setSupplierName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold uppercase text-muted-foreground ml-1">N° Facture</Label>
                                    <div className="relative">
                                        <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-20" />
                                        <Input 
                                            placeholder="XXXXXX" 
                                            className="pl-10 h-11 rounded-xl bg-black/20 border-none shadow-inner font-mono font-bold"
                                            value={invoiceNumber}
                                            onChange={e => setInvoiceNumber(e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-semibold uppercase text-muted-foreground ml-1">Date Facture</Label>
                                    <DatePicker date={invoiceDate} setDate={setInvoiceDate} />
                                </div>
                            </div>

                            <div className="p-4 bg-muted/20 rounded-2xl border border-white/5 space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] font-semibold uppercase text-primary/60 flex items-center gap-2">
                                        <Truck className="h-3.5 w-3.5" /> Frais de Transport
                                    </Label>
                                    <Input 
                                        type="number" 
                                        value={shippingCost || ''} 
                                        onChange={e => setShippingCost(parseFloat(e.target.value) || 0)}
                                        className="w-32 h-9 text-right rounded-lg bg-black/20 border-none shadow-inner font-mono font-bold"
                                        placeholder="0.00"
                                    />
                                </div>
                                <p className="text-[9px] text-muted-foreground italic leading-relaxed">
                                    * Ces frais seront répartis proportionnellement sur le coût de revient de chaque article.
                                </p>
                            </div>
                        </div>

                        <div className="pt-6 border-t border-white/5 space-y-3">
                            <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground/40">
                                <span>Total Marchandise</span>
                                <span className="font-mono text-foreground">{formatCurrency(itemsTotal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs font-semibold uppercase text-muted-foreground/40">
                                <span>Charge Logistique</span>
                                <span className="font-mono text-foreground">+{formatCurrency(shippingCost)}</span>
                            </div>
                            <div className="flex justify-between items-end pt-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-primary">Investissement Global</span>
                                <span className="text-2xl font-black text-primary tracking-tighter">{formatCurrency(totalValue)}</span>
                            </div>
                        </div>

                        <div className="pt-6 space-y-3">
                            <OcrInvoiceScanner onItemsExtracted={handleOcrExtracted} />
                            <Button 
                                onClick={handleSave} 
                                disabled={isSubmitting || items.length === 0}
                                className="w-full h-14 rounded-2xl font-bold text-lg shadow-xl shadow-primary/20 gap-3 group"
                            >
                                {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6 transition-transform group-hover:scale-110" />}
                                Valider la Réception
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-black/40 p-4 border-t border-white/5 justify-center">
                        <p className="text-[9px] font-bold uppercase text-muted-foreground/30 tracking-widest">Elite Inventory Protocol v1.9</p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
