
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
import { ArrowLeft, Search, Save, Loader2, Info, Hash, User, ShoppingBag, Undo2, CheckCircle2, AlertTriangle } from 'lucide-react';
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
                    quantity: 0, // start with 0 to return
                    originalQuantity: item.quantity,
                    returnQuantity: 0,
                    wasRestocked: true,
                }));
                setReturnItems(items);
                setAmountRefunded(0);
            } else {
                toast.error(`Facture n° ${invoiceNumber} non trouvée.`);
                setFoundSale(null);
                setReturnItems([]);
            }
        } catch (error: any) {
            toast.error("Erreur lors de la recherche de la facture.", { description: error.message });
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
        <div className="p-4 sm:p-6 space-y-6 max-w-5xl mx-auto">
            <PageHeader
                title="Nouveau Retour"
                description="Réintégrez des produits au stock et gérez le remboursement client."
            >
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" className="rounded-xl border-none shadow-sm bg-card h-10 w-10" asChild>
                        <Link href="/returns"><ArrowLeft className="h-4 w-4" /></Link>
                     </Button>
                    {foundSale && (
                        <Button 
                            onClick={handleSaveReturn} 
                            disabled={isSaving || !hasItemsToReturn}
                            className="rounded-xl font-bold shadow-lg shadow-primary/20 px-6 h-10"
                        >
                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                            {isSaving ? 'Traitement...' : 'Valider le Retour'}
                        </Button>
                    )}
                </div>
            </PageHeader>

            {/* Step 1: Search */}
            <Card className={cn(
                "rounded-3xl border-none shadow-sm bg-card overflow-hidden transition-all duration-500",
                foundSale ? "opacity-50 grayscale scale-[0.98] origin-top" : ""
            )}>
                <CardHeader className="bg-primary/5 pb-4">
                    <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                        <Hash className="h-4 w-4" /> 1. Rechercher la Vente
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="flex gap-3">
                        <div className="relative flex-grow">
                            <ShoppingBag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
                            <Input
                                placeholder="Entrez le numéro de la facture (ex: 240101-123)..."
                                className="pl-10 h-14 text-lg font-bold rounded-2xl bg-muted/30 border-none shadow-inner"
                                value={invoiceNumber}
                                onChange={(e) => setInvoiceNumber(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearchSale()}
                                disabled={!!foundSale}
                            />
                        </div>
                        <Button 
                            onClick={handleSearchSale} 
                            disabled={isSearching || !!foundSale || !invoiceNumber}
                            size="lg"
                            className="rounded-2xl h-14 px-8 font-black shadow-lg shadow-primary/20"
                        >
                            {isSearching ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Search className="mr-2 h-5 w-5" />}
                            Trouver
                        </Button>
                        {foundSale && (
                            <Button variant="ghost" className="h-14 rounded-2xl font-bold" onClick={() => { setFoundSale(null); setInvoiceNumber(''); setReturnItems([])}}>
                                Changer
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {foundSale && (
                 <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Step 2: Selection */}
                    <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                        <CardHeader className="bg-primary/5 pb-4 flex flex-row items-center justify-between">
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Undo2 className="h-4 w-4" /> 2. Articles à Retourner
                            </CardTitle>
                            <div className="px-3 py-1 bg-muted/50 rounded-xl text-[10px] font-black uppercase text-muted-foreground flex items-center gap-2">
                                <User className="h-3 w-3" /> {foundSale.customerUuid ? 'Client Associé' : 'Client de passage'}
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                             <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-muted/20 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                                            <th className="p-4 text-left">Désignation</th>
                                            <th className="p-4 text-center">Vendu</th>
                                            <th className="p-4 text-center w-40">À Retourner</th>
                                            <th className="p-4 text-right">P.U</th>
                                            <th className="p-4 text-center">Réintégrer Stock</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {returnItems.map((item, index) => (
                                            <tr key={(item.productUuid || `custom-${index}`) + index} className="border-b border-border/50 hover:bg-muted/10 transition-colors">
                                                <td className="p-4">
                                                    <div className="font-bold text-sm">{item.productName}</div>
                                                </td>
                                                <td className="p-4 text-center">
                                                    <span className="px-2 py-1 bg-muted/50 rounded-lg font-mono font-bold text-xs">{item.originalQuantity}</span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="relative">
                                                        <Input 
                                                            type="number" 
                                                            className="h-10 text-center font-black text-primary bg-primary/5 border-primary/20 rounded-xl focus-visible:ring-primary" 
                                                            value={item.returnQuantity} 
                                                            onChange={e => handleItemChange(index, 'returnQuantity', e.target.value)}
                                                            max={item.originalQuantity}
                                                            min={0}
                                                        />
                                                        {item.returnQuantity > 0 && <CheckCircle2 className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-in zoom-in" />}
                                                    </div>
                                                </td>
                                                <td className="p-4 text-right font-mono font-bold text-xs">{formatCurrency(item.price)}</td>
                                                <td className="p-4">
                                                    <div className="flex justify-center">
                                                        <Switch
                                                            checked={item.wasRestocked}
                                                            onCheckedChange={value => handleItemChange(index, 'wasRestocked', value)}
                                                            disabled={!item.productUuid}
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
                    
                    {/* Step 3: Finalization */}
                    <div className="grid md:grid-cols-2 gap-6 items-stretch">
                        <Card className="rounded-3xl border-none shadow-sm bg-card overflow-hidden">
                            <CardHeader className="bg-primary/5 pb-4">
                                <CardTitle className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Info className="h-4 w-4" /> 3. Règlement & Notes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="amountRefunded" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Montant Remboursé en Espèces (DA)</Label>
                                    <div className="relative">
                                        <Input
                                            id="amountRefunded"
                                            type="number"
                                            value={amountRefunded}
                                            onChange={e => setAmountRefunded(Number(e.target.value))}
                                            max={totalReturnValue}
                                            className="h-14 text-2xl font-black text-center rounded-2xl bg-muted/30 border-none shadow-inner"
                                        />
                                        <div className="absolute right-5 top-1/2 -translate-y-1/2 font-black opacity-30">DA</div>
                                    </div>
                                    <p className="text-[10px] text-muted-foreground px-1 italic">Laissez 0 si le montant doit être crédité sur le compte du client.</p>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="notes" className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Notes Internes</Label>
                                    <Textarea
                                        id="notes"
                                        placeholder="Motif du retour, état de la marchandise..."
                                        className="rounded-2xl border-none shadow-inner bg-muted/30 min-h-[100px]"
                                        value={notes}
                                        onChange={e => setNotes(e.target.value)}
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex flex-col gap-6">
                            <div className="bg-card rounded-3xl p-8 border-none shadow-sm space-y-6 flex-grow flex flex-col justify-center relative overflow-hidden">
                                <Undo2 className="absolute -right-6 -bottom-6 h-32 w-32 text-primary/5 rotate-12" />
                                
                                <div className="space-y-4 relative z-10">
                                    <div className="flex justify-between items-center text-muted-foreground">
                                        <span className="text-xs font-black uppercase tracking-widest">Valeur Marchandise</span>
                                        <span className="font-bold">{formatCurrency(totalReturnValue)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-emerald-500">
                                        <span className="text-xs font-black uppercase tracking-widest">Sortie de Caisse</span>
                                        <span className="font-bold">- {formatCurrency(amountRefunded)}</span>
                                    </div>
                                    
                                    <div className="h-px bg-border/50 my-2" />
                                    
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Impact sur le solde client</p>
                                        <div className="flex items-center justify-between">
                                            <p className={cn(
                                                "text-4xl font-black tracking-tighter",
                                                creditImpact >= 0 ? "text-primary" : "text-destructive"
                                            )}>
                                                {creditImpact >= 0 ? `- ${formatCurrency(creditImpact)}` : `+ ${formatCurrency(Math.abs(creditImpact))}`}
                                            </p>
                                            {creditImpact > 0 && <CheckCircle2 className="h-8 w-8 text-primary opacity-50" />}
                                        </div>
                                    </div>
                                </div>

                                {foundSale.customerUuid && (
                                     <div className="flex items-start gap-3 text-[11px] font-medium text-muted-foreground p-4 bg-muted/30 rounded-2xl border border-dashed border-border/50 relative z-10">
                                        <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
                                        <span>{creditImpact >= 0 ? "Le montant non remboursé réduira automatiquement la dette du client." : "L'excédent remboursé augmentera la dette du client."}</span>
                                    </div>
                                )}
                            </div>

                            <Button 
                                size="lg" 
                                className="h-16 rounded-2xl font-black text-xl shadow-xl shadow-primary/20 transition-all active:scale-95"
                                disabled={isSaving || !hasItemsToReturn}
                                onClick={handleSaveReturn}
                            >
                                {isSaving ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <CheckCircle2 className="mr-2 h-6 w-6" />}
                                Finaliser le Retour
                            </Button>
                        </div>
                    </div>
                 </div>
            )}
        </div>
    );
}
