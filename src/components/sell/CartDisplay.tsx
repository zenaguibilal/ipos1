'use client';

import React, { useState, useEffect } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, Tag } from 'lucide-react';
import { formatCurrency, cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";

const CartItemRow = React.memo(({ item, onUpdate, onRemove }: { item: CartItem, onUpdate: any, onRemove: any }) => {
    const handleQtyChange = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        onUpdate(item.uuid, Math.max(0, num));
    };

    const isCustom = item.uuid.startsWith('custom-');
    const stepValue = item.unite === 'Kg' || item.unite === 'Litre' ? "0.001" : "1";

    return (
        <div className={cn(
            "grid grid-cols-[1fr_auto_auto_auto] gap-2 items-center p-1.5 rounded-lg bg-muted/10 border border-white/5 hover:bg-muted/20 transition-colors group",
            item.flash && 'animate-flash ring-1 ring-primary/30'
        )}>
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                    <p className="font-black text-xs tracking-tight truncate group-hover:text-primary transition-colors">{item.name}</p>
                    {isCustom && <Tag className="h-2.5 w-2.5 text-amber-500 opacity-50" />}
                </div>
                <p className="text-[8px] font-bold text-muted-foreground/50 uppercase">
                    {formatCurrency(item.price)} / {item.unite || 'pcs'}
                </p>
            </div>
            
            <div className="flex flex-col items-center">
                <Input
                    type="number"
                    step={stepValue}
                    value={item.cartQuantity}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-14 h-6 text-center rounded-md bg-background/50 border-none shadow-inner font-black text-xs text-primary p-0"
                    min="0"
                />
            </div>

            <div className="w-16 text-right">
                <p className="font-black text-xs tracking-tighter">
                    {formatCurrency(item.price * item.cartQuantity)}
                </p>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground/20 hover:text-destructive h-6 w-6 rounded-md"
                onClick={() => onRemove(item.uuid)}
            >
                <Trash2 className="h-3 w-3" />
            </Button>
        </div>
    );
});
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { updateItemQuantity, removeItemFromCart } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) return null;
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center p-6 space-y-3 opacity-20">
                <ShoppingCart className="h-10 w-10" />
                <p className="text-[9px] font-black uppercase tracking-widest">Panier Vide</p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-2 space-y-1">
                {cart.items.map(item => (
                    <CartItemRow 
                        key={item.uuid} 
                        item={item} 
                        onUpdate={updateItemQuantity} 
                        onRemove={removeItemFromCart} 
                    />
                ))}
            </div>
        </ScrollArea>
    );
}
