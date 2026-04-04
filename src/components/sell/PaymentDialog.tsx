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

export function PaymentDialog({ isOpen, onOpenChange }: { isOpen: boolean, onOpenChange: (open: boolean) => void }) {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { processSale } = useCartActions();
    
    const [amountPaid, setAmountPaid] = useState(0);
    const [dueDate, setDueDate] = useState<Date | undefined>();
    const [isLoading, setIsLoading] = useState(false);
    const [lastSale, setLastSale] = useState<Sale | null>(null);
    const [isReceiptOpen, setIsReceiptOpen] = useState(false);
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [approveOverLimit, setApproveOverLimit] = useState(false);

    const { total } = cart ? calculateCartTotals(cart) : { total: 0 };
    const change = amountPaid - total;

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen && isMounted) {
            setAmountPaid(total);
            setIsLoading(false);
            setLastSale(null);
            setApproveOverLimit(false);
            
            if (cart?.customerUuid) {
                 setDueDate(addDays(new Date(), 30));
                 customerService.getCustomerByUuid(cart.customerUuid).then(c => setCustomer(c || null));
            } else {
                 setDueDate(undefined);
                 setCustomer(null);
            }
        }
    }, [isOpen, total, cart?.customerUuid, isMounted]);
    
    const handleProcessSale = async () => {
        if (amountPaid < 0) return;
        setIsLoading(true);
        const sale = await processSale(amountPaid, dueDate);
        if (sale) {
            setLastSale(sale);
            onOpenChange(false);
            setIsReceiptOpen(true);
        }
        setIsLoading(false);
    };

    const projectedBalance = useMemo(() => {
        if (!customer) return 0;
        const creditAmount = Math.max(0, total - amountPaid);
        return customer.outstandingBalance + creditAmount;
    }, [customer, total, amountPaid]);

    const isOverLimit = useMemo(() => {
        if (!customer || !customer.creditLimit) return false;
        return projectedBalance > customer.creditLimit;
    }, [customer, projectedBalance]);

    if (!cart || !isMounted) return null;

    const isCreditSale = cart.customerUuid && amountPaid < total;
    const canFinalize = !isLoading && amountPaid >= 0 && (
        amountPaid >= total || 
        (cart.customerUuid && (!isOverLimit || approveOverLimit))
    );
    
    return (
        <>
            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px] overflow-hidden border-none shadow-2xl p-0 gap-0 bg-card rounded-3xl">
                    <div className="bg-primary/5 p-6 border-b border-primary/10">
                        <DialogHeader className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                    <Wallet className="h-6 w-6" />
                                </div>
                                <div>
                                    <DialogTitle className="text-xl font-bold tracking-tight">Finaliser la Vente</DialogTitle>
                                    <DialogDescription className="text-muted-foreground font-medium">
                                        {cart.name} • {cart.items.length} article(s)
                                    </DialogDescription>
                                </div>
                            </div>
                        </DialogHeader>
                    </div>

                    <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                        <div className="text-center p-6 bg-muted/30 rounded-3xl border border-border/50 relative overflow-hidden">
                            <Label className="text-muted-foreground uppercase text-[10px] font-black tracking-widest mb-2 block relative z-10">Total à Payer</Label>
                            <p className="text-5xl font-black text-primary tracking-tighter relative z-10">{formatCurrency(total)}</p>
                            <Wallet className="absolute -right-4 -bottom-4 h-24 w-24 text-primary/5 rotate-12" />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                             <div className="space-y-2">
                                <Label htmlFor="amount-paid" className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-1">
                                    <Banknote className="h-3 w-3" />
                                    Montant Reçu
                                </Label>
                                <div className="relative">
                                    <Input
                                        id="amount-paid"
                                        type="number"
                                        className="text-2xl h-16 text-center font-bold focus-visible:ring-primary bg-background border-2 border-transparent focus-visible:border-primary/20 rounded-2xl shadow-sm"
                                        value={amountPaid}
                                        onChange={(e) => setAmountPaid(Number(e.target.value))}
                                        autoFocus
                                        onFocus={(e) => e.target.select()}
                                        onKeyDown={(e) => { if(e.key === 'Enter' && canFinalize) handleProcessSale() }}
                                    />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">DA</div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                 <Label className="flex items-center gap-2 text-xs font-bold text-muted-foreground ml-1">
                                    <CheckCircle2 className="h-3 w-3" />
                                    Monnaie à Rendre
                                 </Label>
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
                                        <div className="p-2 rounded-full bg-amber-500/20">
                                            <Info className="h-4 w-4 text-amber-500" />
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-sm font-bold text-amber-500">Vente à crédit</p>
                                            <p className="text-xs text-amber-500/80 font-medium">Le solde de {formatCurrency(total - amountPaid)} sera ajouté à la dette.</p>
                                        </div>
                                    </div>
                                    
                                    {isOverLimit && (
                                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
                                            <div className="flex items-center gap-2 text-destructive font-black text-[10px] uppercase">
                                                <ShieldAlert className="h-4 w-4" /> Dépassement de plafond détecté
                                            </div>
                                            <p className="text-[10px] font-medium leading-relaxed">
                                                Nouveau solde estimé : <span className="font-black">{formatCurrency(projectedBalance)}</span><br/>
                                                Limite autorisée : <span className="font-black">{formatCurrency(customer?.creditLimit || 0)}</span>
                                            </p>
                                            <div className="flex items-center justify-between bg-black/20 p-3 rounded-lg">
                                                <span className="text-[10px] font-black uppercase text-primary">Approuver le dépassement</span>
                                                <Switch 
                                                    checked={approveOverLimit} 
                                                    onCheckedChange={setApproveOverLimit}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2 pt-2 border-t border-amber-500/10">
                                        <Label className="flex items-center gap-2 text-[10px] uppercase font-bold text-amber-500/70 ml-1">
                                            <Calendar className="h-3 w-3" />
                                            Échéance du crédit
                                        </Label>
                                        <DatePicker date={dueDate} setDate={setDueDate} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 bg-card border-t flex gap-3">
                        <Button 
                            variant="ghost" 
                            onClick={() => onOpenChange(false)} 
                            disabled={isLoading} 
                            className="flex-1 rounded-2xl h-12 font-bold"
                        >
                            Annuler
                        </Button>
                        <div className="flex-1 relative">
                            {amountPaid < total && !cart.customerUuid && (
                                <div className="absolute -top-10 left-0 w-full flex items-center gap-2 text-[10px] font-black text-destructive animate-pulse justify-center">
                                    <AlertCircle className="h-3 w-3" /> Client requis pour crédit
                                </div>
                            )}
                            {isOverLimit && !approveOverLimit && (
                                <div className="absolute -top-10 left-0 w-full flex items-center gap-2 text-[10px] font-black text-destructive animate-pulse justify-center">
                                    <ShieldAlert className="h-3 w-3" /> Approbation requise
                                </div>
                            )}
                            <Button 
                                onClick={handleProcessSale} 
                                disabled={!canFinalize} 
                                className="w-full rounded-2xl h-12 font-bold shadow-lg shadow-primary/20 transition-all active:scale-95"
                            >
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                                Valider [Enter]
                            </Button>
                        </div>
                    </div>
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
