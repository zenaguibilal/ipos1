'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Receipt } from './Receipt';
import { Printer, X, FileText, Smartphone, MessageCircle, Loader2 } from 'lucide-react';
import type { Sale, Customer } from '@/lib/types';
import { useAppStore } from '@/stores/appStore';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { customerService } from '@/services/customer.service';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface PrintReceiptDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    sale: Sale | null;
    customerName?: string;
}

export function PrintReceiptDialog({
    isOpen,
    onOpenChange,
    sale,
    customerName,
}: PrintReceiptDialogProps) {
    const profile = useAppStore(state => state.companyProfile);
    const [receiptType, setReceiptType] = useState<'a4' | 'thermal'>('a4'); 
    const [isGenerating, setIsGenerating] = useState(false);
    const [customer, setCustomer] = useState<Customer | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    /**
     * Calcul critique du solde avant opération :
     * Solde Ancien = Solde Actuel (DB) - (Total Vente - Déjà Payé)
     */
    const oldBalance = useMemo(() => {
        if (!customer || !sale) return 0;
        const currentDebtOfThisSale = sale.total - sale.amountPaid;
        return Math.max(0, customer.outstandingBalance - currentDebtOfThisSale);
    }, [customer, sale]);

    useEffect(() => {
        if (isOpen && sale?.customerUuid) {
            customerService.getCustomerByUuid(sale.customerUuid)
                .then(c => {
                    if (c) setCustomer(c);
                })
                .catch(err => console.error("Error fetching customer for receipt:", err));
        } else {
            setCustomer(null);
        }
    }, [isOpen, sale]);

    const resolvedCustomerName = useMemo(() => {
        if (customer) return `${customer.firstName} ${customer.lastName}`;
        if (customerName && customerName !== 'Client de passage') return customerName;
        return 'Client de passage';
    }, [customer, customerName]);

    const handlePrint = useCallback(() => {
        if (typeof window !== 'undefined') window.print();
    }, []);

    useKeyboardShortcuts([
        {
            key: 'p',
            action: handlePrint,
            description: 'Imprimer le document',
            ignoreInputFocus: true
        },
        {
            key: 'Escape',
            action: () => onOpenChange(false),
            description: 'Fermer la fenêtre',
            ignoreInputFocus: true
        }
    ], 'Impression', isOpen);

    const handleWhatsAppShare = useCallback(async () => {
        if (!sale) return;
        setIsGenerating(true);

        try {
            const { jsPDF } = await import('jspdf');
            const html2canvas = (await import('html2canvas')).default;

            const element = receiptRef.current;
            if (!element) throw new Error("Référence document non trouvée");

            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff"
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: receiptType === 'a4' ? 'a4' : [80, 297]
            });

            const imgWidth = receiptType === 'a4' ? 210 : 80;
            const imgHeight = canvas.height * imgWidth / canvas.width;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            const pdfBlob = pdf.output('blob');
            const fileName = `BL-${sale.invoiceNumber}.pdf`;

            if (navigator.share && navigator.canShare && navigator.canShare({ files: [new File([pdfBlob], fileName, { type: 'application/pdf' })] })) {
                const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
                await navigator.share({
                    files: [file],
                    title: `Bon de Livraison iPOS ${sale.invoiceNumber}`,
                    text: `Bonjour, voici votre bon de livraison n°${sale.invoiceNumber}.`
                });
            } else {
                const url = URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.click();
                URL.revokeObjectURL(url);
                toast.success("PDF généré et téléchargé.");
            }
        } catch (error: any) {
            console.error("Erreur PDF:", error);
            toast.error("Échec de la génération du PDF.");
        } finally {
            setIsGenerating(false);
        }
    }, [sale, receiptType, customer]);

    if (!sale) return null;

    return (
        <>
            {/* Conteneur masqué pour l'impression système réelle */}
            <div className="hidden print:block fixed inset-0 z-[100] bg-white">
                <Receipt 
                    sale={sale} 
                    profile={profile} 
                    receiptType={receiptType} 
                    customerName={resolvedCustomerName} 
                    oldBalance={oldBalance}
                />
            </div>

            <Dialog open={isOpen} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-4xl h-auto max-h-[95vh] flex flex-col p-0 overflow-hidden border-none shadow-xl rounded-2xl bg-card">
                    <DialogHeader className="p-4 bg-primary/5 border-b border-primary/10">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-lg">
                                    <FileText className="h-5 w-5" />
                                </div>
                                <div>
                                    <DialogTitle className="text-lg font-bold tracking-tight">Impression Bon de Livraison</DialogTitle>
                                    <DialogDescription className="text-[10px] uppercase font-semibold text-primary/50">RÉFÉRENCE # {sale.invoiceNumber}</DialogDescription>
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

                    <div className="flex-grow overflow-y-auto bg-muted/30 p-6 custom-scrollbar flex justify-center">
                        <div className={cn("bg-white shadow-2xl transition-all origin-top", receiptType === 'a4' ? "scale-[0.7] sm:scale-[0.85] lg:scale-100" : "scale-100")} ref={receiptRef}>
                            <Receipt 
                                sale={sale} 
                                profile={profile} 
                                receiptType={receiptType} 
                                customerName={resolvedCustomerName} 
                                oldBalance={oldBalance}
                            />
                        </div>
                    </div>

                    <DialogFooter className="p-4 bg-card border-t flex flex-wrap gap-3">
                        <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 font-bold px-6">
                            <X className="mr-2 h-4 w-4" /> Fermer
                        </Button>
                        
                        <Button 
                            variant="outline"
                            onClick={handleWhatsAppShare} 
                            disabled={isGenerating}
                            className="rounded-xl h-10 font-bold border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white transition-all gap-2"
                        >
                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                            Partager PDF
                        </Button>

                        <Button onClick={handlePrint} className="rounded-xl h-10 font-bold flex-1 shadow-lg shadow-sm transition-all active:scale-95 gap-2">
                            <Printer className="h-4 w-4" /> 
                            Imprimer [P]
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
