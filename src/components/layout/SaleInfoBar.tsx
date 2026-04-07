'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { User, HandCoins, Trash2, ChevronRight, Receipt, Info, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * @fileOverview SaleInfoBar - Single Source of Financial Truth
 * Consolidates subtotal, discount, and net totals into a sovereign elite header.
 */
export function SaleInfoBar() {
    const cart = useActiveCart();
    const currentPath = usePathname();
    const { clearCart } = useCartActions();
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const fetchCustomer = useCallback(async () => {
        if (cart?.customerUuid) {
            try {
                const c = await customerService.getCustomerByUuid(cart.customerUuid);
                setCustomer(c || null);
            } catch (e) {
                setCustomer(null);
            }
        } else {
            setCustomer(null);
        }
    }, [cart?.customerUuid]);

    useEffect(() => {
        const hasItems = !!(cart && cart.items.length > 0);
        const isSellPage = currentPath === '/sell';
        setIsVisible(!!(isSellPage || hasItems));
        fetchCustomer();
    }, [cart, currentPath, fetchCustomer]);

    if (!isVisible || !cart) return null;

    const { subtotal, total, discountAmount } = calculateCartTotals(cart);
    const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);

    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de Passage';
    const customerDebt = customer?.outstandingBalance ?? 0;

    return (
        <>
            <div className="bg-card/40 backdrop-blur-3xl text-foreground print-hide shadow-2xl z-20 relative border-b border-white/5 animate-in slide-in-from-top duration-700">
                <div className="max-w-[1800px] mx-auto px-6 sm:px-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between min-h-[5rem] py-3 gap-6">
                        
                        {/* Session & Subtotal Audit */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 bg-black/20 p-2 pl-4 pr-6 rounded-2xl border border-white/5 shadow-inner">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Audit Sous-total</span>
                                    <span className="font-mono font-bold text-sm text-foreground/60">{formatCurrency(subtotal)}</span>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-3">
                                <div className="h-8 w-px bg-white/5" />
                                <div className="flex flex-col">
                                    <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground/30">Session active</span>
                                    <span className="text-[10px] font-black text-emerald-500/60 uppercase">{cart.name}</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Central Financial Core (Net Souverain) */}
                        <div className="flex items-center gap-10 bg-black/40 px-12 py-3 rounded-full border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-10" />
                            
                            <div className="text-center relative z-10">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.4em] mb-1">Net Souverain à Encaisser</p>
                                <div className="flex items-baseline justify-center gap-3">
                                    <span className="text-4xl font-black tracking-tighter text-primary">{formatCurrency(total)}</span>
                                    {itemCount > 0 && (
                                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                            [{itemCount} items]
                                        </span>
                                    )}
                                </div>
                            </div>

                            {discountAmount > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col items-end border-l border-white/10 pl-10 cursor-help group/disc">
                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">Privilège applied</span>
                                                <span className="text-sm font-black text-amber-500/80">-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl border-white/5 bg-card shadow-2xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Remise de {cart.discount.value}{cart.discount.type === 'percentage' ? '%' : ' DA'}</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        
                        {/* Customer & Debt Context */}
                        <div className="flex items-center gap-6">
                             <div className="flex items-center gap-4 bg-muted/20 p-2 pr-6 rounded-2xl border border-white/5 group">
                                <div className="p-2.5 rounded-xl bg-background/50 text-muted-foreground group-hover:text-primary transition-colors shadow-inner">
                                    <User className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Partenaire Client</span>
                                    {customer ? (
                                        <Link href={`/customers/${customer.uuid}`} className="hover:text-primary transition-colors font-black text-sm tracking-tight flex items-center gap-1">
                                            {customerName} <ChevronRight className="h-3 w-3 opacity-30" />
                                        </Link>
                                    ) : (
                                        <span className="font-black text-sm tracking-tight text-muted-foreground/60">{customerName}</span>
                                    )}
                                </div>
                            </div>

                            {customer && (
                                 <div className="flex items-center gap-4 pl-6 border-l border-white/5">
                                    <div className="flex flex-col -space-y-0.5 items-end">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40">Dette Actuelle</span>
                                        <span className={cn("font-mono text-base font-black tracking-tighter", customerDebt > 0 ? 'text-destructive' : 'text-emerald-500')}>
                                            {formatCurrency(customerDebt)}
                                        </span>
                                    </div>
                                    {customerDebt > 0 && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-10 px-4 rounded-xl border-destructive/20 bg-destructive/5 text-destructive hover:bg-destructive hover:text-white transition-all font-black text-[10px] uppercase tracking-widest shadow-lg"
                                            onClick={() => setIsPaymentDialogOpen(true)}
                                        >
                                            <HandCoins className="h-3.5 w-3.5 mr-2" />
                                            Régler
                                        </Button>
                                    )}
                                </div>
                            )}

                            <div className="flex items-center gap-2 pl-6 border-l border-white/5">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-95"
                                                onClick={() => clearCart()}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl bg-destructive text-white border-none shadow-xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Révoquer le manifeste</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={fetchCustomer}
                />
            )}
        </>
    );
}
