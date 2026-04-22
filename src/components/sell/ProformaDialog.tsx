
'use client';

import { useState, useRef, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
    Printer, 
    Download, 
    MessageCircle, 
    X, 
    FileText, 
    Loader2,
    Smartphone
} from 'lucide-react';
import type { ProformaInvoice, CompanyProfile } from '@/lib/types';
import { ProformaReceipt } from './ProformaReceipt';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';

interface ProformaDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    proforma: ProformaInvoice | null;
    profile: CompanyProfile | null;
    customerName?: string;
}

export function ProformaDialog({ isOpen, onOpenChange, proforma, profile, customerName }: ProformaDialogProps) {
    const [receiptType, setReceiptType] = useState<'a4' | 'thermal'>('a4');
    const [isGenerating, setIsGenerating] = useState(false);
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = useCallback(() => {
        if (!proforma) return;
        
        const printablePortal = document.getElementById('receipt-for-print');
        const sourceElement = document.getElementById('proforma-render-inner');

        if (!printablePortal || !sourceElement) {
            toast.error("Erreur de canal de sortie");
            return;
        }

        const clone = sourceElement.cloneNode(true) as HTMLDivElement;
        clone.style.width = receiptType === 'a4' ? '210mm' : '80mm';
        
        printablePortal.innerHTML = '';
        printablePortal.appendChild(clone);

        setTimeout(() => {
            window.print();
        }, 300);
    }, [proforma, receiptType]);

    const generatePDFBlob = async (): Promise<Blob | null> => {
        try {
            const [{ jsPDF }, html2canvas] = await Promise.all([
                import('jspdf'),
                import('html2canvas').then(m => m.default)
            ]);

            const element = document.getElementById('proforma-render-inner');
            if (!element) throw new Error("Rendu introuvable");

            const canvas = await html2canvas(element, { scale: 2, backgroundColor: "#ffffff" });
            const imgData = canvas.toDataURL('image/png');
            
            const pdfWidth = receiptType === 'a4' ? 210 : 80;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            return pdf.output('blob');
        } catch (e) {
            console.error(e);
            return null;
        }
    };

    const handleDownloadPDF = async () => {
        if (!proforma) return;
        setIsGenerating(true);
        const blob = await generatePDFBlob();
        if (blob) {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Proforma_${proforma.proformaNumber}.pdf`;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Document exporté");
        } else {
            toast.error("Erreur de génération PDF");
        }
        setIsGenerating(false);
    };

    const handleWhatsAppShare = async () => {
        if (!proforma) return;
        setIsGenerating(true);
        
        const blob = await generatePDFBlob();
        const fileName = `Proforma_${proforma.proformaNumber}.pdf`;

        if (blob && navigator.share && navigator.canShare && navigator.canShare({ files: [new File([blob], fileName, { type: 'application/pdf' })] })) {
            try {
                const file = new File([blob], fileName, { type: 'application/pdf' });
                await navigator.share({
                    files: [file],
                    title: `Facture Proforma ${proforma.proformaNumber}`,
                    text: `Bonjour, voici votre facture proforma ${proforma.proformaNumber}, total: ${proforma.total} DZD.`,
                });
                toast.success("Document partagé");
            } catch (e: any) {
                if (e.name !== 'AbortError') toast.error("Échec du partage");
            }
        } else {
            // Fallback simple message si le partage de fichier n'est pas supporté
            const msg = encodeURIComponent(`Bonjour, voici votre facture proforma ${proforma.proformaNumber}, total: ${proforma.total} DZD. Document disponible sur demande.`);
            window.open(`https://wa.me/?text=${msg}`, '_blank');
            toast.info("Lien de texte partagé (partage de fichier non supporté)");
        }
        setIsGenerating(false);
    };

    if (!proforma) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl bg-card">
                <DialogHeader className="p-6 bg-muted/20 border-b border-white/5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 rounded-2xl bg-primary text-primary-foreground shadow-lg">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight uppercase">Facture Proforma</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase opacity-50">Document documentaire : {proforma.proformaNumber}</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-background/50 p-1.5 rounded-xl border border-white/5">
                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'thermal' ? "bg-primary text-primary-foreground" : "opacity-40")}>
                                <Smartphone className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold">Ticket</span>
                            </div>
                            <Switch checked={receiptType === 'a4'} onCheckedChange={v => setReceiptType(v ? 'a4' : 'thermal')} />
                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'a4' ? "bg-primary text-primary-foreground" : "opacity-40")}>
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold">A4</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto bg-muted/40 p-6 flex justify-center custom-scrollbar">
                    <div id="proforma-render-container" className={cn("bg-white shadow-2xl transition-all", receiptType === 'a4' ? "w-[210mm]" : "w-[80mm]")}>
                        <div id="proforma-render-inner">
                            <ProformaReceipt proforma={proforma} profile={profile} receiptType={receiptType} customerName={customerName} />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-card border-t border-white/5 flex flex-wrap gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-11 font-bold px-6">
                        <X className="mr-2 h-4 w-4" /> Fermer
                    </Button>
                    <Button variant="outline" onClick={handleDownloadPDF} disabled={isGenerating} className="rounded-xl h-11 font-bold gap-2">
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Exporter PDF
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleWhatsAppShare} 
                        disabled={isGenerating} 
                        className="rounded-xl h-11 font-bold gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        Partager
                    </Button>
                    <Button onClick={handlePrint} className="rounded-xl h-11 font-black text-xs uppercase tracking-widest flex-1 shadow-xl gap-3">
                        <Printer className="h-5 w-5" /> Imprimer
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
