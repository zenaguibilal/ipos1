'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart, Tag, X, Coins, AlertTriangle } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { CartItem } from "@/lib/types";
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface CartItemRowProps {
    item: CartItem;
    isSelected: boolean;
    onUpdate: (uuid: string, quantity: number) => void;
    onPriceUpdate: (uuid: string, price: number) => void;
    onRemove: (uuid: string) => void;
    onSelect: () => void;
}

const CartItemRow = React.memo(({ item, isSelected, onUpdate, onPriceUpdate, onRemove, onSelect }: CartItemRowProps) => {
    const priceInputRef = useRef<HTMLInputElement>(null);

    const handleQtyChange = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        onUpdate(item.uuid, Math.max(0, num));
    };

    const handlePriceChange = (val: string) => {
        const num = parseFloat(val);
        if (isNaN(num)) return;
        onPriceUpdate(item.uuid, Math.max(0, num));
    };

    // Raccourcis clavier locaux pour la ligne sélectionnée
    useKeyboardShortcuts([
        {
            key: '+',
            action: () => onUpdate(item.uuid, Number((item.cartQuantity + 1).toFixed(3))),
            description: 'Quantité +1',
            ignoreInputFocus: false
        },
        {
            key: '=',
            action: () => onUpdate(item.uuid, Number((item.cartQuantity + 1).toFixed(3))),
            description: 'Quantité +1',
            ignoreInputFocus: false
        },
        {
            key: '-',
            action: () => onUpdate(item.uuid, Math.max(0, Number((item.cartQuantity - 1).toFixed(3)))),
            description: 'Quantité -1',
            ignoreInputFocus: false
        },
        {
            key: '*',
            action: () => priceInputRef.current?.focus(),
            description: 'Modifier le prix',
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
    const stepValue = "0.001"; 
    const isZero = item.cartQuantity <= 0;
    
    // Alerte de vente à perte : prix de vente < prix d'achat (si P.A renseigné)
    const isSellingAtLoss = item.price < item.purchasePrice && item.purchasePrice > 0;

    return (
        <div 
            tabIndex={0}
            onFocus={onSelect}
            className={cn(
                "grid grid-cols-[1fr_auto_auto_auto] gap-x-6 items-center p-4 rounded-lg border transition-all duration-500 group outline-none",
                isSelected ? "bg-primary/10 border-primary/30 ring-1 ring-primary/20 shadow-sm" : "bg-muted/20 border-white/5 hover:bg-muted/40",
                isZero && "opacity-50 bg-muted/30 border-dashed border-muted-foreground/30",
                item.flash && 'animate-flash ring-2 ring-primary/30'
            )}
        >
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <p className={cn(
                        "font-semibold text-sm tracking-tight truncate group-hover:text-primary transition-colors",
                        isZero && "text-muted-foreground line-through decoration-1"
                    )}>
                        {item.name}
                    </p>
                    {isCustom && <Tag className="h-3 w-3 text-amber-500 opacity-50" />}
                    {isZero && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-destructive/70 bg-destructive/5 px-2 py-0.5 rounded border border-destructive/10 animate-in fade-in zoom-in duration-300">
                            Non facturé
                        </span>
                    )}
                </div>
                
                {/* Editable Price Field */}
                <div className="flex items-center gap-2 mt-1">
                    <div className="relative group/price">
                        <Coins className="absolute left-2 top-1/2 -translate-y-1/2 h-2.5 w-2.5 text-muted-foreground/30 group-focus-within/price:text-primary transition-colors" />
                        <Input 
                            ref={priceInputRef}
                            type="number"
                            value={item.price}
                            onChange={(e) => handlePriceChange(e.target.value)}
                            className={cn(
                                "h-6 w-24 pl-6 pr-1 text-[10px] font-bold bg-black/10 border-none shadow-inner focus-visible:ring-primary/20",
                                isSellingAtLoss && "text-destructive"
                            )}
                            step="0.01"
                        />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground/30">/ {item.unite || 'pcs'}</span>
                    
                    {/* Alerte Vente à perte */}
                    {isSellingAtLoss && (
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="p-1 rounded-md bg-destructive/10 animate-pulse cursor-help">
                                        <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent className="bg-destructive text-destructive-foreground border-none">
                                    <p className="text-[10px] font-bold uppercase tracking-wider">
                                        Vente à perte ! Coût achat : {formatCurrency(item.purchasePrice)}
                                    </p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col items-center gap-1">
                <div className="flex items-center bg-background/50 rounded-xl border border-white/5 overflow-hidden shadow-inner">
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Math.max(0, Number((item.cartQuantity - 1).toFixed(3)))); }}
                        className="px-3 h-10 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors font-bold"
                    >
                        −
                    </button>
                    <Input
                        type="number"
                        step={stepValue}
                        value={item.cartQuantity}
                        onChange={(e) => handleQtyChange(e.target.value)}
                        className={cn(
                            "w-20 text-center h-10 bg-transparent border-none shadow-none font-black text-lg focus-visible:ring-0",
                            isZero ? "text-destructive" : "text-primary"
                        )}
                        min="0"
                    />
                    <button 
                        onClick={(e) => { e.stopPropagation(); onUpdate(item.uuid, Number((item.cartQuantity + 1).toFixed(3))); }}
                        className="px-3 h-10 hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors font-bold"
                    >
                        +
                    </button>
                </div>
            </div>

            <div className="w-24 text-right">
                <p className={cn(
                    "font-semibold text-base tracking-tighter",
                    isZero ? "text-muted-foreground/30 line-through" : "text-foreground"
                )}>
                    {formatCurrency(item.price * item.cartQuantity)}
                </p>
            </div>

            <Button 
                variant="ghost" 
                size="icon" 
                className={cn(
                    "h-10 w-10 rounded-xl transition-all",
                    isZero 
                        ? "text-destructive opacity-100 bg-destructive/5 hover:bg-destructive/10" 
                        : "text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100"
                )}
                onClick={(e) => { e.stopPropagation(); onRemove(item.uuid); }}
                title="Retirer du panier"
            >
                {isZero ? <X className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
    );
});
CartItemRow.displayName = 'CartItemRow';

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const cart = useActiveCart();
    const { updateItemQuantity, updateItemPrice, removeItemFromCart } = useCartActions();
    
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
                            onPriceUpdate={updateItemPrice}
                            onRemove={removeItemFromCart} 
                            onSelect={() => setSelectedIndex(index)}
                        />
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}