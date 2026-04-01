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
import { Loader2 } from 'lucide-react';
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
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Finaliser la Vente</DialogTitle>
                        <DialogDescription>Entrez le montant payé par le client.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="text-center">
                            <Label>Total à Payer</Label>
                            <p className="text-5xl font-bold text-primary">{formatCurrency(total)}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="amount-paid">Montant Payé</Label>
                                <Input
                                    id="amount-paid"
                                    type="number"
                                    className="text-2xl h-14 text-center"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(Number(e.target.value))}
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <div className="space-y-2">
                                 <Label>Monnaie à Rendre</Label>
                                 <p className="text-2xl h-14 flex items-center justify-center font-bold bg-muted rounded-md">
                                    {change >= 0 ? formatCurrency(change) : '-'}
                                 </p>
                            </div>
                        </div>

                        {isCreditSale && (
                            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-center space-y-2">
                                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                    Cette vente sera à crédit de {formatCurrency(total - amountPaid)}.
                                </p>
                                <div className="space-y-2 text-left">
                                    <Label>Date d'échéance du paiement</Label>
                                    <DatePicker date={dueDate} setDate={setDueDate} />
                                </div>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>Annuler</Button>
                        <Button onClick={handleProcessSale} disabled={isLoading || amountPaid < 0}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirmer la Vente
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
