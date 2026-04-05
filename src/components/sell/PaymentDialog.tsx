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
 * PaymentDialog - Core financial finalization module.
 * Uses high-precision comparisons to avoid JS floating point errors.
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

    // Get totals from utility with precision handling
    const { total } = useMemo(() => cart ? calculateCartTotals(cart) : { total: 0 }, [cart]);
    
    // EPSILON for floating point comparison (standard 0.01 for currency)
    const EPSILON = 0.005;
    const change = Math.max(0, amountPaid - total);
    const isFullPayment = amountPaid >= (total - EPSILON);

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
        const creditAmount = Math.max(0, total - amountPaid);
        return (customer.outstandingBalance || 0) + creditAmount;
    }, [customer, total, amountPaid]);

    const isOverLimit = useMemo(() => {
        if (!customer || !customer.creditLimit) return false;
        return projectedBalance > (customer.creditLimit + EPSILON);
    }, [customer, projectedBalance]);

    if (!cart || !isMounted) return null;

    const isCreditSale = cart.customerUuid && amountPaid < (total - EPSILON);
    const canFinalize = !isLoading && amountPaid >= 0 && (
        isFullPayment || (cart.customerUuid && (!isOverLimit || approveOverLimit))
    );
    
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] overflow-hidden border-none shadow-2xl p-0 gap-0 bg-card rounded-[2.5rem]">
                    <div className="bg-primary/5 p-8 border-b border-primary/10">
                        <DialogHeader>
                            <div className="flex items-center gap-4">
                                <div className="p-3.5 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/20">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-2xl font-black tracking-tight">Validation Flux</DialogTitle>
                                    <DialogDescription className="font-medium text-[10px] font-black uppercase tracking-widest opacity-50">{cart.name}</DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-8 space-y-8">
                        <div className="text-center p-8 bg-black/40 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-inner">
                            <Label className="text-muted-foreground uppercase text-[10px] font-black tracking-[0.3em] mb-3 block opacity-40">Solde Net du Manifeste</Label>
                            <p className="text-5xl font-black text-primary tracking-tighter transition-transform duration-500 group-hover:scale-105">{formatCurrency(total)}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                             <div className="space-y-3">
                                <Label htmlFor="amount-paid" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Encaissé (DA)</Label>
                                <Input
                                    id="amount-paid"
                                    type="number"
                                    step="0.01"
                                    className="text-2xl h-16 text-center font-black bg-background border-none shadow-inner focus-visible:ring-primary/20 rounded-2xl"
                                    value={amountPaid}
                                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => { if(e.key === 'Enter' && canFinalize) handleProcessSale() }}
                                />
                            </div>
                            <div className="space-y-3">
                                 <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Reliquat Flux</Label>
                                 <div className={cn(
                                     "text-2xl h-16 flex items-center justify-center font-black rounded-2xl border border-dashed transition-all duration-500",
                                     change >= 0.01 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-500" : "bg-muted/20 border-white/5 text-muted-foreground/20"
                                 )}>
                                    {change >= 0.01 ? formatCurrency(change) : '-'}
                                 </div>
                            </div>
                        </div>

                        {isCreditSale && (
                            <div className="space-y-4 animate-in slide-in-from-top-4 duration-500">
                                <div className="p-6 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500"><Info className="h-5 w-5" /></div>
                                        <div className="space-y-1">
                                            <p className="text-xs font-black uppercase tracking-tight text-amber-600">Inscription au Grand Livre (Crédit)</p>
                                            <p className="text-[10px] text-amber-600/60 font-medium">Un flux débiteur de {formatCurrency(total - amountPaid)} sera rattaché au compte client.</p>
                                        </div>
                                    </div>
                                    
                                    {isOverLimit && (
                                        <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-2xl space-y-4 shadow-inner">
                                            <div className="flex items-center gap-3 text-destructive font-black text-[10px] uppercase tracking-widest">
                                                <ShieldAlert className="h-5 w-5" /> Alerte Plafond Dépassé
                                            </div>
                                            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl">
                                                <span className="text-[10px] font-black uppercase text-primary">Dérogation Souveraine</span>
                                                <Switch checked={approveOverLimit} onCheckedChange={setApproveOverLimit} className="data-[state=checked]:bg-primary" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-3 pt-4 border-t border-amber-500/10">
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-amber-600/40 ml-1">Échéance de Règlement</Label>
                                        <DatePicker date={dueDate} setDate={setDueDate} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-8 bg-card border-t border-white/5 flex gap-4">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isLoading} className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest">Annuler</Button>
                        <Button 
                            onClick={handleProcessSale} 
                            disabled={!canFinalize} 
                            className="flex-1 rounded-2xl h-14 font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95 gap-3"
                        >
                            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <CheckCircle2 className="h-5 w-5" />}
                            Valider Flux [Enter]
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
            
            <PrintReceiptDialog isOpen={isReceiptOpen} onOpenChange={setIsReceiptOpen} sale={lastSale} />
        </>
    );
}
