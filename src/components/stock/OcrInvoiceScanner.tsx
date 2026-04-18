'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, ScanLine, AlertCircle, CheckCircle2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { ocrInvoice } from '@/ai/flows/ocr-invoice-flow';

export interface OcrLineItem {
    name: string;
    quantity: number;
    purchasePrice: number;
}

interface OcrInvoiceScannerProps {
    onItemsExtracted: (items: OcrLineItem[], metadata?: { supplierName?: string, invoiceNumber?: string }) => void;
    className?: string;
}

export function OcrInvoiceScanner({ onItemsExtracted, className }: OcrInvoiceScannerProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [preview, setPreview]           = useState<string | null>(null);
    const [status, setStatus]             = useState<'idle' | 'success' | 'error'>('idle');

    const processImage = useCallback(async (file: File) => {
        setIsProcessing(true);
        setStatus('idle');

        try {
            const reader = new FileReader();
            const photoDataUri = await new Promise<string>((resolve) => {
                reader.onload = () => resolve(reader.result as string);
                reader.readAsDataURL(file);
            });

            const result = await ocrInvoice({ photoDataUri });

            if (!result.items || result.items.length === 0) {
                toast.warning('لم يتم رصد أي سلع واضحة في الفاتورة.');
                setStatus('error');
                return;
            }

            onItemsExtracted(result.items, { 
                supplierName: result.supplierName, 
                invoiceNumber: result.invoiceNumber 
            });
            
            setStatus('success');
            toast.success(`${result.items.length} منتج(ات) تم استخراجها بنجاح.`);

        } catch (err: any) {
            console.error('OCR error:', err);
            toast.error('فشل محرك التحليل الذكي iPOS-AI.', { description: "تأكد من جودة الصورة وحاول مجدداً." });
            setStatus('error');
        } finally {
            setIsProcessing(false);
        }
    }, [onItemsExtracted]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setPreview(url);
        processImage(file);
        e.target.value = '';
    };

    const clear = () => {
        if (preview) URL.revokeObjectURL(preview);
        setPreview(null);
        setStatus('idle');
    };

    return (
        <div className={cn('space-y-2', className)}>
            {!preview ? (
                <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-xl border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10 transition-all gap-3 group"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                >
                    <ScanLine className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Scanner Facture (iPOS-AI)</span>
                </Button>
            ) : (
                <div className="relative rounded-2xl overflow-hidden border border-primary/20 shadow-xl bg-black/40 animate-in zoom-in-95 duration-500">
                    <img src={preview} alt="Facture Scan" className="w-full max-h-48 object-contain bg-muted/20" />

                    {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-2xl animate-pulse rounded-full"></div>
                                <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
                            </div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary animate-pulse">Extraction iPOS-AI...</p>
                        </div>
                    )}

                    {!isProcessing && status !== 'idle' && (
                        <div className={cn(
                            'absolute top-3 right-3 flex items-center gap-2 rounded-full px-4 py-1.5 text-[9px] font-black uppercase tracking-widest shadow-lg border',
                            status === 'success'
                                ? 'bg-emerald-500 text-white border-emerald-400'
                                : 'bg-destructive text-white border-destructive-foreground/20',
                        )}>
                            {status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
                            {status === 'success' ? 'Identifié' : 'Échec Scan'}
                        </div>
                    )}

                    <button
                        onClick={clear}
                        className="absolute top-3 left-3 rounded-full bg-black/60 p-2 text-white hover:bg-black transition-all hover:scale-110 active:scale-90"
                        type="button"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="sr-only"
                onChange={handleFileChange}
            />
        </div>
    );
}
