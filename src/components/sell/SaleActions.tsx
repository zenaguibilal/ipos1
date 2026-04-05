'use client';

import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2 } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { useActiveCart } from '@/stores/cartStore';

interface SaleActionsProps {
    payButtonRef: React.RefObject<HTMLButtonElement>;
}

/**
 * SaleActions - Finalization controllers.
 * Memoized to prevent button re-rendering on every cart tick.
 */
function SaleActionsContent({ payButtonRef }: SaleActionsProps) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const cart = useActiveCart();
    const hasItems = !!(cart && cart.items.length > 0);
    
    return (
        <div className="grid grid-cols-[auto_1fr] gap-4">
            <DraftsDropdown />
            <Button 
                ref={payButtonRef}
                size="lg" 
                className="h-16 text-xl font-black shadow-xl shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 rounded-2xl group"
                onClick={() => setIsPaymentOpen(true)}
                disabled={!hasItems}
                aria-label="Procéder au paiement final"
            >
                <Wallet className="mr-3 h-6 w-6 transition-transform group-hover:scale-110" />
                <span>Payer [F2]</span>
                <CheckCircle2 className="ml-3 h-5 w-5 opacity-30 group-hover:opacity-100 transition-opacity" />
            </Button>
            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
