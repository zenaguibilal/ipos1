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
            "grid grid-cols-[1fr_auto_auto_auto] gap-1 items-center p-1 rounded-lg bg-muted/5 border border-transparent hover:border-primary/10 hover:bg-primary/5 transition-all group",
            item.flash && 'animate-flash ring-1 ring-primary/20'
        )}>
            <div className="flex-grow min-w-0 pl-1">
                <div className="flex items-center gap-1">
                    <p className="font-bold text-[10px] tracking-tight truncate group-hover:text-primary transition-colors leading-tight">{item.name}</p>
                    {isCustom && <Tag className="h-2 w-2 text-accent opacity-50" />}
                </div>
                <p className="text-[7px] font-black text-muted-foreground/40 uppercase tracking-tighter">
                    {formatCurrency(item.price)} / {item.unite || 'pcs'}
                </p>
            </div>
            
            <Input
                type="number"
                step={stepValue}
                value={item.cartQuantity}
                onChange={(e) => handleQtyChange(e.target.value)}
                className="w-10 h-6 text-center rounded bg-background border shadow-inner font-black text-[10px] text-primary p-0"
                min="0"
            />

            <div className="w-16 text-right">
                <p className="font-black text-[10px] tracking-tighter">
                    {formatCurrency(item.price * item.cartQuantity)}
                </p>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground/20 hover:text-destructive h-6 w-6 rounded transition-opacity opacity-0 group-hover:opacity-100"
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
            <div className="flex-grow flex flex-col items-center justify-center p-4 space-y-2 opacity-10">
                <ShoppingCart className="h-8 w-8" />
                <p className="text-[8px] font-black uppercase tracking-[0.3em]">Panier vide</p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-1.5 space-y-0.5">
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
