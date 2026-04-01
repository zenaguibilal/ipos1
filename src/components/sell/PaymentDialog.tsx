'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { Loader2, CheckCircle2, Info } from 'lucide-react';
import { PrintReceiptDialog } from '../sales/PrintReceiptDialog';
import type { Sale } from '@/lib/types';
import { DatePicker } from '../ui/date-picker';
import { addDays } from 'date-fns';

export function PaymentDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const cart = useActiveCart();
    const { processSale } = useCartActions();
    
    const [amountPaid, setAmountPaid] = useState(0);
    const [dueDate, setDueDate] = useState<Date | undefined>(addDays(new Date(), 30));
    const [isLoading, setIsLoading] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);

    const { total } = cart ? calculateCartTotals(cart) : { total: 0 };
    const change = amountPaid - total;

    useEffect(() => {
        if (isOpen) {
            setAmountPaid(total); // Default to paying the full amount
            setIsLoading(false);
            setLastSale(null);
            if (cart?.customerUuid) {
                 setDueDate(addDays(new Date(), 30));
            } else {
                 setDueDate(undefined);
            }
        }
    }, [isOpen, total, cart?.customerUuid]);
    
    const handleProcessSale = async () => {
        setIsLoading(true);
        const sale = await processSale(amountPaid, dueDate);
        if (sale) {
            setLastSale(sale);
            onOpenChange(false);
            setIsReceiptOpen(true);
        }
        setIsLoading(false);
    };

    if (!cart) return null;

    const isCreditSale = cart.customerUuid && amountPaid < total;
    
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Finaliser la Vente</DialogTitle>
                        <DialogDescription>Entrez le montant reçu pour valider la transaction.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="text-center p-6 bg-primary/10 rounded-2xl border border-primary/20">
                            <Label className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mb-2 block">Total à Payer</Label>
                            <p className="text-5xl font-black text-primary tracking-tighter">{formatCurrency(total)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="amount-paid" className="text-xs font-bold ml-1">Montant Reçu</Label>
                                <Input
                                    id="amount-paid"
                                    type="number"
                                    className="text-2xl h-16 text-center font-bold focus-visible:ring-primary bg-background shadow-sm"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => { if(e.key === 'Enter') handleProcessSale() }}
                                />
                            </div>
                            <div className="space-y-2">
                                 <Label className="text-xs font-bold ml-1">Monnaie à Rendre</Label>
                                 <p className="text-2xl h-16 flex items-center justify-center font-bold bg-muted/50 rounded-md border border-dashed">
                                    {change >= 0 ? formatCurrency(change) : '-'}
                                 </p>
                            </div>
                        </div>

                        {isCreditSale && (
                            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-3">
                                <p className="text-sm font-bold text-amber-500 flex items-center gap-2">
                                    <Info className="h-4 w-4" />
                                    Vente à crédit : {formatCurrency(total - amountPaid)}
                                </p>
                                <div className="space-y-2">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Date d'échéance</Label>
                                    <DatePicker date={dueDate} setDate={setDueDate} />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1">
                            Annuler
                        </Button>
                        <Button onClick={handleProcessSale} disabled={isLoading || amountPaid < 0} className="flex-1 font-bold h-12 shadow-lg shadow-primary/20">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                            Valider [Enter]
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            
            <PrintReceiptDialog 
                isOpen={isReceiptOpen}
                onOpenChange={setIsReceiptOpen}
                sale={lastSale}
            />
        </>
    );
}
