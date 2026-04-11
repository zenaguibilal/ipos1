'use client';

import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Camera, Loader2, X, ScanLine, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface OcrLineItem {
    name: string;
    quantity: number;
    purchasePrice: number;
}

interface OcrInvoiceScannerProps {
    onItemsExtracted: (items: OcrLineItem[]) => void;
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
            // Convert to base64
            const base64 = await new Promise<string>((res, rej) => {
                const reader = new FileReader();
                reader.onload  = () => res((reader.result as string).split(',')[1]);
                reader.onerror = rej;
                reader.readAsDataURL(file);
            });

            const mediaType = file.type as 'image/jpeg' | 'image/png' | 'image/webp';

            const response = await fetch('https://api.anthropic.com/v1/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'claude-sonnet-4-20250514',
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: [
                                {
                                    type: 'image',
                                    source: { type: 'base64', media_type: mediaType, data: base64 },
                                },
                                {
                                    type: 'text',
                                    text: `Tu es un assistant OCR spécialisé dans les factures fournisseur.
Analyse cette image de facture et extrais UNIQUEMENT les lignes d'articles.
Pour chaque ligne, identifie :
- name : nom du produit (string)
- quantity : quantité (number, défaut 1 si absent)
- purchasePrice : prix unitaire HT (number, 0 si absent)

Réponds UNIQUEMENT avec du JSON valide sans aucun texte avant/après ni backticks :
[{"name":"...","quantity":1,"purchasePrice":0}]

Si aucun article n'est détecté, réponds : []`,
                                },
                            ],
                        },
                    ],
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error?.message || 'Erreur API');
            }

            const raw = data.content
                ?.map((b: any) => (b.type === 'text' ? b.text : ''))
                .join('')
                .trim()
                .replace(/```json|```/g, '')
                .trim();

            const items: OcrLineItem[] = JSON.parse(raw || '[]');

            if (!Array.isArray(items) || items.length === 0) {
                toast.warning('Aucun article détecté dans la facture.');
                setStatus('error');
                return;
            }

            const cleaned = items.map(item => ({
                name:          String(item.name || '').trim(),
                quantity:      Math.max(1, Number(item.quantity) || 1),
                purchasePrice: Math.max(0, Number(item.purchasePrice) || 0),
            })).filter(i => i.name.length > 0);

            if (cleaned.length === 0) {
                toast.warning('Données extraites non exploitables.');
                setStatus('error');
                return;
            }

            onItemsExtracted(cleaned);
            setStatus('success');
            toast.success(`${cleaned.length} article(s) extrait(s) de la facture.`);

        } catch (err: any) {
            console.error('OCR error:', err);
            toast.error('Échec de la lecture OCR.', { description: err.message });
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
                    size="sm"
                    className="gap-2 w-full border-dashed"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                >
                    <ScanLine className="h-4 w-4 text-primary" />
                    Scanner une facture fournisseur (OCR)
                </Button>
            ) : (
                <div className="relative rounded-lg overflow-hidden border border-border">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Facture" className="w-full max-h-40 object-contain bg-muted" />

                    {/* Processing overlay */}
                    {isProcessing && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-2">
                            <Loader2 className="h-6 w-6 animate-spin text-primary" />
                            <p className="text-xs font-medium">Analyse OCR en cours…</p>
                        </div>
                    )}

                    {/* Status badge */}
                    {!isProcessing && status !== 'idle' && (
                        <div className={cn(
                            'absolute top-2 right-2 flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                            status === 'success'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300'
                                : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
                        )}>
                            {status === 'success'
                                ? <CheckCircle2 className="h-3 w-3" />
                                : <AlertCircle className="h-3 w-3" />}
                            {status === 'success' ? 'Extrait' : 'Échec'}
                        </div>
                    )}

                    {/* Clear button */}
                    <button
                        onClick={clear}
                        className="absolute top-2 left-2 rounded-full bg-background/80 p-1 hover:bg-background transition-colors"
                        type="button"
                        title="Effacer"
                    >
                        <X className="h-3.5 w-3.5" />
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
