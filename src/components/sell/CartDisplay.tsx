'use client';

import { useState, useEffect } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Trash2, ShoppingCart } from 'lucide-react';
import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function CartDisplay() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { updateItemQuantity, removeItemFromCart } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return <div className="flex-grow flex items-center justify-center"><ShoppingCart className="h-16 w-16 opacity-10 animate-pulse" /></div>;
    }
    
    if (!cart || cart.items.length === 0) {
        return (
            <div className="flex-grow flex flex-col items-center justify-center text-center text-muted-foreground p-4">
                <ShoppingCart className="h-16 w-16" />
                <p className="mt-4 text-lg font-medium">Le panier est vide</p>
                <p>Recherchez ou sélectionnez des produits pour commencer</p>
            </div>
        )
    }

    return (
        <ScrollArea className="flex-grow">
            <div className="p-4">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center text-sm text-muted-foreground px-2 mb-2">
                    <div className="text-left">Produit</div>
                    <div className="text-center">Quantité</div>
                    <div className="text-right">Total</div>
                    <div>{/* For delete button */}</div>
                </div>

                <div className="space-y-2">
                    {cart.items.map(item => (
                        <div 
                            key={item.uuid} 
                            className={cn(
                                "grid grid-cols-[1fr_auto_auto_auto] gap-x-4 items-center p-2 rounded-lg",
                                item.flash && 'animate-flash bg-primary/20'
                            )}
                        >
                            <div className="flex-grow">
                                <p className="font-semibold">{item.name}</p>
                                <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                            </div>
                            <Input
                                type="number"
                                value={item.cartQuantity}
                                onChange={(e) => updateItemQuantity(item.uuid, parseInt(e.target.value) || 0)}
                                className="w-20 text-center h-9"
                                min="0"
                            />
                            <p className="w-24 text-right font-semibold">{formatCurrency(item.price * item.cartQuantity)}</p>
                            <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-destructive hover:text-destructive h-9 w-9"
                                onClick={() => removeItemFromCart(item.uuid)}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>
        </ScrollArea>
    );
}