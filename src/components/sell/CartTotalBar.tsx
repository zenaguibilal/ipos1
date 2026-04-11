'use client';

import React, { useState, useEffect, memo } from 'react';
import { useActiveCart } from '@/stores/cartStore';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';

/**
 * CartTotalBar — shows only the net total.
 * Discount entry removed (arrow in screenshot).
 * The total is also shown in SaleInfoBar at the top.
 */
function CartTotalBarContent() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();

    useEffect(() => { setIsMounted(true); }, []);

    if (!isMounted || !cart) return null;

    const { total } = calculateCartTotals(cart);

    return (
        <div className="flex items-center justify-between px-1">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-xl font-bold text-primary tabular-nums">
                {formatCurrency(total)}
            </span>
        </div>
    );
}

export const CartTotalBar = memo(CartTotalBarContent);
CartTotalBar.displayName = 'CartTotalBar';