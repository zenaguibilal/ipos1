'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { User, HandCoins, Trash2, ChevronRight, Receipt, ShoppingCart } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';

export function SaleInfoBar() {
    const cart = useActiveCart();
    const currentPath = usePathname();
    const { clearCart } = useCartActions();
    
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

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
    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client Passager';

    return (
        <div className="bg-primary text-primary-foreground print-hide shadow-lg z-20 relative">
            <div className="max-w-[1600px] mx-auto px-6 h-12 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-bold uppercase tracking-wider">{cart.name}</span>
                        <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded-lg">{itemCount} items</span>
                    </div>
                    <div className="h-4 w-px bg-white/20" />
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4 opacity-70" />
                        <span className="text-xs font-bold">{customerName}</span>
                        {customer && customer.outstandingBalance > 0 && (
                            <span className="text-[10px] font-bold bg-rose-500/40 px-2 py-0.5 rounded-lg">Dette: {formatCurrency(customer.outstandingBalance)}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-70">Total Net</span>
                        <span className="text-xl font-black tracking-tight">{formatCurrency(total)}</span>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10 rounded-lg"
                        onClick={() => clearCart()}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            
            {customer && (
                <AddPaymentDialog 
                    isOpen={isPaymentDialogOpen}
                    onOpenChange={setIsPaymentDialogOpen}
                    customer={customer}
                    onPaymentSuccess={fetchCustomer}
                />
            )}
        </div>
    );
}
