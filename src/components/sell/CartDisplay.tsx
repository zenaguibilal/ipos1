'use client';

import React, { useState, useEffect } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, Tag } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface CartItemRowProps {
    item: CartItem;
    isSelected: boolean;
    onUpdate: (uuid: string, quantity: number) => void;
    onRemove: (uuid: string) => void;
    onSelect: () => void;
}

const CartItemRow = React.memo(({ item, isSelected, onUpdate, onRemove, onSelect }: CartItemRowProps) => {
    const handleQtyChange = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        onUpdate(item.uuid, Math.max(0, num));
    };

    // Raccourcis clavier locaux pour la ligne sélectionnée
    useKeyboardShortcuts([
        {
            key: '+',
            action: () => onUpdate(item.uuid, item.cartQuantity + 1),
            description: 'Quantité +1',
            ignoreInputFocus: false
        },
        {
            key: '=',
            action: () => onUpdate(item.uuid, item.cartQuantity + 1),
            description: 'Quantité +1',
            ignoreInputFocus: false
        },
        {
            key: '-',
            action: () => onUpdate(item.uuid, Math.max(0, item.cartQuantity - 1)),
            description: 'Quantité -1',
            ignoreInputFocus: false
        },
        {
            key: 'Delete',
            action: () => onRemove(item.uuid),
            description: 'Supprimer article',
            ignoreInputFocus: true
        }
    ], `Article-${item.uuid}`, isSelected);

    const isCustom = item.uuid.startsWith('custom-');
    const isService = item.uuid === 'BREAD_PRODUCT';
    const stepValue = item.unite === 'Kg' || item.unite === 'Litre' ? "0.001" : "1";

    return (
        <div 
            tabIndex={0}
            onFocus={onSelect}
            className={cn(
                "grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center p-4 rounded-lg border transition-all duration-500 group outline-none",
                isSelected ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-sm" : "bg-muted/20 border-white/5 hover:bg-muted/40",
                item.flash && 'animate-flash ring-2 ring-primary/30'
            )}
        >
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-sm tracking-tight truncate group-hover:text-primary transition-colors">{item.name}</p>
                    {isCustom && <Tag className="h-3 w-3 text-amber-500 opacity-50" />}
                </div>
                <p className="text-[10px] font-bold text-muted-foreground/50">
                    {formatCurrency(item.price)} <span className="mx-1 opacity-30">/</span> {item.unite || 'pcs'}
                </p>
            </div>
            
            <div className="flex flex-col items-center gap-1">
                <Input
                    type="number"
                    step={stepValue}
                    value={item.cartQuantity}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    className="w-24 text-center h-10 rounded-xl bg-background/50 border-none shadow-inner font-semibold text-primary"
                    min="0"
                />
            </div>

            <div className="w-24 text-right">
                <p className="font-semibold text-base tracking-tighter text-foreground">
                    {formatCurrency(item.price * item.cartQuantity)}
                </p>
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
    );
});
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const cart = useActiveCart();
    const { updateItemQuantity, removeItemFromCart } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Navigation clavier entre les lignes
    useKeyboardShortcuts([
        {
            key: 'ArrowDown',
            action: () => {
                if (cart && cart.items.length > 0) {
                    setSelectedIndex(prev => prev === null || prev >= cart.items.length - 1 ? 0 : prev + 1);
                }
            },
            description: 'Ligne suivante',
            ignoreInputFocus: true
        },
        {
            key: 'ArrowUp',
            action: () => {
                if (cart && cart.items.length > 0) {
                    setSelectedIndex(prev => prev === null || prev <= 0 ? cart.items.length - 1 : prev - 1);
                }
            },
            description: 'Ligne précédente',
            ignoreInputFocus: true
        }
    ], 'ListePanier', isMounted && cart !== null && cart.items.length > 0);

    if (!isMounted) return null;
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-4 space-y-6 animate-in fade-in duration-1000">
                <div className="p-4 rounded-lg bg-muted/20 border border-white/5 shadow-inner">
                    <ShoppingCart className="h-20 w-20 text-muted-foreground/20" />
                </div>
                <div className="space-y-2">
                    <p className="text-lg font-semibold tracking-tighter text-muted-foreground/40">Manifeste Vierge</p>
                    <p className="text-[10px] font-semibold uppercase text-muted-foreground/20">En attente de flux commercial...</p>
                </div>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-6">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center text-[10px] font-semibold uppercase text-muted-foreground/40 px-4 mb-6">
                    <div className="text-left">Désignation Produit</div>
                    <div className="text-center">Quantité Flux</div>
                    <div className="text-right">Total Net</div>
                    <div></div>
                </div>

                <div className="space-y-3">
                    {cart.items.map((item, index) => (
                        <CartItemRow 
                            key={item.uuid} 
                            item={item} 
                            isSelected={selectedIndex === index}
                            onUpdate={updateItemQuantity} 
                            onRemove={removeItemFromCart} 
                            onSelect={() => setSelectedIndex(index)}
                        />
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}
