'use client';

import React from 'react';
import type { Sale, CompanyProfile } from '@/lib/types';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DeliveryNoteData {
  docNumber: string;
  date: string;
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  clientName: string;
  clientAddress: string;
  paymentMode: string;
  seller: string;
  orderRef: string;
  items: {
    id: number;
    designation: string;
    qty: number;
    unitPrice: number;
    total: number;
  }[];
  totalQty: number;
  grandTotal: number;
  oldBalance: number;
  payment: number;
  newBalance: number;
  amountInWords: string;
}

/**
 * Convertit un nombre en lettres françaises.
 */
function numberToWordsFR(n: number): string {
  const intPart = Math.floor(Math.abs(n));
  const decPart = Math.round((Math.abs(n) - intPart) * 100);

  const units = ["", "UN", "DEUX", "TROIS", "QUATRE", "CINQ", "SIX", "SEPT", "HUIT", "NEUF"];
  const tens = ["", "DIX", "VINGT", "TRENTE", "QUARANTE", "CINQUANTE", "SOIXANTE", "SOIXANTE-DIX", "QUATRE-VINGT", "QUATRE-VINGT-DIX"];
  const teens = ["DIX", "ONZE", "DOUZE", "TREIZE", "QUATORZE", "QUINZE", "SEIZE", "DIX-SEPT", "DIX-HUIT", "DIX-NEUF"];

  function convertGroup(num: number, isMille: boolean = false): string {
    let res = "";
    if (num >= 100) {
      const c = Math.floor(num / 100);
      const rest = num % 100;
      if (c === 1) res += "CENT ";
      else res += units[c] + " CENT" + (rest === 0 && !isMille ? "S " : " ");
      num = rest;
    }
    if (num >= 20) {
      const t = Math.floor(num / 10);
      const u = num % 10;
      if (t === 7 || t === 9) {
        const prefix = (t === 7) ? "SOIXANTE" : "QUATRE-VINGT";
        if (u === 1 && t === 7) res += prefix + " ET ONZE";
        else res += prefix + "-" + teens[u];
      } else {
        const prefix = tens[t];
        if (u === 1) res += prefix + (t === 8 ? "-UN" : " ET UN");
        else if (u > 1) res += prefix + "-" + units[u];
        else res += prefix + (t === 8 && !isMille ? "S" : "");
      }
    } else if (num >= 10) {
      res += teens[num - 10];
    } else if (num > 0) {
      if (!(num === 1 && isMille)) res += units[num];
    }
    return res.trim();
  }

  function getWords(amount: number): string {
    if (amount === 0) return "";
    let res = "";
    const millions = Math.floor(amount / 1000000);
    const thousands = Math.floor((amount % 1000000) / 1000);
    const remainder = amount % 1000;
    if (millions > 0) res += convertGroup(millions) + " MILLION" + (millions > 1 ? "S " : " ");
    if (thousands > 0) res += (thousands === 1 ? "MILLE " : convertGroup(thousands, true) + " MILLE ");
    if (remainder > 0) res += convertGroup(remainder);
    return res.trim();
  }

  if (intPart === 0 && decPart === 0) return "ZERO DINAR";
  let finalStr = n < 0 ? "MOINS " : "";
  if (intPart > 0) finalStr += getWords(intPart) + (intPart > 1 ? " DINARS" : " DINAR");
  if (decPart > 0) {
    if (intPart > 0) finalStr += " ET ";
    finalStr += convertGroup(decPart) + (decPart > 1 ? " CENTIMES" : " CENTIME");
  }
  return finalStr.trim().toUpperCase();
}

interface ReceiptProps {
  sale: Sale;
  profile: CompanyProfile | null;
  receiptType: 'a4' | 'thermal';
  customerName?: string;
  oldBalance?: number;
}

