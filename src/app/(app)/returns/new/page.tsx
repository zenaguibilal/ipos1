'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { salesService } from '@/services/sales.service';
import type { Sale, ReturnItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
    ArrowLeft, 
    Search, 
    Save, 
    Loader2, 
    Info, 
    Hash, 
    User, 
    CheckCircle2, 
    AlertTriangle,
    Landmark,
    Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { PageHeader } from '@/components/layout/PageHeader';
import { useAppActions } from '@/stores/appStore';

type ReturnItemState = ReturnItem & { originalQuantity: number, returnQuantity: number };

export default function NewReturnPage() {
    const router = useRouter();
    const { processReturn } = useAppActions();
    const [invoiceNumber, setInvoiceNumber] = useState('');
    const [foundSale, setFoundSale] = useState<Sale | null>(null);
    const [isSearching, setIsSearching] = useState(false);

    const [returnItems, setReturnItems] = useState<ReturnItemState[]>([]);
    const [amountRefunded, setAmountRefunded] = useState(0);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const handleSearchSale = async () => {
        if (!invoiceNumber) return;
        setIsSearching(true);
        try {
            const sale = await salesService.getSaleByInvoiceNumber(invoiceNumber);
            if (sale) {
                setFoundSale(sale);
                const items: ReturnItemState[] = sale.items.map(item => ({
                    productUuid: item.productUuid,
                    productName: item.name,
                    price: item.price,
                    purchasePrice: item.purchasePrice,
                    quantity: 0,
                    originalQuantity: item.quantity,
                    returnQuantity: 0,
                    wasRestocked: true,
                }));
                setReturnItems(items);
                setAmountRefunded(0);
                toast.success("Facture localisée avec succès.");
            } else {
                toast.error(`Facture n° ${invoiceNumber} introuvable dans le Grand Livre.`);
                setFoundSale(null);
                setReturnItems([]);
            }
        } catch (error: any) {
            toast.error("Erreur lors de la recherche de la facture.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleItemChange = (index: number, field: 'returnQuantity' | 'wasRestocked', value: any) => {
        setReturnItems(items => {
            const newItems = [...items];
            const item = newItems[index];
            if (!item) return items;

            if (field === 'returnQuantity') {
                const newQty = Math.max(0, Math.min(item.originalQuantity, Number(value)));
                newItems[index] = { ...item, returnQuantity: newQty, quantity: newQty };
            } else {
                newItems[index] = { ...item, wasRestocked: value };
            }
            return newItems;
        });
    };
    
    const totalReturnValue = returnItems.reduce((acc, item) => acc + (item.price * item.returnQuantity), 0);
    const hasItemsToReturn = returnItems.some(item => item.returnQuantity > 0);
    const creditImpact = totalReturnValue - amountRefunded;

    const handleSaveReturn = async () => {
        if (!foundSale || !hasItemsToReturn) {
            toast.error("Veuillez sélectionner au moins un article à retourner.");
            return;
        }

        setIsSaving(true);
        const success = await processReturn({
            originalSaleUuid: foundSale.uuid,
            items: returnItems.filter(item => item.returnQuantity > 0),
            totalReturnValue,
            amountRefunded,
            customerUuid: foundSale.customerUuid,
            notes,
        });

        if (success) {
            router.push('/returns');
        }
        setIsSaving(false);
    };

    return (
        <div className="p-6 sm:p-10 space-y-10 max-w-[1200px] mx-auto animate-in fade-in duration-1000">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-white/5 bg-card/40 backdrop-blur-md" asChild>
                    <Link href="/returns"><ArrowLeft className="h-6 w-6" /></Link>
                 </Button>
                 <PageHeader
                    title="Traitement des Retours"
                    description="Centre de régularisation des stocks et avoirs clients"
                    className="mb-0"
                 />
                 {foundSale && (
                    <Button 
                        onClick={handleSaveReturn} 
                        disabled={isSaving || !hasItemsToReturn}
                        className="ml-auto h-14 px-10 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                    >
                        {isSaving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                        {isSaving ? 'Traitement...' : 'Valider le Retour'}
                    </Button>
                 )}
            </div>

            {/* Step 1: Elite Invoice Search */}
            <Card className={cn(
                "rounded-[2.5rem] border-none shadow-2xl bg-card/40 backdrop-blur-3xl overflow-hidden transition-all duration-700",
                foundSale ? "opacity-40 grayscale scale-[0.98] origin-top pointer-events-none" : ""
            )}>
                <CardHeader className="bg-primary/5 p-8 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                            <Search className="h-6 w-6" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tighter">1. Localiser la Vente Originale</CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Saisissez l'identifiant de la facture pour commencer</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="flex gap-4">
                        <div className="relative flex-grow group">
                            <Hash className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground/30 group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Numéro de facture (ex: 240101-123)..."
                                className="pl-14 h-16 text-xl font-black rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                                disabled={!!foundSale}
                            />
                        </div>
                        <Button 
                            onClick={handleSearchSale} 
                            disabled={isSearching || !!foundSale || !invoiceNumber}
                            className="h-16 px-10 rounded-2xl font-black text-base shadow-xl shadow-primary/20"
                        >
                            {isSearching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Sparkles className="mr-2 h-5 w-5" />}
                            Trouver
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {foundSale && (
                 <div className="grid lg:grid-cols-12 gap-8 items-start animate-in slide-in-from-bottom-10 duration-1000">
                    
                    {/* Step 2: Items Selection Table */}
                    <div className="lg:col-span-8 space-y-8">
                        <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden shadow-2xl">
                            <CardHeader className="bg-muted/20 p-8 border-b border-white/5 flex flex-row items-center justify-between">
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tighter">2. Manifeste des Articles</CardTitle>
                                    <CardDescription className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Sélectionnez les quantités à réintégrer</CardDescription>
                                </div>
                                <div className="px-4 py-2 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-3">
                                    <User className="h-4 w-4 text-primary" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-primary">{foundSale.customerUuid ? 'Client Premium' : 'Client de passage'}</span>
                                </div>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="bg-muted/30 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 border-b border-white/5">
                                                <th className="p-6 text-left">Désignation</th>
                                                <th className="p-6 text-center">Vendu</th>
                                                <th className="p-6 text-center w-40">À Retourner</th>
                                                <th className="p-6 text-right">P.U Vente</th>
                                                <th className="p-6 text-center">Stock ?</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {returnItems.map((item, index) => (
                                                <tr key={(item.productUuid || `custom-${index}`) + index} className="hover:bg-primary/5 transition-colors group">
                                                    <td className="p-6">
                                                        <div className="flex flex-col">
                                                            <span className="font-black text-sm tracking-tight group-hover:text-primary transition-colors">{item.productName}</span>
                                                            <span className="text-[9px] text-muted-foreground/40 uppercase font-black tracking-widest">Article d'origine</span>
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-center">
                                                        <div className="inline-flex items-center justify-center px-3 py-1 rounded-xl bg-black/20 border border-white/5 font-mono font-black text-xs">
                                                            {item.originalQuantity}
                                                        </div>
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="relative">
                                                            <Input 
                                                                type="number" 
                                                                className="h-12 text-center font-black text-xl text-primary bg-primary/5 border-none shadow-inner rounded-xl focus-visible:ring-primary" 
                                                                value={item.returnQuantity} 
                                                                onChange={e => handleItemChange(index, 'returnQuantity', e.target.value)}
                                                                max={item.originalQuantity}
                                                                min={0}
                                                            />
                                                            {item.returnQuantity > 0 && <CheckCircle2 className="absolute -right-2 -top-2 h-5 w-5 text-emerald-500 fill-card animate-in zoom-in" />}
                                                        </div>
                                                    </td>
                                                    <td className="p-6 text-right font-black text-sm tracking-tighter">
                                                        {formatCurrency(item.price)}
                                                    </td>
                                                    <td className="p-6">
                                                        <div className="flex justify-center">
                                                            <Switch
                                                                checked={item.wasRestocked}
                                                                onCheckedChange={value => handleItemChange(index, 'wasRestocked', value)}
                                                                disabled={!item.productUuid}
                                                                className="data-[state=checked]:bg-emerald-500"
                                                            />
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Step 3: Finalization & Impact Sidebar */}
                    <div className="lg:col-span-4 space-y-8 sticky top-24">
                        <Card className="rounded-[2.5rem] bg-card/40 backdrop-blur-3xl border-white/5 overflow-hidden shadow-2xl">
                            <CardHeader className="bg-primary/5 p-8 border-b border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                        <Info className="h-6 w-6" />
                                    </div>
                                    <CardTitle className="text-xl font-black tracking-tighter">3. Finalisation</CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                <div className="space-y-4">
                                    <Label htmlFor="amountRefunded" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Remboursement Espèces (DA)</Label>
                                    <div className="relative group">
                                        <Input
                                            id="amountRefunded"
                                            type="number"
                                            value={amountRefunded || ''}
                                            onChange={e => setAmountRefunded(Number(e.target.value))}
                                            max={totalReturnValue}
                                            placeholder="0.0"
                                            className="h-16 text-3xl font-black text-center rounded-2xl bg-black/20 border-none shadow-inner focus-visible:ring-primary/20"
                                        />
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-xs opacity-20 uppercase tracking-widest">DA</div>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground/50 italic leading-relaxed text-center px-4">
                                        Laissez à 0 pour transformer la valeur totale en crédit sur le compte client.
                                    </p>
                                </div>

                                <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 space-y-6 relative overflow-hidden">
                                    <div className="absolute -right-6 -bottom-6 opacity-[0.03] rotate-12">
                                        <Landmark className="h-32 w-32" />
                                    </div>
                                    <div className="space-y-1 relative z-10">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-40">Impact sur le Solde</p>
                                        <div className="flex items-center justify-between">
                                            <p className={cn(
                                                "text-4xl font-black tracking-tighter",
                                                creditImpact >= 0 ? "text-primary" : "text-destructive"
                                            )}>
                                                {creditImpact >= 0 ? `- ${formatCurrency(creditImpact)}` : `+ ${formatCurrency(Math.abs(creditImpact))}`}
                                            </p>
                                        </div>
                                    </div>
                                    {foundSale.customerUuid && (
                                        <div className="flex items-start gap-3 p-4 bg-muted/20 rounded-2xl border border-dashed border-white/10 relative z-10">
                                            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                            <p className="text-[10px] font-medium leading-relaxed text-muted-foreground/70">
                                                {creditImpact >= 0 
                                                    ? "Le montant non remboursé réduira automatiquement la dette actuelle du client." 
                                                    : "L'excédent remboursé augmentera la dette enregistrée du client."}
                                            </p>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Motif du Retour</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Ex: Défaut de fabrication, erreur client..."
                                        className="rounded-2xl border-none shadow-inner bg-black/20 min-h-[100px] text-sm font-medium"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>

                                <Button 
                                    className="w-full h-16 rounded-[1.5rem] font-black text-lg shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                                    disabled={isSaving || !hasItemsToReturn}
                                    onClick={handleSaveReturn}
                                >
                                    {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <CheckCircle2 className="h-6 w-6" />}
                                    Confirmer l'Action Elite
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                 </div>
            )}
        </div>
    );
}
