'use client';

import { useEffect, useRef, useCallback, memo, useState } from 'react';
import { ProductSelector } from '@/components/sell/ProductSearch';
import { CartDisplay } from '@/components/sell/CartDisplay';
import { CartTotalBar } from '@/components/sell/CartTotalBar';
import { SaleActions } from '@/components/sell/SaleActions';
import { useCartActions, useActiveCart } from '@/stores/cartStore';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { PaymentDialog } from '@/components/sell/PaymentDialog';
import { toast } from 'sonner';
import { ConfirmAlertDialog } from '@/components/ui/ConfirmAlertDialog';

function SellPageContent() {
    const cart = useActiveCart();
    const { createCart, clearCart, selectCart } = useCartActions();
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

    // Références pour le focus programmatique
    const searchInputRef = useRef<{ focusInput: () => void }>(null);
    const customerComboRef = useRef<{ focusInput: () => void }>(null);

    const shortcuts = [
        {
            key: 'F2',
            action: () => customerComboRef.current?.focusInput(),
            description: 'Identifier un client',
            ignoreInputFocus: true
        },
        {
            key: 'F3',
            action: () => searchInputRef.current?.focusInput(),
            description: 'Rechercher un produit',
            ignoreInputFocus: true
        },
        {
            key: 'F4',
            action: () => {
                if (cart && cart.items.length > 0) setIsPaymentOpen(true);
                else toast.error("Le panier est vide");
            },
            description: 'Ouvrir l\'encaissement',
            ignoreInputFocus: true
        },
        {
            key: ' ',
            action: () => searchInputRef.current?.focusInput(),
            description: 'Focus sur la recherche',
            ignoreInputFocus: false
        },
        {
            key: 'Backspace',
            ctrl: true,
            action: () => {
                if (cart && cart.items.length > 0) setIsClearConfirmOpen(true);
            },
            description: 'Vider le panier actuel',
            ignoreInputFocus: true
        },
        {
            key: 'w',
            ctrl: true,
            action: () => {
                createCart();
                toast.success('Vente suspendue. Nouveau panier créé.');
            },
            description: 'Suspendre la vente et créer un nouveau panier',
            ignoreInputFocus: true
        }
    ];

    useKeyboardShortcuts(shortcuts, 'Vente');

    return (
        <div className="h-full flex flex-col p-2 gap-2 overflow-hidden bg-background">
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 flex-grow min-h-0">
                {/* Cart panel */}
                <div className="lg:col-span-3 flex flex-col bg-card border border-border rounded-lg overflow-hidden min-h-0 shadow-sm">
                    <CartDisplay />
                    <div className="mt-auto p-3 space-y-3 border-t border-border bg-muted/20">
                        <CartTotalBar />
                        <SaleActions 
                            customerComboRef={customerComboRef}
                            onOpenPayment={() => setIsPaymentOpen(true)}
                        />
                    </div>
                </div>

                {/* Product search panel */}
                <div className="lg:col-span-2 flex flex-col min-h-0">
                    <ProductSelector ref={searchInputRef} />
                </div>
            </div>

            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
            
            <ConfirmAlertDialog
                isOpen={isClearConfirmOpen}
                onOpenChange={setIsClearConfirmOpen}
                title="Vider le panier ?"
                description="Tous les articles de la vente en cours seront supprimés définitivement."
                onConfirm={async () => {
                    clearCart();
                    toast.success("Panier vidé");
                }}
                confirmText="Vider"
            />
        </div>
    );
}

const SellPage = memo(SellPageContent);
SellPage.displayName = 'SellPage';
export default SellPage;
