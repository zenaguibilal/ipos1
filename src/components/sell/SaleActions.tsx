'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Wallet, CheckCircle2 } from 'lucide-react';
import { PaymentDialog } from './PaymentDialog';
import { DraftsDropdown } from './DraftsDropdown';
import { useActiveCart } from '@/stores/cartStore';

export function SaleActions() {
    const [isPaymentOpen, setIsPaymentOpen] = useState(false);
    const cart = useActiveCart();
    
    return (
        <div className="grid grid-cols-[auto_1fr] gap-3">
            <DraftsDropdown />
            <Button 
                id="sell-pay-button"
                size="lg" 
                className="h-14 text-xl font-black shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95"
                onClick={() => setIsPaymentOpen(true)}
                disabled={!cart || cart.items.length === 0}
            >
                <Wallet className="mr-3 h-6 w-6" />
                <span>Payer [F2]</span>
                <CheckCircle2 className="ml-2 h-5 w-5 opacity-50" />
            </Button>
            <PaymentDialog isOpen={isPaymentOpen} onOpenChange={setIsPaymentOpen} />
        </div>
    );
}