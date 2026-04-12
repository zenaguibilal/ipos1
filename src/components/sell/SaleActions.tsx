'use client';

import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { CustomerCombobox } from './CustomerCombobox';
import { useActiveCart } from '@/stores/cartStore';

interface SaleActionsProps {
    payButtonRef: React.RefObject<HTMLButtonElement>;
    customerComboRef: React.RefObject<HTMLButtonElement>;
}

function SaleActionsContent({ payButtonRef, customerComboRef }: SaleActionsProps) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const cart = useActiveCart();

    useEffect(() => {
        setMounted(true);
    }, []);

    const hasItems = !!(mounted && cart && cart.items.length > 0);

    return (
        <div className="flex items-center gap-2">
            <DraftsDropdown />
            <CustomerCombobox ref={customerComboRef} />
            <Button
                ref={payButtonRef}
                className="flex-1 h-9 font-semibold gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                onClick={() => setIsPaymentOpen(true)}
                disabled={!hasItems}
            >
                <Wallet className="h-4 w-4" />
                Payer [F2]
            </Button>
            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
