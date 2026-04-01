'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useActiveCart } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { ShoppingCart, User, Landmark, File, HandCoins } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';

export function SaleInfoBar() {
    const cart = useActiveCart();
    const pathname = usePathname();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const fetchCustomer = useCallback(async () => {
        if (cart?.customerUuid) {
            const c = await customerService.getCustomerByUuid(cart.customerUuid);
            if (c) {
                setCustomer(c);
            }
        } else {
            setCustomer(null);
        }
    }, [cart?.customerUuid]);

    useEffect(() => {
        const hasItems = cart && cart.items.length > 0;
        const isSellPage = pathname === '/sell';
        setIsVisible(isSellPage || hasItems);
        
        fetchCustomer();
    }, [cart, pathname, fetchCustomer]);

    if (!isVisible || !cart) return null;

    const { total } = calculateCartTotals(cart);
    const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);

    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de Passage';
    const customerDebt = customer?.outstandingBalance ?? 0;

    return (
        <>
            <div className="bg-card/80 backdrop-blur-sm text-secondary-foreground print-hide shadow-md z-20 relative border-b border-white/5">
                <div className="container mx-auto px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row items-center justify-between h-auto min-h-[3rem] py-2 text-sm gap-x-6 gap-y-2">
                        
                        {/* Cart Info */}
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                            <div className="flex items-center gap-2">
                                <File className="h-5 w-5 text-primary" />
                                <span className="font-bold">Panier:</span>
                                <span className="font-semibold">{cart.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <ShoppingCart className="h-5 w-5 text-primary" />
                                <span className="font-bold">Total:</span>
                                <span className="font-mono text-base font-bold text-primary">{formatCurrency(total)}</span>
                                {itemCount > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                        ({itemCount} article{itemCount > 1 ? 's' : ''})
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        {/* Customer & Debt Info */}
                        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
                             <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-primary" />
                                <span className="font-bold">Client:</span>
                                {customer ? (
                                    <Link href={`/customers/${customer.uuid}`} className="hover:underline font-semibold">
                                        {customerName}
                                    </Link>
                                ) : (
                                    <span className="font-semibold">{customerName}</span>
                                )}
                            </div>

                            {customer && (
                                 <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <Landmark className="h-5 w-5 text-primary" />
                                        <span className="font-bold">Dette:</span>
                                        <span className={cn("font-mono text-base font-bold", customerDebt > 0 ? 'text-destructive' : '')}>
                                            {formatCurrency(customerDebt)}
                                        </span>
                                    </div>
                                    {customerDebt > 0 && (
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            className="h-7 px-2 text-xs border-primary/50 hover:bg-primary/10 transition-colors"
                                            onClick={() => setIsPaymentDialogOpen(true)}
                                        >
                                            <HandCoins className="h-3 w-3 mr-1" />
                                            Régler
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
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
        </>
    );
}