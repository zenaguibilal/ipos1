'use client';

import { useState, useEffect } from 'react';
import { useActiveCart, useCartActions } from "@/stores/cartStore";
import { calculateCartTotals } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";

export function CartTotalBar() {
    const [isMounted, setIsMounted] = useState(false);
    const cart = useActiveCart();
    const { setDiscount } = useCartActions();
    
    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted || !cart) return <div className="h-24 bg-muted/20 animate-pulse rounded-lg" />;

    const { subtotal, total } = calculateCartTotals(cart);
    
    return (
        <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
            <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-semibold">{formatCurrency(subtotal)}</span>
            </div>
             <div className="flex justify-between items-center">
                <Label htmlFor="discount-value" className="flex-shrink-0 mr-4">Remise</Label>
                <div className="flex gap-2">
                    <Input 
                        id="discount-value" 
                        type="number" 
                        className="w-24 h-9"
                        value={cart.discount.value}
                        onChange={(e) => setDiscount(cart.discount.type, Number(e.target.value))}
                    />
                    <Select 
                        value={cart.discount.type} 
                        onValueChange={(value: 'fixed' | 'percentage') => setDiscount(value, cart.discount.value)}
                    >
                        <SelectTrigger className="w-[80px] h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="fixed">DA</SelectItem>
                            <SelectItem value="percentage">%</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="flex justify-between items-center text-lg font-bold">
                <span className="">Total</span>
                <span className="text-primary">{formatCurrency(total)}</span>
            </div>
        </div>
    );
}
