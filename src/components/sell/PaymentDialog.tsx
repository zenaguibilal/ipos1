'use client';

import { useState, useEffect, useMemo } from 'react';
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
import { Switch } from '@/components/ui/switch';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';
import { Loader2, CheckCircle2, Info, Wallet, Banknote, Calendar, AlertCircle, ShieldAlert } from 'lucide-react';
import { PrintReceiptDialog } from '../sales/PrintReceiptDialog';
import type { Sale, Customer } from '@/lib/types';
import { DatePicker } from '../ui/date-picker';
import { addDays } from 'date-fns';
import { customerService } from '@/services/customer.service';

/**
 * PaymentDialog - Finalization module for transactions.
 * Implements strict financial validation and credit limit monitoring.
 */
export function PaymentDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { processSale } = useCartActions();
    
    const [amountPaid, setAmountPaid] = useState<number>(0);
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [approveOverLimit, setApproveOverLimit] = useState(false);

    const { total } = useMemo(() => cart ? calculateCartTotals(cart) : { total: 0 }, [cart]);
    
    // JS Precision Fix: Using toFixed(2) then back to Number for financial comparison
    const roundedTotal = Number(total.toFixed(2));
    const roundedPaid = Number(amountPaid.toFixed(2));
    const change = Number((roundedPaid - roundedTotal).toFixed(2));

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && isMounted && cart) {
            const totals = calculateCartTotals(cart);
            setAmountPaid(totals.total);
            setIsLoading(false);
            setLastSale(null);
            setApproveOverLimit(false);
            
            if (cart.customerUuid) {
                 setDueDate(addDays(new Date(), 30));
                 customerService.getCustomerByUuid(cart.customerUuid).then(c => setCustomer(c || null));
            } else {
                 setDueDate(undefined);
                 setCustomer(null);
            }
        }
    }, [isOpen, cart, isMounted]);
    
    const handleProcessSale = async () => {
        if (amountPaid < 0 || isLoading) return;
        setIsLoading(true);
        try {
            const sale = await processSale(amountPaid, dueDate);
            if (sale) {
                setLastSale(sale);
                onOpenChange(false);
                setIsReceiptOpen(true);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const projectedBalance = useMemo(() => {
        if (!customer) return 0;
        const creditAmount = Math.max(0, roundedTotal - roundedPaid);
        return (customer.outstandingBalance || 0) + creditAmount;
    }, [customer, roundedTotal, roundedPaid]);

    const isOverLimit = useMemo(() => {
        if (!customer || !customer.creditLimit) return false;
        return projectedBalance > (customer.creditLimit + 0.01); // 0.01 epsilon
    }, [customer, projectedBalance]);

    if (!cart || !isMounted) return null;

    const isCreditSale = cart.customerUuid && roundedPaid < roundedTotal;
    const canFinalize = !isLoading && amountPaid >= 0 && (
        roundedPaid >= roundedTotal || 
        (cart.customerUuid && (!isOverLimit || approveOverLimit))
    );
    
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] overflow-hidden border-none shadow-2xl p-0 gap-0 bg-card rounded-3xl">
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                        <DialogHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-black tracking-tight">Finalisation Transaction</DialogTitle>
                                    <DialogDescription className="font-medium">{cart.name}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6">
                        <div className="text-center p-6 bg-muted/30 rounded-3xl border border-border/50 relative overflow-hidden">
                            <Label className="text-muted-foreground uppercase text-[10px] font-black tracking-widest mb-2 block">Total du Manifeste</Label>
                            <p className="text-5xl font-black text-primary tracking-tighter">{formatCurrency(total)}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="amount-paid" className="text-xs font-bold text-muted-foreground ml-1">Montant Reçu (DA)</Label>
                                <Input
                                    id="amount-paid"
                                    type="number"
                                    className="text-2xl h-16 text-center font-black bg-background border-2 border-transparent focus-visible:border-primary/20 rounded-2xl shadow-sm"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => { if(e.key === 'Enter' && canFinalize) handleProcessSale() }}
                                />
                            </div>
                            <div className="space-y-2">
                                 <Label className="text-xs font-bold text-muted-foreground ml-1">Reliquat / Monnaie</Label>
                                 <div className={cn(
                                     "text-2xl h-16 flex items-center justify-center font-black rounded-2xl border-2 border-dashed transition-all",
                                     change >= 0 ? "bg-green-500/10 border-green-500/30 text-green-500" : "bg-muted/50 border-border/50 text-muted-foreground"
                                 )}>
                                    {change >= 0 ? formatCurrency(change) : '-'}
                                 </div>
                            </div>
                        </div>

                        {isCreditSale && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Info className="h-4 w-4 text-amber-500 mt-1" />
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-amber-500">Achat en Compte (Crédit)</p>
                                            <p className="text-[10px] text-amber-500/80 font-medium">Flux débiteur de {formatCurrency(roundedTotal - roundedPaid)} à enregistrer.</p>
                                        </div>
                                    </div>
                                    
                                    {isOverLimit && (
                                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
                                            <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase">
                                                <ShieldAlert className="h-4 w-4" /> Alerte Plafond Dépassé
                                            </div>
                                            <p className="text-[10px] font-medium leading-relaxed">
                                                Nouveau solde estimé : <span className="font-black">{formatCurrency(projectedBalance)}</span>
                                            </p>
                                            <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                                                <span className="text-[10px] font-black uppercase text-primary">Dérogation Manuelle</span>
                                                <Switch checked={approveOverLimit} onCheckedChange={setApproveOverLimit} className="data-[state=checked]:bg-primary" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-2 border-t border-amber-500/10">
                                        <Label className="text-[10px] uppercase font-bold text-amber-500/70 ml-1">Échéance prévue</Label>
                                        <DatePicker date={dueDate} setDate={setDueDate} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-card border-t flex gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1 rounded-2xl h-12 font-bold">Annuler</Button>
                        <Button 
                            onClick={handleProcessSale} 
                            disabled={!canFinalize} 
                            className="flex-1 rounded-2xl h-12 font-black shadow-lg shadow-primary/20 transition-all active:scale-95 gap-2"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                            Valider [Enter]
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            
            <PrintReceiptDialog isOpen={isReceiptOpen} onOpenChange={setIsReceiptOpen} sale={lastSale} />
        </>
    );
}
