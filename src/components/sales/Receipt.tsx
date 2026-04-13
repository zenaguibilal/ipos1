
'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { formatCurrency, safeToDate, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import QRCode from 'qrcode';
import { numberToArabicWords } from '@/lib/numberToArabicWords';

const QRCodeCanvas = ({ text }: { text: string }) => {
    const ref = React.useRef<HTMLCanvasElement>(null);
    React.useEffect(() => {
        if (ref.current && text) {
            QRCode.toCanvas(
                ref.current,
                text,
                { width: 80, margin: 1, color: { dark: '#000000', light: '#ffffff' } },
                () => {},
            );
        }
    }, [text]);
    return <canvas ref={ref} className="mx-auto" />;
};

interface ReceiptProps {
    sale:        Sale;
    profile:     CompanyProfile | null;
    receiptType: 'a4' | 'thermal';
    customerName?: string;
    isDuplicate?: boolean;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
    ({ sale, profile, receiptType, customerName, isDuplicate = false }, ref) => {
        const thermal = receiptType === 'thermal';

        if (thermal) {
            const amountPaid      = Number(sale.amountPaid      || 0);
            const total           = Number(sale.total           || 0);
            const remainingBalance = Number(sale.remainingBalance || 0);
            const subtotal        = Number(sale.subtotal        || 0);
            const discountAmount  = Number(sale.discountAmount  || 0);
            const hasDebt         = remainingBalance > 0.01;
            const changeGiven     = Math.max(0, amountPaid - total);
            const displayName = customerName && customerName !== 'Client de passage' 
                ? customerName 
                : (sale.customerUuid ? `Client #${sale.customerUuid.substring(0, 8)}` : 'Passage');

            return (
                <div
                    ref={ref}
                    className="bg-white text-black leading-tight w-[80mm] font-mono text-[10pt] px-4 py-6 thermal-receipt"
                >
                    <header className="text-center mb-4">
                        <p className="font-bold uppercase tracking-tighter text-lg">
                            {profile?.companyName || 'iPOS Zen'}
                        </p>
                        <div className="text-[9pt] text-gray-700 mt-1 space-y-0.5">
                            {profile?.address && <p>{profile.address}</p>}
                            {profile?.phone && <p className="font-semibold">Tél: {profile.phone}</p>}
                        </div>
                    </header>
                    <div className="border-b-2 border-black mb-4" />
                    <section className="text-[9pt] mb-4 space-y-1">
                        <div className="flex justify-between font-bold"><span>FACTURE N°:</span><span className="font-mono">{sale.invoiceNumber}</span></div>
                        <div className="flex justify-between"><span>DATE:</span><span>{format(safeToDate(sale.createdAt!), 'dd/MM/yyyy HH:mm', { locale: fr })}</span></div>
                        <div className="flex justify-between italic"><span>CLIENT:</span><span className="font-bold">{displayName}</span></div>
                    </section>
                    <div className="border-b border-dashed border-gray-400 mb-2" />
                    <table className="w-full text-[9pt] mb-4 border-collapse">
                        <thead><tr className="border-b-2 border-black text-left"><th className="pb-1 font-bold">ARTICLE</th><th className="pb-1 text-center font-bold w-10">QTÉ</th><th className="pb-1 text-right font-bold w-24">TOTAL</th></tr></thead>
                        <tbody className="divide-y divide-gray-200">
                            {sale.items.map((item, i) => (
                                <tr key={i} className="align-top">
                                    <td className="py-1.5 pr-2 font-medium leading-snug">{item.name}</td>
                                    <td className="py-1.5 text-center font-mono">{item.quantity}</td>
                                    <td className="py-1.5 text-right font-bold font-mono">{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="border-t-2 border-black pt-2 space-y-1.5">
                        <div className="flex justify-between text-[9pt]"><span>SOUS-TOTAL:</span><span className="font-mono">{formatCurrency(subtotal)}</span></div>
                        {discountAmount > 0 && <div className="flex justify-between text-[9pt] text-gray-600"><span>REMISE:</span><span className="font-mono">-{formatCurrency(discountAmount)}</span></div>}
                        <div className="flex justify-between font-extrabold text-[12pt] border-y border-black py-1 my-1"><span>TOTAL NET:</span><span className="font-mono">{formatCurrency(total)}</span></div>
                        <div className="flex justify-between text-[10pt] font-medium"><span>REÇU CLIENT:</span><span className="font-mono">{formatCurrency(amountPaid)}</span></div>
                        <div className="flex justify-between text-[10pt] font-bold"><span>{hasDebt ? 'SOLDE DÛ:' : 'RENDU:'}</span><span className="font-mono text-lg">{hasDebt ? formatCurrency(remainingBalance) : formatCurrency(changeGiven)}</span></div>
                    </div>
                    <footer className="text-center mt-8 border-t border-dashed border-gray-300 pt-4">
                        <p className="text-[8pt] font-bold italic mb-4">MERCI DE VOTRE VISITE !</p>
                        <QRCodeCanvas text={sale.invoiceNumber} />
                    </footer>
                </div>
            );
        }

        // ─── RENDU A4 CONFORME DROIT ALGÉRIEN ───
        const totalTTC = sale.total;
        const totalHT = sale.items.reduce((acc, item) => {
            const tvaRate = item.tva_rate || profile?.tva_rate || 0;
            const priceHT = item.price / (1 + tvaRate / 100);
            return acc + (priceHT * item.quantity);
        }, 0);
        const totalTVA = totalTTC - totalHT;

        // Group TVA by rate
        const tvaGroups = sale.items.reduce((acc, item) => {
            const rate = item.tva_rate || profile?.tva_rate || 0;
            const ttc = item.price * item.quantity;
            const ht = ttc / (1 + rate / 100);
            const tva = ttc - ht;
            if (!acc[rate]) acc[rate] = { ht: 0, tva: 0 };
            acc[rate].ht += ht;
            acc[rate].tva += tva;
            return acc;
        }, {} as Record<number, { ht: number, tva: number }>);

        const qrData = JSON.stringify({
            inv: sale.invoiceNumber,
            nif: profile?.nif,
            ttc: sale.total,
            date: sale.createdAt
        });

        return (
            <div
                ref={ref}
                className="relative bg-white text-black font-sans text-[10pt] w-[210mm] min-h-[297mm] mx-auto p-[15mm] shadow-lg border border-gray-100 overflow-hidden"
            >
                {/* Filigrane Duplicata */}
                {isDuplicate && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
                        <span className="text-[120pt] font-black text-red-600/10 -rotate-45 uppercase">
                            DUPLICATA
                        </span>
                    </div>
                )}

                <div className="relative z-10 flex flex-col h-full">
                    {/* EN-TÊTE 2 COLONNES */}
                    <header className="grid grid-cols-2 gap-10 mb-10">
                        <div className="space-y-4">
                            {profile?.logoUrl ? (
                                <img src={profile.logoUrl} alt="Logo" className="max-h-20 object-contain" />
                            ) : (
                                <div className="w-16 h-16 bg-primary flex items-center justify-center text-white font-black text-2xl rounded-xl">
                                    {profile?.companyName?.substring(0, 2).toUpperCase() || 'IZ'}
                                </div>
                            )}
                            <div className="space-y-1">
                                <h1 className="text-xl font-black text-primary uppercase tracking-tight leading-none">
                                    {profile?.companyName || 'MAGASIN ZEN'}
                                </h1>
                                <p className="text-sm font-bold text-gray-600">{profile?.legal_form || 'Entreprise Individuelle'}</p>
                                <p className="text-sm leading-tight text-gray-500 max-w-xs">{profile?.address}</p>
                            </div>
                        </div>

                        <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-2 text-[9pt]">
                            <div className="grid grid-cols-[80px_1fr] gap-2">
                                <span className="font-bold text-gray-400">RC:</span>
                                <span className="font-bold">{profile?.rc_number || '—'}</span>
                                <span className="font-bold text-gray-400">NIF:</span>
                                <span className="font-bold">{profile?.nif || '—'}</span>
                                <span className="font-bold text-gray-400">AI:</span>
                                <span className="font-bold">{profile?.ai_number || '—'}</span>
                                <span className="font-bold text-gray-400">NIS:</span>
                                <span className="font-bold">{profile?.nis_number || '—'}</span>
                                {profile?.tva_number && (
                                    <>
                                        <span className="font-bold text-gray-400">TVA:</span>
                                        <span className="font-bold">{profile.tva_number}</span>
                                    </>
                                )}
                            </div>
                            <div className="pt-4 border-t border-gray-200 mt-2 space-y-1">
                                <p className="font-bold flex items-center gap-2">
                                    <span className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center text-[10px]">📞</span>
                                    {profile?.phone || '—'}
                                </p>
                                <p className="font-bold flex items-center gap-2">
                                    <span className="w-4 h-4 bg-primary/10 rounded flex items-center justify-center text-[10px]">✉️</span>
                                    {profile?.email || '—'}
                                </p>
                            </div>
                        </div>
                    </header>

                    {/* BANDEAU TITRE */}
                    <div className="bg-primary p-6 rounded-2xl text-white flex justify-between items-center mb-8 shadow-md">
                        <div>
                            <h2 className="text-2xl font-black tracking-widest uppercase">FACTURE</h2>
                            <p className="text-[10pt] font-bold opacity-80 uppercase">Originale</p>
                        </div>
                        <div className="text-right">
                            <p className="text-2xl font-mono font-black tracking-tighter">N° {sale.invoiceNumber}</p>
                            <p className="text-sm font-bold opacity-80">Émise le: {format(safeToDate(sale.createdAt!), 'dd/MM/yyyy', { locale: fr })}</p>
                        </div>
                    </div>

                    {/* INFOS CLIENT & ÉCHÉANCE */}
                    <div className="grid grid-cols-2 gap-10 mb-8 px-2">
                        <div>
                            <h3 className="text-[8pt] font-black text-gray-400 uppercase tracking-widest mb-2">Facturé à :</h3>
                            <p className="text-lg font-black">{customerName || 'Client de passage'}</p>
                            {sale.customerUuid && <p className="text-xs font-bold text-gray-500 mt-1">ID Client: {sale.customerUuid.substring(0,8).toUpperCase()}</p>}
                        </div>
                        <div className="text-right">
                            <h3 className="text-[8pt] font-black text-gray-400 uppercase tracking-widest mb-2">Modalités :</h3>
                            <p className="text-sm font-bold uppercase">Règlement: {sale.paymentStatus === 'paid' ? 'Espèces' : 'À Crédit'}</p>
                            {sale.dueDate && (
                                <p className="text-sm font-black text-primary mt-1 uppercase">
                                    Échéance: {format(safeToDate(sale.dueDate), 'dd/MM/yyyy')}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* TABLEAU ARTICLES */}
                    <div className="flex-grow">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-[8pt] font-black uppercase text-gray-600 border-y-2 border-gray-200">
                                    <th className="py-4 px-4 text-left">Désignation</th>
                                    <th className="py-4 px-2 text-center w-16">Qté</th>
                                    <th className="py-4 px-2 text-center w-16">Unité</th>
                                    <th className="py-4 px-2 text-right w-24">P.U HT</th>
                                    <th className="py-4 px-2 text-center w-12">TVA%</th>
                                    <th className="py-4 px-2 text-right w-24">Montant TVA</th>
                                    <th className="py-4 px-4 text-right w-32">Total TTC</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {sale.items.map((item, idx) => {
                                    const tvaRate = item.tva_rate || profile?.tva_rate || 0;
                                    const ttc = item.price * item.quantity;
                                    const ht = ttc / (1 + tvaRate / 100);
                                    const tvaAmt = ttc - ht;
                                    
                                    return (
                                        <tr key={idx} className={cn("text-sm transition-colors", idx % 2 === 0 ? "bg-white" : "bg-gray-50/50")}>
                                            <td className="py-4 px-4 font-bold text-gray-800">{item.name}</td>
                                            <td className="py-4 px-2 text-center font-mono font-bold">{item.quantity}</td>
                                            <td className="py-4 px-2 text-center text-gray-500 font-bold uppercase text-[8pt]">Pcs</td>
                                            <td className="py-4 px-2 text-right font-mono">{ht.toFixed(2)}</td>
                                            <td className="py-4 px-2 text-center text-gray-400 font-bold">{tvaRate}%</td>
                                            <td className="py-4 px-2 text-right font-mono text-gray-500">{tvaAmt.toFixed(2)}</td>
                                            <td className="py-4 px-4 text-right font-black tracking-tighter">{ttc.toFixed(2)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* BLOC TOTAUX & LETTRES */}
                    <div className="mt-10 grid grid-cols-[1fr_250px] gap-10 items-start">
                        <div className="space-y-6">
                            <div className="bg-amber-50/50 border-l-4 border-primary p-6 rounded-r-2xl">
                                <p className="text-[8pt] font-black text-primary/60 uppercase tracking-widest mb-2">Arrêtée la présente facture à la somme de :</p>
                                <p className="text-lg font-black text-gray-800 leading-relaxed text-right" dir="rtl">
                                    {numberToArabicWords(sale.total)}
                                </p>
                            </div>
                            
                            {profile?.is_tva_exempt && (
                                <p className="text-[8pt] italic text-gray-400 px-2">
                                    Exonération de TVA : {profile.tva_exempt_reason || 'Article 9 du Code des Taxes sur le Chiffre d\'Affaires'}
                                </p>
                            )}
                        </div>

                        <div className="space-y-3 bg-gray-50 p-6 rounded-2xl border border-gray-100">
                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>TOTAL HT</span>
                                <span className="font-mono">{totalHT.toFixed(2)} DA</span>
                            </div>
                            
                            {Object.entries(tvaGroups).map(([rate, vals]) => (
                                <div key={rate} className="flex justify-between text-xs font-medium text-gray-400">
                                    <span>TVA {rate}%</span>
                                    <span className="font-mono">{vals.tva.toFixed(2)} DA</span>
                                </div>
                            ))}

                            <div className="h-px bg-gray-200 my-2" />
                            
                            <div className="flex justify-between items-end">
                                <span className="text-xs font-black uppercase text-primary">TOTAL TTC</span>
                                <span className="text-xl font-black tracking-tighter text-primary">
                                    {formatCurrency(sale.total)}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* SIGNATURES & QR */}
                    <div className="mt-16 grid grid-cols-3 gap-6 items-end">
                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 h-32 flex flex-col justify-between">
                            <p className="text-[8pt] font-black uppercase text-gray-400 text-center">Signature et cachet du vendeur</p>
                        </div>
                        
                        <div className="flex flex-col items-center">
                            <QRCodeCanvas text={qrData} />
                            <p className="text-[6pt] font-mono opacity-30 mt-2 uppercase">{sale.uuid}</p>
                        </div>

                        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 h-32 flex flex-col justify-between">
                            <p className="text-[8pt] font-black uppercase text-gray-400 text-center">Signature et date du client</p>
                        </div>
                    </div>

                    {/* PIED DE PAGE FIXE */}
                    <footer className="mt-10 pt-6 border-t border-gray-100 text-center space-y-2">
                        <p className="text-[7pt] text-gray-400 leading-relaxed max-w-2xl mx-auto uppercase font-bold">
                            Facture établie conformément à la législation fiscale algérienne en vigueur. Tout retard de paiement entraîne des pénalités conformément à l'article 938 du Code Civil.
                        </p>
                        <div className="flex justify-between items-center text-[8pt] font-bold text-gray-300">
                            <span>iPOS Zen v1.9.8 Elite System</span>
                            <span>Page 1 / 1</span>
                        </div>
                    </footer>
                </div>
            </div>
        );
    },
);
Receipt.displayName = 'Receipt';
