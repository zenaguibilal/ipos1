'use client';

import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { CustomerCombobox } from './CustomerCombobox';
import { useActiveCart } from '@/stores/cartStore';

interface SaleActionsProps {
    customerComboRef: React.RefObject<{ focusInput: () => void }>;
    onOpenPayment: () => void;
}

function SaleActionsContent({ customerComboRef, onOpenPayment }: SaleActionsProps) {
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
                className="flex-1 h-9 font-semibold gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                onClick={onOpenPayment}
                disabled={!hasItems}
            >
                <Wallet className="h-4 w-4" />
                Payer [F4]
            </Button>
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
