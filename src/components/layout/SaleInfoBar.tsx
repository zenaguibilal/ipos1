'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { customerService } from '@/services/customer.service';
import type { Customer } from '@/lib/types';
import { calculateCartTotals, formatCurrency, cn } from '@/lib/utils';
import { User, HandCoins, Trash2, Receipt } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { AddPaymentDialog } from '@/components/payments/AddPaymentDialog';
import { Badge } from '@/components/ui/badge';

export function SaleInfoBar() {
    const cart      = useActiveCart();
    const pathname  = usePathname();
    const { clearCart } = useCartActions();

    const [customer, setCustomer]               = useState<Customer | null>(null);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    const fetchCustomer = useCallback(async () => {
        if (cart?.customerUuid) {
            const c = await customerService.getCustomerByUuid(cart.customerUuid).catch(() => null);
            setCustomer(c || null);
        } else {
            setCustomer(null);
        }
    }, [cart?.customerUuid]);

    useEffect(() => { fetchCustomer(); }, [fetchCustomer]);

    const hasItems  = !!(cart && cart.items.length > 0);
    const isSellPage = pathname === '/sell';
    if (!cart || (!hasItems && !isSellPage)) return null;

    const { total, discountAmount } = calculateCartTotals(cart);
    const itemCount  = cart.items.reduce((s, i) => s + i.cartQuantity, 0);
    const customerDebt = customer?.outstandingBalance ?? 0;

    return (
        <>
            <div className="print-hide h-10 border-b border-border bg-muted/40 flex items-center px-4 gap-4 text-sm z-30">
                {/* Session badge */}
                <div className="flex items-center gap-1.5 text-muted-foreground shrink-0">
                    <Receipt className="h-3.5 w-3.5" />
                    <span className="font-medium text-xs">{cart.name}</span>
                    {hasItems && (
                        <Badge variant="secondary" className="h-4 px-1.5 text-[10px]">
                            {itemCount}
                        </Badge>
                    )}
                </div>

                <div className="h-4 w-px bg-border" />

                {/* Total */}
                <div className="flex items-baseline gap-1.5">
                    <span className="text-xs text-muted-foreground">Total:</span>
                    <span className="font-bold text-primary text-sm tabular-nums">{formatCurrency(total)}</span>
                    {discountAmount > 0 && (
                        <span className="text-xs text-amber-500 hidden sm:inline">(-{formatCurrency(discountAmount)})</span>
                    )}
                </div>

                {/* Customer */}
                {customer && (
                    <>
                        <div className="h-4 w-px bg-border" />
                        <div className="flex items-center gap-1.5 min-w-0">
                            <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                            <Link
                                href={`/customers/${customer.uuid}`}
                                className="text-xs font-medium hover:text-primary transition-colors truncate max-w-[120px]"
                            >
                                {customer.firstName} {customer.lastName}
                            </Link>
                            {customerDebt > 0 && (
                                <span className={cn('text-xs tabular-nums font-medium', 'text-destructive')}>
                                    {formatCurrency(customerDebt)}
                                </span>
                            )}
                        </div>

                        {customerDebt > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2 text-xs text-destructive hover:bg-destructive/10"
                                onClick={() => setIsPaymentDialogOpen(true)}
                            >
                                <HandCoins className="h-3 w-3 mr-1" />
                                Régler
                            </Button>
                        )}
                    </>
                )}

                <div className="flex-1" />

                {/* Clear cart */}
                {hasItems && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => clearCart()}
                        title="Vider le panier"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
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
