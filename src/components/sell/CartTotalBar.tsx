'use client';

import React, { useState, useEffect, memo, useCallback } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { calculateCartTotals } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

/**
 * CartTotalBar - Hardened financial calculation summary.
 * Uses integer arithmetic through calculateCartTotals to avoid decimal drift.
 */
function CartTotalBarContent() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { setDiscount } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleDiscountValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!cart) return;
        const val = parseFloat(e.target.value);
        setDiscount(cart.discount.type, isNaN(val) ? 0 : val);
    }, [cart, setDiscount]);

    if (!isMounted || !cart) return <div className="h-32 bg-muted/20 animate-pulse rounded-[2rem] border border-white/5" />;

    const { subtotal, total, discountAmount } = calculateCartTotals(cart);
    
    return (
        <div className="space-y-4 p-6 bg-black/20 rounded-[2rem] border border-white/5 shadow-inner">
            <div className="flex justify-between items-center px-2">
                <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Audit Sous-total</span>
                <span className="font-mono font-bold text-sm">{formatCurrency(subtotal)}</span>
            </div>

             <div className="flex justify-between items-center gap-4 bg-background/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                    <Label htmlFor="discount-value" className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Privilège Client</Label>
                </div>
                <div className="flex items-center gap-2">
                    <Input 
                        id="discount-value" 
                        type="number" 
                        className="w-24 h-10 rounded-xl bg-black/20 border-none text-center font-black text-amber-500 shadow-inner"
                        value={cart.discount.value || ''}
                        onChange={handleDiscountValueChange}
                        placeholder="0"
                    />
                    <Select 
                        value={cart.discount.type} 
                        onValueChange={(value: 'fixed' | 'percentage') => setDiscount(value, cart.discount.value)}
                    >
                        <SelectTrigger className="w-[80px] h-10 rounded-xl border-none bg-black/20 font-black text-[10px] uppercase shadow-inner">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-white/5 bg-card shadow-2xl">
                            <SelectItem value="fixed" className="font-bold">DA</SelectItem>
                            <SelectItem value="percentage" className="font-bold">%</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="flex justify-between items-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
                <span className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Net Souverain</span>
                <div className="text-right">
                    <span className="text-3xl font-black text-primary tracking-tighter">{formatCurrency(total)}</span>
                    {discountAmount > 0 && (
                        <p className="text-[9px] font-black text-amber-500/60 uppercase tracking-widest mt-1">
                            -{formatCurrency(discountAmount)} déduits
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

export const CartTotalBar = memo(CartTotalBarContent);
CartTotalBar.displayName = 'CartTotalBar';
