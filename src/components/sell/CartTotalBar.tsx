'use client';

import React, { useState, useEffect, memo, useMemo } from 'react';
import { useActiveCart } from '@/stores/cartStore';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

/**
 * CartTotalBar — Affiche le total net et les alertes d'articles à zéro.
 */
function CartTotalBarContent() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();

    useEffect(() => { setIsMounted(true); }, []);

    // Calculer les totaux sur la base des articles actifs (> 0)
    const stats = useMemo(() => {
        if (!cart) return { total: 0, subtotal: 0, discountAmount: 0, zeroCount: 0 };
        
        const activeItems = cart.items.filter(i => i.cartQuantity > 0);
        const zeroItems = cart.items.filter(i => i.cartQuantity === 0);
        
        const totals = calculateCartTotals({ ...cart, items: activeItems });
        
        return {
            ...totals,
            zeroCount: zeroItems.length
        };
    }, [cart]);

    if (!isMounted || !cart) return null;

    return (
        <div className="space-y-2">
            {stats.zeroCount > 0 && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-600 animate-in slide-in-from-bottom-2 duration-500">
                    <AlertCircle className="h-3.5 w-3.5" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                        {stats.zeroCount} article(s) à zéro — non facturé(s)
                    </span>
                </div>
            )}
            
            <div className="flex items-center justify-between px-1">
                <div className="flex flex-col">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground/60 tracking-widest">Total Net</span>
                    {stats.discountAmount > 0 && (
                        <span className="text-[9px] font-bold text-emerald-600 uppercase">
                            Économie : {formatCurrency(stats.discountAmount)}
                        </span>
                    )}
                </div>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-primary tabular-nums tracking-tighter">
                        {formatCurrency(stats.total)}
                    </span>
                </div>
            </div>
        </div>
    );
}

export const CartTotalBar = memo(CartTotalBarContent);
CartTotalBar.displayName = 'CartTotalBar';
