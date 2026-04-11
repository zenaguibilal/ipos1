'use client';

import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer, X, FileText, Smartphone } from 'lucide-react';
import type { Sale } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface PrintReceiptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
}

export function PrintReceiptDialog({
    isOpen,
    onOpenChange,
    sale,
}: PrintReceiptDialogProps) {
    const profile = useAppStore(state => state.companyProfile);
    const [receiptType, setReceiptType] = useState<'a4' | 'thermal'>('thermal');

    const handlePrint = () => window.print();

    if (!sale) return null;

    return (
        <>
            {/* Real printable container (hidden on UI) */}
            <div className="hidden print:block fixed inset-0 z-[100] bg-white">
                <Receipt sale={sale} profile={profile} receiptType={receiptType} />
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-2xl h-auto max-h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-xl rounded-2xl bg-card">
                    <DialogHeader className="p-4 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg">
                                    <Printer className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold tracking-tight">إصدار الفاتورة</DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase font-semibold text-primary/50"># {sale.invoiceNumber}</DialogDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-background/50 p-1.5 rounded-xl border border-primary/10">
                                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'thermal' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-40")}>
                                    <Smartphone className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase">80mm</span>
                                </div>
                                <Switch
                                    checked={receiptType === 'a4'}
                                    onCheckedChange={v => setReceiptType(v ? 'a4' : 'thermal')}
                                />
                                <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'a4' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-40")}>
                                    <FileText className="h-3.5 w-3.5" />
                                    <span className="text-[10px] font-bold uppercase">A4</span>
                                </div>
                            </div>
                        </div>
                    </DialogHeader>

                    {/* Preview Area */}
                    <div className="flex-grow overflow-y-auto bg-muted/30 p-6 custom-scrollbar flex justify-center">
                        <div className="origin-top scale-[0.85] sm:scale-100 transition-transform shadow-2xl">
                            <Receipt sale={sale} profile={profile} receiptType={receiptType} />
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-card border-t flex gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 font-bold flex-1">
                            <X className="mr-2 h-4 w-4" /> إغلاق
                        </Button>
                        <Button onClick={handlePrint} className="rounded-xl h-10 font-bold flex-1 shadow-lg shadow-sm transition-all active:scale-95 gap-2">
                            <Printer className="h-4 w-4" /> 
                            طباعة [P]
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
