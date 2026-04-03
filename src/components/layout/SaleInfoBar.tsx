'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { User, HandCoins, Trash2, ChevronRight, Receipt, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * @fileOverview SaleInfoBar component for iPOS Luxury.
 * Displays real-time cart information, financial totals, and customer debt status.
 */
export function SaleInfoBar() {
    const cart = useActiveCart();
    const pathname = usePathname();
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
        const hasItems = cart && cart.items.length > 0;
        const isSellPage = pathname === '/sell';
        // The bar is visible on the sell page or if there are items in the cart globally.
        setIsVisible(isSellPage || hasItems);
        
        fetchCustomer();
    }, [cart, pathname, fetchCustomer]);

    if (!isVisible || !cart) return null;

    const { total, discountAmount } = calculateCartTotals(cart);
    const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);

    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de Passage';
    const customerDebt = customer?.outstandingBalance ?? 0;

    return (
        <>
            <div className="bg-card/40 backdrop-blur-3xl text-foreground print-hide shadow-2xl z-20 relative border-b border-white/5 animate-in slide-in-from-top duration-700">
                <div className="max-w-[1800px] mx-auto px-6 sm:px-10">
                    <div className="flex flex-col lg:flex-row items-center justify-between min-h-[4.5rem] py-3 gap-6">
                        
                        {/* Section 1: Cart Context & Session Identity */}
                        <div className="flex items-center gap-6">
                            <div className="flex items-center gap-4 bg-black/20 p-2 pl-4 pr-6 rounded-2xl border border-white/5 shadow-inner group">
                                <div className="p-2 rounded-xl bg-primary/10 text-primary shadow-sm group-hover:scale-110 transition-transform">
                                    <Receipt className="h-4 w-4" />
                                </div>
                                <div className="flex flex-col -space-y-0.5">
                                    <span className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-widest">Session Actuelle</span>
                                    <span className="font-black text-sm tracking-tight text-primary">{cart.name}</span>
                                </div>
                            </div>

                            <div className="hidden sm:flex items-center gap-3">
                                <div className="h-8 w-px bg-white/5" />
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">Vente en cours</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Section 2: Core Financials (Elite Dashboard Focus) */}
                        <div className="flex items-center gap-8 bg-black/40 px-10 py-2 rounded-full border border-white/5 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
                            
                            <div className="text-center relative z-10">
                                <p className="text-[9px] font-black uppercase text-muted-foreground/40 tracking-[0.3em] mb-0.5">Total à Encaisser</p>
                                <div className="flex items-baseline justify-center gap-2">
                                    <span className="text-3xl font-black tracking-tighter text-primary">{formatCurrency(total)}</span>
                                    {itemCount > 0 && (
                                        <span className="text-[10px] font-black text-muted-foreground/30 uppercase tracking-widest">
                                            ({itemCount} pcs)
                                        </span>
                                    )}
                                </div>
                            </div>

                            {discountAmount > 0 && (
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <div className="flex flex-col items-end border-l border-white/10 pl-8 cursor-help group/disc">
                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest group-hover/disc:text-amber-400 transition-colors">Privilège</span>
                                                <span className="text-xs font-black text-amber-500/60">-{formatCurrency(discountAmount)}</span>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl border-white/5 bg-card shadow-2xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Remise exclusive appliquée</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            )}
                        </div>
                        
                        {/* Section 3: Customer Relationship & Financial Impact */}
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

                            {/* Section 4: Utility Controls */}
                            <div className="flex items-center gap-2 pl-6 border-l border-white/5">
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-10 w-10 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all active:scale-90"
                                                onClick={() => clearCart()}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TooltipTrigger>
                                        <TooltipContent className="rounded-xl bg-destructive text-white border-none shadow-xl">
                                            <p className="text-[10px] font-black uppercase tracking-widest">Vider le manifeste</p>
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
