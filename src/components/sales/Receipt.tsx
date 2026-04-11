'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { formatCurrency, safeToDate } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import QRCode from 'qrcode';

interface ReceiptProps {
    sale: Sale;
    profile: CompanyProfile | null;
    receiptType: 'a4' | 'thermal';
}

const QRCodeCanvas = ({ text }: { text: string }) => {
    const ref = React.useRef<HTMLCanvasElement>(null);
    React.useEffect(() => {
        if (ref.current && text) {
            QRCode.toCanvas(ref.current, text, { width: 80, margin: 1, color: { dark: '#000000', light: '#ffffff' } }, () => {});
        }
    }, [text]);
    return <canvas ref={ref} className="mx-auto" />;
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType }, ref) => {
        const thermal = receiptType === 'thermal';

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white text-black font-sans leading-tight',
                    thermal
                        ? 'w-[80mm] text-[10pt] px-4 py-6 thermal-receipt'
                        : 'w-[210mm] min-h-[297mm] mx-auto px-12 py-12 text-[11pt] shadow-sm border border-gray-100',
                )}
            >
                {/* Header Section */}
                <header className="text-center mb-4">
                    <p className={cn('font-bold uppercase tracking-tighter', thermal ? 'text-lg' : 'text-2xl')}>
                        {profile?.companyName || 'SMART IPOS SYSTEM'}
                    </p>
                    <div className="text-[9pt] text-gray-700 mt-1 space-y-0.5">
                        {profile?.address && <p>{profile.address}</p>}
                        {profile?.phone && <p className="font-semibold">Tél: {profile.phone}</p>}
                        {profile?.email && <p>{profile.email}</p>}
                    </div>
                </header>

                <div className="border-b-2 border-black mb-4" />

                {/* Metadata */}
                <section className="text-[9pt] mb-4 space-y-1">
                    <div className="flex justify-between font-bold">
                        <span>FACTURE N°:</span>
                        <span className="font-mono">{sale.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>DATE & HEURE:</span>
                        <span>
                            {format(
                                safeToDate(sale.createdAt!),
                                'dd/MM/yyyy HH:mm',
                                { locale: fr },
                            )}
                        </span>
                    </div>
                    {sale.customerUuid && (
                        <div className="flex justify-between italic">
                            <span>CLIENT:</span>
                            <span className="font-bold"># {sale.customerUuid.substring(0, 8)}</span>
                        </div>
                    )}
                </section>

                <div className="border-b border-dashed border-gray-400 mb-2" />

                {/* Items Table */}
                <table className="w-full text-[9pt] mb-4 border-collapse">
                    <thead>
                        <tr className="border-b-2 border-black text-left">
                            <th className="pb-1 font-bold">ARTICLE</th>
                            <th className="pb-1 text-center font-bold w-10">QTÉ</th>
                            {!thermal && <th className="pb-1 text-right font-bold w-20">P.U</th>}
                            <th className="pb-1 text-right font-bold w-24">TOTAL</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {sale.items.map((item, i) => (
                            <tr key={i} className="align-top">
                                <td className="py-2 pr-2 font-medium leading-none">{item.name}</td>
                                <td className="py-2 text-center font-mono">{item.quantity}</td>
                                {!thermal && <td className="py-2 text-right font-mono">{Number(item.price || 0).toFixed(2)}</td>}
                                <td className="py-2 text-right font-bold font-mono">
                                    {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="border-t-2 border-black pt-2 space-y-1.5">
                    <div className="flex justify-between text-[9pt]">
                        <span>SOUS-TOTAL:</span>
                        <span className="font-mono">{formatCurrency(sale.subtotal)}</span>
                    </div>
                    {sale.discountAmount && sale.discountAmount > 0 && (
                        <div className="flex justify-between text-[9pt] text-gray-600">
                            <span>REMISE:</span>
                            <span className="font-mono">-{formatCurrency(sale.discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-extrabold text-[12pt] border-y border-black py-1 my-1">
                        <span>TOTAL NET:</span>
                        <span className="font-mono">{formatCurrency(sale.total)}</span>
                    </div>
                    <div className="flex justify-between text-[10pt] font-medium">
                        <span>REÇU CLIENT:</span>
                        <span className="font-mono">{formatCurrency(sale.amountPaid)}</span>
                    </div>
                    <div className="flex justify-between text-[10pt] font-bold">
                        <span>
                            {sale.remainingBalance > 0.01 ? 'SOLDE DÛ (DETTE):' : 'MONNAIE RENDUE:'}
                        </span>
                        <span className="font-mono text-lg">
                            {formatCurrency(Math.abs(sale.remainingBalance))}
                        </span>
                    </div>
                </div>

                {/* Footer with QR */}
                <footer className="text-center mt-8 border-t border-dashed border-gray-300 pt-4">
                    <p className="text-[8pt] font-bold italic mb-4">MERCI DE VOTRE VISITE ET À BIENTÔT !</p>
                    <div className="flex flex-col items-center gap-2">
                        <QRCodeCanvas text={sale.invoiceNumber} />
                        <p className="text-[7pt] font-mono opacity-50 uppercase tracking-widest">Digital Auth Verified</p>
                    </div>
                </footer>
            </div>
        );
    },
);
Receipt.displayName = 'Receipt';