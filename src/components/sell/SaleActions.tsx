'use client';

import React, { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2, Trash2 } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';

interface SaleActionsProps {
    payButtonRef: React.RefObject<HTMLButtonElement>;
}

/**
 * SaleActions - Finalization controllers.
 * Senior Review Note: Memoized to prevent button re-rendering on every cart tick.
 */
function SaleActionsContent({ payButtonRef }: SaleActionsProps) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    
    const cart = useActiveCart();
    const { clearCart } = useCartActions();
    const hasItems = !!(cart && cart.items.length > 0);

    const handleClearCart = useCallback(async () => {
        clearCart();
    }, [clearCart]);
    
    return (
        <div className="flex flex-col gap-4">
            <div className="grid grid-cols-[auto_1fr_auto] gap-4">
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
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-16 w-16 rounded-2xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={() => setIsClearConfirmOpen(true)}
                    disabled={!hasItems}
                    title="Vider le manifeste"
                >
                    <Trash2 className="h-6 w-6" />
                </Button>
            </div>

            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
            
            <ConfirmAlertDialog 
                isOpen={isClearConfirmOpen}
                onOpenChange={setIsClearConfirmOpen}
                title="Vider le manifeste actuel ?"
                description="Cette action supprimera tous les articles de la session en cours. Cette opération est irréversible."
                onConfirm={handleClearCart}
                confirmText="Vider le panier"
            />
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
