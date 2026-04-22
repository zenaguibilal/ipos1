
'use client';

import { useState, useCallback, useMemo } from 'react';
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

/**
 * Dialogue de gestion documentaire pour Facture Proforma Elite.
 * Supporte Impression locale, Export PDF HD et Partage WhatsApp natif sans cloud tiers.
 */
export function ProformaDialog({ isOpen, onOpenChange, proforma, profile, customerName }: ProformaDialogProps) {
    const [receiptType, setReceiptType] = useState<'a4' | 'thermal'>('a4');
    const [isGenerating, setIsGenerating] = useState(false);

    /**
     * handlePrint - Flux d'impression système direct.
     */
    const handlePrint = useCallback(() => {
        if (!proforma) return;
        
        const printablePortal = document.getElementById('receipt-for-print');
        const sourceElement = document.getElementById('proforma-render-inner');

        if (!printablePortal || !sourceElement) {
            toast.error("Erreur technique : Canal de sortie introuvable.");
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

    /**
     * generatePDFFile - Moteur de génération PDF HD côté client.
     */
    const generatePDFFile = async (): Promise<File | null> => {
        try {
            const [{ jsPDF }, html2canvas] = await Promise.all([
                import('jspdf'),
                import('html2canvas').then(m => m.default)
            ]);

            const element = document.getElementById('proforma-render-inner');
            if (!element) throw new Error("Source de rendu introuvable");

            const canvas = await html2canvas(element, { 
                scale: 3, 
                backgroundColor: "#ffffff",
                useCORS: true,
                logging: false
            });
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            const pdfWidth = receiptType === 'a4' ? 210 : 80;
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: [pdfWidth, pdfHeight]
            });

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            
            const blob = pdf.output('blob');
            const fileName = `Proforma_${proforma?.proformaNumber || 'Elite'}.pdf`;
            return new File([blob], fileName, { type: 'application/pdf' });
        } catch (e) {
            console.error("PDF Engine Error:", e);
            return null;
        }
    };

    const handleDownload = async () => {
        if (!proforma) return;
        setIsGenerating(true);
        const file = await generatePDFFile();
        if (file) {
            const url = URL.createObjectURL(file);
            const link = document.createElement('a');
            link.href = url;
            link.download = file.name;
            link.click();
            URL.revokeObjectURL(url);
            toast.success("Document exporté avec succès.");
        } else {
            toast.error("Échec de la génération du document HD.");
        }
        setIsGenerating(false);
    };

    /**
     * handleWhatsAppShare - Partage natif via Web Share API v2.
     * Envoie le fichier PDF réel si supporté, sinon bascule sur un lien texte.
     */
    const handleWhatsAppShare = async () => {
        if (!proforma) return;
        setIsGenerating(true);
        
        try {
            const file = await generatePDFFile();
            const shareData = {
                title: `Facture Proforma ${proforma.proformaNumber}`,
                text: `Bonjour, voici votre facture proforma ${proforma.proformaNumber} de l'établissement ${profile?.companyName || 'iPOS'}. Total: ${proforma.total} DZD.`,
                files: file ? [file] : undefined
            };

            if (file && typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share(shareData);
                toast.success("Document partagé avec succès.");
            } else {
                // Fallback : Envoi du texte seulement vers WhatsApp
                const msg = encodeURIComponent(shareData.text);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
                toast.info("Partage de fichier non supporté. Lien texte envoyé.");
                if (file) {
                    // Téléchargement automatique pour que l'utilisateur puisse l'envoyer manuellement
                    const url = URL.createObjectURL(file);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.name;
                    link.click();
                }
            }
        } catch (e: any) {
            if (e.name !== 'AbortError') toast.error("Le partage a été interrompu.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (!proforma) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col p-0 overflow-hidden border-none shadow-2xl rounded-3xl bg-card">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-lg">
                                <FileText className="h-6 w-6" />
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-black tracking-tight uppercase">Facture Proforma Elite</DialogTitle>
                                <DialogDescription className="text-xs font-bold uppercase text-primary/40 tracking-widest">Document souverain : {proforma.proformaNumber}</DialogDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 bg-background/50 p-1.5 rounded-xl border border-primary/10">
                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'thermal' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-40")}>
                                <Smartphone className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold">Ticket</span>
                            </div>
                            <Switch checked={receiptType === 'a4'} onCheckedChange={v => setReceiptType(v ? 'a4' : 'thermal')} />
                            <div className={cn("flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all", receiptType === 'a4' ? "bg-primary text-primary-foreground shadow-sm" : "opacity-40")}>
                                <FileText className="h-3.5 w-3.5" />
                                <span className="text-[10px] font-bold">A4</span>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto bg-muted/40 p-8 flex justify-center custom-scrollbar">
                    <div id="proforma-render-container" className={cn("bg-white shadow-2xl transition-all origin-top", receiptType === 'a4' ? "w-[210mm]" : "w-[80mm]")}>
                        <div id="proforma-render-inner">
                            <ProformaReceipt proforma={proforma} profile={profile} receiptType={receiptType} customerName={customerName} />
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-4 bg-card border-t border-white/5 flex flex-wrap gap-3">
                    <Button variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-11 font-bold px-6">
                        <X className="mr-2 h-4 w-4" /> Fermer
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleDownload} 
                        disabled={isGenerating} 
                        className="rounded-xl h-11 font-bold gap-2 border-primary/20 hover:bg-primary/5"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                        Télécharger PDF
                    </Button>
                    <Button 
                        variant="outline" 
                        onClick={handleWhatsAppShare} 
                        disabled={isGenerating} 
                        className="rounded-xl h-11 font-bold gap-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 hover:bg-emerald-500 hover:text-white"
                    >
                        {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                        Partager WhatsApp
                    </Button>
                    <Button onClick={handlePrint} className="rounded-xl h-11 font-black text-xs uppercase tracking-widest flex-1 shadow-xl transition-all active:scale-95 gap-3">
                        <Printer className="h-5 w-5" /> Imprimer [Thermal/A4]
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
