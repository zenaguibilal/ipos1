'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer, X } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface PrintReceiptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    /** When true the dialog auto-triggers print and closes (autoprint mode) */
    autoPrint?: boolean;
}

export function PrintReceiptDialog({
    isOpen,
    onOpenChange,
    sale,
    autoPrint = false,
}: PrintReceiptDialogProps) {
    const profile = useAppStore(state => state.companyProfile);
    const [receiptType, setReceiptType] = useState<'a4' | 'thermal'>('thermal');
    const receiptRef = useRef<HTMLDivElement>(null);
    const hasPrinted = useRef(false);

    /* AutoPrint: fire once when dialog opens with a sale */
    useEffect(() => {
        if (!autoPrint || !isOpen || !sale) return;
        if (hasPrinted.current) return;
        hasPrinted.current = true;

        const timer = setTimeout(() => {
            window.print();
            onOpenChange(false);
        }, 200);

        return () => clearTimeout(timer);
    }, [autoPrint, isOpen, sale, onOpenChange]);

    /* Reset guard when sale changes */
    useEffect(() => {
        hasPrinted.current = false;
    }, [sale?.uuid]);

    const handlePrint = () => window.print();

    if (!sale) return null;

    return (
        <>
            {/* Hidden receipt rendered for @media print */}
            <div className="hidden print:block">
                <Receipt ref={receiptRef} sale={sale} profile={profile} receiptType={receiptType} />
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Printer className="h-4 w-4 text-primary" />
                            Imprimer le reçu
                        </DialogTitle>
                    </DialogHeader>

                    <div className="flex items-center gap-6 py-2 border-b border-border">
                        <div className="flex items-center gap-2">
                            <Switch
                                id="receipt-type"
                                checked={receiptType === 'thermal'}
                                onCheckedChange={v => setReceiptType(v ? 'thermal' : 'a4')}
                            />
                            <Label htmlFor="receipt-type" className="text-sm">
                                Ticket thermique 80mm
                            </Label>
                        </div>
                    </div>

                    {/* Preview */}
                    <div className="overflow-auto border border-border rounded-lg bg-gray-50 p-4 flex justify-center">
                        <Receipt sale={sale} profile={profile} receiptType={receiptType} />
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4 mr-1" /> Fermer
                        </Button>
                        <Button size="sm" onClick={handlePrint}>
                            <Printer className="h-4 w-4 mr-1" /> Imprimer
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
