
'use client';

import React, { useState, useEffect, memo } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, FileText, Loader2 } from 'lucide-react';
import { DraftsDropdown } from './DraftsDropdown';
import { CustomerCombobox } from './CustomerCombobox';
import { useActiveCart } from '@/stores/cartStore';
import { ProformaDialog } from './ProformaDialog';
import { proformaService } from '@/services/proforma.service';
import { customerService } from '@/services/customer.service';
import { useAppStore } from '@/stores/appStore';
import type { ProformaInvoice, Customer } from '@/lib/types';
import { toast } from 'sonner';

interface SaleActionsProps {
    customerComboRef: React.RefObject<{ focusInput: () => void }>;
    onOpenPayment: () => void;
}

function SaleActionsContent({ customerComboRef, onOpenPayment }: SaleActionsProps) {
    const [mounted, setMounted] = useState(false);
    const cart = useActiveCart();
    const profile = useAppStore(state => state.companyProfile);
    
    const [isProformaLoading, setIsProformaLoading] = useState(false);
    const [isProformaDialogOpen, setIsProformaDialogOpen] = useState(false);
    const [generatedProforma, setGeneratedProforma] = useState<ProformaInvoice | null>(null);
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (cart?.customerUuid) {
            customerService.getCustomerByUuid(cart.customerUuid).then(c => setSelectedCustomer(c || null));
        } else {
            setSelectedCustomer(null);
        }
    }, [cart?.customerUuid]);

    const handleCreateProforma = async () => {
        if (!cart || cart.items.length === 0) {
            toast.error("Le panier est vide");
            return;
        }

        setIsProformaLoading(true);
        try {
            const pf = await proformaService.createProformaFromCart(cart);
            setGeneratedProforma(pf);
            setIsProformaDialogOpen(true);
            toast.success("Facture Proforma générée");
        } catch (e: any) {
            toast.error(e.message || "Erreur de génération");
        } finally {
            setIsProformaLoading(false);
        }
    };

    const hasItems = !!(mounted && cart && cart.items.length > 0);

    return (
        <>
            <div className="flex items-center gap-2">
                <DraftsDropdown />
                <CustomerCombobox ref={customerComboRef} />
                
                <Button
                    variant="outline"
                    className="h-9 font-semibold gap-2 border-primary/20 hover:bg-primary/5 hidden sm:flex"
                    onClick={handleCreateProforma}
                    disabled={!hasItems || isProformaLoading}
                >
                    {isProformaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Proforma
                </Button>

                <Button
                    className="flex-1 h-9 font-semibold gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all"
                    onClick={onOpenPayment}
                    disabled={!hasItems}
                >
                    <Wallet className="h-4 w-4" />
                    Payer [F10]
                </Button>
            </div>

            <ProformaDialog 
                isOpen={isProformaDialogOpen}
                onOpenChange={setIsProformaDialogOpen}
                proforma={generatedProforma}
                profile={profile}
                customerName={selectedCustomer ? `${selectedCustomer.firstName} ${selectedCustomer.lastName}` : undefined}
            />
        </>
    );
}

export const SaleActions = memo(SaleActionsContent);
SaleActions.displayName = 'SaleActions';
