'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useActiveCart } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency } from '@/lib/utils';
import { ShoppingCart, User, Landmark } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function SaleInfoBar() {
    const cart = useActiveCart();
    const pathname = usePathname();
    const [customer, setCustomer] = useState<Customer | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        let isCancelled = false;

        const hasItems = cart && cart.items.length > 0;
        const isSellPage = pathname === '/sell';
        setIsVisible(isSellPage || hasItems);
        
        if (cart?.customerUuid) {
            customerService.getCustomerByUuid(cart.customerUuid).then(c => {
                if (!isCancelled && c) {
                    setCustomer(c);
                }
            });
        } else {
            setCustomer(null);
        }

        return () => {
            isCancelled = true;
        };
    }, [cart, pathname]);

    if (!isVisible || !cart) return null;

    const { total } = calculateCartTotals(cart);
    const itemCount = cart.items.reduce((sum, item) => sum + item.cartQuantity, 0);

    const customerName = customer ? `${customer.firstName} ${customer.lastName}` : 'Client de Passage';
    const customerDebt = customer?.outstandingBalance ?? 0;

    return (
        <div className="bg-card/80 backdrop-blur-sm text-secondary-foreground print-hide shadow-md z-20 relative border-b border-white/5">
            <div className="container mx-auto px-4 sm:px-6">
                <div className="flex items-center justify-center sm:justify-between h-auto min-h-[3rem] py-2 text-sm flex-wrap gap-x-6 gap-y-1">
                    {/* Left part */}
                    <div className="flex items-center gap-x-6 gap-y-1 flex-wrap justify-center">
                        <div className="flex items-center gap-2">
                            <ShoppingCart className="h-5 w-5" />
                            <span className="font-bold">Total Panier :</span>
                            <span className="font-mono text-base font-bold text-primary">{formatCurrency(total)}</span>
                             {itemCount > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    ({itemCount} article{itemCount > 1 ? 's' : ''})
                                </span>
                            )}
                        </div>
                        <div className="h-6 w-px bg-secondary-foreground/20 hidden md:block"></div>
                         <div className="flex items-center gap-2">
                            <User className="h-5 w-5" />
                            <span className="font-bold">Client :</span>
                            {customer ? (
                                <Link href={`/customers/${customer.uuid}`} className="hover:underline font-semibold">
                                    {customerName}
                                </Link>
                            ) : (
                                <span className="font-semibold">{customerName}</span>
                            )}
                        </div>
                    </div>
                    {/* Right part */}
                    {customer && (
                         <div className="flex items-center gap-2">
                            <Landmark className="h-5 w-5" />
                            <span className="font-bold">Dette :</span>
                            <span className={cn("font-mono text-base font-bold", customerDebt > 0 ? 'text-destructive' : '')}>
                                {formatCurrency(customerDebt)}
                            </span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
