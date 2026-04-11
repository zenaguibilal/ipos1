'use client';

import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { useActiveCart } from '@/stores/cartStore';

interface SaleActionsProps {
    payButtonRef: React.RefObject<HTMLButtonElement>;
}

function SaleActionsContent({ payButtonRef }: SaleActionsProps) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const cart    = useActiveCart();
    const hasItems = !!(cart && cart.items.length > 0);

    return (
        <div className="flex items-center gap-2">
            <DraftsDropdown />
            <Button
                ref={payButtonRef}
                className="flex-1 h-9 font-semibold gap-2"
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