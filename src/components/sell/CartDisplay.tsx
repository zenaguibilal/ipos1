'use client';

import React, { useState, useEffect } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, Tag } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

const CartItemRow = React.memo(({ item, onUpdate, onRemove }: { item: any, onUpdate: any, onRemove: any }) => (
    <div 
        className={cn(
            "grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center p-4 rounded-[1.5rem] bg-muted/20 border border-white/5 transition-all duration-500 hover:bg-muted/40 group",
            item.flash && 'animate-flash ring-2 ring-primary/30'
        )}
    >
        <div className="flex-grow min-w-0">
            <div className="flex items-center gap-2 mb-1">
                <p className="font-black text-sm tracking-tight truncate group-hover:text-primary transition-colors">{item.name}</p>
                {item.uuid.startsWith('custom-') && <Tag className="h-3 w-3 text-amber-500 opacity-50" />}
            </div>
            <p className="text-[10px] font-bold text-muted-foreground/50">{formatCurrency(item.price)} <span className="mx-1 opacity-30">/</span> {item.unite || 'pcs'}</p>
        </div>
        
        <div className="flex flex-col items-center gap-1">
            <Input
                type="number"
                value={item.cartQuantity}
                onChange={(e) => onUpdate(item.uuid, parseInt(e.target.value) || 0)}
                className="w-20 text-center h-10 rounded-xl bg-background/50 border-none shadow-inner font-black text-primary"
                min="0"
            />
            {item.cartQuantity >= item.quantity && !item.uuid.startsWith('custom-') && (
                <span className="text-[8px] font-black text-destructive uppercase">Stock Max</span>
            )}
        </div>

        <div className="w-24 text-right">
            <p className="font-black text-base tracking-tighter text-foreground">{formatCurrency(item.price * item.cartQuantity)}</p>
        </div>

        <Button 
            variant="ghost" 
            size="icon" 
            className="text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
            onClick={() => onRemove(item.uuid)}
        >
            <Trash2 className="h-4 w-4" />
        </Button>
    </div>
));
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { updateItemQuantity, removeItemFromCart } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return (
            <div className="flex-grow flex items-center justify-center">
                <div className="relative">
                    <div className="absolute -inset-8 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                    <ShoppingCart className="relative h-20 w-20 text-primary/10 animate-bounce duration-[2000ms]" />
                </div>
            </div>
        );
    }
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-12 space-y-6 animate-in fade-in duration-1000">
                <div className="p-10 rounded-[3rem] bg-muted/20 border border-white/5 shadow-inner">
                    <ShoppingCart className="h-20 w-20 text-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                    <p className="text-2xl font-black tracking-tighter text-muted-foreground/40">Panier vide</p>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/20">Prêt pour une nouvelle vente</p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-6">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 px-4 mb-6">
                    <div className="text-left">Désignation</div>
                    <div className="text-center">Quantité</div>
                    <div className="text-right">Total</div>
                    <div></div>
                </div>

                <div className="space-y-3">
                    {cart.items.map(item => (
                        <CartItemRow 
                            key={item.uuid} 
                            item={item} 
                            onUpdate={updateItemQuantity} 
                            onRemove={removeItemFromCart} 
                        />
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}