export const Receipt = React.forwardRef<HTMLDivElement, ReceiptProps>(
  ({ sale, profile, receiptType, customerName, oldBalance = 0 }, ref) => {
    const isThermal = receiptType === 'thermal';
    const formatNum = (val: number) => val.toLocaleString('fr-DZ', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const docData: DeliveryNoteData = {
      docNumber: sale.invoiceNumber,
      date: sale.createdAt ? format(new Date(sale.createdAt), 'dd/MM/yyyy HH:mm') : format(new Date(), 'dd/MM/yyyy HH:mm'),
      companyName: profile?.companyName || 'iPOS ZEN ELITE',
      companyAddress: profile?.address || 'ALGERIE',
      companyPhone: profile?.phone || '',
      clientName: customerName || 'Client de passage',
      clientAddress: 'ALGERIE',
      paymentMode: sale.paymentStatus === 'paid' ? 'COMPTANT' : sale.paymentStatus === 'partial' ? 'PARTIEL' : 'A CREDIT',
      seller: 'ADMIN',
      orderRef: 'Vente Directe',
      items: sale.items.map((item, idx) => ({
        id: idx + 1,
        designation: item.name,
        qty: item.quantity,
        unitPrice: item.price,
        total: item.quantity * item.price,
      })),
      totalQty: sale.items.reduce((sum, i) => sum + i.quantity, 0),
      grandTotal: sale.total,
      oldBalance: oldBalance,
      payment: sale.amountPaid || 0,
      newBalance: (oldBalance + sale.total) - (sale.amountPaid || 0),
      amountInWords: numberToWordsFR(sale.total),
    };

    if (isThermal) {
      return (
        <div ref={ref} className="bg-white text-black font-mono text-[9pt] w-[80mm] p-4 thermal-receipt" style={{ lineHeight: '1.4', letterSpacing: '-0.2px' }}>
          <header className="text-center mb-4">
            <p className="font-bold uppercase text-base">{docData.companyName}</p>
            <p className="text-[7pt] mt-1">{docData.companyAddress}</p>
            {docData.companyPhone && <p className="text-[7pt]">Tel: {docData.companyPhone}</p>}
          </header>
          
          <div className="border-b border-black border-dashed my-2" />
          
          <div className="space-y-0.5 mb-4 text-[8pt]">
            <p className="font-bold text-center underline mb-2 text-[9pt]">BON DE LIVRAISON</p>
            <p><span className="font-bold">N° FACTURE:</span> {docData.docNumber}</p>
            <p><span className="font-bold">DATE:</span> {docData.date}</p>
            <p><span className="font-bold">CLIENT:</span> {docData.clientName}</p>
          </div>
          
          <table className="w-full text-left text-[8pt] mb-4 border-collapse">
            <thead className="table-header-group">
              <tr className="border-b border-black">
                <th className="text-left py-1">DESIGNATION</th>
                <th className="text-center py-1">QTE</th>
                <th className="text-right py-1">TOTAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {docData.items.map((item) => (
                <tr key={item.id} className="break-inside-avoid">
                  <td className="py-2 pr-2 leading-tight uppercase font-bold text-[7.5pt]">{item.designation}</td>
                  <td className="text-center py-2 font-bold">{item.qty}</td>
                  <td className="text-right py-2 font-bold">{formatNum(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          <div className="border-t border-black border-dashed my-2" />
          
          <div className="space-y-1">
            <div className="flex justify-between text-[9pt]">
                <span className="font-bold">TOTAL FACTURE:</span>
                <span className="font-bold">{formatNum(docData.grandTotal)} DA</span>
            </div>
            
            {Math.abs(docData.oldBalance) > 0.01 && (
                <div className="flex justify-between text-[8pt] opacity-70">
                    <span>ANCIEN SOLDE:</span>
                    <span>{formatNum(docData.oldBalance)} DA</span>
                </div>
            )}
            
            <div className="flex justify-between text-[9pt] text-emerald-700 bg-emerald-50 px-1">
                <span className="font-bold">VERSEMENT (RECU):</span>
                <span className="font-bold">-{formatNum(docData.payment)} DA</span>
            </div>
            
            <div className="flex justify-between border-t border-black pt-2 text-[10pt] bg-gray-100 px-1">
                <span className="font-black">NET A PAYER:</span>
                <span className="font-black">{formatNum(docData.newBalance)} DA</span>
            </div>
          </div>
          
          <footer className="text-center mt-8 pt-4 border-t border-dashed border-gray-400">
            <p className="font-bold uppercase text-[8pt]">Merci de votre confiance !</p>
            <p className="text-[6.5pt] opacity-40 mt-2">SYSTEME iPOS ZEN ELITE</p>
          </footer>
        </div>
      );
    }

    return (
      <div ref={ref} className="bg-white text-[#111827] font-sans a4-receipt-wrapper" style={{ letterSpacing: 'normal', lineHeight: '1.5' }}>
        <div className="w-full p-[10mm] bg-white mx-auto">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-[#111827] pb-8 mb-8">
            <div className="flex flex-col gap-1 max-w-[60%]">
              <h1 className="text-3xl font-black uppercase tracking-tight text-[#111827]">{docData.companyName}</h1>
              <p className="text-sm font-semibold opacity-70 mt-2">{docData.companyAddress}</p>
              <p className="text-sm font-bold">Tel: {docData.companyPhone}</p>
            </div>
            <div className="flex flex-col items-end">
              <h2 className="text-3xl font-black text-blue-600 uppercase tracking-tighter">Bon de Livraison</h2>
              <div className="mt-4 text-right">
                <p className="font-mono font-bold text-lg">N° : {docData.docNumber}</p>
                <p className="text-sm font-bold text-gray-500 uppercase">Emis le : {docData.date.split(' ')[0]}</p>
              </div>
            </div>
          </div>

          {/* Client & Metadata */}
          <div className="grid grid-cols-12 gap-8 mb-10">
            <div className="col-span-7 bg-[#EFF6FF] border border-[#BFDBFE] p-6 rounded-2xl">
              <h3 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-2">Destinataire / Client</h3>
              <p className="text-2xl font-black text-[#111827]">{docData.clientName}</p>
              <p className="text-sm font-medium text-gray-500 mt-1">{docData.clientAddress}</p>
            </div>
            <div className="col-span-5 grid grid-cols-2 gap-3">
              {[
                { label: 'Mode paiement', val: docData.paymentMode },
                { label: 'Agent', val: docData.seller },
              ].map((box, i) => (
                <div key={i} className="border border-gray-200 p-4 rounded-2xl bg-gray-50/50">
                  <span className="text-[8px] font-black uppercase text-gray-400 tracking-wider block mb-1">{box.label}</span>
                  <span className="text-[10px] font-bold text-[#111827] truncate block">{box.val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="mb-10">
            <table className="w-full border-collapse">
              <thead className="table-header-group">
                <tr className="bg-white text-black border-y-2 border-black">
                  <th className="text-center w-12 p-4 text-[10px] font-black uppercase">N°</th>
                  <th className="text-left p-4 text-[10px] font-black uppercase">Désignation</th>
                  <th className="text-center w-20 p-4 text-[10px] font-black uppercase">Qté</th>
                  <th className="text-right w-32 p-4 text-[10px] font-black uppercase">P.U (DA)</th>
                  <th className="text-right w-32 p-4 text-[10px] font-black uppercase">Total (DA)</th>
                </tr>
              </thead>
              <tbody>
                {docData.items.map((item, idx) => (
                  <tr key={item.id} className={cn(idx % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]', "break-inside-avoid")}>
                    <td className="text-center font-mono text-xs text-gray-400 border-b border-gray-100 p-4">{item.id}</td>
                    <td className="font-bold text-sm uppercase text-[#111827] border-b border-gray-100 p-4">{item.designation}</td>
                    <td className="text-center font-mono font-bold text-sm border-b border-gray-100 p-4">{item.qty}</td>
                    <td className="text-right font-mono font-bold text-sm border-b border-gray-100 p-4">{formatNum(item.unitPrice)}</td>
                    <td className="text-right font-mono font-black text-sm border-b border-gray-100 p-4">{formatNum(item.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Signature */}
          <div className="mt-12 break-inside-avoid">
            <div className="grid grid-cols-2 gap-12 items-start">
              <div className="space-y-10">
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
                  <p className="text-[10px] font-black uppercase text-gray-400 mb-2 tracking-widest">Arrêté la présente facture à la somme de :</p>
                  <p className="text-sm font-black italic text-gray-800 leading-relaxed uppercase">
                    {docData.amountInWords}
                  </p>
                </div>
                <div className="flex justify-between items-start pt-4 border-t border-dashed border-gray-200">
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Visa Etablissement</p>
                  <p className="text-[9px] font-black uppercase text-gray-400 tracking-widest">Signature Client</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between px-4 py-2 text-sm font-bold text-gray-500">
                  <span>Articles (Qte Totale)</span>
                  <span className="font-mono text-[#111827]">{docData.totalQty}</span>
                </div>
                <div className="flex justify-between px-4 py-2 text-sm font-bold text-[#111827] border-b border-gray-100">
                  <span>Montant Facture</span>
                  <span className="font-mono">{formatNum(docData.grandTotal)} DA</span>
                </div>
                {Math.abs(docData.oldBalance) > 0.01 && (
                  <div className="flex justify-between px-4 py-2 text-sm font-bold text-gray-500">
                    <span>Ancien Solde Client</span>
                    <span className="font-mono text-[#111827]">{formatNum(docData.oldBalance)} DA</span>
                  </div>
                )}
                <div className="flex justify-between px-4 py-2 text-sm font-bold text-emerald-600 bg-emerald-50/50">
                  <span>Versement / Paiement (Reçu)</span>
                  <span className="font-mono">-{formatNum(docData.payment)} DA</span>
                </div>
                <div className="bg-white text-black p-6 rounded-2xl flex justify-between items-center mt-6 border-2 border-black">
                  <span className="text-xs font-black uppercase tracking-widest opacity-60">NET A PAYER (DA)</span>
                  <span className="text-3xl font-black font-mono tracking-tighter">{formatNum(docData.newBalance)}</span>
                </div>
              </div>
            </div>

            <footer className="mt-12 pt-8 border-t border-gray-100 flex justify-between items-center text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em]">
              <span>{docData.companyName} — iPOS ELITE SYSTEM</span>
              <span>Généré par iPOS ZEN — {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
            </footer>
          </div>
        </div>
      </div>
    );
  }
);

Receipt.displayName = 'Receipt';