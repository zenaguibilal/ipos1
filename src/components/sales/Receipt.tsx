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
            QRCode.toCanvas(ref.current, text, { width: 72, margin: 1 }, () => {});
        }
    }, [text]);
    return <canvas ref={ref} />;
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType }, ref) => {
        const thermal = receiptType === 'thermal';

        return (
            <div
                ref={ref}
                className={cn(
                    'bg-white text-black font-sans',
                    thermal
                        ? 'w-[80mm] text-[9pt] px-3 py-2 thermal-receipt'
                        : 'w-[190mm] mx-auto px-8 py-10 text-[11pt] shadow-sm',
                )}
            >
                {/* Header */}
                <header className="text-center mb-3">
                    <p className={cn('font-bold', thermal ? 'text-base' : 'text-xl')}>
                        {profile?.companyName || 'Mon Commerce'}
                    </p>
                    {profile?.address && (
                        <p className="text-[9pt] text-gray-600">{profile.address}</p>
                    )}
                    {profile?.phone && (
                        <p className="text-[9pt] text-gray-600">Tél: {profile.phone}</p>
                    )}
                </header>

                <hr className="border-dashed border-gray-400 my-2" />

                {/* Meta */}
                <section className="text-[8.5pt] mb-2 space-y-0.5">
                    <div className="flex justify-between">
                        <span>Facture #:</span>
                        <span className="font-bold">{sale.invoiceNumber}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Date:</span>
                        <span>
                            {format(
                                safeToDate(sale.createdAt!),
                                'dd/MM/yyyy HH:mm',
                                { locale: fr },
                            )}
                        </span>
                    </div>
                </section>

                <hr className="border-dashed border-gray-400 my-2" />

                {/* Items */}
                <table className="w-full text-[8.5pt] mb-2">
                    <thead>
                        <tr className="border-b border-dashed border-gray-400">
                            <th className="text-left pb-1 font-semibold">Article</th>
                            <th className="text-center pb-1 font-semibold w-8">Qté</th>
                            <th className="text-right pb-1 font-semibold w-16">P.U</th>
                            <th className="text-right pb-1 font-semibold w-16">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sale.items.map((item, i) => (
                            <tr key={i}>
                                <td className="py-0.5">{item.name}</td>
                                <td className="text-center py-0.5">{item.quantity}</td>
                                <td className="text-right py-0.5">
                                    {Number(item.price || 0).toFixed(1)}
                                </td>
                                <td className="text-right py-0.5 font-medium">
                                    {(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(1)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <hr className="border-dashed border-gray-400 my-2" />

                {/* Totals */}
                <section className="text-[9pt] space-y-0.5">
                    <div className="flex justify-between">
                        <span>Sous-total:</span>
                        <span>{formatCurrency(sale.subtotal)}</span>
                    </div>
                    {sale.discountAmount && sale.discountAmount > 0 && (
                        <div className="flex justify-between text-gray-600">
                            <span>Remise:</span>
                            <span>-{formatCurrency(sale.discountAmount)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-[10.5pt] border-t border-gray-400 pt-1 mt-1">
                        <span>TOTAL:</span>
                        <span>{formatCurrency(sale.total)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Montant payé:</span>
                        <span>{formatCurrency(sale.amountPaid)}</span>
                    </div>
                    {/* FIX #23: correct label logic */}
                    <div className="flex justify-between font-medium">
                        <span>
                            {sale.remainingBalance > 0.01
                                ? 'Solde restant:'
                                : 'Monnaie rendue:'}
                        </span>
                        <span>{formatCurrency(Math.abs(sale.remainingBalance))}</span>
                    </div>
                </section>

                {/* Footer */}
                <footer className="text-center mt-4 text-[8pt] text-gray-500">
                    <p>Merci de votre visite !</p>
                    {thermal && (
                        <div className="mx-auto w-fit mt-2">
                            <QRCodeCanvas text={sale.invoiceNumber} />
                        </div>
                    )}
                </footer>
            </div>
        );
    },
);
Receipt.displayName = 'Receipt';
