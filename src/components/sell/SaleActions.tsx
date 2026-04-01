'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { useActiveCart } from '@/stores/cartStore';

export function SaleActions() {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const cart = useActiveCart();
    
    return (
        <div className="grid grid-cols-2 gap-2">
            <DraftsDropdown />
            <Button 
                id="sell-pay-button"
                size="lg" 
                className="h-14 text-lg"
                onClick={() => setIsPaymentOpen(true)}
                disabled={!cart || cart.items.length === 0}
            >
                <Wallet className="mr-2 h-6 w-6" />
                Payer [F2]
            </Button>
            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
        </div>
    );
}
