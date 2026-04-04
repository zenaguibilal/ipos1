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
    const canvasRef = React.useRef<HTMLCanvasElement>(null);

    React.useEffect(() => {
        if (canvasRef.current && text) {
            QRCode.toCanvas(canvasRef.current, text, { width: 80, margin: 1 }, (error) => {
                if (error) console.error(error);
            });
        }
    }, [text]);

    return <canvas ref={canvasRef} />;
};

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(({ sale, profile, receiptType }, ref) => {
    const isThermal = receiptType === 'thermal';
    
    return (
         <div ref={ref} className={cn(
            "bg-white text-black font-sans p-4",
            isThermal ? "thermal-receipt" : "a4-receipt mx-auto",
            isThermal && "w-[80mm] text-[10pt]",
            !isThermal && "w-[210mm] min-h-[297mm] shadow-lg"
        )}>
            {/* Header */}
            <header className={cn("text-center mb-4", isThermal && "mb-2")}>
                <h1 className={cn("font-bold", isThermal ? "text-lg" : "text-2xl")}>
                    {profile?.companyName || 'Mon Magasin'}
                </h1>
                {profile?.address && <p className={cn(isThermal && "text-xs")}>{profile.address}</p>}
                {profile?.phone && <p className={cn(isThermal && "text-xs")}>Tél: {profile.phone}</p>}
            </header>

            {/* Sale Info */}
             <section className={cn("text-xs border-y border-dashed border-black py-2 my-2", isThermal && "text-[8pt]")}>
                <div className="flex justify-between">
                    <span>Facture #:</span>
                    <span className="font-bold">{sale.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{format(safeToDate(sale.createdAt!), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
                </div>
            </section>
            
            {/* Items Table */}
            <table className={cn("w-full my-4", isThermal && "text-[9pt] my-2")}>
                <thead>
                    <tr className="border-b border-dashed border-black">
                        <th className="text-left pb-1">Produit</th>
                        <th className="text-center pb-1">Qté</th>
                        <th className="text-right pb-1">Prix U.</th>
                        <th className="text-right pb-1">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {sale.items.map((item, index) => (
                        <tr key={index} className={cn(!isThermal && "text-sm")}>
                            <td className="py-1">{item.name}</td>
                            <td className="text-center py-1">{item.quantity}</td>
                            <td className="text-right py-1">{Number(item.price || 0).toFixed(1)}</td>
                            <td className="text-right py-1 font-semibold">{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(1)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Totals */}
            <section className={cn("mt-4 pt-2 border-t border-dashed border-black", isThermal ? "text-xs" : "text-sm")}>
                <div className="flex justify-between"><p>Sous-total:</p><p>{formatCurrency(sale.subtotal)}</p></div>
                {sale.discountAmount && sale.discountAmount > 0 ? (
                    <div className="flex justify-between"><p>Remise:</p><p>-{formatCurrency(sale.discountAmount)}</p></div>
                ): null}
                <div className={cn("flex justify-between font-bold border-t border-black mt-1 pt-1", isThermal ? "text-base" : "text-lg")}>
                    <p>TOTAL:</p><p>{formatCurrency(sale.total)}</p>
                </div>
                <div className="flex justify-between"><p>Montant Payé:</p><p>{formatCurrency(sale.amountPaid)}</p></div>
                 <div className="flex justify-between font-bold">
                     <p>{sale.remainingBalance >= 0 ? 'Monnaie Rendue:' : 'Solde Restant:'}</p>
                     <p>{formatCurrency(Math.abs(sale.remainingBalance))}</p>
                 </div>
            </section>

             {/* Footer */}
            <footer className="text-center mt-6">
                <p className="text-xs">Merci de votre visite !</p>
                {isThermal && <div className="mx-auto w-fit my-2"><QRCodeCanvas text={sale.invoiceNumber} /></div>}
            </footer>
        </div>
    );
});
Receipt.displayName = "Receipt";
