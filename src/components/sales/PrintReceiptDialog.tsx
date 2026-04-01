'use client';

import { useRef, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, X } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { Receipt } from './Receipt';
import { useAppStore } from '@/stores/appStore';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';

interface PrintReceiptDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  sale: Sale | null;
}

export function PrintReceiptDialog({ isOpen, onOpenChange, sale }: PrintReceiptDialogProps) {
    const profile = useAppStore((state) => state.companyProfile);
    const printRef = useRef<HTMLDivElement>(null);
    const [receiptType, setReceiptType] = useState<'a4' | 'thermal'>('thermal');

    const handlePrint = () => {
        const printableContent = document.getElementById('receipt-for-print');
        const receiptElement = printRef.current;
        if (!printableContent || !receiptElement) return;

        const contentClone = receiptElement.cloneNode(true) as HTMLDivElement;
        
        printableContent.innerHTML = '';
        printableContent.appendChild(contentClone);
        
        const html = document.querySelector('html');
        if (receiptType === 'thermal') {
            html?.classList.add('thermal');
        }

        window.print();
        
        if (receiptType === 'thermal') {
            html?.classList.remove('thermal');
        }
    };
    
    if (!sale) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col print-dialog-content">
                <DialogHeader className="print-hide">
                    <DialogTitle>Reçu de Vente</DialogTitle>
                    <DialogDescription>Aperçu du reçu pour impression.</DialogDescription>
                </DialogHeader>
                
                <div className="print-hide mx-auto p-4">
                    <RadioGroup defaultValue="thermal" onValueChange={(v) => setReceiptType(v as any)} className="flex gap-4">
                         <div className="flex items-center space-x-2">
                            <RadioGroupItem value="thermal" id="r-thermal" />
                            <Label htmlFor="r-thermal">Thermique (80mm)</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="a4" id="r-a4" />
                            <Label htmlFor="r-a4">Format A4</Label>
                        </div>
                    </RadioGroup>
                </div>

                <div id="label-print-area-wrapper" className="flex-grow overflow-y-auto bg-muted/50 p-4 rounded-md">
                    <Receipt ref={printRef} sale={sale} profile={profile} receiptType={receiptType} />
                </div>
                
                <DialogFooter className="print-hide pt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}><X className="mr-2 h-4 w-4"/>Fermer</Button>
                    <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimer</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
