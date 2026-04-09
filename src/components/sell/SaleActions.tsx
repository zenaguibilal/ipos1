'use client';

import React, { useState, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, Trash2 } from 'lucide-react';
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
                    className="h-12 text-base font-black shadow-lg shadow-primary/20 transition-all active:scale-95 rounded-xl group bg-primary hover:bg-primary/90"
                    onClick={() => setIsPaymentOpen(true)}
                    disabled={!hasItems}
                >
                    <Wallet className="mr-2 h-4 w-4" />
                    <span>Encaisser [F2]</span>
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl text-muted-foreground/20 hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setIsClearConfirmOpen(true)}
                    disabled={!hasItems}
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>

            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
            
            <ConfirmAlertDialog 
                isOpen={isClearConfirmOpen}
                onOpenChange={setIsClearConfirmOpen}
                title="Vider le panier ?"
                description="Cette action supprimera tous les articles de la session en كورس."
                onConfirm={async () => clearCart()}
                confirmText="Vider"
            />
        </div>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
