'use client';

import { useState, useEffect, useCallback } from 'react';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { User, Trash2, ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function SaleInfoBar() {
    const cart = useActiveCart();
    const currentPath = usePathname();
    const { clearCart } = useCartActions();
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    const fetchCustomer = useCallback(async () => {
        if (cart?.customerUuid) {
            try {
                const c = await customerService.getCustomerByUuid(cart.customerUuid);
                setCustomer(c || null);
            } catch (e) {
                setCustomer(null);
            }
        } else {
            setCustomer(null);
        }
    }, [cart?.customerUuid]);

    useEffect(() => {
        const hasItems = !!(cart && cart.items.length > 0);
        const isSellPage = currentPath === '/sell';
        setIsVisible(!!(isSellPage || hasItems));
        fetchCustomer();
    }, [cart, currentPath, fetchCustomer]);

    if (!isVisible || !cart) return null;

    const { total } = calculateCartTotals(cart);
    const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de passage';

    return (
        <div className="bg-primary text-primary-foreground print-hide shadow-sm z-20 relative border-t border-white/5 shrink-0">
            <div className="max-w-[1600px] mx-auto px-3 h-7 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-3 w-3 opacity-70" />
                        <span className="text-[9px] font-black uppercase tracking-tight">{cart.name}</span>
                        <span className="text-[8px] font-black bg-white/20 px-1.5 py-0.5 rounded-sm">{itemCount} pos</span>
                    </div>
                    <div className="h-3 w-px bg-white/20" />
                    <div className="flex items-center gap-2">
                        <User className="h-3 w-3 opacity-70" />
                        <span className="text-[9px] font-bold truncate max-w-[120px]">{customerName}</span>
                        {customer && customer.outstandingBalance > 0 && (
                            <span className="text-[8px] font-black bg-rose-500/40 px-1.5 py-0.5 rounded-sm">Debt: {formatCurrency(customer.outstandingBalance)}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <span className="text-[7px] font-black uppercase opacity-70">Manifest Total</span>
                        <span className="text-sm font-black tracking-tighter">{formatCurrency(total)}</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-5 w-5 text-white/40 hover:text-white hover:bg-white/10 rounded-md"
                        onClick={() => clearCart()}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
