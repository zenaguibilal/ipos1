'use client';

import React, { useState, memo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2, Trash2 } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { useActiveCart, useCartActions } from '@/stores/cartStore';
import { ConfirmAlertDialog } from '../ui/ConfirmAlertDialog';

function SaleActionsContent({ payButtonRef }: { payButtonRef: React.RefObject<HTMLButtonElement> }) {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
    
    const cart = useActiveCart();
    const { clearCart } = useCartActions();
    const hasItems = !!(cart && cart.items.length > 0);

    return (
        <div className="flex flex-col gap-2">
            <div className="grid grid-cols-[auto_1fr_auto] gap-2">
                <DraftsDropdown />
                <Button 
                    ref={payButtonRef}
                    size="lg" 
                    className="h-12 text-lg font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-95 rounded-xl group bg-primary"
                    onClick={() => setIsPaymentOpen(true)}
                    disabled={!hasItems}
                >
                    <Wallet className="mr-2 h-5 w-5" />
                    <span>Payer [F2]</span>
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/5"
                    onClick={() => setIsClearConfirmOpen(true)}
                    disabled={!hasItems}
                >
                    <Trash2 className="h-5 w-5" />
                </Button>
            </div>

            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
            
            <ConfirmAlertDialog 
                isOpen={isClearConfirmOpen}
                onOpenChange={setIsClearConfirmOpen}
                title="Vider le panier ?"
                description="Cette action supprimera tous les articles de la session en cours."
                onConfirm={async () => clearCart()}
                confirmText="Vider"
            />
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
